from typing import List

from app.schemas.mindmap import MindMapState


class SocraticPrompts:
    """Factory for generating specialized Socratic prompts."""

    @staticmethod
    def get_hint_prompt(state: MindMapState, context_chunks: List[str]) -> str:
        """Constructs a prompt that forces the AI to look for Logical gap."""

        # Format nodes and edges for the AI to understand the current map
        nodes_list = ", ".join([n.label for n in state.nodes if n.label.strip()])
        edges_list = ", ".join(
            [f"{e.source} -> {e.target} ({e.label})" for e in state.edges if e.label]
        )

        # Combine the retrieved textbook sections
        textbook_context = "\n".join(context_chunks)

        return f"""
You are a Socratic Tutor specialized in high-order learning and conceptual mapping.

CONTEXT FROM THE SOURCE MATERIAL:
---
{textbook_context}
---

USER'S CURRENT MIND MAP:
- Nodes: {nodes_list}
- Connections: {edges_list}

TASK:
1. Analyze the USER'S MIND MAP against the PROVIDED CONTEXT.
2. Identify a critical concept or relationship from the context
    that is currently MISSING or MISUNDERSTOOD in the map.
3. Formulate a Socratic hint that:
    - Does NOT reveal the missing concept directly.
    - References a relationship between concepts already on the map.
    - Asks a 'How' or 'Why' question to provoke deeper thought.
    - Is concise (1-2 sentences).

RESPONSE FORMAT:
Only return the hint text. No intro or outro.
"""

    @staticmethod
    def get_deep_dive_prompt(node_label: str, context_chunks: List[str]) -> str:
        """A prompt for when a user wants to expand on a specific node."""
        textbook_context = "\n".join(context_chunks)

        return f"""
The user wants to expand on '{node_label}'.
Based on these sections: {textbook_context}
What is the most complex sub-component of '{node_label}' they should add next?
Ask a question that guides them to it.
"""

    @staticmethod
    def get_quiz_prompt(
        nodes_list: str,
        edges_list: str,
        context_chunks: List[str],
    ) -> str:
        """Constructs a prompt that generates a 3-question multiple-choice quiz."""
        textbook_context = "\n".join(context_chunks)

        return f"""
You are an expert educator creating a lightweight quiz based on study material.

SOURCE MATERIAL:
---
{textbook_context}
---

USER'S MIND MAP TOPICS:
- Concepts: {nodes_list}
- Connections: {edges_list}

TASK:
Generate exactly 3 multiple-choice questions testing understanding of key
concepts from the source material.

RESPONSE FORMAT:
Return ONLY valid JSON with this exact structure. No markdown, no
explanation, no code fences:
{{
  "questions": [
    {{
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation of why the answer is correct"
    }}
  ]
}}

RULES:
- Questions should cover different concepts from the source material
- Each question must have exactly 4 options
- correct_index must be 0, 1, 2, or 3
- Options should be plausible (not obviously wrong)
- Explanations should be 1-2 sentences
- Do NOT include any text outside the JSON object
"""
