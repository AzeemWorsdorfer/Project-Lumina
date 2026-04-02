import logging
from typing import Any, Dict, List, Optional

from app.core.database import supabase
from app.services.ingestion.vector_service import get_embeddings

logger: logging.Logger = logging.getLogger(__name__)


def get_relevant_chunks(
    query: str, source_id: str, limit: int = 3
) -> Optional[List[Dict[str, Any]]]:
    """
    Retrieve relevant document chunks based on semantic search.
    Uses local Ollama embedding model (qwen3-embedding:8b) and
    p_source_id for direct SQL filtering.
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if not source_id or not source_id.strip():
        raise ValueError("Source ID cannot be empty")

    if limit <= 0:
        raise ValueError("Limit must be greater than 0")

    # 1. Generate embeddings for the search query
    embeddings = get_embeddings([query.strip()])
    query_vector = embeddings[0] if embeddings else None

    if not query_vector:
        logger.warning("Empty embedding vector generated")
        return []

    try:
        # 2. Attempt search with the new p_source_id parameter and lower threshold
        # We use 0.1 because text-embedding-3-small is very precise;
        # 0.5 is often too restrictive for semantic matches.
        logger.info(
            f"Searching for chunks related to: '{query}' in source: {source_id}"
        )

        response = supabase.rpc(
            "match_documents",
            {
                "query_embedding": query_vector,
                "match_threshold": 0.5,  # Lowered to capture related concepts
                "match_count": limit,
                "p_source_id": source_id.strip(),
            },
        ).execute()

        # 3. Fallback: If no data returned, try the standard RPC with a manual filter
        if not response.data:
            logger.info("No results with p_source_id; attempting fallback search...")
            response = (
                supabase.rpc(
                    "match_documents",
                    {
                        "query_embedding": query_vector,
                        "match_threshold": 0.1,
                        "match_count": limit,
                    },
                )
                .eq("source_id", source_id.strip())
                .execute()
            )

        if not response.data:
            logger.info(
                f"Zero matches found even with lowered threshold for: {query[:30]}"
            )
            return []

        # 4. Return the list of matching chunks
        data = response.data
        if isinstance(data, list):
            logger.info(f"Found {len(data)} relevant chunks.")
            return data
        else:
            logger.warning(f"Unexpected response format from Supabase: {type(data)}")
            return []

    except Exception as e:
        logger.error(f"Error searching documents in Supabase: {e}")
        raise
