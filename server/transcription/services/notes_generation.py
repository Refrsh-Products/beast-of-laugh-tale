import os
import logging
from anthropic import Anthropic

logger = logging.getLogger(__name__)

NOTES_SYSTEM_PROMPT = """You are an expert academic note-taker. You receive a verbatim transcript of a university lecture (which may mix Bangla and English) and produce well-structured, comprehensive study notes in English.

Your output must follow this exact structure:

---
## Logistics
*Date, exam info, assignments, deadlines, announcements, and anything the professor said students must act on.*

---
## [Topic 1 Title]
### Key Concepts
- ...

### Details / Explanation
...

### Examples
...

---
## [Topic 2 Title]
...

---

Rules:
- Write all notes in clear English, even if the transcript is in Bangla.
- Translate Bangla explanations faithfully; do not omit them.
- Preserve all technical terms, formulas, and equations exactly as they appear in the transcript.
- Include a Logistics section at the top ONLY if the professor mentioned dates, deadlines, assignments, or exams. If there is nothing logistical, omit that section entirely.
- Be thorough — this is a study resource, not a summary. Capture all explained concepts.
- Use markdown formatting (headers, bold, bullet points, code blocks for formulas/code).
- Do not invent content that was not in the lecture."""


def generate_notes_from_transcript(transcript: str, lecture_title: str = "Lecture") -> str:
    """Call Claude to generate structured study notes from a lecture transcript."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set")

    client = Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        system=NOTES_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Here is the transcript for **{lecture_title}**. Please generate structured study notes.\n\n---\n{transcript}\n---",
            }
        ],
    )

    notes = ""
    for block in message.content:
        if block.type == "text":
            notes += block.text

    logger.info("Notes generation complete: %d chars for '%s'", len(notes), lecture_title)
    return notes.strip()
