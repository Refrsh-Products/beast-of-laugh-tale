import os
from typing import List
import dotenv
import json
from langchain_core.documents import Document
from langchain_postgres import PGVectorStore, PGEngine
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from notebooks.models import NotebookFile
from anthropic import Anthropic
from anthropic.types import TextBlockParam, ImageBlockParam, TextBlock
from asgiref.sync import sync_to_async
from sqlalchemy.exc import ProgrammingError


async def get_vector_store():
    connection_string = os.getenv("CONNECTION_STRING")
    if connection_string is None:
        raise ValueError("CONNECTION_STRING environment variable is not set")

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    pg_engine = PGEngine.from_connection_string(url=connection_string)

    try:
        await pg_engine.ainit_vectorstore_table(
            table_name="rag_embeddings",
            vector_size=3072,
            overwrite_existing=False,
        )
    except ProgrammingError:
        pass  # Table already exists

    return await PGVectorStore.create(
        engine=pg_engine,
        embedding_service=embeddings,
        table_name="rag_embeddings",
    )

async def ingest_note_to_rag(note_id):
    from unstructured.partition.pdf import partition_pdf
    from unstructured.chunking.title import chunk_by_title

    note = await NotebookFile.objects.select_related('notebook__user').aget(id=note_id)
    file = note.file.path

    # Step 1: Partition
    print(f"Partitioning document: {file}")

    elements = partition_pdf(
        filename=file,  # Path to your PDF file
        strategy="hi_res", # Use the most accurate (but slower) processing method of extraction
        infer_table_structure=True, # Keep tables as structured HTML, not jumbled text
        extract_image_block_types=["Image"], # Grab images found in the PDF
        extract_image_block_to_payload=True # Store images as base64 data you can actually use
    )

    print(f"Extracted {len(elements)} elements")

    # Step 2: Chunk
    print(f"Creating smart chunks...")

    chunks = chunk_by_title(
        elements, # The parsed PDF elements from previous step
        max_characters=3000, # Hard limit - never exceed 3000 characters per chunk
        new_after_n_chars=2400, # Try to start a new chunk after 2400 characters
        combine_text_under_n_chars=500 # Merge tiny chunks under 500 chars with neighbors
    )

    print(f"Created {len(chunks)} chunks")
    
    # Step 3: AI Summarisation
    print("Processing chunks with AI Summaries...")

    langchain_documents = []
    total_chunks = len(chunks)

    for i, chunk in enumerate(chunks):
        current_chunk = i + 1
        print(f"   Processing chunk {current_chunk}/{total_chunks}")
        
        # Analyze chunk content
        content_data = separate_content_types(chunk)
        
        # Debug prints
        print(f"     Types found: {content_data['types']}")
        print(f"     Tables: {len(content_data['tables'])}, Images: {len(content_data['images'])}")
        
        # Create AI-enhanced summary if chunk has tables/images
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
        
        # Create LangChain Document with rich metadata
        doc = Document(
            page_content=enhanced_content,
            metadata={
                "original_content": json.dumps({
                    "raw_text": content_data['text'],
                    "tables_html": content_data['tables'],
                    "images_base64": content_data['images']
                })
            }
        )
        
        langchain_documents.append(doc)
    
    print(f"Processed {len(langchain_documents)} chunks")
    summarised_chunks = langchain_documents

    for doc in summarised_chunks:
        doc.metadata["notebook_id"] = note.notebook.pk
        doc.metadata["user_id"] = str(note.notebook.user.pk)

    # Step 4: Vector Store
    vector_store = await get_vector_store()
    await vector_store.aadd_documents(summarised_chunks)

    note.is_indexed = True
    await note.asave()

async def query_notebook_rag(notebook_id, user_id, user_query):
    vector_store = await get_vector_store()
    
    # THE KEY STEP: Metadata Filter
    # Only search chunks matching this specific notebook and user
    results = await vector_store.asimilarity_search(
        user_query, 
        k=5, 
        filter={"notebook_id": notebook_id, "user_id": str(user_id)}
    )
    
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
    
    # Check for tables and images in original elements
    if hasattr(chunk, 'metadata') and hasattr(chunk.metadata, 'orig_elements'):
        for element in chunk.metadata.orig_elements:
            element_type = type(element).__name__
            
            # Handle tables
            if element_type == 'Table':
                content_data['types'].append('table')
                table_html = getattr(element.metadata, 'text_as_html', element.text)
                content_data['tables'].append(table_html)
            
            # Handle images
            elif element_type == 'Image':
                if hasattr(element, 'metadata') and hasattr(element.metadata, 'image_base64'):
                    content_data['types'].append('image')
                    content_data['images'].append(element.metadata.image_base64)
    
    content_data['types'] = list(set(content_data['types']))
    return content_data

def create_ai_enhanced_summary(text: str, tables: List[str], images: List[str]) -> str:
    """Create AI-enhanced summary for mixed content"""

    # client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    try:
        # Build the text prompt
        prompt_text = f"""You are creating a searchable description for document content retrieval.

        CONTENT TO ANALYZE:
        TEXT CONTENT:
        {text}

        """
        
        # Add tables if present
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

        # Build content parts for Claude
        content_parts: list[TextBlockParam | ImageBlockParam] = [
            TextBlockParam(type="text", text=prompt_text)
        ]

        # Add images as inline data
        for image_b64 in images:
            content_parts.append(ImageBlockParam(
                type="image",
                source={"type": "base64", "media_type": "image/jpeg", "data": image_b64}
            ))

        # Send to AI and get response
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
        # Fallback to simple summary
        summary = f"{text[:300]}..."
        if tables:
            summary += f" [Contains {len(tables)} table(s)]"
        if images:
            summary += f" [Contains {len(images)} image(s)]"
        return summary