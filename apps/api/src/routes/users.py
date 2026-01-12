"""User management routes (Admin only)"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserResponse, UserRoleUpdate
from ..core.deps import require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all users

    Admin only
    """
    users = db.query(User).order_by(User.email).all()
    return [UserResponse.model_validate(u) for u in users]


@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update user role

    Admin only
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.role = role_update.role
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)
