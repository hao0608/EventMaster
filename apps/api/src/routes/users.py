"""User management routes (Admin only)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserResponse, UserRoleUpdate, UserListResponse
from ..core.deps import require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
def get_all_users(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all users

    Admin only
    """
    query = db.query(User).order_by(User.email)
    total = query.count()
    users = query.offset(offset).limit(limit).all()

    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        limit=limit,
        offset=offset
    )


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

    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while updating user role"
        )

    return UserResponse.model_validate(user)
