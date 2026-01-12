"""Registration Pydantic schemas"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from ..models.registration import RegistrationStatus


class RegistrationBase(BaseModel):
    """Base registration schema"""
    event_id: str
    user_id: str
    status: RegistrationStatus


class RegistrationCreate(BaseModel):
    """Schema for creating a registration (minimal - event_id from path)"""
    pass


class RegistrationResponse(BaseModel):
    """Schema for registration response"""
    id: str
    event_id: str
    event_title: str
    event_start_at: datetime
    user_id: str
    status: RegistrationStatus
    qr_code: str
    created_at: datetime

    class Config:
        from_attributes = True


class AttendeeResponse(RegistrationResponse):
    """Schema for attendee response (registration with user info)"""
    user_display_name: str
    user_email: str
