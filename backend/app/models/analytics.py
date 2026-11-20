"""
Analytics and Event Tracking Database Models for TALENTRA Phase 6.

Provides lightweight event tracking and metric snapshotting while reusing
existing workflow timestamps from documents, matching runs, assignments,
and outreach communications.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Float,
    Text,
    Index,
)
from sqlalchemy.orm import relationship
from backend.app.models.base import Base


class RecruitmentEvent(Base):
    """
    Lightweight append-only event log for recruitment operations lifecycle events.
    Enables granular Turnaround Time (TAT) tracking and auditability.
    """
    __tablename__ = "recruitment_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(64), nullable=False, index=True)
    # Event types: jd_received, jd_parsed, matching_started, matching_completed,
    # candidate_assigned, outreach_drafted, campaign_submitted, campaign_approved,
    # email_sent, candidate_replied, candidate_shortlisted

    entity_type = Column(String(32), nullable=True)  # jd, candidate, assignment, campaign
    entity_id = Column(String(64), nullable=True, index=True)

    jd_id = Column(Integer, nullable=True, index=True)
    candidate_id = Column(Integer, nullable=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)

    timestamp = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    metadata_json = Column(Text, nullable=True)  # Structured extra attributes

    __table_args__ = (
        Index("ix_recruitment_events_jd_type", "jd_id", "event_type"),
        Index("ix_recruitment_events_candidate_type", "candidate_id", "event_type"),
    )

    def __repr__(self):
        return f"<RecruitmentEvent {self.id}: {self.event_type} at {self.timestamp}>"


class RecruitmentMetricSnapshot(Base):
    """
    Periodic metric snapshots for historical trend reporting.
    """
    __tablename__ = "recruitment_metric_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    metric_category = Column(String(32), nullable=False)  # overview, tat, funnel, ta_workload
    metric_key = Column(String(64), nullable=False)
    metric_value = Column(Float, nullable=False)
    metadata_json = Column(Text, nullable=True)

    def __repr__(self):
        return f"<RecruitmentMetricSnapshot {self.snapshot_date}: {self.metric_key}={self.metric_value}>"
