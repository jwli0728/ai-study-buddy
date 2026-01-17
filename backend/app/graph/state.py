from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class GraphState(TypedDict):
    """State that flows through the conversation graph."""

    # User input
    user_query: str
    session_id: str
    user_id: str

    # Conversation history
    messages: Annotated[list[BaseMessage], add_messages]

    # RAG retrieval results
    retrieved_chunks: list[dict]

    # Processing flags
    needs_retrieval: bool
    has_context: bool
    has_documents: bool

    # Response
    response: str | None
    sources: list[dict]
