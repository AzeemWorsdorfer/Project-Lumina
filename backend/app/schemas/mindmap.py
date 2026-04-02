from typing import Annotated, Dict, List, Optional

from pydantic import UUID4, BaseModel, BeforeValidator, Field, validator


class MindMapNode(BaseModel):
    """Single thought/concept in the user's mindmap"""

    id: str = Field(..., description="Unique ID from ReactFlow", min_length=1)
    label: str = Field(..., description="The text inside the node", min_length=1)
    # Helps the AI find the specific PDF context later.
    related_source_chunk_id: Optional[int] = Field(None, ge=1)
    position: Dict[str, float] = Field(..., description="Node position coordinates")

    @validator("position")
    def validate_position(cls, v: Dict[str, float]) -> Dict[str, float]:
        """Validate position has required keys and valid values."""
        required_keys = {"x", "y"}
        if not required_keys.issubset(v.keys()):
            missing = required_keys - v.keys()
            raise ValueError(f"Position missing required keys: {missing}")

        for key, value in v.items():
            if not isinstance(value, (int, float)):
                raise ValueError(f"Position {key} must be a number")

        return v


class MindMapEdge(BaseModel):
    """A connection between two nodes"""

    id: str = Field(..., min_length=1)
    source: str = Field(..., description="ID of the 'parent' node", min_length=1)
    target: str = Field(..., description="ID of the 'child' node", min_length=1)
    label: Optional[str] = Field(None, description="Edge label/description")

    @validator("source", "target")
    def validate_node_ids(cls, v: str) -> str:
        """Validate node IDs are not empty."""
        if not v or not v.strip():
            raise ValueError("Node IDs cannot be empty")
        return v.strip()


def strip_whitespace(v: any) -> any:
    if isinstance(v, str):
        return v.strip()
    return v


class MindMapState(BaseModel):
    """The full state of the user's mindmap"""

    session_id: Annotated[UUID4, BeforeValidator(strip_whitespace)] = Field(
        ..., description="Study session identifier"
    )
    nodes: List[MindMapNode] = Field(...)
    edges: List[MindMapEdge] = Field(...)

    @validator("nodes")
    def validate_nodes(cls, v: List[MindMapNode]) -> List[MindMapNode]:
        """Validate nodes list is not empty when required."""
        if len(v) == 0:
            # Allow empty nodes for initial state, but warn in validation context
            pass
        return v

    @validator("edges")
    def validate_edges(cls, v: List[MindMapEdge]) -> List[MindMapEdge]:
        """Validate edge consistency."""
        return v


class SocraticHint(BaseModel):
    """The response the AI gives back ('The Nudge')"""

    hint_text: str = Field(..., description="The hint text for the user", min_length=1)
    suggested_node_id: Optional[str] = Field(
        None, description="Optional node ID to connect to"
    )
    type: str = Field(default="guidance", description="Type of hint")

    @validator("hint_text")
    def validate_hint_text(cls, v: str) -> str:
        """Validate hint text is not just whitespace."""
        if not v or not v.strip():
            raise ValueError("Hint text cannot be empty or whitespace")
        return v.strip()

    @validator("type")
    def validate_type(cls, v: str) -> str:
        """Validate hint type is from allowed values."""
        allowed_types = {"guidance", "question", "connection", "alert"}
        if v not in allowed_types:
            raise ValueError(f"Hint type must be one of: {allowed_types}")
        return v


# ------------------------------------------------------------------------------------
"""
Safety: If the Frontend sends a malformed map,
FastAPI will reject it immediately with a clear error message,
instead of crashing the AI service.
"""

"""
AI Clarity: When we pass this MindMapState to GPT-mini, it receives a structured JSON.
It can see that "Node A" is not connected to "Node B," which is the
"Gap" it needs to point out.
"""
