"""
DOCX Text Extraction Service for TALENTRA.

Uses python-docx to extract text from paragraphs, tables, and sections.
"""

from pathlib import Path
from typing import Union
import io
import docx


def extract_text_from_docx(source: Union[str, Path, bytes]) -> str:
    """
    Extracts plain text from a DOCX file path or raw bytes.
    Parses paragraphs and table cell contents.
    """
    text_parts = []

    try:
        if isinstance(source, (str, Path)):
            doc = docx.Document(str(source))
        elif isinstance(source, bytes):
            doc = docx.Document(io.BytesIO(source))
        else:
            raise ValueError(f"Unsupported source type: {type(source)}")

        # 1. Paragraphs
        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                text_parts.append(text)

        # 2. Table Cells
        for table in doc.tables:
            for row in table.rows:
                row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_texts:
                    text_parts.append(" | ".join(row_texts))

        combined_text = "\n".join(text_parts).strip()
        cleaned_text = combined_text.encode("utf-8", "ignore").decode("utf-8", "ignore")
        return cleaned_text
    except Exception as e:
        return f"[DOCX Extraction Error: {str(e)}]"
