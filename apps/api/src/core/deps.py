"""FastAPI dependencies for authentication and authorization"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, UserRole
from .security import decode_access_token

# HTTP Bearer token security scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.

    Supports both:
    - Legacy JWT tokens (with user_id in database)
    - Cognito JWT tokens (extracts role from cognito:groups claim)

    Args:
        credentials: HTTP Bearer token credentials
        db: Database session

    Returns:
        Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Try to get user from database
    user = db.query(User).filter(User.id == user_id).first()

    # If user not found and this is a Cognito token, create user on-the-fly
    if user is None and "cognito:groups" in payload:
        user = _create_or_update_cognito_user(user_id, payload, db)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # For Cognito tokens, update role from cognito:groups if different
    if "cognito:groups" in payload:
        cognito_role = _extract_role_from_cognito_groups(payload.get("cognito:groups", []))
        if cognito_role and user.role != cognito_role:
            user.role = cognito_role
            db.commit()
            db.refresh(user)

    return user


def _extract_role_from_cognito_groups(groups: list) -> Optional[UserRole]:
    """
    Extract UserRole from Cognito groups claim.

    Cognito groups are returned as a list. We take the highest precedence role.
    Precedence: admin (10) > organizer (20) > member (30)

    Args:
        groups: List of group names from cognito:groups claim

    Returns:
        UserRole or None if no valid role found
    """
    if not groups:
        return None

    # Map group names to roles with precedence
    role_precedence = {
        "admin": (UserRole.ADMIN, 10),
        "organizer": (UserRole.ORGANIZER, 20),
        "member": (UserRole.MEMBER, 30),
    }

    # Find the role with highest precedence (lowest number)
    matched_roles = [
        role_precedence[group] for group in groups
        if group in role_precedence
    ]

    if not matched_roles:
        return None

    # Return role with lowest precedence value (highest authority)
    return min(matched_roles, key=lambda x: x[1])[0]


def _create_or_update_cognito_user(user_id: str, payload: dict, db: Session) -> User:
    """
    Create or update a user from Cognito JWT payload.

    Args:
        user_id: Cognito sub (user ID)
        payload: JWT payload
        db: Database session

    Returns:
        User instance
    """
    # Extract user information from Cognito token
    email = payload.get("email", f"{user_id}@cognito.user")
    role = _extract_role_from_cognito_groups(payload.get("cognito:groups", []))

    if role is None:
        role = UserRole.MEMBER  # Default role

    # Check if user already exists
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        # Create new user
        user = User(
            id=user_id,
            email=email,
            password_hash="",  # Cognito users don't use password hash
            display_name=payload.get("name", email.split("@")[0]),
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get the current user (allows unauthenticated access)

    Args:
        credentials: Optional HTTP Bearer token credentials
        db: Database session

    Returns:
        Current user if authenticated, None otherwise
    """
    if credentials is None:
        return None

    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


def require_role(*allowed_roles: UserRole):
    """
    Dependency factory to require specific user roles

    Args:
        *allowed_roles: One or more UserRole values that are allowed

    Returns:
        Dependency function that checks user role
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(r.value for r in allowed_roles)}"
            )
        return current_user

    return role_checker


# Convenience dependencies for common role requirements
require_admin = require_role(UserRole.ADMIN)
require_organizer_or_admin = require_role(UserRole.ORGANIZER, UserRole.ADMIN)
