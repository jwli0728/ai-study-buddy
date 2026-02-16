from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from app.graph.state import GraphState
from app.config import get_settings

settings = get_settings()


class QueryRouterNode:
    """Routes queries to determine if RAG retrieval is needed."""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0,
        )
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """Analyze the user's query and determine if it requires searching through lecture notes/documents for specific information.

Return 'retrieve' if the query:
- Asks about specific content from notes/lectures
- References material that should be in uploaded documents
- Asks "what did the lecture say about..."
- Asks about specific facts, definitions, or concepts that might be in the notes
- Requests summaries or explanations of uploaded content

Return 'direct' if the query:
- Is a general knowledge question not specific to uploaded notes
- Asks for general explanations of common concepts
- Is conversational/greeting (like "hi", "hello", "thanks")
- Asks about capabilities or how to use the system

Respond with ONLY 'retrieve' or 'direct', nothing else.""",
                ),
                ("human", "{query}"),
            ]
        )

    async def __call__(self, state: GraphState) -> GraphState:
        """Route the query based on content analysis."""
        # If no documents exist, skip retrieval
        if not state.get("has_documents", False):
            return {"needs_retrieval": False}

        chain = self.prompt | self.llm
        result = await chain.ainvoke({"query": state["user_query"]})
        decision = result.content.strip().lower()
        return {"needs_retrieval": decision == "retrieve"}
