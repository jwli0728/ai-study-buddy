from uuid import UUID
import asyncio

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db, AsyncSessionLocal
from app.db.models import User, StudySession
from app.schemas import DocumentResponse, DocumentListResponse, DocumentStatusResponse
from app.services.document import DocumentService
from app.api.deps import get_current_user, get_session_for_user
from app.config import get_settings

settings = get_settings()
router = APIRouter(tags=["Documents"])

# Allowed MIME types
ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/markdown": ".md",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}


async def process_document_background(document_id: UUID):
    """Background task to process a document."""
    async with AsyncSessionLocal() as db:
        service = DocumentService()
        try:
            await service.process_document(db, document_id)
        except Exception as e:
            print(f"Error processing document {document_id}: {e}")


@router.post(
    "/sessions/{session_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session: StudySession = Depends(get_session_for_user),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document to a study session."""
    # Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_MIME_TYPES.values())}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE // (1024 * 1024)}MB",
        )

    # Save document
    service = DocumentService()
    document = await service.save_uploaded_file(
        db=db,
        session_id=session.id,
        user_id=current_user.id,
        file_content=content,
        original_filename=file.filename or "unknown",
        mime_type=file.content_type,
    )

    # Queue background processing
    background_tasks.add_task(process_document_background, document.id)

    return DocumentResponse.model_validate(document)


@router.get("/sessions/{session_id}/documents", response_model=DocumentListResponse)
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: StudySession = Depends(get_session_for_user),
    db: AsyncSession = Depends(get_db),
):
    """List all documents in a study session."""
    return await DocumentService.list_documents(db, session.id, skip=skip, limit=limit)


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific document."""
    document = await DocumentService.get_document_for_user(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return DocumentResponse.model_validate(document)


@router.get("/documents/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the processing status of a document."""
    # Verify ownership
    document = await DocumentService.get_document_for_user(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    status_response = await DocumentService.get_document_status(db, document_id)
    if not status_response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return status_response


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document."""
    document = await DocumentService.get_document_for_user(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    await DocumentService.delete_document(db, document)
    return None
