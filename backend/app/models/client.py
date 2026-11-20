"""
Client Entity Model for TALENTRA.

Represents corporate clients, hiring companies, or customer accounts
that sponsor job requirements within the Talent Intelligence Platform.
"""

from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.job_requirement import JobRequirement


class Client(Base, TimestampMixin):
    """
    Client model representing organizations with hiring demands.
    Has a 1-to-many relationship with JobRequirement entities.
    """
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        doc="Internal surrogate primary key identifier.",
    )
    client_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique business identifier for the client (e.g., 'CLI-ACME-001').",
    )
    name: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
        doc="Official registered corporate name of the client.",
    )
    industry: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Primary industry domain (e.g., Technology, Healthcare, Finance).",
    )
    website: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Public corporate website URL.",
    )
    contact_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Primary point of contact or hiring manager name.",
    )
    contact_email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Email address for hiring notifications and correspondence.",
    )
    contact_phone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Direct contact telephone number.",
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        server_default="active",
        nullable=False,
        doc="Operational status of the client ('active', 'inactive', 'onboarding').",
    )
    billing_address: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Formal billing and invoicing street address.",
    )

    # 1-to-many relationship: A client can have multiple job requirements
    job_requirements: Mapped[List["JobRequirement"]] = relationship(
        "JobRequirement",
        back_populates="client",
        cascade="all, delete-orphan",
        doc="Collection of job requirements associated with this client.",
    )

    def __repr__(self) -> str:
        return f"<Client(id={self.id}, code='{self.client_code}', name='{self.name}')>"

