"""Tests for Pydantic schema validation."""

import uuid

import pytest
from pydantic import ValidationError

from app.schemas.mindmap import MindMapEdge, MindMapNode, MindMapState, SocraticHint


class TestMindMapNode:
    """Test MindMapNode validation."""

    def test_valid_node(self) -> None:
        """Test creating a valid mind map node."""
        node = MindMapNode(
            id="node-1",
            label="Test Node",
            position={"x": 100.0, "y": 200.0},
        )
        assert node.id == "node-1"
        assert node.label == "Test Node"
        assert node.position == {"x": 100.0, "y": 200.0}
        assert node.related_source_chunk_id is None

    def test_valid_node_with_chunk_id(self) -> None:
        """Test node with related source chunk ID."""
        node = MindMapNode(
            id="node-1",
            label="Test Node",
            position={"x": 100.0, "y": 200.0},
            related_source_chunk_id=5,
        )
        assert node.related_source_chunk_id == 5

    def test_empty_id_raises_error(self) -> None:
        """Test empty node ID raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapNode(
                id="",
                label="Test Node",
                position={"x": 100.0, "y": 200.0},
            )
        assert "id" in str(exc_info.value)

    def test_empty_label_raises_error(self) -> None:
        """Test empty node label raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapNode(
                id="node-1",
                label="",
                position={"x": 100.0, "y": 200.0},
            )
        assert "label" in str(exc_info.value)

    def test_missing_position_key_raises_error(self) -> None:
        """Test position missing required keys raises error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapNode(
                id="node-1",
                label="Test Node",
                position={"x": 100.0},
            )
        assert "y" in str(exc_info.value).lower() or "Position" in str(exc_info.value)

    def test_invalid_position_type_raises_error(self) -> None:
        """Test position with non-numeric values raises error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapNode(
                id="node-1",
                label="Test Node",
                position={"x": "invalid", "y": 100.0},
            )
        assert "position" in str(exc_info.value).lower()

    def test_invalid_chunk_id_raises_error(self) -> None:
        """Test invalid chunk ID raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapNode(
                id="node-1",
                label="Test Node",
                position={"x": 100.0, "y": 200.0},
                related_source_chunk_id=0,
            )
        assert "related_source_chunk_id" in str(exc_info.value)


class TestMindMapEdge:
    """Test MindMapEdge validation."""

    def test_valid_edge(self) -> None:
        """Test creating a valid mind map edge."""
        edge = MindMapEdge(
            id="edge-1",
            source="node-1",
            target="node-2",
            label="connects to",
        )
        assert edge.id == "edge-1"
        assert edge.source == "node-1"
        assert edge.target == "node-2"
        assert edge.label == "connects to"

    def test_valid_edge_without_label(self) -> None:
        """Test edge without optional label."""
        edge = MindMapEdge(
            id="edge-1",
            source="node-1",
            target="node-2",
        )
        assert edge.label is None

    def test_empty_id_raises_error(self) -> None:
        """Test empty edge ID raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapEdge(
                id="",
                source="node-1",
                target="node-2",
            )
        assert "id" in str(exc_info.value)

    def test_empty_source_raises_error(self) -> None:
        """Test empty source node ID raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapEdge(
                id="edge-1",
                source="",
                target="node-2",
            )
        assert "source" in str(exc_info.value)

    def test_empty_target_raises_error(self) -> None:
        """Test empty target node ID raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapEdge(
                id="edge-1",
                source="node-1",
                target="",
            )
        assert "target" in str(exc_info.value)

    def test_whitespace_node_ids_stripped(self) -> None:
        """Test whitespace in node IDs is stripped."""
        edge = MindMapEdge(
            id="edge-1",
            source="  node-1  ",
            target="  node-2  ",
        )
        assert edge.source == "node-1"
        assert edge.target == "node-2"


