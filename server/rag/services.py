import os
import json
import asyncio
import logging
import threading
from typing import List, Tuple
import numpy as np
from langchain_core.documents import Document
from langchain_postgres import PGVectorStore, PGEngine
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from notebooks.models import NotebookFile
from anthropic import Anthropic
from anthropic.types import TextBlock
from asgiref.sync import sync_to_async
from sqlalchemy.exc import ProgrammingError
from langchain_text_splitters import RecursiveCharacterTextSplitter


logger = logging.LoggerAdapter(logging.getLogger(__name__), {"tag": "rag"})


_vector_store = None
# A threading lock, not asyncio: callers reach this from several threads (Celery's
# --pool=threads worker, gunicorn's threads), each on its own short-lived
# asyncio.run() loop, and an asyncio.Lock binds permanently to the first loop that
# takes it. Held across the awaits below, which is safe because that awaited work
# runs on PGEngine's background loop, not on the caller's — it can't deadlock here.
_vector_store_lock = threading.Lock()


async def get_vector_store():
    """Return the process-wide PGVectorStore, building it on first use.

    Every call used to construct a fresh embeddings client, a fresh PGEngine (an
    entire new asyncpg pool) and a fresh PGVectorStore, so each retrieval paid
    full pool setup before doing any work — and dropped the pool afterwards.

    Caching is safe across callers because langchain-postgres dispatches every
    engine/vector-store coroutine onto its own long-lived background loop
    (``PGEngine._default_loop``) via ``run_coroutine_threadsafe``; the pool is
    never bound to the throwaway ``asyncio.run`` loop of whichever caller built
    it. Construction stays lazy — nothing is built at import time — so gunicorn's
    forked workers each open their own pool post-fork instead of sharing the
    parent's.
    """
    global _vector_store

    if _vector_store is not None:
        return _vector_store

    connection_string = os.getenv("CONNECTION_STRING")
    if connection_string is None:
        raise ValueError("CONNECTION_STRING environment variable is not set")

    with _vector_store_lock:
        if _vector_store is not None:
            return _vector_store

        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        pg_engine = PGEngine.from_connection_string(url=connection_string)

        try:
            await pg_engine.ainit_vectorstore_table(
                table_name="rag_embeddings",
                vector_size=3072,
                overwrite_existing=False,
            )
        except ProgrammingError:
            pass  # Table already exists (created by another process)

        _vector_store = await PGVectorStore.create(
            engine=pg_engine,
            embedding_service=embeddings,
            table_name="rag_embeddings",
        )

    return _vector_store


async def ingest_note_to_rag(note_id):
    note = await NotebookFile.objects.select_related('notebook__user').aget(id=note_id)
    file_path = note.file.path

    TEXT_EXTENSIONS = {"txt", "md"}
    IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "tiff", "bmp"}
    LLAMAPARSE_EXTENSIONS = IMAGE_EXTENSIONS | {
        "pdf", "docx", "doc", "pptx", "ppt", "xlsx", "xls",
    }

    # Step 1: Parse
    logger.info("Parsing document: %s (type=%s)", file_path, note.file_type)

    if note.file_type in TEXT_EXTENSIONS:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_text = f.read()
    elif note.file_type in LLAMAPARSE_EXTENSIONS:
        from llama_cloud import AsyncLlamaCloud

        # Choose parse tier based on whether the document contains images.
        # Images/diagrams → agentic (10 cr); text-only → cost_effective (3 cr).
        if note.file_type == "pdf":
            has_images = _pdf_has_images(file_path)
        else:
            # Non-PDF office docs and image files: assume visual content.
            has_images = True

        tier = "agentic" if has_images else "cost_effective"
        logger.info("Using LlamaParse tier=%s for file_type=%s", tier, note.file_type)

        client = AsyncLlamaCloud(api_key=os.getenv("LLAMA_CLOUD_API_KEY"))
        file_obj = await client.files.create(file=file_path, purpose="parse")

        result = await client.parsing.parse(
            file_id=file_obj.id,
            tier=tier,
            version="latest",
            expand=["markdown_full"],
        )
        raw_text = result.markdown_full or ""
    else:
        raise ValueError(f"Unsupported file type: {note.file_type}")

    logger.info("Parsed document: %d chars", len(raw_text))

    # Step 2: Chunk
    splitter = RecursiveCharacterTextSplitter(
        separators=["\n## ", "\n### ", "\n\n", "\n", " "],
        chunk_size=3000,
        chunk_overlap=200,
    )
    chunk_texts = splitter.split_text(raw_text)
    logger.info("Created %d chunks", len(chunk_texts))

    langchain_documents = [Document(page_content=t) for t in chunk_texts]

    # Step 3: Embed chunks
    logger.info("Embedding chunks...")
    embed_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    chunk_embeddings = await embed_model.aembed_documents(chunk_texts)

    # Step 4: Topic Discovery
    try:
        topics, topic_embeddings = await discover_file_topics(
            langchain_documents, str(note.notebook.pk)
        )
        if topics:
            assign_topics_by_similarity(langchain_documents, chunk_embeddings, topic_embeddings, topics)
            logger.info("Assigned topics to %d chunks", len(langchain_documents))
    except Exception:
        logger.exception("Topic discovery failed (non-fatal)")

    # Step 5: Attach metadata
    for doc in langchain_documents:
        doc.metadata["notebook_id"] = str(note.notebook.pk)
        doc.metadata["user_id"] = str(note.notebook.user.pk)
        doc.metadata["notebook_file_id"] = str(note.pk)

    # Step 6: Vector Store — use pre-computed embeddings to avoid re-embedding
    logger.info("Upserting to vector store...")
    vector_store = await get_vector_store()
    await vector_store.aadd_embeddings(
        texts=[doc.page_content for doc in langchain_documents],
        embeddings=chunk_embeddings,
        metadatas=[doc.metadata for doc in langchain_documents],
    )

    note.ingestion_status = NotebookFile.IngestionStatus.READY
    await note.asave(update_fields=["ingestion_status"])


