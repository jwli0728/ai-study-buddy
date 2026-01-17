from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class DocumentBase(BaseModel):
    original_filename: str
    mime_type: str
    file_size: int


class DocumentResponse(DocumentBase):
    id: UUID
    session_id: UUID
    filename: str
    processing_status: str
    processing_error: str | None
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


class DocumentStatusResponse(BaseModel):
    id: UUID
    processing_status: str
    processing_error: str | None
    chunk_count: int
