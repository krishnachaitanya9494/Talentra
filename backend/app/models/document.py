"""
Document Repository Models for TALENTRA.

Stores metadata and storage tracking for raw ingested files:
- JobDescriptionDocument
- ResumeDocument

Tracks:
- Unique document IDs
- Original filename
- Stored file path
- File extension and MIME type
- File size (bytes)
- SHA-256 checksum (with duplicate detection)
- Upload timestamp and processing status
- Error reporting where applicable
"""

import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Integer, BigInteger, Text, DateTime, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.models.base import Base, TimestampMixin


class JobDescriptionDocument(Base, TimestampMixin):
    """
    Tracks uploaded and ingested Job Description raw files in data/documents/job_descriptions/.
    Enforces duplicate detection via SHA-256 hash.
    """
    __tablename__ = "job_description_documents"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        doc="Internal primary key identifier.",
    )
    doc_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True,
        default=lambda: f"DOC-JD-{uuid.uuid4().hex[:12].upper()}",
        nullable=False,
        doc="Unique external document identifier.",
    )
    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        doc="Original client-supplied filename.",
    )
    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Sanitized unique storage filename on disk.",
    )
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Relative or absolute disk path in data/documents/job_descriptions/.",
    )
    file_extension: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        doc="File extension (e.g., '.pdf', '.docx', '.txt').",
    )
    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="MIME content type (e.g., 'application/pdf').",
    )
    file_size_bytes: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        doc="Exact file size in bytes.",
    )
    sha256_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        doc="SHA-256 hash used for duplicate detection.",
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        default=datetime.utcnow,
        nullable=False,
        doc="Upload timestamp.",
    )
    processing_status: Mapped[str] = mapped_column(
        String(32),
        default="processed",
        server_default="processed",
        nullable=False,
        index=True,
        doc="Status ('pending', 'processed', 'duplicate', 'failed').",
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Diagnostic or ingestion error information if failed.",
    )
    raw_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Extracted plain text content from the document.",
    )

    def __repr__(self) -> str:
        return f"<JobDescriptionDocument(id={self.id}, doc_id='{self.doc_id}', filename='{self.original_filename}')>"


class ResumeDocument(Base, TimestampMixin):
    """
    Tracks uploaded and ingested Candidate Resume raw files in data/documents/resumes/.
    Enforces duplicate detection via SHA-256 hash.
    """
    __tablename__ = "resume_documents"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        doc="Internal primary key identifier.",
    )
    doc_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True,
        default=lambda: f"DOC-RES-{uuid.uuid4().hex[:12].upper()}",
        nullable=False,
        doc="Unique external document identifier.",
    )
    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        doc="Original client-supplied filename.",
    )
    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Sanitized unique storage filename on disk.",
    )
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Relative or absolute disk path in data/documents/resumes/.",
    )
    file_extension: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        doc="File extension (e.g., '.pdf', '.docx', '.txt').",
    )
    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="MIME content type (e.g., 'application/pdf').",
    )
    file_size_bytes: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        doc="Exact file size in bytes.",
    )
    sha256_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        doc="SHA-256 hash used for duplicate detection.",
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        default=datetime.utcnow,
        nullable=False,
        doc="Upload timestamp.",
    )
    processing_status: Mapped[str] = mapped_column(
        String(32),
        default="processed",
        server_default="processed",
        nullable=False,
        index=True,
        doc="Status ('pending', 'processed', 'duplicate', 'failed').",
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Diagnostic or ingestion error information if failed.",
    )
    raw_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Extracted plain text content from the document.",
    )

    def __repr__(self) -> str:
        return f"<ResumeDocument(id={self.id}, doc_id='{self.doc_id}', filename='{self.original_filename}')>"