class TestMindMapState:
    """Test MindMapState validation."""

    def test_valid_state(self, valid_uuid: uuid.UUID) -> None:
        """Test creating a valid mind map state."""
        state = MindMapState(
            session_id=valid_uuid,
            nodes=[MindMapNode(id="n1", label="Node 1", position={"x": 0.0, "y": 0.0})],
            edges=[],
        )
        assert state.session_id == valid_uuid
        assert len(state.nodes) == 1
        assert len(state.edges) == 0

    def test_valid_state_with_edges(self, valid_uuid: uuid.UUID) -> None:
        """Test state with nodes and edges."""
        state = MindMapState(
            session_id=valid_uuid,
            nodes=[
                MindMapNode(id="n1", label="Node 1", position={"x": 0.0, "y": 0.0}),
                MindMapNode(id="n2", label="Node 2", position={"x": 100.0, "y": 100.0}),
            ],
            edges=[
                MindMapEdge(id="e1", source="n1", target="n2"),
            ],
        )
        assert len(state.edges) == 1

    def test_empty_nodes_allowed(self, valid_uuid: uuid.UUID) -> None:
        """Test empty nodes list is allowed (for initial state)."""
        state = MindMapState(
            session_id=valid_uuid,
            nodes=[],
            edges=[],
        )
        assert state.nodes == []

    def test_invalid_session_id_raises_error(self) -> None:
        """Test invalid session ID raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            MindMapState(
                session_id="not-a-valid-uuid",
                nodes=[],
                edges=[],
            )
        assert "session_id" in str(exc_info.value)

    def test_session_id_with_whitespace(self, valid_uuid: uuid.UUID) -> None:
        """Test session ID with whitespace is stripped."""
        state = MindMapState(
            session_id=f"  {valid_uuid}  ",
            nodes=[],
            edges=[],
        )
        assert state.session_id == valid_uuid


class TestSocraticHint:
    """Test SocraticHint validation."""

    def test_valid_hint(self) -> None:
        """Test creating a valid socratic hint."""
        hint = SocraticHint(
            hint_text="Consider the relationship between these concepts.",
            type="guidance",
        )
        assert hint.hint_text == "Consider the relationship between these concepts."
        assert hint.type == "guidance"
        assert hint.suggested_node_id is None

    def test_valid_hint_with_node_id(self) -> None:
        """Test hint with suggested node ID."""
        hint = SocraticHint(
            hint_text="Think about node-1.",
            suggested_node_id="node-1",
            type="question",
        )
        assert hint.suggested_node_id == "node-1"

    def test_empty_hint_text_raises_error(self) -> None:
        """Test empty hint text raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            SocraticHint(
                hint_text="",
                type="guidance",
            )
        assert "hint_text" in str(exc_info.value)

    def test_whitespace_only_hint_text_raises_error(self) -> None:
        """Test whitespace-only hint text raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            SocraticHint(
                hint_text="   ",
                type="guidance",
            )
        assert "hint_text" in str(exc_info.value)

    def test_invalid_hint_type_raises_error(self) -> None:
        """Test invalid hint type raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            SocraticHint(
                hint_text="Valid hint text",
                type="invalid_type",
            )
        assert "type" in str(exc_info.value)

    @pytest.mark.parametrize(
        "hint_type", ["guidance", "question", "connection", "alert"]
    )
    def test_valid_hint_types(self, hint_type: str) -> None:
        """Test all valid hint types are accepted."""
        hint = SocraticHint(
            hint_text="Test hint",
            type=hint_type,
        )
        assert hint.type == hint_type

    def test_default_hint_type(self) -> None:
        """Test default hint type is 'guidance'."""
        hint = SocraticHint(
            hint_text="Test hint",
        )
        assert hint.type == "guidance"

    def test_hint_text_stripped(self) -> None:
        """Test hint text is stripped of whitespace."""
        hint = SocraticHint(
            hint_text="  Test hint with whitespace  ",
        )
        assert hint.hint_text == "Test hint with whitespace"
