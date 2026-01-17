from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.graph.state import GraphState
from app.config import get_settings

settings = get_settings()


class GenerationNode:
    """LLM generation node using Google Gemini."""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.7,
        )

        self.rag_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a helpful AI study assistant. Use the provided context from lecture notes to answer the student's question accurately and helpfully.

Guidelines:
- Base your answers primarily on the provided context
- If the context contains relevant information, cite the source using [Source: filename]
- If the context doesn't fully answer the question, say what you found and offer to help further
- Be educational and encouraging
- Keep responses clear and well-organized
- If asked about something not in the context, acknowledge this and provide general knowledge if appropriate

Context from lecture notes:
{context}""",
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        self.general_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a helpful AI study assistant. Help students understand concepts, answer questions, and provide clear explanations.

Guidelines:
- Be educational and encouraging
- Provide clear, well-organized explanations
- Use examples when helpful
- If you don't know something, say so honestly
- Suggest uploading relevant lecture notes if the question would benefit from specific course material""",
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

    async def __call__(self, state: GraphState) -> GraphState:
        """Generate a response using the LLM."""
        if state.get("has_context", False) and state.get("retrieved_chunks"):
            # RAG response with context
            context = "\n\n".join(
                [
                    f"[{chunk['document_name']}]: {chunk['content']}"
                    for chunk in state["retrieved_chunks"]
                ]
            )

            chain = self.rag_prompt | self.llm
            response = await chain.ainvoke(
                {"context": context, "messages": state["messages"]}
            )

            state["sources"] = [
                {
                    "chunk_id": chunk["id"],
                    "document_name": chunk["document_name"],
                    "similarity": chunk["similarity"],
                }
                for chunk in state["retrieved_chunks"]
            ]
        else:
            # General response without RAG
            chain = self.general_prompt | self.llm
            response = await chain.ainvoke({"messages": state["messages"]})
            state["sources"] = []

        state["response"] = response.content
        return state
