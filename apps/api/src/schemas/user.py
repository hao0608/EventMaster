"""User Pydantic schemas"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from ..models.user import UserRole
from ..core.sanitize import sanitize_string


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    display_name: str = Field(..., min_length=1, max_length=100)

    @field_validator('display_name')
    @classmethod
    def sanitize_display_name(cls, v: str) -> str:
        """Sanitize display name to prevent XSS"""
        return sanitize_string(v) or v


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


class UserListResponse(BaseModel):
    """Schema for user list response with pagination"""
    items: list[UserResponse]
    total: int
    limit: int
    offset: int
