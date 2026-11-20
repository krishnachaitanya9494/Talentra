"""
Repository and Document Ingestion Router for TALENTRA.

Provides RESTful endpoints for:
- Uploading individual Job Descriptions
- Bulk uploading multiple Job Descriptions
- Uploading individual Resumes
- Bulk uploading multiple Resumes (supporting 200+ files)
- Listing and searching uploaded documents
- Fetching full document details
- Safe document deletion (database + storage cleanup)
- Repository storage & record statistics
"""

from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.core.config import settings
from backend.app.models.document import JobDescriptionDocument, ResumeDocument
from backend.app.schemas.repository import (
    DocumentItem,
    PaginatedDocumentsResponse,
    UploadSingleResponse,
    BulkUploadItemResult,
    BulkUploadResponse,
    RepositoryStatsResponse,
    DeleteDocumentResponse,
    RepositorySyncResponse,
)
from backend.app.services.document_storage import (
    store_document,
    delete_stored_document,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZES,
)

router = APIRouter(prefix="/api/v1/repository", tags=["Document Ingestion Repository"])


# ============================================================================
# STATS ENDPOINT
# ============================================================================

@router.get(
    "/stats",
    response_model=RepositoryStatsResponse,
    summary="Retrieve Repository Statistics",
    description="Returns aggregate counts and byte storage footprint of all ingested documents.",
)
def get_repository_stats(db: Session = Depends(get_db)) -> RepositoryStatsResponse:
    total_jds = db.scalar(select(func.count(JobDescriptionDocument.id))) or 0
    total_resumes = db.scalar(select(func.count(ResumeDocument.id))) or 0
    jd_bytes = db.scalar(select(func.coalesce(func.sum(JobDescriptionDocument.file_size_bytes), 0))) or 0
    resume_bytes = db.scalar(select(func.coalesce(func.sum(ResumeDocument.file_size_bytes), 0))) or 0

    return RepositoryStatsResponse(
        total_jds=total_jds,
        total_resumes=total_resumes,
        total_documents=total_jds + total_resumes,
        total_storage_bytes=jd_bytes + resume_bytes,
        jd_storage_bytes=jd_bytes,
        resume_storage_bytes=resume_bytes,
        database_file=settings.DATABASE_URL.replace("sqlite:///", ""),
    )


@router.post(
    "/sync",
    response_model=RepositorySyncResponse,
    summary="Synchronize Local Files with Document Repository",
    description="Scans data/jds and data/resumes, stores documents in data/documents, and indexes them in SQLite.",
)
def sync_repository_documents(db: Session = Depends(get_db)) -> RepositorySyncResponse:
    jds_dir = Path("data/jds")
    resumes_dir = Path("data/resumes")

    jd_synced = 0
    jd_dupes = 0
    jd_errors = 0

    if jds_dir.exists():
        for path in jds_dir.glob("*"):
            if path.is_file() and not path.name.startswith("."):
                try:
                    content = path.read_bytes()
                    doc, is_dup, _ = store_document(
                        content=content,
                        original_filename=path.name,
                        doc_type="jd",
                        db=db,
                    )
                    if is_dup:
                        jd_dupes += 1
                    else:
                        jd_synced += 1
                except Exception:
                    jd_errors += 1

    res_synced = 0
    res_dupes = 0
    res_errors = 0

    if resumes_dir.exists():
        for path in resumes_dir.glob("*"):
            if path.is_file() and not path.name.startswith("."):
                try:
                    content = path.read_bytes()
                    doc, is_dup, _ = store_document(
                        content=content,
                        original_filename=path.name,
                        doc_type="resume",
                        db=db,
                    )
                    if is_dup:
                        res_dupes += 1
                    else:
                        res_synced += 1
                except Exception:
                    res_errors += 1

    total_jds = db.scalar(select(func.count(JobDescriptionDocument.id))) or 0
    total_resumes = db.scalar(select(func.count(ResumeDocument.id))) or 0

    return RepositorySyncResponse(
        message="Local data files synchronized successfully with Document Repository.",
        jds_synced=jd_synced,
        jds_duplicates=jd_dupes,
        jds_errors=jd_errors,
        resumes_synced=res_synced,
        resumes_duplicates=res_dupes,
        resumes_errors=res_errors,
        total_jds=total_jds,
        total_resumes=total_resumes,
    )


