import logging
import re
from typing import AsyncGenerator, Dict, List

import ollama

from app.schemas.mindmap import MindMapState
from app.services.reasoning.prompt import SocraticPrompts
from app.services.reasoning.search_service import get_relevant_chunks

logger: logging.Logger = logging.getLogger(__name__)

AI_MODEL = "deepseek-r1:8b"

ollama_async_client = ollama.AsyncClient()


def _strip_thinking_tags(text: str) -> str:
    """Remove <think>...</think> tags from DeepSeek R1 responses."""
    return re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()


async def generate_socratic_hint_streaming(
    state: MindMapState, source_id: str
) -> AsyncGenerator[str, None]:
    """
    Generate a Socratic hint based on mind map state and source material.
    Uses async streaming to yield chunks as they're generated.

    Uses a local Ollama model (deepseek-r1:8b) to generate hints by:
    1. Validating the mind map state
    2. Retrieving relevant context from the knowledge base
    3. Building a Socratic prompt
    4. Generating a streaming hint using the local AI model
    """
    try:
        if not state.nodes:
            yield (
                "Your map is a blank canvas! What is the central theme "
                "of your study material?"
            )
            return

        search_query = state.nodes[-1].label
        if not search_query.strip():
            raise ValueError("Node label cannot be empty")

        context_chunks_response = get_relevant_chunks(search_query.strip(), source_id)

        if not context_chunks_response:
            logger.warning(
                f"No context found for query: {search_query} in source: {source_id}"
            )
            yield (
                "I see you're thinking about "
                f"'{search_query}'. Try connecting it to another concept "
                "to see how they interact!"
            )
            return

        chunk_texts: List[str] = []
        if isinstance(context_chunks_response, list):
            for chunk in context_chunks_response:
                if isinstance(chunk, Dict):
                    content = chunk.get("content")
                    if isinstance(content, str):
                        chunk_texts.append(content)
                elif isinstance(chunk, str):
                    chunk_texts.append(chunk)

        if not chunk_texts:
            logger.warning(
                f"No valid text content found in context chunks "
                f"for query: {search_query}"
            )
            yield (
                "I see you're thinking about "
                f"'{search_query}'. Try connecting it to another concept "
                "to see how they interact!"
            )
            return

        prompt = SocraticPrompts.get_hint_prompt(state, chunk_texts)

        stream = await ollama_async_client.chat(
            model=AI_MODEL, messages=[{"role": "user", "content": prompt}], stream=True
        )

        # DeepSeek R1 outputs <think>...</think> before the actual response
        # Buffer until thinking block closes, then yield response content
        in_thinking = False
        buffer = ""

        async for chunk in stream:
            content = chunk["message"]["content"]
            if not content:
                continue

            buffer += content

            # Check for thinking tag start
            if "<think>" in buffer:
                in_thinking = True

            # Check for thinking tag end
            if in_thinking and "</think>" in buffer:
                # Remove everything up to and including the closing tag
                buffer = buffer.split("</think>", 1)[1]
                in_thinking = False
                if buffer.strip():
                    yield buffer
                buffer = ""
                continue

            # If not in thinking block, yield content directly
            if not in_thinking:
                yield content

    except ValueError as e:
        logger.warning(f"Invalid input in generate_socratic_hint: {e}")
        yield "Please make sure all nodes have labels before requesting a hint."
    except Exception as e:
        logger.error(f"Socratic Engine Failure: {e}")
        yield (
            "I'm having a bit of trouble analyzing the textbook right now. "
            "Can you try adding one more connection?"
        )


def generate_socratic_hint(state: MindMapState, source_id: str) -> str:
    """
    Synchronous version - generates hint and returns full result.
    Kept for backward compatibility.
    """

    try:
        if not state.nodes:
            return (
                "Your map is a blank canvas! What is the central theme "
                "of your study material?"
            )

        search_query = state.nodes[-1].label
        if not search_query.strip():
            raise ValueError("Node label cannot be empty")

        context_chunks_response = get_relevant_chunks(search_query.strip(), source_id)

        if not context_chunks_response:
            logger.warning(
                f"No context found for query: {search_query} in source: {source_id}"
            )
            return (
                "I see you're thinking about "
                f"'{search_query}'. Try connecting it to another concept "
                "to see how they interact!"
            )

        chunk_texts: List[str] = []
        if isinstance(context_chunks_response, list):
            for chunk in context_chunks_response:
                if isinstance(chunk, Dict):
                    content = chunk.get("content")
                    if isinstance(content, str):
                        chunk_texts.append(content)
                elif isinstance(chunk, str):
                    chunk_texts.append(chunk)

        if not chunk_texts:
            logger.warning(
                f"No valid text content found in context chunks "
                f"for query: {search_query}"
            )
            return (
                "I see you're thinking about "
                f"'{search_query}'. Try connecting it to another concept "
                "to see how they interact!"
            )

        prompt = SocraticPrompts.get_hint_prompt(state, chunk_texts)

        response = ollama.chat(
            model=AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )

        content = response["message"]["content"]
        if not content:
            content = "I couldn't generate a hint at this time."
        return _strip_thinking_tags(content)

    except ValueError as e:
        logger.warning(f"Invalid input in generate_socratic_hint: {e}")
        return "Please make sure all nodes have labels before requesting a hint."
    except Exception as e:
        logger.error(f"Socratic Engine Failure: {e}")
        return (
            "I'm having a bit of trouble analyzing the textbook right now. "
            "Can you try adding one more connection?"
        )
