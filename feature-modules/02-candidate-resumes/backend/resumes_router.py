import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Standalone FastAPI Router for Module 02: Candidate Resumes.
Mountable in any FastAPI application via:
    app.include_router(router, prefix="/api/v1/candidate-resumes", tags=["Candidate Resumes"])
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional
from contracts.resumes_schemas import CandidateItemSchema, UploadResumeResultSchema, BulkUploadResultSchema
from backend.resumes_service import CandidateResumeService

router = APIRouter()
service = CandidateResumeService()

_IN_MEMORY_CANDIDATES = [
    {
        "id": 133,
        "name": "Lavanya Gudibanda",
        "email": "lavanya.gudibanda@example.com",
        "phone": "+91 98480 12345",
        "current_role": "Senior Oracle Cloud EPM / FCCS Consultant",
        "experience_years": 7.2,
        "skills": ["Oracle EPM", "PBCS", "Hyperion", "Essbase", "Financial Consolidation"],
        "location": "Bangalore, India",
        "status": "active",
        "resume_file": "lavanya_gudibanda_resume.pdf"
    },
    {
        "id": 41,
        "name": "Laxmikant Reddy",
        "email": "laxmikant.reddy@example.com",
        "phone": "+91 99890 54321",
        "current_role": "Senior Siemens Teamcenter PLM Specialist",
        "experience_years": 5.2,
        "skills": ["Siemens Teamcenter", "PLM", "BMIDE", "Active Workspace"],
        "location": "Hyderabad, India",
        "status": "active",
        "resume_file": "laxmikant_reddy_resume.pdf"
    }
]

@router.get("", response_model=List[CandidateItemSchema])
def list_candidates(search: Optional[str] = None):
    """List candidate resumes with optional keyword search."""
    if search:
        q = search.lower()
        return [
            c for c in _IN_MEMORY_CANDIDATES
            if q in c["name"].lower() or any(q in s.lower() for s in c["skills"])
        ]
    return _IN_MEMORY_CANDIDATES

@router.post("/upload", response_model=UploadResumeResultSchema)
async def upload_single_resume(file: UploadFile = File(...)):
    """Upload and validate an individual resume document."""
    content = await file.read()
    return service.validate_and_deduplicate(file.filename, content)

@router.post("/bulk-upload", response_model=BulkUploadResultSchema)
async def upload_bulk_resumes(files: List[UploadFile] = File(...)):
    """Bulk upload and deduplicate multiple resume documents."""
    results = []
    dup_count = 0
    success_count = 0

    for f in files:
        content = await f.read()
        res = service.validate_and_deduplicate(f.filename, content)
        results.append(res)
        if res.is_duplicate:
            dup_count += 1
        elif res.status == "success":
            success_count += 1

    return BulkUploadResultSchema(
        total_files=len(files),
        successful_uploads=success_count,
        duplicates_detected=dup_count,
        items=results
    )
