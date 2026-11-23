"""
Enterprise Recruitment Agent Models for TALENTRA.

Implements persistent state for:
- ApprovalRequest (Human-in-the-Loop sensitive actions queue)
- AgentTrace (Execution audit log with latency and tool telemetry)
- ResumeEmbedding (2,048-dim vector embeddings for candidates)
- JobEmbedding (2,048-dim vector embeddings for job requisitions)
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
    Boolean,
)
from backend.app.models.base import Base, TimestampMixin


class ApprovalRequest(Base, TimestampMixin):
    """
    Human-in-the-Loop Safety Gate Approval Queue.
    Intercepts sensitive actions (offers, stage transitions, rejections, requirement edits)
    before state mutation can take place.
    """
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    approval_id = Column(String(36), unique=True, index=True, nullable=False)
    action_type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    payload = Column(Text, nullable=False)  # JSON-encoded metadata
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, approved, rejected
    requested_by = Column(String(100), default="Recruiter Assistant", nullable=False)
    resolved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "approval_id": self.approval_id,
            "action_type": self.action_type,
            "description": self.description,
            "payload": self.payload,
            "status": self.status,
            "requested_by": self.requested_by,
            "resolved_by": self.resolved_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class AgentTrace(Base, TimestampMixin):
    """
    Persistent audit trace capturing agent turns, tool invocations,
    latency, and approximate token usage.
    """
    __tablename__ = "agent_traces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trace_id = Column(String(36), unique=True, index=True, nullable=False)
    session_id = Column(String(64), index=True, nullable=False)
    prompt = Column(Text, nullable=False)
    tools_called = Column(Text, nullable=False)  # JSON-encoded list of tool calls
    tokens_used = Column(Integer, default=0, nullable=False)
    latency_ms = Column(Float, default=0.0, nullable=False)
    response_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "trace_id": self.trace_id,
            "session_id": self.session_id,
            "prompt": self.prompt,
            "tools_called": self.tools_called,
            "tokens_used": self.tokens_used,
            "latency_ms": self.latency_ms,
            "response_text": self.response_text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ResumeEmbedding(Base, TimestampMixin):
    """
    2,048-dimensional dense vector embeddings for candidate profiles and resumes.
    Cached by content SHA-256 hash.
    """
    __tablename__ = "resume_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resume_doc_id = Column(String(36), index=True, nullable=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), index=True, nullable=True)
    content_hash = Column(String(64), index=True, nullable=False)
    embedding_json = Column(Text, nullable=False)  # JSON-encoded list of 2048 floats
    dimension = Column(Integer, default=2048, nullable=False)
    model_name = Column(String(100), default="nvidia/nemotron-3-embed-1b:free", nullable=False)
    provider = Column(String(50), default="openrouter", nullable=False)
    is_fallback = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class JobEmbedding(Base, TimestampMixin):
    """
    2,048-dimensional dense vector embeddings for job requisitions and parsed specs.
    Cached by content SHA-256 hash.
    """
    __tablename__ = "job_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    jd_doc_id = Column(String(36), index=True, nullable=True)
    job_id = Column(Integer, ForeignKey("job_requirements.id", ondelete="CASCADE"), index=True, nullable=True)
    content_hash = Column(String(64), index=True, nullable=False)
    embedding_json = Column(Text, nullable=False)  # JSON-encoded list of 2048 floats
    dimension = Column(Integer, default=2048, nullable=False)
    model_name = Column(String(100), default="nvidia/nemotron-3-embed-1b:free", nullable=False)
    provider = Column(String(50), default="openrouter", nullable=False)
    is_fallback = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
