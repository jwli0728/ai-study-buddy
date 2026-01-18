from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User, StudySession
from app.schemas import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    SessionListResponse,
)
from app.services.session import SessionService
from app.api.deps import get_current_user, get_session_for_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    include_archived: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all study sessions for the current user."""
    return await SessionService.list_sessions(
        db, current_user.id, skip=skip, limit=limit, include_archived=include_archived
    )


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new study session."""
    session = await SessionService.create_session(db, current_user.id, session_data)
    return SessionResponse.model_validate(session)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session: StudySession = Depends(get_session_for_user),
):
    """Get a specific study session."""
    return SessionResponse.model_validate(session)


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_data: SessionUpdate,
    session: StudySession = Depends(get_session_for_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a study session."""
    updated = await SessionService.update_session(db, session, session_data)
    return SessionResponse.model_validate(updated)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session: StudySession = Depends(get_session_for_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a study session."""
    await SessionService.delete_session(db, session)
    return None


@router.post("/{session_id}/archive", response_model=SessionResponse)
async def archive_session(
    archive: bool = Query(True),
    session: StudySession = Depends(get_session_for_user),
    db: AsyncSession = Depends(get_db),
):
    """Archive or unarchive a study session."""
    updated = await SessionService.archive_session(db, session, archive)
    return SessionResponse.model_validate(updated)
