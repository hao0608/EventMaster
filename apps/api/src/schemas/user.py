"""User Pydantic schemas"""
from pydantic import BaseModel, EmailStr, Field
from ..models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    display_name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole = UserRole.MEMBER


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    role: UserRole

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    """Schema for updating user role"""
    role: UserRole
