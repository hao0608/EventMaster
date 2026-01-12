"""API route handlers"""
from .auth import router as auth_router
from .events import router as events_router
from .registrations import router as registrations_router
from .checkin import router as checkin_router
from .users import router as users_router

__all__ = [
    "auth_router",
    "events_router",
    "registrations_router",
    "checkin_router",
    "users_router"
]
