import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def _parse_int(raw: str, default: int) -> int:
    try:
        return int(raw)
    except (ValueError, TypeError):
        logger.warning("Invalid int value %r, using default %d", raw, default)
        return default


def _parse_float(raw: str, default: float) -> float:
    try:
        return float(raw)
    except (ValueError, TypeError):
        logger.warning("Invalid float value %r, using default %f", raw, default)
        return default


class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_CHAT_MODEL: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
    OPENAI_EMBEDDING_MODEL: str = os.getenv(
        "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
    )

    # Rate limiting
    OPENAI_RATE_LIMIT_RPM: int = _parse_int(
        os.getenv("OPENAI_RATE_LIMIT_RPM", "10"), 10
    )

    # Monthly spending cap (USD) — enforced at OpenAI dashboard level
    OPENAI_MONTHLY_LIMIT_USD: float = _parse_float(
        os.getenv("OPENAI_MONTHLY_LIMIT_USD", "5.0"), 5.0
    )


settings = Settings()
