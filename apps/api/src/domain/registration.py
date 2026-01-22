"""Domain service for walk-in registrations."""
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional
import uuid
from fastapi import HTTPException, status as http_status
from sqlalchemy.orm import Session
from ..core.security import get_password_hash
from ..models.event import Event, EventStatus
from ..models.registration import Registration, RegistrationStatus
from ..models.user import User, UserRole


@dataclass
class WalkInResult:
    """Result of a walk-in registration attempt."""
    success: bool
    message: str
    registration: Registration


class WalkInService:
    """Business logic for walk-in registrations."""

    @staticmethod
    def create_walk_in_registration(
        db: Session,
        event_id: str,
        email: str,
        display_name: Optional[str],
        current_user: User,
    ) -> WalkInResult:
        """Create or re-activate a walk-in registration and check-in the attendee."""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Event not found")

        if event.status != EventStatus.PUBLISHED:
            raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Event is not published")

        if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
            raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Forbidden")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                display_name=display_name or email.split('@')[0],
                hashed_password=get_password_hash(f"temp{uuid.uuid4().hex[:16]}"),
                role=UserRole.MEMBER,
            )
            db.add(user)
            db.flush()

        registration = db.query(Registration).filter(
            Registration.event_id == event_id,
            Registration.user_id == user.id,
        ).first()

        if registration:
            if registration.status == RegistrationStatus.CHECKED_IN:
                return WalkInResult(
                    success=False,
                    message="User already checked in",
                    registration=registration,
                )

            if registration.status == RegistrationStatus.CANCELLED:
                if event.is_full:
                    raise HTTPException(
                        status_code=http_status.HTTP_400_BAD_REQUEST,
                        detail="Event is at full capacity",
                    )
                event.registered_count += 1

            registration.status = RegistrationStatus.CHECKED_IN
            db.commit()
            db.refresh(registration)

            return WalkInResult(
                success=True,
                message="Existing registration checked in!",
                registration=registration,
            )

        if event.is_full:
            raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Event is at full capacity")

        registration = Registration(
            id=str(uuid.uuid4()),
            event_id=event_id,
            user_id=user.id,
            event_title=event.title,
            event_start_at=event.start_at,
            status=RegistrationStatus.CHECKED_IN,
            qr_code=f"QR-{event_id}-{user.id}-WALKIN",
            created_at=datetime.now(timezone.utc),
        )

        event.registered_count += 1

        db.add(registration)
        db.commit()
        db.refresh(registration)

        return WalkInResult(
            success=True,
            message="Walk-in Registered & Checked In!",
            registration=registration,
        )
