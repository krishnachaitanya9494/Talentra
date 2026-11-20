"""
PDF Text Extraction Service for TALENTRA.

Uses pypdf to safely extract text from PDF documents with encoding sanitization.
"""

from pathlib import Path
from typing import Union
import io
import pypdf


def extract_text_from_pdf(source: Union[str, Path, bytes]) -> str:
    """
    Extracts plain text from a PDF file path or raw bytes.
    Cleans up whitespace and strips unpaired surrogate code points.
    """
    text_parts = []

    try:
        if isinstance(source, (str, Path)):
            reader = pypdf.PdfReader(str(source))
        elif isinstance(source, bytes):
            reader = pypdf.PdfReader(io.BytesIO(source))
        else:
            raise ValueError(f"Unsupported source type: {type(source)}")

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

        combined_text = "\n\n".join(text_parts).strip()
        # Clean up surrogates that would break utf-8 serialization/SQLite
        cleaned_text = combined_text.encode("utf-8", "ignore").decode("utf-8", "ignore")
        return cleaned_text
    except Exception as e:
        return f"[PDF Extraction Error: {str(e)}]"
