"""
Matching & Segmentation Database Models for TALENTRA Phase 3.

Provides structured relational models to persist matching configurations,
matching evaluation runs, ranked candidate match records, and explainable
evidence dimensions.
"""

from datetime import datetime, timezone
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


class MatchingConfiguration(Base):
    """
    Configurable scoring weights and segmentation thresholds for candidate matching.
    """
    __tablename__ = "matching_configurations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, default="Default Deterministic Scoring")
    
    # Configurable dimension weights (sum = 1.0)
    weight_required_skills = Column(Float, default=0.35, nullable=False)
    weight_preferred_skills = Column(Float, default=0.10, nullable=False)
    weight_experience = Column(Float, default=0.20, nullable=False)
    weight_role_relevance = Column(Float, default=0.15, nullable=False)
    weight_qualifications = Column(Float, default=0.05, nullable=False)
    weight_certifications = Column(Float, default=0.05, nullable=False)
    weight_location = Column(Float, default=0.10, nullable=False)

    # Configurable segment boundaries (0 - 100)
    threshold_strong = Column(Float, default=80.0, nullable=False)
    threshold_potential = Column(Float, default=65.0, nullable=False)
    threshold_partial = Column(Float, default=45.0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "weights": {
                "required_skills": self.weight_required_skills,
                "preferred_skills": self.weight_preferred_skills,
                "experience": self.weight_experience,
                "role_relevance": self.weight_role_relevance,
                "qualifications": self.weight_qualifications,
                "certifications": self.weight_certifications,
                "location": self.weight_location,
            },
            "thresholds": {
                "strong": self.threshold_strong,
                "potential": self.threshold_potential,
                "partial": self.threshold_partial,
            },
        }


class MatchingRun(Base):
    """
    Record of an evaluation execution matching candidates against a Job Description.
    """
    __tablename__ = "matching_runs"

    id = Column(Integer, primary_key=True, index=True)
    jd_id = Column(Integer, ForeignKey("job_description_documents.id"), nullable=False, index=True)
    run_by_user_id = Column(Integer, nullable=True)
    status = Column(String(50), default="completed", nullable=False)
    engine_version = Column(String(20), default="3.0.0", nullable=False)

    total_evaluated = Column(Integer, default=0, nullable=False)
    strong_matches = Column(Integer, default=0, nullable=False)
    potential_matches = Column(Integer, default=0, nullable=False)
    partial_matches = Column(Integer, default=0, nullable=False)
    not_suitable = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    candidate_matches = relationship(
        "CandidateMatch",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="desc(CandidateMatch.overall_score)",
    )


class CandidateMatch(Base):
    """
    Individual ranked candidate match record against a specific Job Description.
    """
    __tablename__ = "candidate_matches"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("matching_runs.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, index=True)
    jd_id = Column(Integer, nullable=False, index=True)

    overall_score = Column(Float, nullable=False, index=True)
    segment = Column(String(50), nullable=False, index=True)  # Strong Match, Potential Match, Partial Match, Not Suitable

    # Matched and missing skills JSON strings
    matched_skills = Column(Text, default="[]")
    missing_skills = Column(Text, default="[]")

    # Granular dimension scores (0 - 100)
    skills_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    role_score = Column(Float, default=0.0)
    qualifications_score = Column(Float, default=0.0)
    certifications_score = Column(Float, default=0.0)
    location_score = Column(Float, default=0.0)

    has_critical_mismatch = Column(Boolean, default=False, nullable=False)
    data_completeness = Column(Float, default=100.0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    run = relationship("MatchingRun", back_populates="candidate_matches")
    candidate = relationship("Candidate")
    evidences = relationship("MatchEvidence", back_populates="match", cascade="all, delete-orphan")


class MatchEvidence(Base):
    """
    Supporting evidence snippet explaining a specific evaluation dimension for a candidate match.
    """
    __tablename__ = "match_evidences"

    id = Column(Integer, primary_key=True, index=True)
    candidate_match_id = Column(Integer, ForeignKey("candidate_matches.id"), nullable=False, index=True)
    dimension = Column(String(50), nullable=False)  # Skills, Experience, Role Relevance, Location, Qualifications, Certifications
    status = Column(String(20), nullable=False)     # confirmed_match, partial_match, confirmed_mismatch, unknown
    score = Column(Float, default=0.0)
    weight = Column(Float, default=0.0)
    evidence_text = Column(Text, nullable=False)

    match = relationship("CandidateMatch", back_populates="evidences")
