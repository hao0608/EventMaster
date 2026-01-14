"""Check-in Pydantic schemas"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from .registration import RegistrationResponse
from ..core.sanitize import sanitize_string


class CheckInRequest(BaseModel):
    """Schema for check-in/verify request"""
    qr_code: str


class WalkInRequest(BaseModel):
    """Schema for walk-in registration request"""
    event_id: str
    email: EmailStr
    display_name: Optional[str] = None

    @field_validator('display_name')
    @classmethod
    def sanitize_display_name(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize display name to prevent XSS"""
        if v is None:
            return v
        return sanitize_string(v) or v


class CheckInResult(BaseModel):
    """Schema for check-in result"""
    success: bool
    message: str
    registration: Optional[RegistrationResponse] = None
