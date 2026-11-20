"""
Candidate Intelligence & Structured Requisition Models for TALENTRA Phase 2.

Stores:
- CandidateResumeLink (Multiple resumes per candidate)
- CandidateEducation (Degrees, institutions, graduation years)
- CandidateEmployer (Work history timeline and employers)
- CandidateCertification (Verified professional credentials)
- CandidateAuditLog (Field-level manual corrections and changes)
- ParsedJobRequirement (Structured JD requirements separate from raw document)
"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base, TimestampMixin


class CandidateResumeLink(Base, TimestampMixin):
    """
    Links a candidate profile to one or more uploaded ResumeDocument records.
    Supports versioning and multi-resume tracking per candidate.
    """
    __tablename__ = "candidate_resume_links"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    resume_doc_id: Mapped[str] = mapped_column(
        String(36),
        index=True,
        nullable=False,
        doc="References ResumeDocument.doc_id",
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    linked_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        default=datetime.utcnow,
        nullable=False,
    )


class CandidateEducation(Base, TimestampMixin):
    """
    Extracted educational degrees and university credentials.
    """
    __tablename__ = "candidate_educations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    degree: Mapped[str] = mapped_column(String(100), nullable=False)
    institution: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    field_of_study: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    graduation_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class CandidateEmployer(Base, TimestampMixin):
    """
    Extracted employment history and past companies.
    """
    __tablename__ = "candidate_employers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role_title: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    start_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    end_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class CandidateCertification(Base, TimestampMixin):
    """
    Extracted professional certifications (AWS, Azure, Scrum, PMP, etc.).
    """
    __tablename__ = "candidate_certifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    certification_name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuing_organization: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    issue_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class CandidateAuditLog(Base, TimestampMixin):
    """
    Audit log tracking manual corrections and data provenance changes.
    """
    __tablename__ = "candidate_audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by: Mapped[str] = mapped_column(String(100), default="Recruiter Admin", nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        default=datetime.utcnow,
        nullable=False,
    )


class ParsedJobRequirement(Base, TimestampMixin):
    """
    Structured extracted requisition requirements separate from raw JobDescriptionDocument.
    """
    __tablename__ = "parsed_job_requirements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    jd_doc_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True,
        nullable=False,
        doc="References JobDescriptionDocument.doc_id",
    )
    job_title: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    required_skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferred_skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    min_experience_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_experience_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    required_qualifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    certifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(String(50), default="Full-time", nullable=True)
    work_mode: Mapped[Optional[str]] = mapped_column(String(50), default="On-site", nullable=True)
    mandatory_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferred_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extraction_confidence: Mapped[float] = mapped_column(Float, default=0.85, nullable=False)
    extraction_evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_manually_corrected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    corrected_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    corrected_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
