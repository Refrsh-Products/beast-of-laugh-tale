import asyncio
from ..models import Chats

from rag.services import query_notebook_rag


def get_notebook_context(chat: Chats, user_id: int, user_query: str) -> str:
    """
    Handles the asynchronous RAG query and formats the documents 
    into a single context string.
    """
    rag_results = asyncio.run(
        query_notebook_rag(
            notebook_id=chat.notebook_id, # type: ignore
            user_id=user_id,
            user_query=user_query,
        )
    )

    if not rag_results:
        return "No specific notebook context found."

    return "\n\n".join(doc.page_content for doc in rag_results)

def build_study_assistant_prompt(context: str) -> str:
    """
    Encapsulates the persona and instructions for the LLM.
    """
    return (
        "You are a helpful study assistant. Answer the user's questions using the context below from their notebook.\n\n"
        f"Notebook context:\n{context}\n\n"
        "If the context does not contain enough information to answer, say so clearly."
    )