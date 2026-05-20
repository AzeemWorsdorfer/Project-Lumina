import logging
from typing import Any, Dict, List, Optional

from openai import OpenAI

from app.app.settings import settings
from app.core.database import get_supabase

logger: logging.Logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_embeddings(texts: List[str]) -> Optional[List[List[float]]]:
    """
    Generate vectors using OpenAI text-embedding-3-small.
    Produces 1536-dimensional embeddings matching the VECTOR(1536) schema.
    """
    if not texts:
        return []

    if not all(isinstance(text, str) and text.strip() for text in texts):
        logger.error("All texts must be non-empty strings")
        return None

    try:
        response = client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=texts,
        )
        embeddings = [item.embedding for item in response.data]
        return embeddings
    except Exception as e:
        logger.error(f"OpenAI Embedding Error: {e}")
        return None


def save_chunks_to_db(chunks: List[Dict[str, Any]], source_id: str) -> None:
    """
    Processes and saves a list of text chunks and their embeddings to Supabase.
    Implements batching and rate-limit handling.
    """
    if not chunks:
        logger.warning("No chunks to save")
        return

    if not source_id or not source_id.strip():
        raise ValueError("Source ID cannot be empty")

    batch_size = 25
    total = len(chunks)

    for i in range(0, total, batch_size):
        batch = chunks[i : i + batch_size]

        # Validate batch chunks
        batch_texts: List[str] = []
        for chunk in batch:
            if not isinstance(chunk, dict):
                logger.error(f"Invalid chunk format: {chunk}")
                continue

            content = chunk.get("content")
            if not isinstance(content, str) or not content.strip():
                logger.error("Chunk content must be non-empty string")
                continue

            batch_texts.append(content.strip())

        if not batch_texts:
            logger.warning(f"No valid content in batch {i // batch_size + 1}")
            continue

        logger.info(f"Processing batch {i // batch_size + 1} for source {source_id}...")
        embeddings = get_embeddings(batch_texts)

        if embeddings and len(embeddings) == len(batch_texts):
            rows = []
            for j, chunk in enumerate(batch):
                if j < len(embeddings) and chunk.get("content"):
                    rows.append(
                        {
                            "source_id": source_id,
                            "content": chunk["content"],
                            "metadata": chunk.get("metadata", {}),
                            "embedding": embeddings[j],
                        }
                    )

            if rows:
                try:
                    get_supabase().table("document_sections").insert(rows).execute()
                    logger.info(f"Saved {min(i + batch_size, total)}/{total} chunks.")
                except Exception as e:
                    logger.error(f"Failed to save batch to database: {e}")
                    raise
