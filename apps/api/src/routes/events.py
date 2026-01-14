"""Event management routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from typing import Optional, List
from datetime import datetime
import uuid
import logging
from ..database import get_db
from ..models.user import User, UserRole
from ..models.event import Event
from ..schemas.event import EventCreate, EventUpdate, EventResponse, EventListResponse
from ..core.deps import (
    get_current_user,
    get_current_user_optional,
    require_organizer_or_admin
)

router = APIRouter(prefix="/events", tags=["Events"])
logger = logging.getLogger(__name__)


@router.get("", response_model=EventListResponse)
def get_events(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get list of all events with pagination

    Public endpoint - authentication optional
    """
    query = db.query(Event).order_by(Event.start_at.desc())
    total = query.count()
    events = query.offset(offset).limit(limit).all()

    return EventListResponse(
        items=[EventResponse.model_validate(e) for e in events],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/managed", response_model=EventListResponse)
def get_managed_events(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Get events managed by current user

    - Organizers see their own events
    - Admins see all events
    """
    if current_user.role == UserRole.ADMIN:
        query = db.query(Event).order_by(Event.start_at.desc())
    else:
        query = db.query(Event).filter(
            Event.organizer_id == current_user.id
        ).order_by(Event.start_at.desc())

    total = query.count()
    events = query.offset(offset).limit(limit).all()

    return EventListResponse(
        items=[EventResponse.model_validate(e) for e in events],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get event details by ID

    Public endpoint - authentication optional
    """
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    return EventResponse.model_validate(event)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new event

    Requires Organizer or Admin role
    """
    # Validate dates
    if event_data.end_at <= event_data.start_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Event end time must be after start time"
        )

    # Create event
    event = Event(
        id=str(uuid.uuid4()),
        organizer_id=current_user.id,
        title=event_data.title,
        description=event_data.description,
        start_at=event_data.start_at,
        end_at=event_data.end_at,
        location=event_data.location,
        capacity=event_data.capacity,
        registered_count=0
    )

    try:
        db.add(event)
        db.commit()
        db.refresh(event)
        logger.info(f"Event created: {event.id} by user {current_user.id}")
    except IntegrityError as e:
        db.rollback()
        logger.error(f"IntegrityError creating event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event with this ID already exists"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while creating event"
        )

    return EventResponse.model_validate(event)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    event_updates: EventUpdate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Update an event

    Must be event organizer or admin
    """
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
            detail="You do not have permission to update this event"
        )

    # Apply updates
    update_data = event_updates.model_dump(exclude_unset=True)

    # Validate dates if both are being updated
    start_at = update_data.get("start_at", event.start_at)
    end_at = update_data.get("end_at", event.end_at)

    if end_at <= start_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Event end time must be after start time"
        )

    for key, value in update_data.items():
        setattr(event, key, value)

    try:
        db.commit()
        db.refresh(event)
        logger.info(f"Event updated: {event.id} by user {current_user.id}")
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating event {event_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while updating event"
        )

    return EventResponse.model_validate(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Delete an event

    Must be event organizer or admin
    """
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
            detail="You do not have permission to delete this event"
        )

    try:
        db.delete(event)
        db.commit()
        logger.info(f"Event deleted: {event_id} by user {current_user.id}")
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting event {event_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while deleting event"
        )

    return None
