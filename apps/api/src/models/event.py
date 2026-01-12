"""Event database model"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Event(Base):
    """Event model for managing company events"""

    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    organizer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    start_at = Column(DateTime, nullable=False, index=True)
    end_at = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=False)
    capacity = Column(Integer, nullable=False)
    registered_count = Column(Integer, default=0, nullable=False)

    # Relationships
    organizer = relationship("User", back_populates="organized_events", foreign_keys=[organizer_id])
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Event(id={self.id}, title={self.title}, organizer_id={self.organizer_id})>"

    @property
    def is_full(self) -> bool:
        """Check if event is at capacity"""
        return self.registered_count >= self.capacity

    @property
    def available_slots(self) -> int:
        """Get number of available slots"""
        return max(0, self.capacity - self.registered_count)
