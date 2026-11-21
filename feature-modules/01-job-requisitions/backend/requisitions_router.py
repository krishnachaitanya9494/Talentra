import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Standalone FastAPI Router for Module 01: Job Requisitions.
Mountable in any FastAPI application via:
    app.include_router(router, prefix="/api/v1/job-requisitions", tags=["Job Requisitions"])
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from contracts.requisitions_schemas import (
    RequisitionCreateSchema,
    RequisitionUpdateSchema,
    RequisitionResponseSchema,
    ValidationResultSchema,
)
from backend.requisitions_service import JobRequisitionService

router = APIRouter()
service = JobRequisitionService()

# In-memory storage fallback for standalone execution
_IN_MEMORY_REQS = [
    {
        "id": 1,
        "req_code": "JD-001",
        "title": "Oracle EPM / Hyperion Planning Consultant",
        "department": "Engineering & Delivery",
        "location": "Hyderabad / Remote",
        "experience_level": "5 - 8 Years",
        "skills": "Oracle EPM, PBCS, Hyperion, Essbase",
        "description": "Looking for an experienced Oracle EPM Consultant to implement PBCS and Hyperion applications.",
        "status": "open",
    },
    {
        "id": 2,
        "req_code": "JD-002",
        "title": "Siemens Teamcenter PLM Consultant / Engineer",
        "department": "PLM & Industrial Systems",
        "location": "Bangalore / Hybrid",
        "experience_level": "5 - 8 Years",
        "skills": "Siemens Teamcenter, PLM, Active Workspace, BMIDE",
        "description": "Seeking a Siemens Teamcenter PLM specialist to manage CAD/BOM workflows and schema configuration.",
        "status": "open",
    }
]

@router.get("", response_model=List[RequisitionResponseSchema])
def list_requisitions(status: Optional[str] = None):
    """List all job requisitions, optionally filtered by status."""
    if status and status.lower() != "all":
        return [r for r in _IN_MEMORY_REQS if r["status"].lower() == status.lower()]
    return _IN_MEMORY_REQS

@router.get("/{req_id}", response_model=RequisitionResponseSchema)
def get_requisition(req_id: int):
    """Retrieve single requisition by ID."""
    match = next((r for r in _IN_MEMORY_REQS if r["id"] == req_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return match

@router.get("/{req_id}/structured")
def get_structured_specs(req_id: int):
    """Get 10-section canonical breakdown for a requisition."""
    match = next((r for r in _IN_MEMORY_REQS if r["id"] == req_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return service.build_structured_specs(match)

@router.get("/{req_id}/validation", response_model=ValidationResultSchema)
def validate_requisition(req_id: int):
    """Deterministic validation score and issue breakdown."""
    match = next((r for r in _IN_MEMORY_REQS if r["id"] == req_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return service.validate_requisition(match)

@router.put("/{req_id}", response_model=RequisitionResponseSchema)
def update_requisition(req_id: int, payload: RequisitionUpdateSchema):
    """Update requisition specifications."""
    match = next((r for r in _IN_MEMORY_REQS if r["id"] == req_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Requisition not found")
    data = payload.dict(exclude_unset=True)
    match.update(data)
    return match
