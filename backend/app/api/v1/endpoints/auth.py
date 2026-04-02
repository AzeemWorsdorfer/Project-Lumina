import logging
from typing import Dict

from fastapi import APIRouter, Depends

from app.api.v1.deps import get_current_user

logger: logging.Logger = logging.getLogger(__name__)

router: APIRouter = APIRouter()


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)) -> Dict[str, str]:
    """Get current authenticated user info."""
    return {
        "id": current_user.get("id", ""),
        "email": current_user.get("email", ""),
    }
