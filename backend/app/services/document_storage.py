"""
Secure Document Storage & Ingestion Service for TALENTRA.

Manages:
- Storage in data/documents/job_descriptions and data/documents/resumes
- Path traversal prevention & safe filename generation
- File extension, MIME, and size validation
- SHA-256 duplicate detection
- Atomic filesystem & database consistency
- Document deletion
"""

import os
import re
import hashlib
import mimetypes
from pathlib import Path
from typing import Tuple, Optional, Dict, Any, List
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.app.models.document import JobDescriptionDocument, ResumeDocument
from backend.app.services.document_parser import extract_text_from_file

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = WORKSPACE_ROOT / "data"
DOCUMENTS_DIR = DATA_DIR / "documents"
JD_STORAGE_DIR = DOCUMENTS_DIR / "job_descriptions"
RESUME_STORAGE_DIR = DOCUMENTS_DIR / "resumes"

# Ensure isolated directories exist
JD_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
RESUME_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "jd": {".pdf", ".docx", ".doc", ".txt", ".md", ".json"},
    "resume": {".pdf", ".docx", ".doc", ".txt"},
}

MAX_FILE_SIZES = {
    "jd": 15 * 1024 * 1024,      # 15 MB
    "resume": 25 * 1024 * 1024,  # 25 MB
}

MIME_TYPE_MAP = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
}


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and illegal characters."""
    base = Path(filename).name
    # Strip any directory separators or dangerous patterns
    clean = re.sub(r"[^\w\.-]", "_", base)
    clean = re.sub(r"\.{2,}", ".", clean)
    return clean.strip("._") or "unnamed_document"


def compute_sha256(content: bytes) -> str:
    """Compute standard SHA-256 hash of byte content."""
    hasher = hashlib.sha256()
    hasher.update(content)
    return hasher.hexdigest()


def validate_file_metadata(filename: str, content_size: int, doc_type: str) -> Tuple[str, str]:
    """
    Validate file extension, size limit, and determine MIME type.
    Raises ValueError on validation failure.
    """
    if doc_type not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Invalid document type: '{doc_type}'. Allowed: 'jd', 'resume'")

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS[doc_type]:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS[doc_type]))
        raise ValueError(f"Unsupported file format '{ext}'. Allowed for {doc_type}: {allowed}")

    max_size = MAX_FILE_SIZES[doc_type]
    if content_size > max_size:
        max_mb = max_size // (1024 * 1024)
        raise ValueError(f"File size exceeds limit of {max_mb} MB")

    if content_size == 0:
        raise ValueError("File content is empty (0 bytes)")

    mime_type = MIME_TYPE_MAP.get(ext) or mimetypes.guess_type(filename)[0] or "application/octet-stream"
    return ext, mime_type


def store_document(
    content: bytes,
    original_filename: str,
    doc_type: str,
    db: Session,
) -> Tuple[Any, bool, Optional[str]]:
    """
    Safely store a document file and register it in the database.
    
    Returns:
        Tuple of:
        - document record (JobDescriptionDocument or ResumeDocument)
        - is_duplicate (bool): True if already registered via SHA-256
        - error_message (Optional[str])
    """
    clean_name = sanitize_filename(original_filename)
    ext, mime_type = validate_file_metadata(clean_name, len(content), doc_type)
    sha256 = compute_sha256(content)

    model_class = JobDescriptionDocument if doc_type == "jd" else ResumeDocument
    storage_dir = JD_STORAGE_DIR if doc_type == "jd" else RESUME_STORAGE_DIR

    # Check for existing duplicate by SHA-256
    stmt = select(model_class).where(model_class.sha256_hash == sha256)
    existing = db.scalar(stmt)
    if existing:
        return existing, True, None

    # Generate unique stored filename
    import uuid
    doc_code_prefix = "DOC-JD-" if doc_type == "jd" else "DOC-RES-"
    unique_code = f"{doc_code_prefix}{uuid.uuid4().hex[:12].upper()}"
    stored_name = f"{unique_code}_{clean_name}"
    target_path = storage_dir / stored_name

    try:
        # 1. Write file atomically to disk
        target_path.write_bytes(content)

        # 2. Extract plain text content
        raw_text = None
        try:
            raw_text = extract_text_from_file(target_path)
            if raw_text:
                raw_text = raw_text.encode("utf-8", "ignore").decode("utf-8", "ignore")
        except Exception as e:
            raw_text = f"[Text extraction note: {e}]"

        # 3. Create database record
        doc_record = model_class(
            doc_id=unique_code,
            original_filename=clean_name,
            stored_filename=stored_name,
            file_path=str(target_path.as_posix()),
            file_extension=ext,
            mime_type=mime_type,
            file_size_bytes=len(content),
            sha256_hash=sha256,
            processing_status="processed",
            raw_text=raw_text,
            error_message=None,
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)
        return doc_record, False, None

    except Exception as exc:
        db.rollback()
        # Clean up orphaned physical file if created
        if target_path.exists():
            try:
                target_path.unlink()
            except Exception:
                pass
        raise RuntimeError(f"Failed to store document: {exc}")


def delete_stored_document(doc_id: str, doc_type: str, db: Session) -> bool:
    """
    Safely delete a document from both database and physical filesystem.
    """
    model_class = JobDescriptionDocument if doc_type == "jd" else ResumeDocument
    stmt = select(model_class).where(model_class.doc_id == doc_id)
    doc = db.scalar(stmt)
    if not doc:
        return False

    # 1. Delete physical file if present
    if doc.file_path:
        file_path = Path(doc.file_path)
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                # Log warning but continue to remove DB record
                pass

    # 2. Delete database record
    db.delete(doc)
    db.commit()
    return True
