from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, END

from app.graph.state import GraphState
from app.graph.nodes.router import QueryRouterNode
from app.graph.nodes.retrieval import RetrievalNode
from app.graph.nodes.generation import GenerationNode
from app.services.embedding import EmbeddingService


class StudyBuddyGraph:
    """LangGraph-based conversation flow for the study buddy."""

    def __init__(self):
        self.router = QueryRouterNode()
        self.retrieval = RetrievalNode()
        self.generation = GenerationNode()
        self.embedding_service = EmbeddingService()
        self._graph = None

    def _build_graph(self) -> StateGraph:
        """Build the conversation graph."""
        workflow = StateGraph(GraphState)

        # Add nodes - we'll handle the actual logic in run()
        # since we need db access which isn't available at graph build time
        workflow.add_node("route_query", lambda state: state)
        workflow.add_node("retrieve", lambda state: state)
        workflow.add_node("generate", lambda state: state)

        # Define edges
        workflow.set_entry_point("route_query")

        workflow.add_conditional_edges(
            "route_query",
            lambda state: "retrieve" if state.get("needs_retrieval", False) else "generate",
            {
                "retrieve": "retrieve",
                "generate": "generate",
            },
        )

        workflow.add_edge("retrieve", "generate")
        workflow.add_edge("generate", END)

        return workflow.compile()

    async def run(
        self,
        db: AsyncSession,
        session_id: UUID,
        user_id: UUID,
        user_query: str,
        conversation_history: list[dict],
    ) -> dict:
        """Run the conversation graph."""
        # Convert conversation history to LangChain messages
        messages = []
        for msg in conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))

        # Add current query
        messages.append(HumanMessage(content=user_query))

        # Check if session has documents
        has_documents = await self.embedding_service.has_documents(db, session_id)

        # Initialize state
        state: GraphState = {
            "user_query": user_query,
            "session_id": str(session_id),
            "user_id": str(user_id),
            "messages": messages,
            "retrieved_chunks": [],
            "needs_retrieval": False,
            "has_context": False,
            "has_documents": has_documents,
            "response": None,
            "sources": [],
        }

        # Run the graph steps manually to pass db
        # Step 1: Route query
        state = await self.router(state)

        # Step 2: Retrieve if needed
        if state.get("needs_retrieval", False):
            state = await self.retrieval(state, db)

        # Step 3: Generate response
        state = await self.generation(state)

        return {
            "response": state["response"],
            "sources": state["sources"],
        }


# Singleton instance
study_buddy_graph = StudyBuddyGraph()
