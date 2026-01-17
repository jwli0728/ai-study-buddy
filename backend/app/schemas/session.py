from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class SessionBase(BaseModel):
    title: str
    description: str | None = None
    subject: str | None = None


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    subject: str | None = None
    is_archived: bool | None = None


class SessionResponse(SessionBase):
    id: UUID
    user_id: UUID
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]
    total: int
