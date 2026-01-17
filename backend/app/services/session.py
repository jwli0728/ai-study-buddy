from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import StudySession
from app.schemas import SessionCreate, SessionUpdate, SessionResponse, SessionListResponse


class SessionService:
    @staticmethod
    async def create_session(
        db: AsyncSession, user_id: UUID, session_data: SessionCreate
    ) -> StudySession:
        """Create a new study session."""
        session = StudySession(
            user_id=user_id,
            title=session_data.title,
            description=session_data.description,
            subject=session_data.subject,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def get_session(db: AsyncSession, session_id: UUID) -> StudySession | None:
        """Get a session by ID."""
        result = await db.execute(
            select(StudySession).where(StudySession.id == session_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_session_for_user(
        db: AsyncSession, session_id: UUID, user_id: UUID
    ) -> StudySession | None:
        """Get a session by ID, verifying ownership."""
        result = await db.execute(
            select(StudySession).where(
                StudySession.id == session_id,
                StudySession.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_sessions(
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        include_archived: bool = False,
    ) -> SessionListResponse:
        """List all sessions for a user."""
        query = select(StudySession).where(StudySession.user_id == user_id)

        if not include_archived:
            query = query.where(StudySession.is_archived == False)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(StudySession.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        sessions = result.scalars().all()

        return SessionListResponse(
            sessions=[SessionResponse.model_validate(s) for s in sessions],
            total=total,
        )

    @staticmethod
    async def update_session(
        db: AsyncSession, session: StudySession, session_data: SessionUpdate
    ) -> StudySession:
        """Update a session."""
        update_data = session_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(session, field, value)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def delete_session(db: AsyncSession, session: StudySession) -> None:
        """Delete a session."""
        await db.delete(session)
        await db.commit()

    @staticmethod
    async def archive_session(
        db: AsyncSession, session: StudySession, archive: bool = True
    ) -> StudySession:
        """Archive or unarchive a session."""
        session.is_archived = archive
        await db.commit()
        await db.refresh(session)
        return session
