"""Check-in and verification routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ..database import get_db
from ..models.user import User, UserRole
from ..models.event import Event, EventStatus
from ..models.registration import Registration, RegistrationStatus
from ..schemas.checkin import CheckInRequest, CheckInResult, WalkInRequest
from ..schemas.registration import RegistrationResponse
from ..domain.registration import WalkInService
from ..core.deps import require_organizer_or_admin

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

    if event.status != EventStatus.PUBLISHED:
        return CheckInResult(
            success=False,
            message="活動尚未發布，無法驗票。"
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
    try:
        result = WalkInService.create_walk_in_registration(
            db=db,
            event_id=request.event_id,
            email=request.email,
            display_name=request.display_name,
            current_user=current_user,
        )
    except HTTPException as exc:
        if exc.status_code in {status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND}:
            return CheckInResult(success=False, message=str(exc.detail))
        raise

    return CheckInResult(
        success=result.success,
        message=result.message,
        registration=RegistrationResponse.model_validate(result.registration)
    )
