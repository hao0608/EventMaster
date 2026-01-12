"""Check-in Pydantic schemas"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from .registration import RegistrationResponse


class CheckInRequest(BaseModel):
    """Schema for check-in/verify request"""
    qr_code: str


class WalkInRequest(BaseModel):
    """Schema for walk-in registration request"""
    event_id: str
    email: EmailStr
    display_name: Optional[str] = None


class CheckInResult(BaseModel):
    """Schema for check-in result"""
    success: bool
    message: str
    registration: Optional[RegistrationResponse] = None
