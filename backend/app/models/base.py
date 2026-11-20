"""
Base Model Definition and Declarative Base for TALENTRA.

Uses SQLAlchemy 2.x DeclarativeBase and provides common timestamp mixins
for auditing creation and update times across all relational entities.
"""

from datetime import datetime, timezone
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    Foundational Declarative Base class for all TALENTRA SQLAlchemy 2.x ORM models.
    """
    pass


class TimestampMixin:
    """
    Reusable mixin providing timezone-aware created_at and updated_at timestamps.
    Automatically managed by the database and SQLAlchemy lifecycle events.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp indicating when the record was initially created.",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp indicating when the record was last modified.",
    )
