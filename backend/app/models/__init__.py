"""
SQLAlchemy ORM Models Package for TALENTRA.

Centralizes all foundational relational models, ensuring consistent imports
and registration on the shared Base.metadata catalog for Alembic and FastAPI.
"""

from backend.app.models.base import Base, TimestampMixin
from backend.app.models.user import User, UserRole
from backend.app.models.client import Client
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.submission import CandidateSubmission
from backend.app.models.interview import Interview
from backend.app.models.document import JobDescriptionDocument, ResumeDocument
from backend.app.models.candidate_intelligence import (
    CandidateResumeLink,
    CandidateEducation,
    CandidateEmployer,
    CandidateCertification,
    CandidateAuditLog,
    ParsedJobRequirement,
)
from backend.app.models.matching import (
    MatchingConfiguration,
    MatchingRun,
    CandidateMatch,
    MatchEvidence,
)
from backend.app.models.assignment import (
    CandidateAssignment,
    AssignmentStatus,
    AssignmentHistory,
    AssignmentNote,
    AssignmentNotification,
)
from backend.app.models.outreach import (
    EmailTemplate,
    EmailProviderAccount,
    OutreachCampaign,
    CampaignStatus,
    CandidateCommunication,
    EmailSuppressionList,
)
from backend.app.models.analytics import (
    RecruitmentEvent,
    RecruitmentMetricSnapshot,
)
from backend.app.models.sourcing import (
    SourcingSearch,
    SourcingSearchResult,
    CandidateExport,
)
from backend.app.models.scraper import (
    ProfileScrapeRun,
    ScrapedCandidateItem,
)
from backend.app.models.agent import (
    ApprovalRequest,
    AgentTrace,
    ResumeEmbedding,
    JobEmbedding,
)

__all__ = [
    "Base",
    "TimestampMixin",
    "User",
    "UserRole",
    "Client",
    "Candidate",
    "JobRequirement",
    "CandidateSubmission",
    "Interview",
    "JobDescriptionDocument",
    "ResumeDocument",
    "CandidateResumeLink",
    "CandidateEducation",
    "CandidateEmployer",
    "CandidateCertification",
    "CandidateAuditLog",
    "ParsedJobRequirement",
    "MatchingConfiguration",
    "MatchingRun",
    "CandidateMatch",
    "MatchEvidence",
    "CandidateAssignment",
    "AssignmentStatus",
    "AssignmentHistory",
    "AssignmentNote",
    "AssignmentNotification",
    "EmailTemplate",
    "EmailProviderAccount",
    "OutreachCampaign",
    "CampaignStatus",
    "CandidateCommunication",
    "EmailSuppressionList",
    "RecruitmentEvent",
    "RecruitmentMetricSnapshot",
    "SourcingSearch",
    "SourcingSearchResult",
    "CandidateExport",
    "ProfileScrapeRun",
    "ScrapedCandidateItem",
    "ApprovalRequest",
    "AgentTrace",
    "ResumeEmbedding",
    "JobEmbedding",
]
