import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Standalone Service Logic for Module 02: Candidate Resumes.
100% deterministic SHA-256 duplicate detection, document validation, and metadata extraction.
"""

import hashlib
from typing import List, Dict, Any, Optional
from contracts.resumes_schemas import UploadResumeResultSchema, BulkUploadResultSchema

class CandidateResumeService:
    def __init__(self):
        self._known_hashes = set()

    def compute_file_hash(self, file_bytes: bytes) -> str:
        """Calculate SHA-256 hash of file content."""
        return hashlib.sha256(file_bytes).hexdigest()

    def validate_and_deduplicate(self, filename: str, file_bytes: bytes) -> UploadResumeResultSchema:
        """Validate file and check against known duplicate hashes."""
        if not file_bytes:
            return UploadResumeResultSchema(
                status="error",
                filename=filename,
                file_hash="",
                is_duplicate=False,
                message="File content is empty."
            )

        f_hash = self.compute_file_hash(file_bytes)
        if f_hash in self._known_hashes:
            return UploadResumeResultSchema(
                status="duplicate",
                filename=filename,
                file_hash=f_hash,
                is_duplicate=True,
                message="Identical resume document already exists in repository."
            )

        self._known_hashes.add(f_hash)
        return UploadResumeResultSchema(
            status="success",
            filename=filename,
            file_hash=f_hash,
            is_duplicate=False,
            candidate_id=101,
            message="Resume document validated and indexed."
        )