# ============================================================================
# JOB DESCRIPTIONS REPOSITORY
# ============================================================================

@router.post(
    "/jds/upload",
    response_model=UploadSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a Single Job Description",
    description="Uploads, verifies, and stores an individual Job Description document (.pdf, .docx, .txt).",
)
async def upload_single_jd(
    file: UploadFile = File(..., description="Job Description file"),
    db: Session = Depends(get_db),
) -> UploadSingleResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided.")

    content = await file.read()
    try:
        doc, is_duplicate, _ = store_document(
            content=content,
            original_filename=file.filename,
            doc_type="jd",
            db=db,
        )
        msg = "Document already indexed (duplicate detected via SHA-256)" if is_duplicate else "Job description stored successfully"
        return UploadSingleResponse(
            success=True,
            is_duplicate=is_duplicate,
            message=msg,
            document=DocumentItem.model_validate(doc),
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Storage error: {exc}")


@router.post(
    "/jds/bulk-upload",
    response_model=BulkUploadResponse,
    summary="Bulk Upload Job Descriptions",
    description="Uploads and ingests multiple Job Description files with per-file result tracking.",
)
async def bulk_upload_jds(
    files: List[UploadFile] = File(..., description="Multiple Job Description files"),
    db: Session = Depends(get_db),
) -> BulkUploadResponse:
    results: List[BulkUploadItemResult] = []
    successful = 0
    duplicates = 0
    failed = 0

    for file in files:
        fname = file.filename or "unnamed"
        try:
            content = await file.read()
            doc, is_duplicate, _ = store_document(
                content=content,
                original_filename=fname,
                doc_type="jd",
                db=db,
            )
            if is_duplicate:
                duplicates += 1
                results.append(BulkUploadItemResult(
                    filename=fname,
                    success=True,
                    is_duplicate=True,
                    doc_id=doc.doc_id,
                    message="Duplicate document (SHA-256 match)",
                ))
            else:
                successful += 1
                results.append(BulkUploadItemResult(
                    filename=fname,
                    success=True,
                    is_duplicate=False,
                    doc_id=doc.doc_id,
                    message="Ingested successfully",
                ))
        except Exception as exc:
            failed += 1
            results.append(BulkUploadItemResult(
                filename=fname,
                success=False,
                is_duplicate=False,
                doc_id=None,
                message="Failed to ingest",
                error=str(exc),
            ))

    return BulkUploadResponse(
        total_files=len(files),
        successful_count=successful,
        duplicate_count=duplicates,
        failed_count=failed,
        results=results,
    )


@router.get(
    "/jds",
    response_model=PaginatedDocumentsResponse,
    summary="List Uploaded Job Descriptions",
    description="Lists and searches stored Job Description documents.",
)
def list_uploaded_jds(
    search: Optional[str] = Query(None, description="Search term for filename or extracted text"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedDocumentsResponse:
    query = select(JobDescriptionDocument)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                JobDescriptionDocument.original_filename.ilike(pattern),
                JobDescriptionDocument.doc_id.ilike(pattern),
                JobDescriptionDocument.raw_text.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.order_by(JobDescriptionDocument.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return PaginatedDocumentsResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[DocumentItem.model_validate(item) for item in items],
    )


@router.get(
    "/jds/{doc_id}",
    response_model=DocumentItem,
    summary="Get Job Description Document Details",
)
def get_jd_document(doc_id: str, db: Session = Depends(get_db)) -> DocumentItem:
    stmt = select(JobDescriptionDocument).where(JobDescriptionDocument.doc_id == doc_id)
    doc = db.scalar(stmt)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description document not found")
    return DocumentItem.model_validate(doc)


@router.delete(
    "/jds/{doc_id}",
    response_model=DeleteDocumentResponse,
    summary="Delete a Job Description Document",
    description="Safely removes a Job Description from both database and physical filesystem.",
)
def delete_jd_document(doc_id: str, db: Session = Depends(get_db)) -> DeleteDocumentResponse:
    deleted = delete_stored_document(doc_id, doc_type="jd", db=db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description document not found")
    return DeleteDocumentResponse(
        success=True,
        message="Job description document deleted successfully from database and filesystem.",
        doc_id=doc_id,
    )


# ============================================================================
# CANDIDATE RESUMES REPOSITORY
# ============================================================================

@router.post(
    "/resumes/upload",
    response_model=UploadSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a Single Candidate Resume",
    description="Uploads, verifies, and stores an individual Candidate Resume document (.pdf, .docx, .txt).",
)
async def upload_single_resume(
    file: UploadFile = File(..., description="Resume file"),
    db: Session = Depends(get_db),
) -> UploadSingleResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided.")

    content = await file.read()
    try:
        doc, is_duplicate, _ = store_document(
            content=content,
            original_filename=file.filename,
            doc_type="resume",
            db=db,
        )
        msg = "Document already indexed (duplicate detected via SHA-256)" if is_duplicate else "Resume stored successfully"
        return UploadSingleResponse(
            success=True,
            is_duplicate=is_duplicate,
            message=msg,
            document=DocumentItem.model_validate(doc),
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Storage error: {exc}")


@router.post(
    "/resumes/bulk-upload",
    response_model=BulkUploadResponse,
    summary="Bulk Upload Candidate Resumes",
    description="Uploads and ingests multiple Candidate Resume files (supports 200+ resumes) with individual tracking.",
)
async def bulk_upload_resumes(
    files: List[UploadFile] = File(..., description="Multiple Resume files"),
    db: Session = Depends(get_db),
) -> BulkUploadResponse:
    results: List[BulkUploadItemResult] = []
    successful = 0
    duplicates = 0
    failed = 0

    for file in files:
        fname = file.filename or "unnamed"
        try:
            content = await file.read()
            doc, is_duplicate, _ = store_document(
                content=content,
                original_filename=fname,
                doc_type="resume",
                db=db,
            )
            if is_duplicate:
                duplicates += 1
                results.append(BulkUploadItemResult(
                    filename=fname,
                    success=True,
                    is_duplicate=True,
                    doc_id=doc.doc_id,
                    message="Duplicate document (SHA-256 match)",
                ))
            else:
                successful += 1
                results.append(BulkUploadItemResult(
                    filename=fname,
                    success=True,
                    is_duplicate=False,
                    doc_id=doc.doc_id,
                    message="Ingested successfully",
                ))
        except Exception as exc:
            failed += 1
            results.append(BulkUploadItemResult(
                filename=fname,
                success=False,
                is_duplicate=False,
                doc_id=None,
                message="Failed to ingest",
                error=str(exc),
            ))

    return BulkUploadResponse(
        total_files=len(files),
        successful_count=successful,
        duplicate_count=duplicates,
        failed_count=failed,
        results=results,
    )


@router.get(
    "/resumes",
    response_model=PaginatedDocumentsResponse,
    summary="List Uploaded Candidate Resumes",
    description="Lists and searches stored Candidate Resume documents.",
)
def list_uploaded_resumes(
    search: Optional[str] = Query(None, description="Search term for filename or extracted text"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedDocumentsResponse:
    query = select(ResumeDocument)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                ResumeDocument.original_filename.ilike(pattern),
                ResumeDocument.doc_id.ilike(pattern),
                ResumeDocument.raw_text.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.order_by(ResumeDocument.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return PaginatedDocumentsResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[DocumentItem.model_validate(item) for item in items],
    )


@router.get(
    "/resumes/{doc_id}",
    response_model=DocumentItem,
    summary="Get Resume Document Details",
)
def get_resume_document(doc_id: str, db: Session = Depends(get_db)) -> DocumentItem:
    stmt = select(ResumeDocument).where(ResumeDocument.doc_id == doc_id)
    doc = db.scalar(stmt)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume document not found")
    return DocumentItem.model_validate(doc)


@router.delete(
    "/resumes/{doc_id}",
    response_model=DeleteDocumentResponse,
    summary="Delete a Resume Document",
    description="Safely removes a Resume from both database and physical filesystem.",
)
def delete_resume_document(doc_id: str, db: Session = Depends(get_db)) -> DeleteDocumentResponse:
    deleted = delete_stored_document(doc_id, doc_type="resume", db=db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume document not found")
    return DeleteDocumentResponse(
        success=True,
        message="Resume document deleted successfully from database and filesystem.",
        doc_id=doc_id,
    )
