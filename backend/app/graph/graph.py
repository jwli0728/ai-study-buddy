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
        self.embedding_service = EmbeddingService()
        self.retrieval = RetrievalNode(self.embedding_service)
        self.generation = GenerationNode()
        self._graph = self._build_graph()

    def _build_graph(self):
        """Build and compile the conversation graph."""
        workflow = StateGraph(GraphState)

        # Add nodes with real callables
        workflow.add_node("route_query", self.router)
        workflow.add_node("retrieve", self.retrieval)
        workflow.add_node("generate", self.generation)

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
        initial_state: GraphState = {
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

        # Run the compiled graph, passing db via config
        result = await self._graph.ainvoke(
            initial_state,
            config={"configurable": {"db": db}},
        )

        return {
            "response": result["response"],
            "sources": result["sources"],
        }


# Singleton instance
study_buddy_graph = StudyBuddyGraph()
