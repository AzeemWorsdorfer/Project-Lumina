import logging
from typing import Any, Dict, List

import fitz

logger: logging.Logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Opens a PDF file, extracts text from each page, and returns a list of dictionaries.
    Each dictionary contains the page number (1-indexed) and the extracted text.
    """
    if not file_path or not file_path.strip():
        raise ValueError("File path cannot be empty")

    content: List[Dict[str, Any]] = []

    try:
        with fitz.open(file_path) as doc:
            # Check if document has pages
            if doc.page_count == 0:
                logger.warning(f"PDF file {file_path} has no pages")
                return content

            for page_num in range(doc.page_count):
                page = doc[page_num]
                try:
                    text = page.get_text("text")
                    clean_text = text.replace("\x00", "")
                    content.append({"page": page_num + 1, "text": clean_text})
                except Exception as e:
                    logger.warning(
                        f"Error extracting text from page {page_num + 1}: {e}"
                    )
                    content.append({"page": page_num + 1, "text": ""})

    except fitz.FileNotFoundError:
        raise ValueError(f"PDF file not found: {file_path}")
    except fitz.EmptyFileError:
        raise ValueError(f"PDF file is empty or corrupted: {file_path}")
    except Exception as e:
        logger.error(f"Error processing PDF file {file_path}: {e}")
        raise ValueError(f"Failed to process PDF: {e}")

    return content
