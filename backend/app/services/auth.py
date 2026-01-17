import hashlib
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, RefreshToken
from app.schemas import UserCreate, UserResponse, TokenResponse, AuthResponse
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.config import get_settings

settings = get_settings()


class AuthService:
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
        """Get a user by email."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
        """Get a user by ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """Create a new user."""
        user = User(
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            full_name=user_data.full_name,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
        """Authenticate a user with email and password."""
        user = await AuthService.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    @staticmethod
    async def create_tokens(db: AsyncSession, user: User) -> TokenResponse:
        """Create access and refresh tokens for a user."""
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        # Store refresh token hash
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        refresh_token_record = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(refresh_token_record)
        await db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    @staticmethod
    async def refresh_access_token(db: AsyncSession, refresh_token: str) -> str | None:
        """Refresh an access token using a refresh token."""
        try:
            user_id = verify_refresh_token(refresh_token)
        except Exception:
            return None

        # Verify token exists in database and is not revoked
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        token_record = result.scalar_one_or_none()
        if not token_record:
            return None

        # Verify user exists and is active
        user = await AuthService.get_user_by_id(db, UUID(user_id))
        if not user or not user.is_active:
            return None

        return create_access_token(user_id)

    @staticmethod
    async def revoke_refresh_token(db: AsyncSession, refresh_token: str) -> bool:
        """Revoke a refresh token."""
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        token_record = result.scalar_one_or_none()
        if token_record:
            token_record.revoked = True
            await db.commit()
            return True
        return False

    @staticmethod
    async def register_and_login(db: AsyncSession, user_data: UserCreate) -> AuthResponse:
        """Register a new user and return auth response with tokens."""
        user = await AuthService.create_user(db, user_data)
        tokens = await AuthService.create_tokens(db, user)
        return AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=tokens,
        )
