"""Tests for Socratic prompt generation."""

import uuid
from typing import Any, Dict, List

from app.schemas.mindmap import MindMapEdge, MindMapNode, MindMapState
from app.services.reasoning.prompt import SocraticPrompts


class TestGetHintPrompt:
    """Test the get_hint_prompt static method."""

    def test_hint_prompt_contains_nodes(
        self, sample_mindmap_state: Dict[str, Any]
    ) -> None:
        """Test hint prompt includes node information."""
        state = MindMapState(**sample_mindmap_state)
        context_chunks = ["Context from textbook"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        assert "Concept A" in prompt
        assert "Concept B" in prompt
        assert "Nodes:" in prompt

    def test_hint_prompt_contains_edges(
        self, sample_mindmap_state: Dict[str, Any]
    ) -> None:
        """Test hint prompt includes edge information."""
        state = MindMapState(**sample_mindmap_state)
        context_chunks = ["Context from textbook"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        assert "node-1" in prompt
        assert "node-2" in prompt
        assert "Connections:" in prompt

    def test_hint_prompt_contains_context(
        self, sample_mindmap_state: Dict[str, Any]
    ) -> None:
        """Test hint prompt includes context chunks."""
        state = MindMapState(**sample_mindmap_state)
        context_chunks = ["First context chunk", "Second context chunk"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        assert "First context chunk" in prompt
        assert "Second context chunk" in prompt
        assert "CONTEXT FROM THE SOURCE MATERIAL" in prompt

    def test_hint_prompt_structure(self, sample_mindmap_state: Dict[str, Any]) -> None:
        """Test hint prompt has expected structure."""
        state = MindMapState(**sample_mindmap_state)
        context_chunks = ["Context"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        assert "Socratic Tutor" in prompt
        assert "TASK:" in prompt
        assert "RESPONSE FORMAT:" in prompt
        assert "1." in prompt
        assert "2." in prompt
        assert "3." in prompt

    def test_empty_nodes_handled(self, valid_uuid: uuid.UUID) -> None:
        """Test prompt handles empty nodes gracefully."""
        state = MindMapState(
            session_id=valid_uuid,
            nodes=[],
            edges=[],
        )
        context_chunks = ["Context"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        assert "Nodes:" in prompt
        assert "Connections:" in prompt

    def test_empty_edges_handled(self, valid_uuid: uuid.UUID) -> None:
        """Test prompt handles empty edges gracefully."""
        state = MindMapState(
            session_id=valid_uuid,
            nodes=[
                MindMapNode(id="n1", label="Single Node", position={"x": 0.0, "y": 0.0})
            ],
            edges=[],
        )
        context_chunks = ["Context"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        assert "Single Node" in prompt
        assert "Connections:" in prompt

    def test_nodes_without_labels_filtered(self, valid_uuid: uuid.UUID) -> None:
        """Test nodes with empty labels are not included in prompt."""
        state = MindMapState(
            session_id=valid_uuid,
            nodes=[
                MindMapNode(id="n1", label="Valid Node", position={"x": 0.0, "y": 0.0}),
                MindMapNode(id="n2", label="  ", position={"x": 100.0, "y": 100.0}),
            ],
            edges=[],
        )
        context_chunks = ["Context"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        assert "Valid Node" in prompt
        # Empty label node shouldn't appear in the nodes list section
        # (it might still appear elsewhere in the prompt)

    def test_edges_without_labels_filtered(self, valid_uuid: uuid.UUID) -> None:
        """Test edges without labels are filtered from connections list."""
        state = MindMapState(
            session_id=valid_uuid,
            nodes=[
                MindMapNode(id="n1", label="Node 1", position={"x": 0.0, "y": 0.0}),
                MindMapNode(id="n2", label="Node 2", position={"x": 100.0, "y": 100.0}),
            ],
            edges=[
                MindMapEdge(id="e1", source="n1", target="n2", label=""),
            ],
        )
        context_chunks = ["Context"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        # Edges without labels are filtered - connections list should be empty
        assert "- Connections:" in prompt
        # But no edge content should appear after the colon

    def test_multiple_context_chunks_joined(
        self, sample_mindmap_state: Dict[str, Any]
    ) -> None:
        """Test multiple context chunks are joined with newlines."""
        state = MindMapState(**sample_mindmap_state)
        context_chunks = ["Chunk 1", "Chunk 2", "Chunk 3"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        # All chunks should appear in prompt
        assert "Chunk 1" in prompt
        assert "Chunk 2" in prompt
        assert "Chunk 3" in prompt

    def test_context_formatted_with_dividers(
        self, sample_mindmap_state: Dict[str, Any]
    ) -> None:
        """Test context section has proper dividers."""
        state = MindMapState(**sample_mindmap_state)
        context_chunks = ["Context content"]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        assert "---" in prompt
        assert "CONTEXT FROM THE SOURCE MATERIAL:" in prompt


class TestGetDeepDivePrompt:
    """Test the get_deep_dive_prompt static method."""

    def test_deep_dive_contains_node_label(self) -> None:
        """Test deep dive prompt includes the node label."""
        node_label = "Photosynthesis"
        context_chunks = ["Context about biology"]

        prompt = SocraticPrompts.get_deep_dive_prompt(node_label, context_chunks)

        assert "Photosynthesis" in prompt
        assert "expand on 'Photosynthesis'" in prompt

    def test_deep_dive_contains_context(self) -> None:
        """Test deep dive prompt includes context chunks."""
        node_label = "Topic"
        context_chunks = ["First section", "Second section"]

        prompt = SocraticPrompts.get_deep_dive_prompt(node_label, context_chunks)

        assert "First section" in prompt
        assert "Second section" in prompt

    def test_deep_dive_structure(self) -> None:
        """Test deep dive prompt has expected structure."""
        node_label = "Concept"
        context_chunks = ["Context"]

        prompt = SocraticPrompts.get_deep_dive_prompt(node_label, context_chunks)

        assert "The user wants to expand" in prompt
        assert "Based on these sections" in prompt
        assert "What is the most complex sub-component" in prompt
        assert "Ask a question" in prompt

    def test_empty_context_handled(self) -> None:
        """Test deep dive handles empty context."""
        node_label = "Topic"
        context_chunks: List[str] = []

        prompt = SocraticPrompts.get_deep_dive_prompt(node_label, context_chunks)

        # Should still generate a valid prompt
        assert "Topic" in prompt
        assert "Based on these sections:" in prompt

    def test_special_characters_in_node_label(self) -> None:
        """Test node labels with special characters are handled."""
        node_label = "Complex-Concept_123 (with parens)"
        context_chunks = ["Context"]

        prompt = SocraticPrompts.get_deep_dive_prompt(node_label, context_chunks)

        assert node_label in prompt


class TestSocraticPromptsIntegration:
    """Integration tests for prompt methods."""

    def test_hint_prompt_with_complex_state(self, valid_uuid: uuid.UUID) -> None:
        """Test hint prompt with a complex mind map state."""
        state = MindMapState(
            session_id=valid_uuid,
            nodes=[
                MindMapNode(id="n1", label="Root", position={"x": 0.0, "y": 0.0}),
                MindMapNode(id="n2", label="Child 1", position={"x": 100.0, "y": 50.0}),
                MindMapNode(
                    id="n3", label="Child 2", position={"x": 100.0, "y": 150.0}
                ),
            ],
            edges=[
                MindMapEdge(id="e1", source="n1", target="n2", label="has"),
                MindMapEdge(id="e2", source="n1", target="n3", label="has"),
            ],
        )
        context_chunks = [
            "Textbook context about the root concept.",
            "Additional information about children.",
        ]

        prompt = SocraticPrompts.get_hint_prompt(state, context_chunks)

        # Verify all nodes are mentioned
        assert "Root" in prompt
        assert "Child 1" in prompt
        assert "Child 2" in prompt

        # Verify structure
        assert "Socratic Tutor" in prompt
        assert "Analyze the USER'S MIND MAP" in prompt

    def test_both_prompts_return_strings(
        self, sample_mindmap_state: Dict[str, Any]
    ) -> None:
        """Test both prompt methods return strings."""
        state = MindMapState(**sample_mindmap_state)

        hint_prompt = SocraticPrompts.get_hint_prompt(state, ["Context"])
        deep_dive_prompt = SocraticPrompts.get_deep_dive_prompt("Topic", ["Context"])

        assert isinstance(hint_prompt, str)
        assert isinstance(deep_dive_prompt, str)
        assert len(hint_prompt) > 0
        assert len(deep_dive_prompt) > 0
