import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional

import ollama

from app.core.database import supabase

EMBEDDING_MODEL = "qwen3-embedding:8b"

logger: logging.Logger = logging.getLogger(__name__)


def get_embeddings(texts: List[str]) -> Optional[List[List[float]]]:
    """
    Generate vectors locally using Qwen3-Embedding.
    """
    if not texts:
        return []

    if not all(isinstance(text, str) and text.strip() for text in texts):
        logger.error("All texts must be non-empty strings")
        return None

    try:

        def get_single(text: str) -> List[float]:
            response = ollama.embeddings(model=EMBEDDING_MODEL, prompt=text)
            return response["embedding"]

        with ThreadPoolExecutor(max_workers=8) as executor:
            embeddings = list(executor.map(get_single, texts))
        return embeddings
    except Exception as e:
        logger.error(f"Ollama Embedding Error: {e}")
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
                    supabase.table("document_sections").insert(rows).execute()
                    logger.info(f"Saved {min(i + batch_size, total)}/{total} chunks.")
                except Exception as e:
                    logger.error(f"Failed to save batch to database: {e}")
                    raise
