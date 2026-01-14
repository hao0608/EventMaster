"""Registration database model"""
import enum
from sqlalchemy import Column, String, ForeignKey, DateTime, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class RegistrationStatus(str, enum.Enum):
    """Registration status enumeration"""
    REGISTERED = "registered"
    CHECKED_IN = "checked_in"
    CANCELLED = "cancelled"


class Registration(Base):
    """Registration model for event sign-ups and check-ins"""

    __tablename__ = "registrations"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.REGISTERED, nullable=False)
    qr_code = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Denormalized fields for quick access
    event_title = Column(String(200), nullable=False)
    event_start_at = Column(DateTime, nullable=False)

    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="registrations")

    # Composite index for unique constraint
    __table_args__ = (
        Index('idx_event_user', 'event_id', 'user_id'),
    )

    def __repr__(self):
        return f"<Registration(id={self.id}, event_id={self.event_id}, user_id={self.user_id}, status={self.status})>"
