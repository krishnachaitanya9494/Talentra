import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Standalone FastAPI Router for Module 05: JD-Based Candidate Sourcing & Excel Engine.
Mountable in any FastAPI application via:
    app.include_router(router, prefix="/api/v1/sourcing", tags=["Sourcing & Excel"])
"""

from fastapi import APIRouter, HTTPException, Response
from typing import List
from contracts.sourcing_schemas import (
    SourcingSearchFilter,
    SourcingSearchResponse,
    ExcelExportRequest,
    ExportHistoryItem,
)
from backend.sourcing_service import SourcingExcelService

router = APIRouter()
service = SourcingExcelService()

_INTERNAL_POOL = [
    {"id": 133, "name": "Lavanya Gudibanda", "email": "lavanya.g@internal.com", "phone": "+91 98480 12345", "current_role": "Senior Oracle Cloud EPM / FCCS", "experience_years": 7.2, "skills": ["Oracle EPM", "PBCS", "Hyperion", "Essbase"], "location": "Bangalore, India"},
    {"id": 41, "name": "Laxmikant Reddy", "email": "laxmikant.r@internal.com", "phone": "+91 99890 54321", "current_role": "Senior Siemens Teamcenter PLM", "experience_years": 5.2, "skills": ["Siemens Teamcenter", "PLM", "BMIDE"], "location": "Hyderabad, India"},
    {"id": 51, "name": "Chandan Bhat", "email": "chandan.b@internal.com", "phone": "+91 97410 98765", "current_role": "Senior Technical Consultant", "experience_years": 7.0, "skills": ["SAP PS", "PMO", "Financial Controlling"], "location": "Bangalore, India"},
]

_EXPORT_HISTORY = []

@router.post("/search", response_model=SourcingSearchResponse)
def search_candidates(payload: SourcingSearchFilter):
    """Search internal candidates using Boolean queries and experience filters."""
    return service.search_internal_candidates(
        candidates_pool=_INTERNAL_POOL,
        boolean_query=payload.boolean_query,
        exp_min=payload.experience_min,
        exp_max=payload.experience_max,
    )

@router.post("/export-excel")
def export_excel(payload: ExcelExportRequest):
    """Generate and return structured Excel workbook for sourced candidates."""
    search_res = service.search_internal_candidates(candidates_pool=_INTERNAL_POOL)
    selected = [c for c in search_res.candidates if not payload.candidate_ids or c.id in payload.candidate_ids]
    excel_bytes = service.generate_excel_workbook(selected)

    filename = f"{payload.export_title or 'Sourced_Candidates'}.xlsx"
    _EXPORT_HISTORY.append({
        "id": len(_EXPORT_HISTORY) + 1,
        "filename": filename,
        "record_count": len(selected),
        "created_at": "Just now",
        "download_url": f"/api/v1/sourcing/export-download/{filename}",
    })

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export-history", response_model=List[ExportHistoryItem])
def get_export_history():
    """Retrieve audit history of generated Excel exports."""
    return [ExportHistoryItem(**item) for item in _EXPORT_HISTORY]
