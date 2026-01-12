"""User database model"""
import enum
from sqlalchemy import Column, String, Enum
from sqlalchemy.orm import relationship
from ..database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    MEMBER = "member"
    ORGANIZER = "organizer"
    ADMIN = "admin"


class User(Base):
    """User model for authentication and authorization"""

    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER, nullable=False)

    # Relationships
    organized_events = relationship("Event", back_populates="organizer", foreign_keys="Event.organizer_id")
    registrations = relationship("Registration", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
