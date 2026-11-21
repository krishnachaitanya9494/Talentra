"""
Shared Integration Interfaces.

Abstract base classes allowing host applications (e.g. your company's main website)
to supply their own database or storage implementations to the feature modules.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from shared.common_contracts.schemas import CandidateProfileContract, JobRequisitionContract


class CandidateRepositoryAdapter(ABC):
    """Abstract interface for candidate repository access."""

    @abstractmethod
    def get_candidate_by_id(self, candidate_id: int) -> Optional[CandidateProfileContract]:
        """Retrieve a candidate by primary ID."""
        pass

    @abstractmethod
    def list_candidates(self, limit: int = 100, offset: int = 0) -> List[CandidateProfileContract]:
        """List candidates with pagination."""
        pass

    @abstractmethod
    def search_candidates(
        self,
        query: str,
        min_experience: Optional[float] = None,
        max_experience: Optional[float] = None,
        location: Optional[str] = None,
        limit: int = 50
    ) -> List[CandidateProfileContract]:
        """Search candidates using query parameters."""
        pass


class JobRequisitionRepositoryAdapter(ABC):
    """Abstract interface for job requisition repository access."""

    @abstractmethod
    def get_requisition_by_id(self, req_id: int) -> Optional[JobRequisitionContract]:
        """Retrieve a requisition by primary ID."""
        pass

    @abstractmethod
    def list_requisitions(self, status: Optional[str] = None) -> List[JobRequisitionContract]:
        """List requisitions optionally filtered by status."""
        pass

    @abstractmethod
    def save_requisition(self, req: JobRequisitionContract) -> JobRequisitionContract:
        """Create or update a requisition."""
        pass


class StorageAdapter(ABC):
    """Abstract interface for document file storage (Local disk, S3, Azure Blob, etc.)."""

    @abstractmethod
    def save_file(self, filename: str, content: bytes) -> str:
        """Persist a file and return its storage URI or key."""
        pass

    @abstractmethod
    def read_file(self, storage_key: str) -> bytes:
        """Read a file by storage URI or key."""
        pass

    @abstractmethod
    def delete_file(self, storage_key: str) -> bool:
        """Delete a file by storage URI or key."""
        pass
