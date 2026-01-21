"""Domain service for event approval workflow."""
from typing import List
from datetime import datetime, timezone
import logging
from fastapi import HTTPException, status as http_status
from sqlalchemy.orm import Session
from ..models.event import Event, EventStatus

logger = logging.getLogger(__name__)


class EventApprovalService:
    """Business logic for event approval actions."""

    @staticmethod
    def get_pending_events(db: Session, limit: int = 20, offset: int = 0) -> List[Event]:
        """Return pending events for admin review."""
        return (
            db.query(Event)
            .filter(Event.status == EventStatus.PENDING)
            .order_by(Event.start_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def approve_event(event_id: str, admin_id: str, db: Session) -> Event:
        """Approve a pending event and return the updated record."""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Event not found")

        if event.status != EventStatus.PENDING:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail={"error": "InvalidStatus", "message": "Event is not pending"},
            )

        event.status = EventStatus.PUBLISHED
        db.commit()
        db.refresh(event)

        EventApprovalService._log_action(event.id, admin_id, "APPROVE")
        return event

    @staticmethod
    def reject_event(event_id: str, admin_id: str, db: Session) -> Event:
        """Reject a pending event and return the updated record."""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Event not found")

        if event.status != EventStatus.PENDING:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail={"error": "InvalidStatus", "message": "Event is not pending"},
            )

        event.status = EventStatus.REJECTED
        db.commit()
        db.refresh(event)

        EventApprovalService._log_action(event.id, admin_id, "REJECT")
        return event

    @staticmethod
    def log_event_creation(event: Event, creator_id: str) -> None:
        """Log event creation with its initial status."""
        EventApprovalService._log_action(event.id, creator_id, f"CREATE_{event.status.value}")

    @staticmethod
    def _log_action(event_id: str, admin_id: str, action: str) -> None:
        """Emit a structured log entry for approval actions."""
        logger.info(
            "Event approval action",
            extra={
                "event_id": event_id,
                "admin_id": admin_id,
                "action": action,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
