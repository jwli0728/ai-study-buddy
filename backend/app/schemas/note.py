from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class NoteBase(BaseModel):
    title: str | None = None
    content: str


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None


class NoteResponse(NoteBase):
    id: UUID
    session_id: UUID
    is_pinned: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    notes: list[NoteResponse]
    total: int
