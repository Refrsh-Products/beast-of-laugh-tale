import os
import json
import asyncio
from typing import List, Tuple
import numpy as np
from langchain_core.documents import Document
from langchain_postgres import PGVectorStore, PGEngine
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from notebooks.models import NotebookFile
from anthropic import Anthropic
from anthropic.types import TextBlockParam, ImageBlockParam, TextBlock
from asgiref.sync import sync_to_async
from sqlalchemy.exc import ProgrammingError


_vectorstore_table_initialized = False


async def get_vector_store():
    global _vectorstore_table_initialized

    connection_string = os.getenv("CONNECTION_STRING")
    if connection_string is None:
        raise ValueError("CONNECTION_STRING environment variable is not set")

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    pg_engine = PGEngine.from_connection_string(url=connection_string)

    if not _vectorstore_table_initialized:
        try:
            await pg_engine.ainit_vectorstore_table(
                table_name="rag_embeddings",
                vector_size=3072,
                overwrite_existing=False,
            )
        except ProgrammingError:
            pass  # Table already exists (created by another process)

        _vectorstore_table_initialized = True

    return await PGVectorStore.create(
        engine=pg_engine,
        embedding_service=embeddings,
        table_name="rag_embeddings",
    )


async def ingest_note_to_rag(note_id):
    from unstructured.partition.pdf import partition_pdf
    from unstructured.partition.image import partition_image
    from unstructured.chunking.title import chunk_by_title

    note = await NotebookFile.objects.select_related('notebook__user').aget(id=note_id)
    file_path = note.file.path

    # Step 1: Partition
    print(f"Partitioning document: {file_path}")

    IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "tiff", "bmp"}

    if note.file_type == "pdf":
        elements = partition_pdf(
            filename=file_path,
            strategy="hi_res",
            infer_table_structure=True,
            extract_image_block_types=["Image"],
            extract_image_block_to_payload=True
        )
    elif note.file_type in IMAGE_EXTENSIONS:
        elements = partition_image(filename=file_path)
    else:
        raise ValueError(f"Unsupported file type: {note.file_type}")

    print(f"Extracted {len(elements)} elements")

    # Step 2: Chunk
    print(f"Creating smart chunks...")

    chunks = chunk_by_title(
        elements,
        max_characters=3000,
        new_after_n_chars=2400,
        combine_text_under_n_chars=500
    )

    print(f"Created {len(chunks)} chunks")

    # Step 3: AI Summarisation
    print("Processing chunks with AI Summaries...")

    langchain_documents = []
    total_chunks = len(chunks)

    for i, chunk in enumerate(chunks):
        current_chunk = i + 1
        print(f"   Processing chunk {current_chunk}/{total_chunks}")

        content_data = separate_content_types(chunk)

        print(f"     Types found: {content_data['types']}")
        print(f"     Tables: {len(content_data['tables'])}, Images: {len(content_data['images'])}")

        if content_data['tables'] or content_data['images']:
            print(f"     Creating AI summary for mixed content...")
            try:
                enhanced_content = await sync_to_async(create_ai_enhanced_summary)(
                    content_data['text'],
                    content_data['tables'],
                    content_data['images']
                )
                print(f"     AI summary created successfully")
                print(f"     Enhanced content preview: {enhanced_content[:200]}...")
            except Exception as e:
                print(f"     AI summary failed: {e}")
                enhanced_content = content_data['text']
        else:
            print(f"     Using raw text (no tables/images)")
            enhanced_content = content_data['text']

        doc = Document(
            page_content=enhanced_content,
            metadata={
                "original_content": json.dumps({
                    "raw_text": content_data['text'],
                    "tables_html": content_data['tables'],
                })
            }
        )

        langchain_documents.append(doc)

    print(f"Processed {len(langchain_documents)} chunks")
    summarised_chunks = langchain_documents

    for doc in summarised_chunks:
        doc.metadata["notebook_id"] = str(note.notebook.pk)
        doc.metadata["user_id"] = str(note.notebook.user.pk)
        doc.metadata["notebook_file_id"] = str(note.pk)

    # Step 4: Topic Discovery + Chunk Embedding
    print("Discovering topics and embedding chunks...")

    embed_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    chunk_texts = [doc.page_content for doc in summarised_chunks]
    chunk_embeddings = await embed_model.aembed_documents(chunk_texts)

    try:
        topics, topic_embeddings = await discover_file_topics(
            summarised_chunks, str(note.notebook.pk)
        )
        if topics:
            assign_topics_by_similarity(summarised_chunks, chunk_embeddings, topic_embeddings, topics)
            print(f"Assigned topics to {len(summarised_chunks)} chunks")
    except Exception as e:
        print(f"Topic discovery failed (non-fatal): {e}")

    # Step 5: Vector Store — use pre-computed embeddings to avoid re-embedding
    print("Upserting to vector store...")
    vector_store = await get_vector_store()
    await vector_store.aadd_embeddings(
        texts=chunk_texts,
        embeddings=chunk_embeddings,
        metadatas=[doc.metadata for doc in summarised_chunks],
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

    print(f"  LLM discovered topics: {raw_topics}")

    embed_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    topic_embeddings_raw = await embed_model.aembed_documents(raw_topics)

    notebook = await Notebook.objects.aget(pk=notebook_id)

    result_topics = []
    result_embeddings = []

    for topic_name, topic_emb in zip(raw_topics, topic_embeddings_raw):
        matched_topic = await _find_similar_topic(notebook_id, topic_emb, threshold=0.9)

        if matched_topic:
            print(f"  Reusing existing topic: '{matched_topic.name}'")
            result_topics.append(matched_topic)
            # Fetch the stored embedding for this topic for later cosine comparison
            result_embeddings.append(matched_topic.embedding.tolist())
        else:
            new_topic = await sync_to_async(NotebookTopic.objects.create)(
                notebook=notebook,
                name=topic_name,
                embedding=topic_emb,
            )
            print(f"  Created new topic: '{topic_name}'")
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
    """Delete all vector chunks belonging to a single NotebookFile."""
    connection_string = os.getenv("CONNECTION_STRING")
    if not connection_string:
        raise ValueError("CONNECTION_STRING environment variable is not set")

    from sqlalchemy.ext.asyncio import create_async_engine
    engine = create_async_engine(connection_string)
    async with engine.begin() as conn:
        await conn.execute(
            __import__("sqlalchemy").text(
                "DELETE FROM rag_embeddings WHERE langchain_metadata->>'notebook_file_id' = :file_id"
            ),
            {"file_id": str(notebook_file_id)},
        )
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
        print(f"  No topic-filtered results for topic_id={topic_id}, falling back to notebook-level retrieval")
        fallback_filter = {"notebook_id": str(notebook_id), "user_id": str(user_id)}
        print(f"  Fallback filter: {fallback_filter}")
        results = await vector_store.asimilarity_search(
            topic_name,
            k=k,
            filter=fallback_filter,
        )
        print(f"  Fallback results count: {len(results)}")

    return results


#=========================== HELPER FUNCTIONS ===========================#

def separate_content_types(chunk):
    """Analyze what types of content are in a chunk"""
    content_data = {
        'text': chunk.text,
        'tables': [],
        'images': [],
        'types': ['text']
    }

    if hasattr(chunk, 'metadata') and hasattr(chunk.metadata, 'orig_elements'):
        for element in chunk.metadata.orig_elements:
            element_type = type(element).__name__

            if element_type == 'Table':
                content_data['types'].append('table')
                table_html = getattr(element.metadata, 'text_as_html', element.text)
                content_data['tables'].append(table_html)

            elif element_type == 'Image':
                if hasattr(element, 'metadata') and hasattr(element.metadata, 'image_base64'):
                    content_data['types'].append('image')
                    content_data['images'].append(element.metadata.image_base64)

    content_data['types'] = list(set(content_data['types']))
    return content_data


def create_ai_enhanced_summary(text: str, tables: List[str], images: List[str]) -> str:
    """Create AI-enhanced summary for mixed content"""

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    try:
        prompt_text = f"""You are creating a searchable description for document content retrieval.

        CONTENT TO ANALYZE:
        TEXT CONTENT:
        {text}

        """

        if tables:
            prompt_text += "TABLES:\n"
            for i, table in enumerate(tables):
                prompt_text += f"Table {i+1}:\n{table}\n\n"

        prompt_text += """
        YOUR TASK:
        Generate a comprehensive, searchable description that covers:

        1. Key facts, numbers, and data points from text and tables
        2. Main topics and concepts discussed
        3. Questions this content could answer
        4. Visual content analysis (charts, diagrams, patterns in images)
        5. Alternative search terms users might use

        Make it detailed and searchable - prioritize findability over brevity.

        SEARCHABLE DESCRIPTION:"""

        content_parts: list[TextBlockParam | ImageBlockParam] = [
            TextBlockParam(type="text", text=prompt_text)
        ]

        for image_b64 in images:
            content_parts.append(ImageBlockParam(
                type="image",
                source={"type": "base64", "media_type": "image/jpeg", "data": image_b64}
            ))

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system="You are creating a searchable description for document content retrieval.",
            temperature=0,
            messages=[{"role": "user", "content": content_parts}]
        )

        block = response.content[0]
        if not isinstance(block, TextBlock):
            raise ValueError("Claude returned a non-text response")
        return block.text

    except Exception as e:
        print(f" AI summary failed: {e}")
        summary = f"{text[:300]}..."
        if tables:
            summary += f" [Contains {len(tables)} table(s)]"
        if images:
            summary += f" [Contains {len(images)} image(s)]"
        return summary


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
    except Exception as e:
        print(f"  Topic generation failed: {e}")
        return []
