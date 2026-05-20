import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import UUID4

from app.api.v1.deps import get_current_user
from app.core.database import get_supabase
from app.core.rate_limiter import rate_limiter
from app.schemas.mindmap import MindMapState, SocraticHint
from app.services.reasoning.ai_service import (
    generate_quiz,
    generate_socratic_hint,
    generate_socratic_hint_streaming,
)

logger: logging.Logger = logging.getLogger(__name__)

router: APIRouter = APIRouter()


@router.get("/sessions", response_model=List[dict])
async def list_sessions(current_user: dict = Depends(get_current_user)):
    """Fetches all study sessions for the authenticated user."""
    user_id = current_user.get("id")
    try:
        result = (
            get_supabase().table("study_sessions")
            .select("id", "name", "created_at", "sources(file_name)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        sessions = []
        for session in result.data:
            sessions.append(
                {
                    "id": session.get("id"),
                    "session_name": session.get("name"),
                    "created_at": session.get("created_at"),
                    "sources": session.get("sources"),
                }
            )

        return sessions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}",
        )


@router.get("/session/{session_id}")
async def get_session(
    session_id: str, current_user: dict = Depends(get_current_user)
) -> Optional[Dict[str, Any]]:
    """Retrieve a study session by ID for the authenticated user."""
    user_id = current_user.get("id")
    try:
        if not session_id or not session_id.strip():
            raise ValueError("Session ID cannot be empty")

        result = (
            get_supabase().table("study_sessions")
            .select("*, sources(*)")
            .eq("id", session_id.strip())
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Session not found")

        return result.data[0]
    except ValueError as e:
        logger.warning(f"Invalid session request: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.put("/{session_id}/map", response_model=Dict[str, Any])
async def save_map(
    session_id: UUID4,
    state: MindMapState,
    current_user: dict = Depends(get_current_user),
):
    """Save the current state of the mind map (nodes and edges)."""
    user_id = current_user.get("id")
    try:
        session_check = (
            get_supabase().table("study_sessions")
            .select("id")
            .eq("id", str(session_id))
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not session_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        map_data = {
            "nodes": [node.model_dump() for node in state.nodes],
            "edges": [edge.model_dump() for edge in state.edges],
        }

        result = (
            get_supabase().table("study_sessions")
            .update({"mind_map_data": map_data})
            .eq("id", str(session_id))
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        return {"status": "success", "message": "Mind map saved successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving mind map for session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save mind map state",
        )


@router.post("/get-socratic-hint", response_model=SocraticHint)
async def get_hint(
    payload: MindMapState, current_user: dict = Depends(get_current_user)
) -> SocraticHint:
    """Generate a Socratic hint based on the current mind map state."""
    user_id = current_user.get("id")

    if not rate_limiter.check(f"hint:{user_id}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Rate limit exceeded. Maximum 10 requests per minute. "
                "Please wait before trying again."
            ),
        )

    try:
        session_data = (
            get_supabase().table("study_sessions")
            .select("source_id")
            .eq("id", str(payload.session_id))
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not session_data.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Study session not found"
            )

        actual_source_id = session_data.data["source_id"]

        if not payload.nodes:
            raise ValueError("Mind map cannot be empty")

        hint_text = generate_socratic_hint(payload, actual_source_id)

        if not hint_text:
            raise RuntimeError("Failed to generate hint")

        return SocraticHint(hint_text=hint_text, type="guidance")

    except ValueError as e:
        logger.warning(f"Invalid input in get_hint: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error in study router: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


@router.post("/get-socratic-hint-stream")
async def get_hint_stream(
    payload: MindMapState, current_user: dict = Depends(get_current_user)
):
    """Generate a Socratic hint with streaming response."""
    user_id = current_user.get("id")

    if not rate_limiter.check(f"hint-stream:{user_id}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Rate limit exceeded. Maximum 10 requests per minute. "
                "Please wait before trying again."
            ),
        )

    try:
        session_data = (
            get_supabase().table("study_sessions")
            .select("source_id")
            .eq("id", str(payload.session_id))
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not session_data.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Study session not found"
            )

        actual_source_id = session_data.data["source_id"]

        if not payload.nodes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mind map cannot be empty",
            )

        async def event_generator():
            full_response = ""
            async for chunk in generate_socratic_hint_streaming(
                payload, actual_source_id
            ):
                full_response += chunk
                yield f"data: {chunk}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except ValueError as e:
        logger.warning(f"Invalid input in get_hint_stream: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error in study router stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


@router.post("/generate-quiz")
async def create_quiz(
    payload: MindMapState, current_user: dict = Depends(get_current_user)
):
    """Generate a 3-question multiple-choice quiz from source material."""
    user_id = current_user.get("id")

    if not rate_limiter.check(f"quiz:{user_id}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Rate limit exceeded. Maximum 10 requests per minute. "
                "Please wait before trying again."
            ),
        )

    try:
        session_data = (
            get_supabase().table("study_sessions")
            .select("source_id")
            .eq("id", str(payload.session_id))
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not session_data.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Study session not found"
            )

        actual_source_id = session_data.data["source_id"]

        if not payload.nodes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mind map cannot be empty",
            )

        quiz_data = generate_quiz(payload, actual_source_id)

        return quiz_data

    except ValueError as e:
        logger.warning(f"Invalid input in generate_quiz: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        logger.warning(f"Quiz generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error in generate_quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str, current_user: dict = Depends(get_current_user)
):
    """Deletes a study session and associated data."""
    user_id = current_user.get("id")
    try:
        session_res = (
            get_supabase().table("study_sessions")
            .select("source_id")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not session_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        source_id = session_res.data[0].get("source_id")

        if source_id:
            get_supabase().table("document_sections").delete().eq(
                "source_id", source_id
            ).execute()

        get_supabase().table("study_sessions").delete().eq("id", session_id).execute()

        if source_id:
            get_supabase().table("sources").delete().eq("id", source_id).execute()

        return {"status": "success", "message": f"Session {session_id} deleted."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete failed for session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}",
        )


@router.get("/session/{session_id}/pdf-url")
async def get_pdf_signed_url(
    session_id: UUID4, current_user: dict = Depends(get_current_user)
):
    """Generates a secure, 1-hour signed URL for the PDF associated with a session."""
    user_id = current_user.get("id")
    try:
        res = (
            get_supabase().table("study_sessions")
            .select("sources(file_name)")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not res.data or not res.data.get("sources"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "PDF source not found for this session. "
                    "Check if the session has a source_id."
                ),
            )

        file_name = res.data["sources"]["file_name"]

        url_result = get_supabase().storage.from_("pdfs").create_signed_url(
            path=file_name, expires_in=3600
        )

        if isinstance(url_result, dict):
            signed_url = url_result.get("signedURL") or url_result.get("signed_url")
        else:
            signed_url = url_result

        if not signed_url:
            raise Exception("SDK returned an empty URL result")

        return {"url": signed_url}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Detailed Signed URL Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sign URL: {str(e)}",
        )
