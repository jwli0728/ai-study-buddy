from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.config import get_settings

settings = get_settings()

# Password hashing with Argon2
password_hasher = PasswordHash((Argon2Hasher(),))


class InvalidTokenError(Exception):
    """Raised when a token is invalid or expired."""
    pass


def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return password_hasher.verify(plain_password, hashed_password)


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "access"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        raise InvalidTokenError(str(e))


def verify_access_token(token: str) -> str:
    """Verify an access token and return the user ID."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise InvalidTokenError("Invalid token type")
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenError("Invalid token payload")
    return user_id


def verify_refresh_token(token: str) -> str:
    """Verify a refresh token and return the user ID."""
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise InvalidTokenError("Invalid token type")
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenError("Invalid token payload")
    return user_id


def create_password_reset_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT password reset token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "password_reset"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
