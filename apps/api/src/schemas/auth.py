"""Authentication Pydantic schemas"""
from pydantic import BaseModel, EmailStr
from .user import UserResponse


class LoginRequest(BaseModel):
    """Schema for login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    """Schema for login response"""
    user: UserResponse
    access_token: str
