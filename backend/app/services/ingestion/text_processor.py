import logging
import re
from typing import Any, Dict, List, Union

logger: logging.Logger = logging.getLogger(__name__)


def chunk_text(
    pages_content: Union[str, List[Dict[str, Any]]],
    chunk_size: int = 1500,
    overlap: int = 300,
) -> List[Dict[str, Any]]:
    """
    Splits text into idea-based chunks, avoiding mid-sentence cuts.
    """
    if chunk_size <= 0:
        raise ValueError("Chunk size must be greater than 0")

    if overlap < 0:
        raise ValueError("Overlap cannot be negative")

    if overlap >= chunk_size:
        raise ValueError("Overlap must be smaller than chunk size")

    # Handle list input from extract_text_from_pdf
    if isinstance(pages_content, list):
        if not pages_content:
            return []
        try:
            pages_content = " ".join(page.get("text", "") for page in pages_content)
        except Exception as e:
            logger.error(f"Error processing pages_content list: {e}")
            raise ValueError("Invalid pages_content format")

    # Clean up Text extra whitespace but keep paragraph breaks.
    text = re.sub(r"\s+", " ", str(pages_content))

    if not text.strip():
        return []

    chunks: List[Dict[str, Any]] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        # If we're not at the very end, try to find a better place to split
        if end < text_len:
            # Look for a paragraph break or sentence end within the last 100 chars
            search_area = text[end - 100 : end + 100]
            # Find the last period, exclamation, question mark.
            match = re.search(r"[.!?]\s", search_area[::-1])
            if match:
                end = end - match.start()

        chunk_content = text[start:end].strip()
        if chunk_content:  # Only add non-empty chunks
            chunks.append(
                {
                    "content": chunk_content,
                    "metadata": {"char_count": len(chunk_content)},
                }
            )

        # Move forward by chunk_size minus overlap
        start = max(end - overlap, start + 1)  # Ensure progress

    return chunks
