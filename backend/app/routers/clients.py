"""
Clients and Accounts API Router for TALENTRA.

Provides HTTP endpoints for:
- Listing corporate client accounts with requisition and candidate pipeline metrics
- Client detail inspection including active vs closed job requisitions
- Creating client accounts
- Full relational mapping to JobRequirement and CandidateSubmission entities
"""

import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.client import Client
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.submission import CandidateSubmission

router = APIRouter(prefix="/api/v1/clients", tags=["Clients & Accounts"])


class CreateClientRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Client company name.")
    industry: Optional[str] = Field(None, description="Industry sector (e.g. Technology, Finance, Healthcare).")
    website: Optional[str] = Field(None, description="Corporate website URL.")
    contact_name: Optional[str] = Field(None, description="Primary hiring contact name.")
    contact_email: Optional[str] = Field(None, description="Primary hiring contact email.")
    contact_phone: Optional[str] = Field(None, description="Direct phone contact.")
    status: str = Field("active", description="Account status: active, onboarding, inactive.")
    billing_address: Optional[str] = Field(None, description="Billing address.")


@router.get("")
def list_clients(
    status_filter: Optional[str] = Query(None, description="Filter by status: active, inactive, onboarding"),
    search: Optional[str] = Query(None, description="Search client name or industry"),
    db: Session = Depends(get_db),
):
    """
    Returns corporate client accounts with real-time operational statistics:
    - total JDs sponsored
    - active JDs
    - candidate submissions pipeline
    """
    query = db.query(Client)

    if status_filter:
        query = query.filter(Client.status == status_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Client.name.ilike(search_pattern))
            | (Client.industry.ilike(search_pattern))
            | (Client.client_code.ilike(search_pattern))
        )

    clients = query.order_by(Client.name.asc()).all()

    items = []
    for c in clients:
        jds = c.job_requirements or []
        total_jds = len(jds)
        active_jds = sum(1 for j in jds if j.status.lower() in ("open", "active"))
        
        # Count submissions across client JDs
        jd_ids = [j.id for j in jds]
        total_submissions = 0
        if jd_ids:
            total_submissions = (
                db.query(CandidateSubmission)
                .filter(CandidateSubmission.job_requirement_id.in_(jd_ids))
                .count()
            )

        items.append({
            "id": c.id,
            "client_code": c.client_code,
            "name": c.name,
            "industry": c.industry,
            "website": c.website,
            "contact_name": c.contact_name,
            "contact_email": c.contact_email,
            "contact_phone": c.contact_phone,
            "status": c.status,
            "total_jds": total_jds,
            "active_jds": active_jds,
            "total_submissions": total_submissions,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    return {"status": "success", "total": len(items), "clients": items}


@router.get("/{client_id}")
def get_client_detail(
    client_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns complete client profile with associated Job Requirements and candidate pipeline.
    """
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found.")

    jds = c.job_requirements or []
    jd_list = []
    for j in jds:
        sub_count = db.query(CandidateSubmission).filter(CandidateSubmission.job_requirement_id == j.id).count()
        jd_list.append({
            "id": j.id,
            "req_code": j.req_code,
            "title": j.title,
            "department": j.department,
            "domain": j.domain,
            "experience_min": j.experience_min,
            "experience_max": j.experience_max,
            "location": j.location,
            "status": j.status,
            "open_positions": j.open_positions,
            "submissions_count": sub_count,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        })

    return {
        "status": "success",
        "client": {
            "id": c.id,
            "client_code": c.client_code,
            "name": c.name,
            "industry": c.industry,
            "website": c.website,
            "contact_name": c.contact_name,
            "contact_email": c.contact_email,
            "contact_phone": c.contact_phone,
            "status": c.status,
            "billing_address": c.billing_address,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "job_requirements": jd_list,
        },
    }


@router.post("")
def create_client(
    payload: CreateClientRequest,
    db: Session = Depends(get_db),
):
    """
    Registers a new client corporate account.
    """
    existing = db.query(Client).filter(Client.name.ilike(payload.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Client '{payload.name}' already exists.")

    prefix = "".join(w[0] for w in payload.name.split() if w)[:4].upper()
    if not prefix:
        prefix = "CLI"
    client_code = f"CLI-{prefix}-{uuid.uuid4().hex[:4].upper()}"

    client = Client(
        client_code=client_code,
        name=payload.name,
        industry=payload.industry,
        website=payload.website,
        contact_name=payload.contact_name,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        status=payload.status,
        billing_address=payload.billing_address,
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    return {
        "status": "success",
        "client": {
            "id": client.id,
            "client_code": client.client_code,
            "name": client.name,
            "industry": client.industry,
            "status": client.status,
        },
    }
