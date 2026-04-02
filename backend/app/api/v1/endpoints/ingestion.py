import asyncio
import logging
import os
import re
import shutil
from typing import Any, Dict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.v1.deps import get_current_user
from app.core.database import supabase
from app.services.ingestion.pdf_service import extract_text_from_pdf
from app.services.ingestion.text_processor import chunk_text
from app.services.ingestion.vector_service import save_chunks_to_db
from app.services.reasoning.session_manager import create_session, initialize_source

logger: logging.Logger = logging.getLogger(__name__)
router: APIRouter = APIRouter()
UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf"}


def allowed_file(filename: str) -> bool:
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


@router.post("/upload-pdf")
async def upload_pdf(
    session_name: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Upload a PDF file and create a study session."""
    raw_user_id = current_user.get("id")
    if not raw_user_id or not isinstance(raw_user_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )
    user_id: str = raw_user_id

    if not session_name or not session_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session name cannot be empty",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Filename cannot be empty"
        )

    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed"
        )

    safe_filename = re.sub(r"[^\w\-_\.]", "_", file.filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        pdf_pages = await asyncio.to_thread(extract_text_from_pdf, file_path)
        if not pdf_pages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text could be extracted from PDF",
            )

        source_id = initialize_source(safe_filename, len(pdf_pages), user_id)

        if not source_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize source.",
            )

        chunks = chunk_text(pdf_pages)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process PDF content",
            )

        await asyncio.to_thread(save_chunks_to_db, chunks, source_id)

        with open(file_path, "rb") as f:
            supabase.storage.from_("pdfs").upload(
                path=safe_filename, file=f, file_options={"upsert": "true"}
            )

        session = create_session(session_name, source_id, user_id)
        if not session or not isinstance(session, dict):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create session",
            )

        session_id = session.get("id")
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid session created",
            )

        return {
            "message": "Study session initialized",
            "session_id": session_id,
            "source_id": source_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing PDF upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during file processing",
        )
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to clean up file {file_path}: {e}")
