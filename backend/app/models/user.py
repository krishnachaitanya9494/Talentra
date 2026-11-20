"""
User and Authentication Database Models for TALENTRA.

Provides structured models for authenticated system users, roles,
and organizational assignments to support least-privilege security.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.models.base import Base


class UserRole:
    ADMINISTRATOR = "administrator"
    RECRUITMENT_MANAGER = "recruitment_manager"
    TA_RECRUITER = "ta_recruiter"
    VIEWER = "viewer"

    ALL_ROLES = [ADMINISTRATOR, RECRUITMENT_MANAGER, TA_RECRUITER, VIEWER]


class User(Base):
    """
    Authenticated system user supporting TALENTRA recruitment operations.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.VIEWER, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # TA / Recruiter details
    team = Column(String(100), nullable=True)  # e.g., "Engineering & Cloud", "Enterprise Sales"
    technical_specialization = Column(String(255), nullable=True)  # e.g., "Java, Cloud, DevOps"
    work_phone = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "team": self.team,
            "technical_specialization": self.technical_specialization,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