async def discover_file_topics(
    langchain_documents: List[Document],
    notebook_id: str,
) -> Tuple[list, List[List[float]]]:
    """
    Build a document summary, ask Claude Haiku for 5 topics, then
    deduplicate against existing NotebookTopic rows for this notebook.

    Returns a tuple of (topic_objects, topic_embeddings) where topic_embeddings
    is a list of float lists in the same order as topic_objects.
    """
    from rag.models import NotebookTopic
    from notebooks.models import Notebook
    from django.db import connection

    # Build a concise summary from chunk page_content (cap at 6000 chars)
    combined = " ".join(doc.page_content for doc in langchain_documents)
    summary = combined[:6000]

    # Ask LLM to generate topic list
    raw_topics = await sync_to_async(_generate_topics_from_summary)(summary)
    if not raw_topics:
        return [], []

    logger.info("LLM discovered topics: %s", raw_topics)

    embed_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    topic_embeddings_raw = await embed_model.aembed_documents(raw_topics)

    notebook = await Notebook.objects.aget(pk=notebook_id)

    result_topics = []
    result_embeddings = []

    for topic_name, topic_emb in zip(raw_topics, topic_embeddings_raw):
        matched_topic = await _find_similar_topic(notebook_id, topic_emb, threshold=0.9)

        if matched_topic:
            logger.debug("Reusing existing topic: '%s'", matched_topic.name)
            result_topics.append(matched_topic)
            # Fetch the stored embedding for this topic for later cosine comparison
            result_embeddings.append(matched_topic.embedding.tolist())
        else:
            new_topic = await sync_to_async(NotebookTopic.objects.create)(
                notebook=notebook,
                name=topic_name,
                embedding=topic_emb,
            )
            logger.info("Created new topic: '%s'", topic_name)
            result_topics.append(new_topic)
            result_embeddings.append(topic_emb)

    return result_topics, result_embeddings


async def _find_similar_topic(notebook_id: str, query_embedding: List[float], threshold: float):
    """
    Return the closest NotebookTopic for this notebook if cosine similarity >= threshold,
    otherwise return None.
    """
    from rag.models import NotebookTopic

    existing = await sync_to_async(list)(
        NotebookTopic.objects.filter(notebook_id=notebook_id)
    )
    if not existing:
        return None

    q = np.array(query_embedding, dtype=np.float32)
    best_topic = None
    best_sim = -1.0

    for topic in existing:
        t = np.array(topic.embedding, dtype=np.float32)
        sim = float(np.dot(q, t) / (np.linalg.norm(q) * np.linalg.norm(t) + 1e-10))
        if sim > best_sim:
            best_sim = sim
            best_topic = topic

    if best_sim >= threshold:
        return best_topic
    return None


def assign_topics_by_similarity(
    docs: List[Document],
    chunk_embeddings: List[List[float]],
    topic_embeddings: List[List[float]],
    topics: list,
) -> None:
    """
    For each chunk, find the topic with the highest cosine similarity and
    write its id into doc.metadata["topic_id"] and name into doc.metadata["topic_name"].
    """
    if not topics or not topic_embeddings:
        return

    topic_matrix = np.array(topic_embeddings, dtype=np.float32)
    # Normalize rows
    norms = np.linalg.norm(topic_matrix, axis=1, keepdims=True) + 1e-10
    topic_matrix_normed = topic_matrix / norms

    for doc, chunk_emb in zip(docs, chunk_embeddings):
        c = np.array(chunk_emb, dtype=np.float32)
        c_norm = c / (np.linalg.norm(c) + 1e-10)
        sims = topic_matrix_normed @ c_norm
        best_idx = int(np.argmax(sims))
        best_topic = topics[best_idx]
        doc.metadata["topic_id"] = str(best_topic.pk)
        doc.metadata["topic_name"] = best_topic.name


