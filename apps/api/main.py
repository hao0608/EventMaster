"""FastAPI application entry point"""
import re
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from src.core.config import settings
from src.core.logging import setup_logging
from src.database import init_db
from src.routes import (
    auth_router,
    events_router,
    registrations_router,
    checkin_router,
    users_router
)


def get_allowed_origins() -> list[str]:
    """Build list of allowed origins including Cloudflare Pages wildcard support."""
    origins = list(settings.ALLOWED_ORIGINS)
    return origins


def is_allowed_origin(origin: str) -> bool:
    """Check if origin is allowed, including Cloudflare Pages wildcard."""
    if not origin:
        return False

    # Check exact match
    if origin in settings.ALLOWED_ORIGINS:
        return True

    # Check Cloudflare Pages wildcard (*.PROJECT.pages.dev)
    if settings.CLOUDFLARE_PAGES_PROJECT:
        pattern = rf"^https://[a-z0-9-]+\.{re.escape(settings.CLOUDFLARE_PAGES_PROJECT)}\.pages\.dev$"
        if re.match(pattern, origin):
            return True
        # Also allow main project URL
        main_url = f"https://{settings.CLOUDFLARE_PAGES_PROJECT}.pages.dev"
        if origin == main_url:
            return True

    return False


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware with Cloudflare Pages wildcard support."""

    async def dispatch(self, request: Request, call_next) -> Response:
        origin = request.headers.get("origin", "")

        # Handle preflight
        if request.method == "OPTIONS":
            if is_allowed_origin(origin):
                response = Response(status_code=200)
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "*"
                response.headers["Access-Control-Allow-Headers"] = "*"
                return response

        response = await call_next(request)

        # Add CORS headers for allowed origins
        if is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"

        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    setup_logging()
    init_db()
    yield
    # Shutdown (cleanup if needed)
    pass


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="活動報名與驗票系統 Backend API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS with Cloudflare Pages wildcard support
if settings.CLOUDFLARE_PAGES_PROJECT:
    # Use dynamic CORS for Cloudflare Pages wildcard support
    app.add_middleware(DynamicCORSMiddleware)
else:
    # Use standard CORS middleware for static origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Register routers
app.include_router(auth_router)
app.include_router(events_router)
app.include_router(registrations_router)
app.include_router(checkin_router)
app.include_router(users_router)


@app.get("/", tags=["Health"])
def root():
    """Root endpoint with app info"""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for ALB/ECS health checks.

    Returns minimal response for fast health verification.
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
