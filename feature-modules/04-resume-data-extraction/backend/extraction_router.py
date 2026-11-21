import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Standalone FastAPI Router for Module 04: Resume Data Extraction.
Mountable in any FastAPI application via:
    app.include_router(router, prefix="/api/v1/scraper", tags=["Resume Extraction"])
"""

import uuid
from io import StringIO
import csv
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from typing import List
from contracts.extraction_schemas import BatchExtractionJobResponse, ExtractedCandidateRecordSchema
from backend.extraction_service import ResumeExtractionService

router = APIRouter()
service = ResumeExtractionService()

_EXTRACTION_JOBS = {}

@router.post("/upload-batch", response_model=BatchExtractionJobResponse)
async def upload_batch(files: List[UploadFile] = File(...)):
    """Upload multiple resumes and execute deterministic data extraction."""
    job_id = str(uuid.uuid4())[:8]
    records = []

    for f in files:
        content = await f.read()
        try:
            text = content.decode("utf-8", errors="ignore")
        except Exception:
            text = ""
        rec = service.parse_resume_text(f.filename, text)
        records.append(rec)

    job_data = {
        "job_id": job_id,
        "status": "completed",
        "total_files": len(files),
        "processed_count": len(files),
        "records": records,
    }
    _EXTRACTION_JOBS[job_id] = job_data
    return BatchExtractionJobResponse(**job_data)

@router.get("/batch-status/{job_id}", response_model=BatchExtractionJobResponse)
def get_status(job_id: str):
    """Check batch extraction status."""
    if job_id not in _EXTRACTION_JOBS:
        raise HTTPException(status_code=404, detail="Batch job not found")
    return BatchExtractionJobResponse(**_EXTRACTION_JOBS[job_id])

@router.get("/batch-results/{job_id}", response_model=BatchExtractionJobResponse)
def get_results(job_id: str):
    """Retrieve extracted records for a batch."""
    if job_id not in _EXTRACTION_JOBS:
        raise HTTPException(status_code=404, detail="Batch job not found")
    return BatchExtractionJobResponse(**_EXTRACTION_JOBS[job_id])

@router.get("/export/{job_id}")
def export_batch(job_id: str, format: str = "csv"):
    """Export extracted candidate records to CSV or Excel with clean columns."""
    if job_id not in _EXTRACTION_JOBS:
        raise HTTPException(status_code=404, detail="Batch job not found")
    records = _EXTRACTION_JOBS[job_id]["records"]

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Phone Number", "Mail ID", "Location", "Experience (Years)", "Primary Skills"])
    for r in records:
        writer.writerow([
            r.name or "",
            r.phone or "",
            r.email or "",
            r.location or "",
            r.total_experience_years if r.total_experience_years is not None else "",
            ", ".join(r.skills) if r.skills else "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=extracted_candidates_{job_id}.csv"}
    )
