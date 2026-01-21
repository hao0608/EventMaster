"""Pydantic schemas for request/response validation"""
from .user import UserCreate, UserResponse, UserRole, UserRoleUpdate
from .auth import LoginRequest, LoginResponse, TokenResponse
from .event import EventCreate, EventUpdate, EventResponse
from .approval import ApprovalActionResponse
from .registration import RegistrationResponse, RegistrationCreate, AttendeeResponse
from .checkin import CheckInRequest, CheckInResult, WalkInRequest

__all__ = [
    "UserCreate", "UserResponse", "UserRole", "UserRoleUpdate",
    "LoginRequest", "LoginResponse", "TokenResponse",
    "EventCreate", "EventUpdate", "EventResponse",
    "ApprovalActionResponse",
    "RegistrationResponse", "RegistrationCreate", "AttendeeResponse",
    "CheckInRequest", "CheckInResult", "WalkInRequest"
]
