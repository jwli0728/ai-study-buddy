from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Note
from app.schemas import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse


class NoteService:
    @staticmethod
    async def create_note(
        db: AsyncSession, session_id: UUID, user_id: UUID, note_data: NoteCreate
    ) -> Note:
        """Create a new note."""
        note = Note(
            session_id=session_id,
            user_id=user_id,
            title=note_data.title,
            content=note_data.content,
        )
        db.add(note)
        await db.commit()
        await db.refresh(note)
        return note

    @staticmethod
    async def get_note(db: AsyncSession, note_id: UUID) -> Note | None:
        """Get a note by ID."""
        result = await db.execute(select(Note).where(Note.id == note_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_note_for_user(
        db: AsyncSession, note_id: UUID, user_id: UUID
    ) -> Note | None:
        """Get a note by ID, verifying ownership."""
        result = await db.execute(
            select(Note).where(Note.id == note_id, Note.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_notes(
        db: AsyncSession, session_id: UUID, skip: int = 0, limit: int = 50
    ) -> NoteListResponse:
        """List all notes for a session."""
        query = select(Note).where(Note.session_id == session_id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results (pinned first, then by creation date)
        query = (
            query.order_by(Note.is_pinned.desc(), Note.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        notes = result.scalars().all()

        return NoteListResponse(
            notes=[NoteResponse.model_validate(n) for n in notes],
            total=total,
        )

    @staticmethod
    async def update_note(db: AsyncSession, note: Note, note_data: NoteUpdate) -> Note:
        """Update a note."""
        update_data = note_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(note, field, value)
        await db.commit()
        await db.refresh(note)
        return note

    @staticmethod
    async def delete_note(db: AsyncSession, note: Note) -> None:
        """Delete a note."""
        await db.delete(note)
        await db.commit()

    @staticmethod
    async def pin_note(db: AsyncSession, note: Note, pin: bool = True) -> Note:
        """Pin or unpin a note."""
        note.is_pinned = pin
        await db.commit()
        await db.refresh(note)
        return note
