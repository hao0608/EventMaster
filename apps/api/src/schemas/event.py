"""Event Pydantic schemas"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from ..core.sanitize import sanitize_string, sanitize_multiline


class EventBase(BaseModel):
    """Base event schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    start_at: datetime
    end_at: datetime
    location: str = Field(..., min_length=1, max_length=200)
    capacity: int = Field(..., ge=1, le=10000)

    @field_validator('title', 'location')
    @classmethod
    def sanitize_text_fields(cls, v: str) -> str:
        """Sanitize title and location to prevent XSS"""
        return sanitize_string(v) or v

    @field_validator('description')
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        """Sanitize description to prevent XSS while preserving newlines"""
        return sanitize_multiline(v) or v


class EventCreate(EventBase):
    """Schema for creating a new event"""
    pass


class EventUpdate(BaseModel):
    """Schema for updating an event"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=2000)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    capacity: Optional[int] = Field(None, ge=1, le=10000)

    @field_validator('title', 'location')
    @classmethod
    def sanitize_text_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize title and location to prevent XSS"""
        if v is None:
            return v
        return sanitize_string(v) or v

    @field_validator('description')
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize description to prevent XSS while preserving newlines"""
        if v is None:
            return v
        return sanitize_multiline(v) or v


class EventResponse(EventBase):
    """Schema for event response"""
    id: str
    organizer_id: str
    registered_count: int

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    """Schema for event list response with pagination"""
    items: list[EventResponse]
    total: int
    limit: int
    offset: int
