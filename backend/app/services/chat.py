from uuid import UUID

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ChatMessage
from app.schemas import (
    ChatMessageResponse,
    ChatResponse,
    MessageListResponse,
    SourceReference,
)
from app.graph.graph import study_buddy_graph


class ChatService:
    @staticmethod
    async def get_conversation_history(
        db: AsyncSession, session_id: UUID, limit: int = 20
    ) -> list[dict]:
        """Get recent conversation history for context."""
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()

        # Reverse to get chronological order
        messages = list(reversed(messages))

        return [{"role": msg.role, "content": msg.content} for msg in messages]

    @staticmethod
    async def process_message(
        db: AsyncSession,
        session_id: UUID,
        user_id: UUID,
        content: str,
    ) -> ChatResponse:
        """Process a user message and generate AI response."""
        # Get conversation history for context
        history = await ChatService.get_conversation_history(db, session_id, limit=10)

        # Run the LangGraph
        result = await study_buddy_graph.run(
            db=db,
            session_id=session_id,
            user_id=user_id,
            user_query=content,
            conversation_history=history,
        )

        # Save user message
        user_message = ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=content,
            sources=[],
        )
        db.add(user_message)

        # Save assistant message
        sources_data = [
            {
                "chunk_id": s["chunk_id"],
                "document_name": s["document_name"],
                "similarity": s["similarity"],
            }
            for s in result["sources"]
        ]

        assistant_message = ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=result["response"],
            sources=sources_data,
        )
        db.add(assistant_message)

        await db.commit()
        await db.refresh(user_message)
        await db.refresh(assistant_message)

        return ChatResponse(
            user_message_id=user_message.id,
            assistant_message_id=assistant_message.id,
            response=result["response"],
            sources=[
                SourceReference(
                    chunk_id=s["chunk_id"],
                    document_name=s["document_name"],
                    similarity=s["similarity"],
                )
                for s in result["sources"]
            ],
        )

    @staticmethod
    async def list_messages(
        db: AsyncSession, session_id: UUID, skip: int = 0, limit: int = 50
    ) -> MessageListResponse:
        """List all messages for a session."""
        query = select(ChatMessage).where(ChatMessage.session_id == session_id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(ChatMessage.created_at.asc()).offset(skip).limit(limit)
        result = await db.execute(query)
        messages = result.scalars().all()

        return MessageListResponse(
            messages=[
                ChatMessageResponse(
                    id=msg.id,
                    session_id=msg.session_id,
                    role=msg.role,
                    content=msg.content,
                    sources=[
                        SourceReference(
                            chunk_id=s.get("chunk_id", ""),
                            document_name=s.get("document_name", ""),
                            similarity=s.get("similarity", 0.0),
                        )
                        for s in (msg.sources or [])
                    ],
                    created_at=msg.created_at,
                )
                for msg in messages
            ],
            total=total,
        )

    @staticmethod
    async def clear_messages(db: AsyncSession, session_id: UUID) -> None:
        """Clear all messages for a session."""
        await db.execute(
            delete(ChatMessage).where(ChatMessage.session_id == session_id)
        )
        await db.commit()
