from uuid import UUID
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings

settings = get_settings()


@dataclass
class RetrievedChunk:
    id: str
    content: str
    document_id: str
    document_name: str
    chunk_index: int
    similarity: float
    metadata: dict


class EmbeddingService:
    def __init__(self):
        self._embeddings = None

    @property
    def embeddings(self):
        if self._embeddings is None:
            self._embeddings = GoogleGenerativeAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                google_api_key=settings.GOOGLE_API_KEY,
            )
        return self._embeddings

    async def similarity_search(
        self,
        db: AsyncSession,
        session_id: UUID,
        query: str,
        k: int = 5,
        score_threshold: float = 0.5,
    ) -> list[RetrievedChunk]:
        """Perform similarity search using pgvector."""
        # Generate query embedding
        query_embedding = await self.embeddings.aembed_query(query)

        # Convert embedding to string format for pgvector
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # Perform similarity search with pgvector
        # Using <=> for cosine distance (1 - similarity)
        result = await db.execute(
            text("""
                SELECT
                    dc.id,
                    dc.content,
                    dc.metadata,
                    dc.chunk_index,
                    dc.document_id,
                    d.original_filename,
                    1 - (dc.embedding <=> :query_embedding::vector) as similarity
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE dc.session_id = :session_id
                    AND dc.embedding IS NOT NULL
                ORDER BY dc.embedding <=> :query_embedding::vector
                LIMIT :k
            """),
            {
                "query_embedding": embedding_str,
                "session_id": str(session_id),
                "k": k,
            },
        )

        rows = result.fetchall()

        chunks = []
        for row in rows:
            if row.similarity >= score_threshold:
                chunks.append(
                    RetrievedChunk(
                        id=str(row.id),
                        content=row.content,
                        document_id=str(row.document_id),
                        document_name=row.original_filename,
                        chunk_index=row.chunk_index,
                        similarity=row.similarity,
                        metadata=row.metadata or {},
                    )
                )

        return chunks

    async def has_documents(self, db: AsyncSession, session_id: UUID) -> bool:
        """Check if a session has any document chunks."""
        result = await db.execute(
            text("""
                SELECT EXISTS(
                    SELECT 1 FROM document_chunks
                    WHERE session_id = :session_id
                    AND embedding IS NOT NULL
                    LIMIT 1
                )
            """),
            {"session_id": str(session_id)},
        )
        return result.scalar() or False
