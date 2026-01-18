from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User, StudySession
from app.schemas import ChatMessageCreate, ChatResponse, MessageListResponse
from app.services.chat import ChatService
from app.api.deps import get_current_user, get_session_for_user

router = APIRouter(tags=["Chat"])


@router.get("/sessions/{session_id}/messages", response_model=MessageListResponse)
async def list_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: StudySession = Depends(get_session_for_user),
    db: AsyncSession = Depends(get_db),
):
    """Get chat history for a session."""
    return await ChatService.list_messages(db, session.id, skip=skip, limit=limit)


@router.post("/sessions/{session_id}/chat", response_model=ChatResponse)
async def send_message(
    message: ChatMessageCreate,
    session: StudySession = Depends(get_session_for_user),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message and receive AI response."""
    return await ChatService.process_message(
        db=db,
        session_id=session.id,
        user_id=current_user.id,
        content=message.content,
    )


@router.delete("/sessions/{session_id}/messages", status_code=204)
async def clear_messages(
    session: StudySession = Depends(get_session_for_user),
    db: AsyncSession = Depends(get_db),
):
    """Clear all chat messages for a session."""
    await ChatService.clear_messages(db, session.id)
    return None
