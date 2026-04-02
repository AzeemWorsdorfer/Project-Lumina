"""Shared test fixtures and configuration."""

import uuid
from typing import Any, Dict, Generator, List
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    """Create a FastAPI test client."""
    from app.main import app

    return TestClient(app)


@pytest.fixture
def mock_supabase() -> Generator[MagicMock, None, None]:
    """Mock Supabase client."""
    with patch("app.core.database.get_supabase") as mock:
        mock_client = MagicMock()
        mock.return_value = mock_client
        yield mock_client


@pytest.fixture
def mock_ollama() -> Generator[MagicMock, None, None]:
    """Mock Ollama client."""
    with patch("ollama") as mock:
        mock_client = MagicMock()
        mock.return_value = mock_client
        yield mock_client


@pytest.fixture
def valid_uuid() -> uuid.UUID:
    """Return a valid UUID for testing."""
    return uuid.uuid4()


@pytest.fixture
def sample_mindmap_node() -> Dict[str, Any]:
    """Return a valid mind map node."""
    return {
        "id": "node-1",
        "label": "Test Node",
        "position": {"x": 100.0, "y": 200.0},
        "related_source_chunk_id": 1,
    }


@pytest.fixture
def sample_mindmap_edge() -> Dict[str, Any]:
    """Return a valid mind map edge."""
    return {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "label": "connects to",
    }


@pytest.fixture
def sample_mindmap_state(valid_uuid: uuid.UUID) -> Dict[str, Any]:
    """Return a valid mind map state."""
    return {
        "session_id": str(valid_uuid),
        "nodes": [
            {
                "id": "node-1",
                "label": "Concept A",
                "position": {"x": 0.0, "y": 0.0},
            },
            {
                "id": "node-2",
                "label": "Concept B",
                "position": {"x": 100.0, "y": 100.0},
            },
        ],
        "edges": [
            {
                "id": "edge-1",
                "source": "node-1",
                "target": "node-2",
                "label": "related to",
            }
        ],
    }


@pytest.fixture
def sample_chunks() -> List[Dict[str, Any]]:
    """Return sample text chunks."""
    return [
        {
            "content": "This is the first chunk of text.",
            "metadata": {"char_count": 32},
        },
        {
            "content": "This is the second chunk with more content.",
            "metadata": {"char_count": 43},
        },
    ]


@pytest.fixture
def sample_pdf_pages() -> List[Dict[str, Any]]:
    """Return sample PDF page content."""
    return [
        {
            "page": 1,
            "text": "Page one content. This is a sentence. Another sentence here.",
        },
        {"page": 2, "text": "Page two content. More text follows this section."},
    ]


@pytest.fixture
def sample_context_chunks() -> List[str]:
    """Return sample context chunks for AI prompts."""
    return [
        "Context from textbook page 1: Important concepts here.",
        "Context from textbook page 2: Related information.",
    ]


@pytest.fixture
def temp_pdf_file(tmp_path) -> str:
    """Create a temporary PDF file for testing."""
    pdf_path = tmp_path / "test.pdf"
    # Create a minimal PDF using fitz
    try:
        import fitz

        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((100, 100), "Test PDF content")
        doc.save(str(pdf_path))
        doc.close()
    except ImportError:
        # If fitz not available, create empty file
        pdf_path.write_bytes(b"")

    return str(pdf_path)


@pytest.fixture
def mock_session_response() -> Dict[str, Any]:
    """Return a mock session creation response."""
    return {
        "id": str(uuid.uuid4()),
        "name": "Test Session",
        "source_id": str(uuid.uuid4()),
    }


@pytest.fixture
def mock_source_response() -> Dict[str, Any]:
    """Return a mock source creation response."""
    return {
        "id": str(uuid.uuid4()),
        "filename": "test.pdf",
        "page_count": 5,
    }
