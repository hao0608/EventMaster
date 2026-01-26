"""Security utilities for authentication and authorization"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from jose import JWTError, jwt, jwk
from jose.utils import base64url_decode
from passlib.context import CryptContext
from .config import settings
from .jwks import jwks_cache
import json

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password for storing"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token

    Args:
        data: Dictionary containing claims to encode in the token
        expires_delta: Optional expiration time delta

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT access token.

    Supports both:
    - Legacy HS256 tokens (signed with SECRET_KEY)
    - Cognito RS256 tokens (signed with Cognito's private key, verified with JWKS)

    Args:
        token: JWT token string

    Returns:
        Decoded token payload or None if invalid
    """
    # First, try to decode using Cognito JWKS (RS256)
    if settings.COGNITO_USER_POOL_ID and settings.COGNITO_REGION:
        cognito_payload = _decode_cognito_token(token)
        if cognito_payload:
            return cognito_payload

    # Fallback to legacy HS256 verification
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def _decode_cognito_token(token: str) -> Optional[Dict]:
    """
    Decode and verify a Cognito JWT token using JWKS.

    Args:
        token: JWT token string from Cognito

    Returns:
        Decoded token payload or None if invalid
    """
    try:
        # Get the JWT headers (contains 'kid' - Key ID)
        headers = jwt.get_unverified_headers(token)
        kid = headers.get("kid")

        if not kid:
            return None

        # Get JWKS from cache
        jwks = jwks_cache.get_jwks()
        if not jwks:
            return None

        # Find the key matching the 'kid'
        key = None
        for jwk_key in jwks.get("keys", []):
            if jwk_key.get("kid") == kid:
                key = jwk_key
                break

        if not key:
            return None

        # Construct the public key from JWK
        public_key = jwk.construct(key)

        # Decode and verify the token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=settings.cognito_issuer,
            options={"verify_aud": False}  # Cognito access tokens don't have 'aud' claim
        )

        return payload

    except JWTError:
        return None
    except Exception:
        return None
