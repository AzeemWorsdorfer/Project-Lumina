import logging
from typing import Optional

from supabase import Client, create_client

logger: logging.Logger = logging.getLogger(__name__)

_supabase: Optional[Client] = None


def get_supabase() -> Client:
    """Lazy-initialize and return the Supabase client."""
    global _supabase
    if _supabase is not None:
        return _supabase

    import os

    url_raw: Optional[str] = os.getenv("SUPABASE_URL")
    key_raw: Optional[str] = os.getenv("SUPABASE_KEY")

    if not url_raw or not key_raw:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_KEY must be set in environment variables"
        )

    try:
        _supabase = create_client(url_raw, key_raw)
        logger.info("Successfully connected to Supabase database")
    except Exception as e:
        logger.error(f"Failed to connect to Supabase database: {e}")
        raise

    return _supabase
