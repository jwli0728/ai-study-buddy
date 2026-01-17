from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.graph.state import GraphState
from app.services.embedding import EmbeddingService


class RetrievalNode:
    """RAG retrieval node using pgvector similarity search."""

    def __init__(self):
        self.embedding_service = EmbeddingService()

    async def __call__(self, state: GraphState, db: AsyncSession) -> GraphState:
        """Retrieve relevant document chunks for the query."""
        if not state.get("needs_retrieval", False):
            state["retrieved_chunks"] = []
            state["has_context"] = False
            return state

        session_id = UUID(state["session_id"])

        # Perform similarity search
        chunks = await self.embedding_service.similarity_search(
            db=db,
            session_id=session_id,
            query=state["user_query"],
            k=5,
            score_threshold=0.5,
        )

        state["retrieved_chunks"] = [
            {
                "id": chunk.id,
                "content": chunk.content,
                "document_name": chunk.document_name,
                "similarity": chunk.similarity,
            }
            for chunk in chunks
        ]
        state["has_context"] = len(chunks) > 0

        return state
