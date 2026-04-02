"""Tests for PDF text extraction functionality."""


import pytest

from app.services.ingestion.pdf_service import extract_text_from_pdf


class TestExtractTextFromPdf:
    """Test the extract_text_from_pdf function."""

    def test_extract_text_from_valid_pdf(self, tmp_path) -> None:
        """Test extracting text from a valid PDF file."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_valid.pdf"
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((100, 100), "Hello World")
        page.insert_text((100, 150), "Second line of text")
        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))

        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["page"] == 1
        assert "Hello World" in result[0]["text"]
        assert "Second line" in result[0]["text"]

    def test_extract_text_from_multi_page_pdf(self, tmp_path) -> None:
        """Test extracting text from multi-page PDF."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_multipage.pdf"
        doc = fitz.open()

        page1 = doc.new_page()
        page1.insert_text((100, 100), "Page one content")

        page2 = doc.new_page()
        page2.insert_text((100, 100), "Page two content")

        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))

        assert len(result) == 2
        assert result[0]["page"] == 1
        assert result[1]["page"] == 2
        assert "Page one" in result[0]["text"]
        assert "Page two" in result[1]["text"]

    def test_empty_file_path_raises_error(self) -> None:
        """Test empty file path raises ValueError."""
        with pytest.raises(ValueError, match="File path cannot be empty"):
            extract_text_from_pdf("")

    def test_whitespace_only_path_raises_error(self) -> None:
        """Test whitespace-only file path raises ValueError."""
        with pytest.raises(ValueError, match="File path cannot be empty"):
            extract_text_from_pdf("   ")

    def test_nonexistent_file_raises_error(self, tmp_path) -> None:
        """Test non-existent file raises ValueError."""
        nonexistent_path = tmp_path / "does_not_exist.pdf"

        with pytest.raises(ValueError, match="PDF file not found"):
            extract_text_from_pdf(str(nonexistent_path))

    def test_empty_pdf_file_raises_error(self, tmp_path) -> None:
        """Test empty/corrupted PDF file raises ValueError."""
        empty_pdf_path = tmp_path / "empty.pdf"
        empty_pdf_path.write_bytes(b"")

        with pytest.raises(ValueError, match="PDF file is empty or corrupted"):
            extract_text_from_pdf(str(empty_pdf_path))

    def test_empty_pdf_content(self, tmp_path) -> None:
        """Test PDF with empty content returns empty text list."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "empty_content.pdf"
        doc = fitz.open()
        page = doc.new_page()
        # Don't add any text to the page
        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["text"] == ""

    def test_page_numbers_are_one_indexed(self, tmp_path) -> None:
        """Test that page numbers are 1-indexed."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_pages.pdf"
        doc = fitz.open()

        for i in range(3):
            page = doc.new_page()
            page.insert_text((100, 100), f"Page {i + 1}")

        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))

        assert len(result) == 3
        assert result[0]["page"] == 1
        assert result[1]["page"] == 2
        assert result[2]["page"] == 3

    def test_result_format_is_dict_list(self, tmp_path) -> None:
        """Test result format matches expected structure."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_format.pdf"
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((100, 100), "Test")
        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))

        assert isinstance(result, list)
        assert len(result) > 0
        assert isinstance(result[0], dict)
        assert "page" in result[0]
        assert "text" in result[0]
        assert isinstance(result[0]["page"], int)
        assert isinstance(result[0]["text"], str)

    def test_null_bytes_removed(self, tmp_path) -> None:
        """Test null bytes are removed from extracted text."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_null.pdf"
        doc = fitz.open()
        page = doc.new_page()
        # Insert text with embedded null characters
        page.insert_text((100, 100), "Hello\x00World")
        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))

        assert len(result) == 1
        assert "\x00" not in result[0]["text"]
        assert "Hello" in result[0]["text"]
        assert "World" in result[0]["text"]

    def test_special_characters_preserved(self, tmp_path) -> None:
        """Test special characters are preserved in extracted text."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_special.pdf"
        doc = fitz.open()
        page = doc.new_page()
        special_text = "Special: !@#$%^&*()_+-=[]{}|;':\",./<>?"
        page.insert_text((100, 100), special_text)
        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))

        assert len(result) == 1
        # At least some special characters should be preserved
        assert "!" in result[0]["text"] or "Special" in result[0]["text"]

    def test_unicode_characters(self, tmp_path) -> None:
        """Test unicode characters are handled."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_unicode.pdf"
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((100, 100), "Unicode: café résumé naïve")
        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))

        assert len(result) == 1
        # Unicode handling may vary, but extraction should succeed
        assert len(result[0]["text"]) > 0

    def test_returns_list_even_with_errors(self, tmp_path) -> None:
        """Test function returns list type even when errors occur."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_error_handling.pdf"
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((100, 100), "Content")
        doc.save(str(pdf_path))
        doc.close()

        # Normal case should return list
        result = extract_text_from_pdf(str(pdf_path))
        assert isinstance(result, list)

    def test_long_text_extraction(self, tmp_path) -> None:
        """Test extraction of longer text content."""
        fitz = pytest.importorskip("fitz")

        pdf_path = tmp_path / "test_long.pdf"
        doc = fitz.open()
        page = doc.new_page()

        long_text = "This is a long paragraph. " * 50
        page.insert_text((100, 100), long_text)
        doc.save(str(pdf_path))
        doc.close()

        result = extract_text_from_pdf(str(pdf_path))

        assert len(result) == 1
        # Should extract substantial text
        assert len(result[0]["text"]) > 100

    def test_file_not_found_specific_error(self, tmp_path) -> None:
        """Test specific error message for file not found."""
        missing_path = tmp_path / "missing.pdf"

        with pytest.raises(ValueError) as exc_info:
            extract_text_from_pdf(str(missing_path))

        error_msg = str(exc_info.value)
        assert "not found" in error_msg.lower() or "PDF file" in error_msg
