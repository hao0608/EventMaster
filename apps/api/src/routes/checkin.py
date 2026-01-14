"""Check-in and verification routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from datetime import datetime, timezone
import uuid
from ..database import get_db
from ..models.user import User, UserRole
from ..models.event import Event
from ..models.registration import Registration, RegistrationStatus
from ..schemas.checkin import CheckInRequest, CheckInResult, WalkInRequest
from ..schemas.registration import RegistrationResponse
from ..core.deps import require_organizer_or_admin
from ..core.security import get_password_hash

router = APIRouter(tags=["Check-in"])


@router.post("/verify", response_model=CheckInResult)
def verify_ticket(
    request: CheckInRequest,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Verify ticket and check-in

    Must be organizer or admin
    """
    # Find registration by QR code
    registration = db.query(Registration).filter(
        Registration.qr_code == request.qr_code
    ).first()

    if not registration:
        return CheckInResult(
            success=False,
            message="Invalid Ticket / QR Code not found"
        )

    # Get event
    event = db.query(Event).filter(Event.id == registration.event_id).first()
    if not event:
        return CheckInResult(
            success=False,
            message="Event data missing"
        )

    # Check permissions (organizer can only verify their own events)
    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        return CheckInResult(
            success=False,
            message="權限不足：這張票券屬於其他主辦方的活動，您無法驗票。"
        )

    # Check if already checked in
    if registration.status == RegistrationStatus.CHECKED_IN:
        return CheckInResult(
            success=False,
            message="Ticket already used / Checked in",
            registration=RegistrationResponse.model_validate(registration)
        )

    # Check if cancelled
    if registration.status == RegistrationStatus.CANCELLED:
        return CheckInResult(
            success=False,
            message="Ticket was cancelled",
            registration=RegistrationResponse.model_validate(registration)
        )

    # Check in
    registration.status = RegistrationStatus.CHECKED_IN

    try:
        db.commit()
        db.refresh(registration)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while checking in"
        )

    return CheckInResult(
        success=True,
        message="Check-in Successful!",
        registration=RegistrationResponse.model_validate(registration)
    )


@router.post("/walk-in", response_model=CheckInResult)
def walk_in_register(
    request: WalkInRequest,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Walk-in registration with immediate check-in

    Must be organizer or admin
    """
    # Check if event exists
    event = db.query(Event).filter(Event.id == request.event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check permissions
    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        return CheckInResult(
            success=False,
            message="權限不足：您不是此活動的主辦方，無法進行現場報名操作。"
        )

    # Find or create user
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        # Create new user
        display_name = request.display_name or request.email.split('@')[0]
        user = User(
            id=str(uuid.uuid4()),
            email=request.email,
            display_name=display_name,
            hashed_password=get_password_hash(f"temp{uuid.uuid4().hex[:16]}"),  # Temporary password
            role=UserRole.MEMBER
        )
        db.add(user)
        db.flush()

    # Check if registration exists
    registration = db.query(Registration).filter(
        Registration.event_id == request.event_id,
        Registration.user_id == user.id
    ).first()

    if registration:
        if registration.status == RegistrationStatus.CHECKED_IN:
            return CheckInResult(
                success=False,
                message="User already checked in",
                registration=RegistrationResponse.model_validate(registration)
            )

        # Reactivate cancelled registration
        if registration.status == RegistrationStatus.CANCELLED:
            event.registered_count += 1

        registration.status = RegistrationStatus.CHECKED_IN

        try:
            db.commit()
            db.refresh(registration)
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error occurred while checking in existing registration"
            )

        return CheckInResult(
            success=True,
            message="Existing registration checked in!",
            registration=RegistrationResponse.model_validate(registration)
        )

    # Create new registration and check in
    registration = Registration(
        id=str(uuid.uuid4()),
        event_id=request.event_id,
        user_id=user.id,
        event_title=event.title,
        event_start_at=event.start_at,
        status=RegistrationStatus.CHECKED_IN,
        qr_code=f"QR-{request.event_id}-{user.id}-WALKIN",
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
            detail="Database error occurred while creating walk-in registration"
        )

    return CheckInResult(
        success=True,
        message="Walk-in Registered & Checked In!",
        registration=RegistrationResponse.model_validate(registration)
    )
