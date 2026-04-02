import logging
import os
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

logger: logging.Logger = logging.getLogger(__name__)

load_dotenv()

url_raw: Optional[str] = os.getenv("SUPABASE_URL")
key_raw: Optional[str] = os.getenv("SUPABASE_KEY")

if not url_raw or not key_raw:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_KEY must be set in environment variables"
    )

url: str = url_raw
key: str = key_raw

try:
    supabase: Client = create_client(url, key)
    logger.info("Successfully connected to Supabase database")
except Exception as e:
    logger.error(f"Failed to connect to Supabase database: {e}")
    raise
