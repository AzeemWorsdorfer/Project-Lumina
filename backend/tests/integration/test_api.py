"""Integration tests for API endpoints."""

import uuid
from io import BytesIO
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def mock_auth():
    """Mock authentication by overriding the dependency."""
    from app.api.v1.deps.auth import get_current_user, security

    def override_get_current_user():
        return {
            "id": str(uuid.uuid4()),
            "email": "test@example.com",
        }

    from app.main import app

    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()


class TestUploadPdfEndpoint:
    """Test the PDF upload endpoint."""

    @pytest.fixture(autouse=True)
    def setup_mocks(self, mock_auth) -> None:
        """Setup common mocks for all tests."""
        fitz = pytest.importorskip("fitz")
        pdf_buffer = BytesIO()
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((100, 100), "Test content")
        doc.save(pdf_buffer)
        doc.close()
        pdf_buffer.seek(0)
        self.pdf_content = pdf_buffer.getvalue()

    def test_upload_pdf_success(self, client: TestClient) -> None:
        """Test successful PDF upload and session creation."""
        session_id = str(uuid.uuid4())
        source_id = str(uuid.uuid4())

        with (
            patch("app.api.v1.endpoints.ingestion.initialize_source") as mock_init,
            patch("app.api.v1.endpoints.ingestion.create_session") as mock_create,
            patch("app.api.v1.endpoints.ingestion.save_chunks_to_db") as mock_save,
        ):
            mock_init.return_value = source_id
            mock_create.return_value = {"id": session_id}
            mock_save.return_value = None

            response = client.post(
                "/api/v1/upload-pdf?session_name=Test Session",
                files={
                    "file": ("test.pdf", BytesIO(self.pdf_content), "application/pdf")
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Study session initialized"
        assert data["session_id"] == session_id
        assert data["source_id"] == source_id

    def test_upload_pdf_missing_session_name(self, client: TestClient) -> None:
        """Test upload without session name returns 422 (validation error)."""
        response = client.post(
            "/api/v1/upload-pdf?session_name=",
            files={"file": ("test.pdf", BytesIO(self.pdf_content), "application/pdf")},
        )

        assert response.status_code in [400, 422]

    def test_upload_pdf_non_pdf_file(self, client: TestClient) -> None:
        """Test upload with non-PDF file returns 400."""
        response = client.post(
            "/api/v1/upload-pdf?session_name=Test Session",
            files={"file": ("test.txt", BytesIO(b"Not a PDF"), "text/plain")},
        )

        assert response.status_code == 400
        assert "Only PDF files" in response.json()["detail"]

    def test_upload_pdf_empty_filename(self, client: TestClient) -> None:
        """Test upload with empty filename returns error."""
        response = client.post(
            "/api/v1/upload-pdf?session_name=Test Session",
            files={"file": ("", BytesIO(self.pdf_content), "application/pdf")},
        )

        assert response.status_code in [400, 422]

    def test_upload_pdf_source_initialization_failure(self, client: TestClient) -> None:
        """Test failure to initialize source returns 500."""
        with patch("app.api.v1.endpoints.ingestion.initialize_source") as mock_init:
            mock_init.return_value = None

            response = client.post(
                "/api/v1/upload-pdf?session_name=Test Session",
                files={
                    "file": ("test.pdf", BytesIO(self.pdf_content), "application/pdf")
                },
            )

        assert response.status_code == 500
        assert "Failed to initialize source" in response.json()["detail"]

    def test_upload_pdf_session_creation_failure(self, client: TestClient) -> None:
        """Test failure to create session returns 500."""
        source_id = str(uuid.uuid4())

        with (
            patch("app.api.v1.endpoints.ingestion.initialize_source") as mock_init,
            patch("app.api.v1.endpoints.ingestion.create_session") as mock_create,
            patch("app.api.v1.endpoints.ingestion.save_chunks_to_db"),
        ):
            mock_init.return_value = source_id
            mock_create.return_value = None

            response = client.post(
                "/api/v1/upload-pdf?session_name=Test Session",
                files={
                    "file": ("test.pdf", BytesIO(self.pdf_content), "application/pdf")
                },
            )

        assert response.status_code == 500
        assert "Failed to create session" in response.json()["detail"]

    def test_upload_pdf_extraction_failure(self, client: TestClient) -> None:
        """Test PDF extraction failure returns 400."""
        with patch(
            "app.api.v1.endpoints.ingestion.extract_text_from_pdf"
        ) as mock_extract:
            mock_extract.return_value = []

            response = client.post(
                "/api/v1/upload-pdf?session_name=Test Session",
                files={
                    "file": ("test.pdf", BytesIO(self.pdf_content), "application/pdf")
                },
            )

        assert response.status_code == 400
        assert "No text could be extracted" in response.json()["detail"]


class TestGetSocraticHintEndpoint:
    """Test the Socratic hint endpoint."""

    @pytest.fixture(autouse=True)
    def setup_mocks(self, mock_auth):
        pass

    def test_get_hint_invalid_payload(self, client: TestClient) -> None:
        """Test hint request with invalid payload returns 422."""
        response = client.post(
            "/api/v1/get-socratic-hint",
            json={"invalid": "payload"},
        )

        assert response.status_code == 422


class TestGetSessionEndpoint:
    """Test the session retrieval endpoint."""

    @pytest.fixture(autouse=True)
    def setup_mocks(self, mock_auth):
        pass

    def test_get_session_invalid_uuid(self, client: TestClient) -> None:
        """Test invalid UUID format returns error."""
        response = client.get("/api/v1/session/invalid-uuid")

        assert response.status_code in [400, 404, 422, 500]


class TestUpdateMapEndpoint:
    """Test the map update endpoint."""

    @pytest.fixture(autouse=True)
    def setup_mocks(self, mock_auth):
        pass

    def test_update_map_invalid_payload(self, client: TestClient) -> None:
        """Test update with invalid payload returns 422."""
        session_id = str(uuid.uuid4())

        response = client.put(
            f"/api/v1/{session_id}/map",
            json={"invalid": "payload"},
        )

        assert response.status_code == 422


class TestApiEndpointsIntegration:
    """Basic integration tests for API workflow."""

    @pytest.fixture(autouse=True)
    def setup_mocks(self, mock_auth):
        pass

    def test_endpoints_exist(self, client: TestClient) -> None:
        """Test that all main endpoints exist and return expected status codes."""
        response = client.post("/api/v1/upload-pdf?session_name=test")
        assert response.status_code in [400, 422]

        response = client.get("/api/v1/session/invalid")
        assert response.status_code in [400, 404, 422, 500]

        response = client.post("/api/v1/get-socratic-hint", json={})
        assert response.status_code == 422
