"""
Apify-Inspired Resume & Candidate Profile Scraper Models for TALENTRA.

Reference: coregent/resume-candidate-profile-scraper
Stores scraping run configurations, execution statuses, dataset items,
completeness metrics, and external social/portfolio links.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base, TimestampMixin


class ProfileScrapeRun(Base, TimestampMixin):
    """
    Audit record for each candidate scraper execution run.
    """
    __tablename__ = "profile_scrape_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    actor_id: Mapped[str] = mapped_column(String(100), default="coregent/resume-candidate-profile-scraper", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="SUCCEEDED", nullable=False, index=True)  # RUNNING, SUCCEEDED, FAILED
    
    total_urls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    extracted_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_completeness_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    proxy_mode: Mapped[str] = mapped_column(String(50), default="datacenter_automatic", nullable=False)
    apify_dataset_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    started_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    items: Mapped[List["ScrapedCandidateItem"]] = relationship(
        "ScrapedCandidateItem", back_populates="run", cascade="all, delete-orphan"
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "run_code": self.run_code,
            "actor_id": self.actor_id,
            "status": self.status,
            "total_urls": self.total_urls,
            "extracted_count": self.extracted_count,
            "avg_completeness_score": round(self.avg_completeness_score, 1),
            "proxy_mode": self.proxy_mode,
            "apify_dataset_id": self.apify_dataset_id,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "duration_seconds": round(self.duration_seconds, 2),
        }


class ScrapedCandidateItem(Base, TimestampMixin):
    """
    Extracted candidate profile item corresponding to Apify Actor dataset output.
    """
    __tablename__ = "scraped_candidate_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("profile_scrape_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    headline: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    
    total_experience_years: Mapped[Optional[float]] = mapped_column(Float, default=0.0, nullable=True)
    current_company: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Comma-separated or JSON string
    education: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Portfolio and Social links
    github_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Completeness scoring (0-100)
    completeness_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    # Raw JSON payload
    raw_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Ingestion status into TALENTRA candidate pool
    is_imported_to_pool: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    imported_candidate_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    run: Mapped["ProfileScrapeRun"] = relationship("ProfileScrapeRun", back_populates="items")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "run_id": self.run_id,
            "source_url": self.source_url,
            "full_name": self.full_name,
            "headline": self.headline or "Candidate Profile",
            "email": self.email,
            "phone": self.phone,
            "location": self.location or "Not Specified",
            "total_experience_years": self.total_experience_years or 0.0,
            "current_company": self.current_company,
            "skills": [s.strip() for s in (self.skills or "").split(",") if s.strip()],
            "education": self.education or "Bachelor Degree",
            "github_url": self.github_url,
            "linkedin_url": self.linkedin_url,
            "portfolio_url": self.portfolio_url,
            "completeness_score": round(self.completeness_score, 1),
            "is_imported_to_pool": self.is_imported_to_pool,
            "imported_candidate_id": self.imported_candidate_id,
        }
