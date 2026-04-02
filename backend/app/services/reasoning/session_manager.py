import logging
from typing import Any, Dict, Optional

from app.core.database import supabase

logger: logging.Logger = logging.getLogger(__name__)


def initialize_source(file_name: str, page_count: int, user_id: str) -> Optional[str]:
    """
    Registers a new PDF source in the database.
    Returns the source_id (UUID).
    """
    if not file_name or not file_name.strip():
        raise ValueError("File name cannot be empty")

    if page_count <= 0:
        raise ValueError("Page count must be greater than 0")

    try:
        data = {
            "file_name": file_name.strip(),
            "page_count": page_count,
            "status": "processed",
            "user_id": user_id,
        }
        result = supabase.table("sources").insert(data).execute()

        if not result.data or len(result.data) == 0:
            logger.error("No data returned from source insertion")
            return None

        first_result = result.data[0]
        if not isinstance(first_result, dict):
            logger.error(f"Unexpected result format: {type(first_result)}")
            return None

        source_id = first_result.get("id")
        if not source_id:
            logger.error("Source ID not found in response")
            return None

        logger.info(f"Source initialized: {file_name} (ID: {source_id})")
        return str(source_id)
    except Exception as e:
        logger.error(f"Failed to initialize source: {e}")
        return None


def create_session(
    session_name: str, source_id: str, user_id: str
) -> Optional[Dict[str, Any]]:
    """
    Creates a new study session linked to a specific source.
    """
    if not session_name or not session_name.strip():
        raise ValueError("Session name cannot be empty")

    if not source_id or not source_id.strip():
        raise ValueError("Source ID cannot be empty")

    try:
        data = {
            "name": session_name.strip(),
            "source_id": source_id.strip(),
            "user_id": user_id,
            "mind_map_data": {"nodes": [], "edges": []},
        }
        result = supabase.table("study_sessions").insert(data).execute()

        if not result.data or len(result.data) == 0:
            logger.error("No data returned from session creation")
            return None

        session_data = result.data[0]
        if not isinstance(session_data, dict):
            logger.error(f"Unexpected session result format: {type(session_data)}")
            return None

        logger.info(f"Session created: {session_name}")
        return session_data
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        return None