async def delete_file_vectors(notebook_file_id: str):
    """Delete a file's chunks plus any topics this file orphans.

    Topics are notebook-scoped and reused across files in the same notebook
    (see `_find_similar_topic`), so we only delete a topic if no remaining
    chunk references it. Orphan-check must run BEFORE the chunk delete,
    otherwise every referenced topic looks orphaned.
    """
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine

    connection_string = os.getenv("CONNECTION_STRING")
    if not connection_string:
        raise ValueError("CONNECTION_STRING environment variable is not set")

    engine = create_async_engine(connection_string)
    try:
        async with engine.begin() as conn:
            await conn.execute(
                text(
                    """
                    DELETE FROM rag_notebooktopic
                    WHERE id::text IN (
                        SELECT DISTINCT langchain_metadata->>'topic_id'
                        FROM rag_embeddings
                        WHERE langchain_metadata->>'notebook_file_id' = :file_id
                          AND langchain_metadata->>'topic_id' IS NOT NULL
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM rag_embeddings
                        WHERE langchain_metadata->>'notebook_file_id' != :file_id
                          AND langchain_metadata->>'topic_id' = rag_notebooktopic.id::text
                    )
                    """
                ),
                {"file_id": str(notebook_file_id)},
            )
            await conn.execute(
                text(
                    "DELETE FROM rag_embeddings WHERE langchain_metadata->>'notebook_file_id' = :file_id"
                ),
                {"file_id": str(notebook_file_id)},
            )
    finally:
        await engine.dispose()


async def delete_notebook_vectors(notebook_id: str):
    """Delete all vector chunks belonging to an entire Notebook."""
    connection_string = os.getenv("CONNECTION_STRING")
    if not connection_string:
        raise ValueError("CONNECTION_STRING environment variable is not set")

    from sqlalchemy.ext.asyncio import create_async_engine
    engine = create_async_engine(connection_string)
    async with engine.begin() as conn:
        await conn.execute(
            __import__("sqlalchemy").text(
                "DELETE FROM rag_embeddings WHERE langchain_metadata->>'notebook_id' = :notebook_id"
            ),
            {"notebook_id": str(notebook_id)},
        )
    await engine.dispose()


async def query_notebook_rag(notebook_id, user_id, user_query):
    vector_store = await get_vector_store()

    results = await vector_store.asimilarity_search(
        user_query,
        k=5,
        filter={"notebook_id": str(notebook_id), "user_id": str(user_id)}
    )

    return results


async def query_notebook_rag_by_topic(notebook_id: str, user_id: str, topic_name: str, topic_id: str, k: int = 10):
    """
    Retrieve chunks for a specific topic. Filters by notebook + topic_id metadata,
    then ranks by semantic similarity to the topic name.
    Falls back to notebook-level retrieval if the topic filter yields no results.
    """
    vector_store = await get_vector_store()

    results = await vector_store.asimilarity_search(
        topic_name,
        k=k,
        filter={"notebook_id": str(notebook_id), "user_id": str(user_id), "topic_id": str(topic_id)}
    )

    # Graceful fallback for old chunks that pre-date topic tagging
    if not results:
        logger.info(
            "No topic-filtered results for topic_id=%s, falling back to notebook-level retrieval",
            topic_id,
        )
        fallback_filter = {"notebook_id": str(notebook_id), "user_id": str(user_id)}
        logger.debug("Fallback filter: %s", fallback_filter)
        results = await vector_store.asimilarity_search(
            topic_name,
            k=k,
            filter=fallback_filter,
        )
        logger.info("Fallback results count: %d", len(results))

    return results


#=========================== HELPER FUNCTIONS ===========================#

def _pdf_has_images(file_path: str) -> bool:
    """Return True if any page in the PDF contains embedded image XObjects."""
    from pypdf import PdfReader
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            resources = page.get("/Resources")
            if resources and "/XObject" in resources:
                xobjects = resources["/XObject"]
                if hasattr(xobjects, "get_object"):
                    xobjects = xobjects.get_object()
                for obj in xobjects.values():
                    if hasattr(obj, "get_object"):
                        obj = obj.get_object()
                    if obj.get("/Subtype") == "/Image":
                        return True
    except Exception:
        logger.warning("Could not inspect PDF for images, assuming visual content: %s", file_path)
        return True
    return False


def _generate_topics_from_summary(summary: str) -> List[str]:
    """
    Call Claude Haiku with the document summary and return a list of up to 5 topic strings.
    Returns an empty list on failure.
    """
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""You are a topic extraction system for academic lecture notes.

Given the following document content, identify the 5 most specific and distinct topics covered.

Rules:
- Return ONLY a valid JSON array of strings, no explanation or markdown
- Each topic should be 3-7 words, specific enough to be useful as a quiz category
- Topics should be distinct from each other (no overlap)
- If the document clearly covers fewer than 5 topics, return fewer
- Good examples: ["Mitosis and Cell Division", "DNA Replication Mechanisms", "Protein Synthesis"]
- Bad examples: ["Science", "Biology", "Chapter 1"]

DOCUMENT CONTENT:
{summary}

JSON array:"""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        block = response.content[0]
        if not isinstance(block, TextBlock):
            return []
        raw_text = block.text.strip()
        # Strip markdown code fences if present (```json ... ``` or ``` ... ```)
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()
        topics = json.loads(raw_text)
        if isinstance(topics, list):
            return [str(t).strip() for t in topics if t][:5]
        return []
    except Exception:
        logger.exception("Topic generation failed")
        return []
