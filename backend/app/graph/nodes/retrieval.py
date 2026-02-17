from uuid import UUID

from langchain_core.runnables import RunnableConfig

from app.graph.state import GraphState
from app.services.embedding import EmbeddingService


class RetrievalNode:
    """RAG retrieval node using pgvector similarity search."""

    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service

    async def __call__(self, state: GraphState, config: RunnableConfig) -> GraphState:
        """Retrieve relevant document chunks for the query."""
        if not state.get("needs_retrieval", False):
            return {"retrieved_chunks": [], "has_context": False}

        # We pass the db session through a RunnableConfig because we want to reuse the same session/transaction across
        # all nodes. We also do not want to pass db through GraphState because we need to keep GraphState serializable.
        db = config["configurable"]["db"]
        session_id = UUID(state["session_id"])

        # Perform similarity search
        chunks = await self.embedding_service.similarity_search(
            db=db,
            session_id=session_id,
            query=state["user_query"],
            k=5,
            score_threshold=0.5,
        )

        retrieved_chunks = [
            {
                "id": chunk.id,
                "content": chunk.content,
                "document_name": chunk.document_name,
                "similarity": chunk.similarity,
            }
            for chunk in chunks
        ]

        return {"retrieved_chunks": retrieved_chunks, "has_context": len(chunks) > 0}
