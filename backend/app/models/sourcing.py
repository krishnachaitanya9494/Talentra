"""
Sourcing and Excel Automation Database Models for TALENTRA.

Provides models to track:
- SourcingSearch: Records search sessions, input JD specifications, filter parameters, and aggregate match metrics.
- SourcingSearchResult: Individual candidate evaluations, ranking, dimensional scores, evidence, and deduplication info.
- CandidateExport: Audit history of generated Excel workbooks, export file paths, candidate counts, and status.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from backend.app.models.base import Base


class SourcingSearch(Base):
    """
    Tracks a JD-to-candidate sourcing session.
    """
    __tablename__ = "sourcing_searches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    search_code = Column(
        String(36),
        unique=True,
        index=True,
        default=lambda: f"SRC-{uuid.uuid4().hex[:10].upper()}",
        nullable=False,
    )
    jd_id = Column(Integer, ForeignKey("job_description_documents.id"), nullable=True, index=True)
    jd_title = Column(String(255), nullable=False)
    input_source = Column(String(32), default="paste", nullable=False)  # upload, paste, existing_jd
    raw_jd_text = Column(Text, nullable=True)
    parsed_requirements_json = Column(Text, nullable=False)  # JSON representation of requirements

    # Aggregated metrics
    total_candidates_searched = Column(Integer, default=0, nullable=False)
    total_matches_found = Column(Integer, default=0, nullable=False)
    strong_matches_count = Column(Integer, default=0, nullable=False)
    potential_matches_count = Column(Integer, default=0, nullable=False)
    partial_matches_count = Column(Integer, default=0, nullable=False)
    not_suitable_count = Column(Integer, default=0, nullable=False)
    duplicates_identified_count = Column(Integer, default=0, nullable=False)

    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    status = Column(String(32), default="completed", nullable=False)  # completed, in_progress, failed

    # Relationships
    results = relationship(
        "SourcingSearchResult",
        back_populates="search",
        cascade="all, delete-orphan",
        order_by="SourcingSearchResult.rank",
    )
    exports = relationship("CandidateExport", back_populates="search")
    created_by = relationship("User")
    jd_document = relationship("JobDescriptionDocument")

    def __repr__(self):
        return f"<SourcingSearch {self.search_code}: {self.jd_title} ({self.total_matches_found} matches)>"


class SourcingSearchResult(Base):
    """
    Evaluated candidate for a specific sourcing search.
    """
    __tablename__ = "sourcing_search_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    search_id = Column(Integer, ForeignKey("sourcing_searches.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, index=True)

    rank = Column(Integer, nullable=False)
    match_score = Column(Float, nullable=False, index=True)
    match_segment = Column(String(32), nullable=False, index=True)  # Strong Match, Potential Match, Partial Match, Not Suitable

    matched_skills = Column(Text, nullable=True)
    missing_skills = Column(Text, nullable=True)
    experience_compatibility = Column(String(100), nullable=True)
    match_explanation = Column(Text, nullable=True)
    evidence_json = Column(Text, nullable=True)  # JSON 7-dimension evidence details
    has_critical_mismatch = Column(Boolean, default=False, nullable=False)
    profile_completeness_percent = Column(Float, default=0.0, nullable=False)

    # Deduplication tracking
    is_duplicate = Column(Boolean, default=False, nullable=False)
    duplicate_of_id = Column(Integer, nullable=True)
    duplicate_reason = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    search = relationship("SourcingSearch", back_populates="results")
    candidate = relationship("Candidate")

    __table_args__ = (
        Index("ix_sourcing_results_search_rank", "search_id", "rank"),
        Index("ix_sourcing_results_search_score", "search_id", "match_score"),
    )

    def __repr__(self):
        return f"<SourcingSearchResult #{self.rank} Cand:{self.candidate_id} Score:{self.match_score}>"


class CandidateExport(Base):
    """
    Audit log and storage tracking for generated Excel workbooks.
    """
    __tablename__ = "candidate_exports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    export_code = Column(
        String(36),
        unique=True,
        index=True,
        default=lambda: f"EXP-{uuid.uuid4().hex[:10].upper()}",
        nullable=False,
    )
    search_id = Column(Integer, ForeignKey("sourcing_searches.id", ondelete="SET NULL"), nullable=True, index=True)
    jd_id = Column(Integer, nullable=True, index=True)
    jd_title = Column(String(255), nullable=False)

    export_filename = Column(String(255), nullable=False)
    export_folder = Column(String(500), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0, nullable=False)

    total_candidates_exported = Column(Integer, default=0, nullable=False)
    selected_segments = Column(String(255), default="All Qualified", nullable=False)

    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    status = Column(String(32), default="completed", nullable=False)  # completed, failed

    # Relationships
    search = relationship("SourcingSearch", back_populates="exports")
    created_by = relationship("User")

    def __repr__(self):
        return f"<CandidateExport {self.export_code}: {self.export_filename} ({self.total_candidates_exported} candidates)>"
