import json
import logging
from typing import AsyncGenerator, Dict, List

from openai import AsyncOpenAI, OpenAI

from app.app.settings import settings
from app.schemas.mindmap import MindMapState
from app.services.reasoning.prompt import SocraticPrompts
from app.services.reasoning.search_service import get_relevant_chunks

logger: logging.Logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)
async_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_socratic_hint_streaming(
    state: MindMapState, source_id: str
) -> AsyncGenerator[str, None]:
    """
    Generate a Socratic hint based on mind map state and source material.
    Uses async streaming to yield chunks as they're generated.

    Uses an OpenAI chat model (gpt-4o-mini) to generate hints by:
    1. Validating the mind map state
    2. Retrieving relevant context from the knowledge base
    3. Building a Socratic prompt
    4. Generating a streaming hint via the OpenAI API
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

        stream = await async_client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )

        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
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

        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )

        content = response.choices[0].message.content
        if not content:
            content = "I couldn't generate a hint at this time."
        return content

    except ValueError as e:
        logger.warning(f"Invalid input in generate_socratic_hint: {e}")
        return "Please make sure all nodes have labels before requesting a hint."
    except Exception as e:
        logger.error(f"Socratic Engine Failure: {e}")
        return (
            "I'm having a bit of trouble analyzing the textbook right now. "
            "Can you try adding one more connection?"
        )


def generate_quiz(state: MindMapState, source_id: str) -> Dict:
    """Generate a 3-question multiple-choice quiz from source material."""

    try:
        if not state.nodes:
            raise ValueError("Mind map cannot be empty")

        search_query = state.nodes[-1].label
        if not search_query.strip():
            raise ValueError("Node label cannot be empty")

        context_chunks_response = get_relevant_chunks(
            search_query.strip(), source_id, limit=5
        )

        if not context_chunks_response:
            logger.warning(
                f"No context found for query: {search_query} in source: {source_id}"
            )
            raise RuntimeError("No relevant source material found")

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
            raise RuntimeError("No valid source content found")

        nodes_list = ", ".join([n.label for n in state.nodes if n.label.strip()])
        edges_list = ", ".join(
            [f"{e.source} -> {e.target} ({e.label})" for e in state.edges if e.label]
        )

        prompt = SocraticPrompts.get_quiz_prompt(nodes_list, edges_list, chunk_texts)

        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )

        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("Failed to generate quiz")

        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        quiz_data = json.loads(content)

        if "questions" not in quiz_data or not isinstance(quiz_data["questions"], list):
            raise RuntimeError("Invalid quiz format")

        return quiz_data

    except (ValueError, RuntimeError) as e:
        logger.warning(f"Quiz generation error: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON: {e}")
        raise RuntimeError("Failed to parse quiz response")
    except Exception as e:
        logger.error(f"Quiz generation failure: {e}")
        raise RuntimeError("Failed to generate quiz")
