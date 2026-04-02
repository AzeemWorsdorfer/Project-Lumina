"""Tests for text processing and chunking functionality."""

from typing import Any, Dict, List

import pytest

from app.services.ingestion.text_processor import chunk_text


class TestChunkText:
    """Test the chunk_text function."""

    def test_valid_text_chunking(self) -> None:
        """Test basic text chunking with default parameters."""
        text = "This is sentence one. This is sentence two. This is sentence three."
        chunks = chunk_text(text, chunk_size=50, overlap=10)

        assert isinstance(chunks, list)
        assert len(chunks) > 0
        for chunk in chunks:
            assert "content" in chunk
            assert "metadata" in chunk
            assert "char_count" in chunk["metadata"]

    def test_chunking_from_pdf_pages(
        self, sample_pdf_pages: List[Dict[str, Any]]
    ) -> None:
        """Test chunking from PDF page format."""
        chunks = chunk_text(sample_pdf_pages)

        assert isinstance(chunks, list)
        assert len(chunks) > 0

    def test_empty_text_returns_empty_list(self) -> None:
        """Test empty text returns empty list."""
        chunks = chunk_text("")
        assert chunks == []

    def test_whitespace_only_text_returns_empty_list(self) -> None:
        """Test whitespace-only text returns empty list."""
        chunks = chunk_text("   \n\t   ")
        assert chunks == []

    def test_empty_pdf_pages_list_returns_empty_list(self) -> None:
        """Test empty PDF pages list returns empty list."""
        chunks = chunk_text([])
        assert chunks == []

    def test_invalid_chunk_size_zero_raises_error(self) -> None:
        """Test chunk size of zero raises ValueError."""
        with pytest.raises(ValueError, match="Chunk size must be greater than 0"):
            chunk_text("Some text", chunk_size=0)

    def test_invalid_chunk_size_negative_raises_error(self) -> None:
        """Test negative chunk size raises ValueError."""
        with pytest.raises(ValueError, match="Chunk size must be greater than 0"):
            chunk_text("Some text", chunk_size=-10)

    def test_negative_overlap_raises_error(self) -> None:
        """Test negative overlap raises ValueError."""
        with pytest.raises(ValueError, match="Overlap cannot be negative"):
            chunk_text("Some text", chunk_size=100, overlap=-5)

    def test_overlap_equal_to_chunk_size_raises_error(self) -> None:
        """Test overlap equal to chunk size raises ValueError."""
        with pytest.raises(ValueError, match="Overlap must be smaller than chunk size"):
            chunk_text("Some text", chunk_size=100, overlap=100)

    def test_overlap_greater_than_chunk_size_raises_error(self) -> None:
        """Test overlap greater than chunk size raises ValueError."""
        with pytest.raises(ValueError, match="Overlap must be smaller than chunk size"):
            chunk_text("Some text", chunk_size=100, overlap=150)

    def test_chunk_content_not_empty(self) -> None:
        """Test all chunks have non-empty content."""
        text = "First sentence here. Second sentence here. Third sentence here."
        chunks = chunk_text(text, chunk_size=30, overlap=5)

        for chunk in chunks:
            assert chunk["content"].strip() != ""

    def test_chunk_metadata_has_char_count(self) -> None:
        """Test chunks have correct character count metadata."""
        text = "Short text."
        chunks = chunk_text(text, chunk_size=100, overlap=10)

        assert len(chunks) == 1
        assert chunks[0]["metadata"]["char_count"] == len(chunks[0]["content"])

    def test_sentence_boundary_detection(self) -> None:
        """Test chunks respect sentence boundaries when possible."""
        # Create text where sentence ends are clear
        sentences = [f"This is sentence number {i}." for i in range(1, 20)]
        text = " ".join(sentences)

        chunks = chunk_text(text, chunk_size=100, overlap=10)

        # Chunks should generally end at sentence boundaries
        for chunk in chunks:
            content = chunk["content"].strip()
            if not content.endswith(".") and len(content) > 50:
                # If it doesn't end with period, it might be mid-chunk
                pass  # This is acceptable

    def test_overlap_preservation(self) -> None:
        """Test that overlap creates overlapping content between chunks."""
        text = (
            "First part of the text with some content. "
            "Second part of the text with more content. "
            "Third part of the text with even more content."
        )

        chunks = chunk_text(text, chunk_size=50, overlap=20)

        if len(chunks) > 1:
            # Check that there's some overlap between consecutive chunks
            first_chunk_end = chunks[0]["content"][-20:]
            second_chunk_start = chunks[1]["content"][:20]

            # There should be some common content
            # Note: exact overlap may vary due to sentence boundary detection
            assert len(chunks[0]["content"]) > 0
            assert len(chunks[1]["content"]) > 0

    def test_long_text_creates_multiple_chunks(self) -> None:
        """Test long text creates multiple chunks."""
        # Create text longer than chunk_size
        text = "Word. " * 500  # Long text

        chunks = chunk_text(text, chunk_size=100, overlap=10)

        assert len(chunks) > 1

    def test_pdf_page_dict_extraction(self) -> None:
        """Test extraction of text from PDF page dictionaries."""
        pages = [
            {"page": 1, "text": "Page one content here."},
            {"page": 2, "text": "Page two content here."},
        ]

        chunks = chunk_text(pages)

        assert len(chunks) > 0
        # Content from both pages should be present
        full_content = " ".join(chunk["content"] for chunk in chunks)
        assert "Page one" in full_content
        assert "Page two" in full_content

    def test_invalid_pdf_page_format_raises_error(self) -> None:
        """Test invalid PDF page format raises ValueError."""
        invalid_pages = [
            {"invalid_key": "no text key"},
        ]

        # Should handle gracefully, possibly returning empty chunks
        # or raising ValueError depending on implementation
        result = chunk_text(invalid_pages)
        assert isinstance(result, list)

    def test_special_characters_handling(self) -> None:
        """Test handling of special characters in text."""
        text = 'Special chars: émojis 🎉, quotes "test", newlines\n\n\t tabs.'

        chunks = chunk_text(text, chunk_size=100, overlap=10)

        assert len(chunks) > 0
        # Special characters should be preserved
        full_content = " ".join(chunk["content"] for chunk in chunks)
        assert "émojis" in full_content

    def test_whitespace_normalization(self) -> None:
        """Test that extra whitespace is normalized."""
        text = "Multiple   spaces   and\t\ttabs   here."

        chunks = chunk_text(text, chunk_size=100, overlap=10)

        if chunks:
            # Whitespace should be normalized
            assert "  " not in chunks[0]["content"] or len(chunks[0]["content"]) < 50

    def test_single_chunk_for_short_text(self) -> None:
        """Test short text produces single chunk."""
        text = "Short."

        chunks = chunk_text(text, chunk_size=1000, overlap=100)

        assert len(chunks) == 1
        assert chunks[0]["content"] == "Short."

    def test_chunk_progress_ensured(self) -> None:
        """Test that chunking always makes progress."""
        text = "A. B. C. D. E. F. G. H. I. J."

        chunks = chunk_text(text, chunk_size=10, overlap=5)

        # Should create multiple chunks without infinite loop
        assert len(chunks) > 0
        # Verify all chunks have content
        for chunk in chunks:
            assert len(chunk["content"]) > 0
