"""
TXT Text Extraction Service for TALENTRA.

Safely decodes plain text files across utf-8, utf-8-sig, latin-1, and cp1252.
"""

from pathlib import Path
from typing import Union


def extract_text_from_txt(source: Union[str, Path, bytes]) -> str:
    """
    Extracts plain text with multi-encoding fallback.
    """
    raw_bytes: bytes

    try:
        if isinstance(source, (str, Path)):
            raw_bytes = Path(source).read_bytes()
        elif isinstance(source, bytes):
            raw_bytes = source
        else:
            raise ValueError(f"Unsupported source type: {type(source)}")

        for enc in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
            try:
                decoded = raw_bytes.decode(enc)
                return decoded.encode("utf-8", "ignore").decode("utf-8", "ignore").strip()
            except UnicodeDecodeError:
                continue

        # Fallback with ignore errors
        return raw_bytes.decode("utf-8", errors="ignore").strip()
    except Exception as e:
        return f"[TXT Extraction Error: {str(e)}]"
