import io
import os
import logging
from google import genai
from google.genai import types as genai_types

logger = logging.getLogger(__name__)

SUPPORTED_AUDIO_MIME_TYPES = {
    "mp3": "audio/mpeg",
    "mp4": "audio/mp4",
    "m4a": "audio/mp4",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
    "aac": "audio/aac",
    "webm": "audio/webm",
    "3gp": "audio/3gpp",
    "amr": "audio/amr",
}

MAX_AUDIO_BYTES = 500 * 1024 * 1024  # 500 MB (Gemini Files API limit is 2GB; we cap earlier)

TRANSCRIPTION_PROMPT = """You are transcribing a university lecture. The lecture is in a mix of Bangla and English (code-switching is normal — the professor may switch between Bangla and English mid-sentence).

Your task:
1. Transcribe the entire lecture as accurately as possible.
2. Write Bangla words in Bengali script (not romanized), and keep English terms in English.
3. Preserve technical terms, proper nouns, equations, and formulas exactly as spoken.
4. Do NOT summarize, paraphrase, or omit anything. Produce a verbatim transcript.
5. Use speaker labels only if there are clearly multiple distinct speakers (e.g., "Professor:", "Student:").
6. If a segment is inaudible or unclear, write [inaudible] rather than guessing.

Output only the transcript text. No preamble, no metadata, no commentary."""


def _get_client() -> genai.Client:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)


def get_audio_mime_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return SUPPORTED_AUDIO_MIME_TYPES.get(ext, "audio/mpeg")


class TranscriptionFailed(Exception):
    """Raised when transcription cannot produce a usable transcript."""


def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """Upload audio to Gemini Files API, transcribe, then delete the upload."""
    client = _get_client()
    mime_type = get_audio_mime_type(filename)

    uploaded_file = client.files.upload(
        file=io.BytesIO(audio_bytes),
        config=genai_types.UploadFileConfig(
            mime_type=mime_type,
            display_name=filename,
        ),
    )
    logger.info("Uploaded audio to Gemini Files API: uri=%s", uploaded_file.uri)

    try:
        if not uploaded_file.uri:
            raise TranscriptionFailed("Gemini upload returned no file URI.")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=genai_types.Content(
                role="user",
                parts=[
                    genai_types.Part.from_uri(
                        file_uri=uploaded_file.uri,
                        mime_type=mime_type,
                    ),
                    genai_types.Part.from_text(text=TRANSCRIPTION_PROMPT),
                ],
            ),
        )
        transcript = (response.text or "").strip()
        logger.info("Transcription complete: %d chars", len(transcript))
        if not transcript:
            raise TranscriptionFailed(
                "The transcription model returned no text. The audio may be silent, too short, or unintelligible."
            )
        return transcript
    finally:
        if uploaded_file.name:
            try:
                client.files.delete(name=uploaded_file.name)
                logger.info("Deleted Gemini file: %s", uploaded_file.name)
            except Exception as cleanup_err:
                logger.warning("Failed to delete Gemini file %s: %s", uploaded_file.name, cleanup_err)
