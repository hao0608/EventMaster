"""FastAPI application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.database import init_db
from src.routes import (
    auth_router,
    events_router,
    registrations_router,
    checkin_router,
    users_router
)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="活動報名與驗票系統 Backend API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
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


@app.on_event("startup")
def on_startup():
    """Initialize database on startup"""
    init_db()


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
