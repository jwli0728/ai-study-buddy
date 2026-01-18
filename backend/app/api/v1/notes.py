from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User, StudySession
from app.schemas import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse
from app.services.note import NoteService
from app.api.deps import get_current_user, get_session_for_user

router = APIRouter(tags=["Notes"])


@router.get("/sessions/{session_id}/notes", response_model=NoteListResponse)
async def list_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: StudySession = Depends(get_session_for_user),
    db: AsyncSession = Depends(get_db),
):
    """List all notes for a session."""
    return await NoteService.list_notes(db, session.id, skip=skip, limit=limit)


@router.post(
    "/sessions/{session_id}/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_note(
    note_data: NoteCreate,
    session: StudySession = Depends(get_session_for_user),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new note in a session."""
    note = await NoteService.create_note(db, session.id, current_user.id, note_data)
    return NoteResponse.model_validate(note)


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific note."""
    note = await NoteService.get_note_for_user(db, note_id, current_user.id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    return NoteResponse.model_validate(note)


@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a note."""
    note = await NoteService.get_note_for_user(db, note_id, current_user.id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    updated = await NoteService.update_note(db, note, note_data)
    return NoteResponse.model_validate(updated)


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a note."""
    note = await NoteService.get_note_for_user(db, note_id, current_user.id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    await NoteService.delete_note(db, note)
    return None


@router.post("/notes/{note_id}/pin", response_model=NoteResponse)
async def pin_note(
    note_id: UUID,
    pin: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pin or unpin a note."""
    note = await NoteService.get_note_for_user(db, note_id, current_user.id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    updated = await NoteService.pin_note(db, note, pin)
    return NoteResponse.model_validate(updated)
