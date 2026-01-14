"""Registration management routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from typing import List
from datetime import datetime, timezone
import uuid
from ..database import get_db
from ..models.user import User, UserRole
from ..models.event import Event
from ..models.registration import Registration, RegistrationStatus
from ..schemas.registration import (
    RegistrationResponse,
    AttendeeResponse,
    RegistrationListResponse,
    AttendeeListResponse
)
from ..core.deps import get_current_user, require_organizer_or_admin

router = APIRouter(tags=["Registrations"])


@router.post("/events/{event_id}/registrations", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register current user for an event
    """
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user already has an active registration
    existing_reg = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.user_id == current_user.id
    ).first()

    if existing_reg:
        if existing_reg.status == RegistrationStatus.CANCELLED:
            # Reactivate cancelled registration
            existing_reg.status = RegistrationStatus.REGISTERED
            existing_reg.created_at = datetime.now(timezone.utc)
            event.registered_count += 1
            try:
                db.commit()
                db.refresh(existing_reg)
            except SQLAlchemyError as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error occurred while reactivating registration"
                )
            return RegistrationResponse.model_validate(existing_reg)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already registered for this event"
            )

    # Check capacity
    if event.is_full:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is at full capacity"
        )

    # Create registration
    registration = Registration(
        id=str(uuid.uuid4()),
        event_id=event_id,
        user_id=current_user.id,
        event_title=event.title,
        event_start_at=event.start_at,
        status=RegistrationStatus.REGISTERED,
        qr_code=f"QR-{event_id}-{current_user.id}-{uuid.uuid4().hex[:8]}",
        created_at=datetime.now(timezone.utc)
    )

    event.registered_count += 1

    try:
        db.add(registration)
        db.commit()
        db.refresh(registration)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration with this ID already exists"
        )
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while creating registration"
        )

    return RegistrationResponse.model_validate(registration)


@router.get("/me/registrations", response_model=RegistrationListResponse)
def get_my_registrations(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's registrations
    """
    query = db.query(Registration).filter(
        Registration.user_id == current_user.id
    ).order_by(Registration.created_at.desc())

    total = query.count()
    registrations = query.offset(offset).limit(limit).all()

    return RegistrationListResponse(
        items=[RegistrationResponse.model_validate(r) for r in registrations],
        total=total,
        limit=limit,
        offset=offset
    )


@router.delete("/registrations/{registration_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_registration(
    registration_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel a registration

    Users can only cancel their own registrations
    Cannot cancel if already checked in
    """
    registration = db.query(Registration).filter(
        Registration.id == registration_id
    ).first()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )

    # Check ownership
    if registration.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own registrations"
        )

    # Check if already checked in
    if registration.status == RegistrationStatus.CHECKED_IN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a ticket that has already been checked in"
        )

    # Check if already cancelled
    if registration.status == RegistrationStatus.CANCELLED:
        return None

    # Cancel registration
    registration.status = RegistrationStatus.CANCELLED

    # Decrease event count
    event = db.query(Event).filter(Event.id == registration.event_id).first()
    if event and event.registered_count > 0:
        event.registered_count -= 1

    try:
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while cancelling registration"
        )

    return None


@router.get("/events/{event_id}/attendees", response_model=AttendeeListResponse)
def get_event_attendees(
    event_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Get attendee list for an event

    Must be event organizer or admin
    """
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check permissions
    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this event's attendees"
        )

    # Get registrations with user info
    query = db.query(Registration).filter(
        Registration.event_id == event_id
    ).order_by(Registration.created_at.desc())

    total = query.count()
    registrations = query.offset(offset).limit(limit).all()

    attendees = []
    for reg in registrations:
        attendee_data = RegistrationResponse.model_validate(reg).model_dump()
        attendee_data["user_display_name"] = reg.user.display_name
        attendee_data["user_email"] = reg.user.email
        attendees.append(AttendeeResponse(**attendee_data))

    return AttendeeListResponse(
        items=attendees,
        total=total,
        limit=limit,
        offset=offset
    )
