"""Authentication routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import LoginRequest, LoginResponse
from ..schemas.user import UserResponse
from ..core.security import verify_password, create_access_token
from ..core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password

    Returns JWT access token and user information
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create access token
    access_token = create_access_token(data={"sub": user.id})

    return LoginResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information
    """
    return UserResponse.model_validate(current_user)
