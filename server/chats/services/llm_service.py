import json
import os
from typing import Generator

from ..models import Chats, ChatMessages, ChatRole
from anthropic import Anthropic

def _stream_llm_response(
    chat: Chats,
    system_prompt: str,
    conversation_history: list,
    next_index: int,
) -> Generator[bytes, None, None]:
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    full_content = ""
    token_count = None

    try:
        with client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            system=system_prompt,
            messages=conversation_history,
        ) as stream:
            for text in stream.text_stream:
                full_content += text
                yield f"data: {json.dumps({'text': text})}\n\n".encode()

            token_count = stream.get_final_message().usage.output_tokens

    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n".encode()
        return

    ChatMessages.objects.create(
        chat=chat,
        role=ChatRole.CHATBOT,
        content=full_content,
        token_count=token_count,
        order_index=next_index,
    )

    yield b"data: [DONE]\n\n"