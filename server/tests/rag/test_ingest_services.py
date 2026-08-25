"""Service-level tests for LlamaParse, Gemini embeddings, topics, and PGVector."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from anthropic.types import TextBlock
from asgiref.sync import sync_to_async
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connections
from sqlalchemy.exc import ProgrammingError

from notebooks.models import NotebookFile
from rag import services
from tests.factories import NotebookFactory


@pytest.fixture(autouse=True)
async def close_async_orm_connections():
    """Release the thread-sensitive async ORM connection before DB teardown."""
    yield
    await sync_to_async(connections.close_all, thread_sensitive=True)()


@sync_to_async
def source_file(user, settings, tmp_path, *, name, file_type, content=b"notes"):
    settings.MEDIA_ROOT = str(tmp_path)
    notebook = NotebookFactory(user=user)
    return NotebookFile.objects.create(
        notebook=notebook,
        name=name,
        file=SimpleUploadedFile(name, content),
        file_size=len(content),
        file_type=file_type,
    )


@pytest.fixture
def pipeline_mocks():
    embedding_model = MagicMock()
    embedding_model.aembed_documents = AsyncMock(
        side_effect=lambda texts: [[0.1, 0.2, 0.3] for _ in texts]
    )
    vector_store = MagicMock()
    vector_store.aadd_embeddings = AsyncMock()

    with patch(
        "rag.services.GoogleGenerativeAIEmbeddings",
        return_value=embedding_model,
    ) as embeddings_class, patch(
        "rag.services.discover_file_topics",
        new_callable=AsyncMock,
        return_value=([], []),
    ) as discover_topics, patch(
        "rag.services.get_vector_store",
        new_callable=AsyncMock,
        return_value=vector_store,
    ) as get_vector_store:
        yield SimpleNamespace(
            embedding_model=embedding_model,
            embeddings_class=embeddings_class,
            discover_topics=discover_topics,
            get_vector_store=get_vector_store,
            vector_store=vector_store,
        )


# Text files bypass LlamaParse, then use Gemini embeddings and PGVector metadata.
@pytest.mark.django_db(transaction=True)
async def test_text_ingestion_chunks_embeds_stores_and_marks_ready(
    user,
    settings,
    tmp_path,
    pipeline_mocks,
):
    notebook_file = await source_file(
        user,
        settings,
        tmp_path,
        name="lecture.txt",
        file_type="txt",
        content=b"Cell division and DNA replication",
    )

    await services.ingest_note_to_rag(str(notebook_file.pk))

    notebook_file = await NotebookFile.objects.aget(pk=notebook_file.pk)
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.READY
    pipeline_mocks.embedding_model.aembed_documents.assert_awaited_once_with(
        ["Cell division and DNA replication"]
    )
    call = pipeline_mocks.vector_store.aadd_embeddings.await_args
    assert call.kwargs["texts"] == ["Cell division and DNA replication"]
    assert call.kwargs["embeddings"] == [[0.1, 0.2, 0.3]]
    metadata = call.kwargs["metadatas"][0]
    assert metadata == {
        "notebook_id": str(notebook_file.notebook_id),
        "user_id": str(user.pk),
        "notebook_file_id": str(notebook_file.pk),
    }


# Text-only PDFs use LlamaParse's lower-cost parsing tier.
@pytest.mark.parametrize(
    ("has_images", "expected_tier"),
    [(False, "cost_effective"), (True, "agentic")],
)
@pytest.mark.django_db(transaction=True)
async def test_pdf_ingestion_selects_tier_from_visual_content(
    user,
    settings,
    tmp_path,
    pipeline_mocks,
    monkeypatch,
    has_images,
    expected_tier,
):
    monkeypatch.setenv("LLAMA_CLOUD_API_KEY", "test-key")
    notebook_file = await source_file(
        user,
        settings,
        tmp_path,
        name="lecture.pdf",
        file_type="pdf",
        content=b"fake PDF bytes",
    )
    llama_client = MagicMock()
    llama_client.files.create = AsyncMock(return_value=SimpleNamespace(id="file-1"))
    llama_client.parsing.parse = AsyncMock(
        return_value=SimpleNamespace(markdown_full="Parsed PDF content")
    )

    with patch("rag.services._pdf_has_images", return_value=has_images), patch(
        "llama_cloud.AsyncLlamaCloud",
        return_value=llama_client,
    ):
        await services.ingest_note_to_rag(str(notebook_file.pk))

    assert llama_client.files.create.await_count == 1
    assert llama_client.parsing.parse.await_args.kwargs["tier"] == expected_tier
    notebook_file = await NotebookFile.objects.aget(pk=notebook_file.pk)
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.READY


# Images and Office documents use the visual/agentic LlamaParse tier.
@pytest.mark.django_db(transaction=True)
async def test_image_ingestion_uses_agentic_llamaparse(
    user,
    settings,
    tmp_path,
    pipeline_mocks,
    monkeypatch,
):
    monkeypatch.setenv("LLAMA_CLOUD_API_KEY", "test-key")
    notebook_file = await source_file(
        user,
        settings,
        tmp_path,
        name="diagram.png",
        file_type="png",
        content=b"fake image bytes",
    )
    llama_client = MagicMock()
    llama_client.files.create = AsyncMock(return_value=SimpleNamespace(id="file-2"))
    llama_client.parsing.parse = AsyncMock(
        return_value=SimpleNamespace(markdown_full="Parsed image notes")
    )

    with patch("llama_cloud.AsyncLlamaCloud", return_value=llama_client):
        await services.ingest_note_to_rag(str(notebook_file.pk))

    assert llama_client.parsing.parse.await_args.kwargs["tier"] == "agentic"


# Unsupported types fail before any paid embeddings or vector-store call.
@pytest.mark.django_db(transaction=True)
async def test_unsupported_type_fails_before_external_pipeline_calls(
    user,
    settings,
    tmp_path,
    pipeline_mocks,
):
    notebook_file = await source_file(
        user,
        settings,
        tmp_path,
        name="exploit.pdf.sh",
        file_type="sh",
    )

    with pytest.raises(ValueError, match="Unsupported file type: sh"):
        await services.ingest_note_to_rag(str(notebook_file.pk))

    pipeline_mocks.embeddings_class.assert_not_called()
    pipeline_mocks.get_vector_store.assert_not_awaited()


# Claude topic discovery is non-fatal, but its failure is observable in logs.
@pytest.mark.django_db(transaction=True)
async def test_topic_discovery_failure_is_logged_and_ingestion_continues(
    user,
    settings,
    tmp_path,
    pipeline_mocks,
    caplog,
):
    notebook_file = await source_file(
        user,
        settings,
        tmp_path,
        name="lecture.md",
        file_type="md",
        content=b"# Genetics",
    )
    pipeline_mocks.discover_topics.side_effect = RuntimeError("Claude unavailable")

    with caplog.at_level("ERROR"):
        await services.ingest_note_to_rag(str(notebook_file.pk))

    notebook_file = await NotebookFile.objects.aget(pk=notebook_file.pk)
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.READY
    assert "Topic discovery failed" in caplog.text
    pipeline_mocks.vector_store.aadd_embeddings.assert_awaited_once()


# READY is written only after the vector-store upsert completes successfully.
@pytest.mark.django_db(transaction=True)
async def test_vector_store_failure_does_not_mark_file_ready(
    user,
    settings,
    tmp_path,
    pipeline_mocks,
):
    notebook_file = await source_file(
        user,
        settings,
        tmp_path,
        name="lecture.txt",
        file_type="txt",
    )
    pipeline_mocks.vector_store.aadd_embeddings.side_effect = RuntimeError(
        "PGVector unavailable"
    )

    with pytest.raises(RuntimeError, match="PGVector unavailable"):
        await services.ingest_note_to_rag(str(notebook_file.pk))

    notebook_file = await NotebookFile.objects.aget(pk=notebook_file.pk)
    assert notebook_file.ingestion_status != NotebookFile.IngestionStatus.READY


# Missing database configuration fails before constructing embedding clients.
@pytest.mark.asyncio
async def test_get_vector_store_requires_connection_string(monkeypatch):
    monkeypatch.setattr(services, "_vector_store", None)
    monkeypatch.delenv("CONNECTION_STRING", raising=False)

    with pytest.raises(ValueError, match="CONNECTION_STRING"):
        await services.get_vector_store()


# A process creates the expensive PGVector client once and reuses it thereafter.
@pytest.mark.asyncio
async def test_get_vector_store_initializes_once_and_caches(monkeypatch):
    monkeypatch.setattr(services, "_vector_store", None)
    monkeypatch.setenv("CONNECTION_STRING", "postgresql+asyncpg://test")
    engine = MagicMock()
    engine.ainit_vectorstore_table = AsyncMock()
    vector_store = object()

    with patch("rag.services.GoogleGenerativeAIEmbeddings"), patch(
        "rag.services.PGEngine.from_connection_string",
        return_value=engine,
    ) as create_engine, patch(
        "rag.services.PGVectorStore.create",
        new_callable=AsyncMock,
        return_value=vector_store,
    ) as create_store:
        first = await services.get_vector_store()
        second = await services.get_vector_store()

    assert first is vector_store
    assert second is vector_store
    create_engine.assert_called_once()
    engine.ainit_vectorstore_table.assert_awaited_once()
    create_store.assert_awaited_once()


# Concurrent table creation conflicts do not prevent creating the vector-store client.
@pytest.mark.asyncio
async def test_get_vector_store_tolerates_existing_table_race(monkeypatch):
    monkeypatch.setattr(services, "_vector_store", None)
    monkeypatch.setenv("CONNECTION_STRING", "postgresql+asyncpg://test")
    engine = MagicMock()
    engine.ainit_vectorstore_table = AsyncMock(
        side_effect=ProgrammingError("CREATE TABLE", {}, Exception("exists"))
    )
    vector_store = object()

    with patch("rag.services.GoogleGenerativeAIEmbeddings"), patch(
        "rag.services.PGEngine.from_connection_string",
        return_value=engine,
    ), patch(
        "rag.services.PGVectorStore.create",
        new_callable=AsyncMock,
        return_value=vector_store,
    ):
        result = await services.get_vector_store()

    assert result is vector_store


# Claude's fenced JSON response is normalized into at most five topic names.
def test_generate_topics_parses_fenced_claude_json(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    response = SimpleNamespace(
        content=[
            TextBlock(
                type="text",
                text='```json\n["A", "B", "C", "D", "E", "F"]\n```',
            )
        ]
    )
    anthropic = MagicMock()
    anthropic.messages.create.return_value = response

    with patch("rag.services.Anthropic", return_value=anthropic):
        topics = services._generate_topics_from_summary("lecture summary")

    assert topics == ["A", "B", "C", "D", "E"]


# Claude failures fall back to no topics and emit an error log for monitoring.
def test_generate_topics_failure_logs_and_returns_empty(monkeypatch, caplog):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    anthropic = MagicMock()
    anthropic.messages.create.side_effect = RuntimeError("Claude unavailable")

    with patch("rag.services.Anthropic", return_value=anthropic), caplog.at_level(
        "ERROR"
    ):
        topics = services._generate_topics_from_summary("lecture summary")

    assert topics == []
    assert "Topic generation failed" in caplog.text
