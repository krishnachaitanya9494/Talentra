"""
Pydantic Schemas for Document Repository & Ingestion Engine.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doc_id: str
    original_filename: str
    stored_filename: str
    file_path: str
    file_extension: str
    mime_type: str
    file_size_bytes: int
    sha256_hash: str
    uploaded_at: datetime
    processing_status: str
    error_message: Optional[str] = None
    raw_text: Optional[str] = None


class PaginatedDocumentsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[DocumentItem]


class UploadSingleResponse(BaseModel):
    success: bool
    is_duplicate: bool
    message: str
    document: DocumentItem


class BulkUploadItemResult(BaseModel):
    filename: str
    success: bool
    is_duplicate: bool
    doc_id: Optional[str] = None
    message: str
    error: Optional[str] = None


class BulkUploadResponse(BaseModel):
    total_files: int
    successful_count: int
    duplicate_count: int
    failed_count: int
    results: List[BulkUploadItemResult]


class RepositoryStatsResponse(BaseModel):
    total_jds: int
    total_resumes: int
    total_documents: int
    total_storage_bytes: int
    jd_storage_bytes: int
    resume_storage_bytes: int
    database_file: str


class DeleteDocumentResponse(BaseModel):
    success: bool
    message: str
    doc_id: str


class RepositorySyncResponse(BaseModel):
    message: str
    jds_synced: int
    jds_duplicates: int
    jds_errors: int
    resumes_synced: int
    resumes_duplicates: int
    resumes_errors: int
    total_jds: int
    total_resumes: int
