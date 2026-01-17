from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class SourceReference(BaseModel):
    chunk_id: str
    document_name: str
    similarity: float


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    sources: list[SourceReference]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    user_message_id: UUID
    assistant_message_id: UUID
    response: str
    sources: list[SourceReference]


class MessageListResponse(BaseModel):
    messages: list[ChatMessageResponse]
    total: int
