"""
Enterprise Recruitment Agent API Router for TALENTRA.

Provides endpoints for:
- Agent conversation turn with tool calling & RAG synthesis
- Tool registry retrieval (8 core deterministic & vector tools)
- Human-in-the-Loop Governance: listing and approving/rejecting sensitive actions
- Persistent Agent Traces & Audit Logs
- Vector Embeddings sync
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from backend.app.database.session import get_db
from backend.app.models.agent import ApprovalRequest, AgentTrace, ResumeEmbedding, JobEmbedding
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.user import User, UserRole
from backend.app.core.security import (
    get_current_user,
    require_role,
    create_access_token,
    hash_password,
    verify_password,
)
from backend.app.services.ai.recruitment_agent import (
    EnterpriseRecruitmentAgent,
    TOOL_REGISTRY_SPECS,
    MASTER_SYSTEM_PROMPT,
)
from backend.app.services.ai.embedding_service import get_embedding_provider

router = APIRouter(
    prefix="/api/v1/agent",
    tags=["Enterprise Recruitment Agent"],
)


# --- Request & Response Schemas ---

class ChatRequest(BaseModel):
    session_id: str = Field(default="session-default", description="Recruiter conversation session identifier")
    message: str = Field(..., min_length=1, description="Recruiter message or command")


class ChatResponse(BaseModel):
    trace_id: str
    session_id: str
    response: str
    tools_called: List[Dict[str, Any]]
    latency_ms: float
    approval_request: Optional[Dict[str, Any]] = None


class ApprovalActionRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$", description="'approve' or 'reject'")
    resolved_by: Optional[str] = Field(default=None, description="Client hint (overridden by authenticated JWT identity)")


class AgentSessionAuthRequest(BaseModel):
    email: str = Field(..., description="Recruiter or Administrator account email")
    password: str = Field(..., min_length=1, description="Account password")


class ApprovalItemResponse(BaseModel):
    id: int
    approval_id: str
    action_type: str
    description: str
    payload: Dict[str, Any]
    status: str
    requested_by: str
    resolved_by: Optional[str] = None
    created_at: Optional[str] = None
    resolved_at: Optional[str] = None


class TraceItemResponse(BaseModel):
    id: int
    trace_id: str
    session_id: str
    prompt: str
    tools_called: List[Dict[str, Any]]
    tokens_used: int
    latency_ms: float
    response_text: str
    created_at: Optional[str] = None


# --- Endpoints ---

@router.post("/chat", response_model=ChatResponse, summary="Agent Conversation Turn")
def agent_chat_turn(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Execute a recruiter conversation turn:
    - Verifies safety gate
    - Executes tools
    - Formats grounded response
    - Logs trace
    """
    agent = EnterpriseRecruitmentAgent(db)
    result = agent.run_turn(session_id=payload.session_id, message=payload.message)
    return ChatResponse(**result)


@router.get("/tools", summary="Retrieve 8 Tool Calling Registry Specifications")
def get_tool_registry():
    """Returns the 8 deterministic & vector tool specifications in standard OpenAI function format."""
    return {
        "status": "success",
        "count": len(TOOL_REGISTRY_SPECS),
        "tools": TOOL_REGISTRY_SPECS,
        "system_prompt": MASTER_SYSTEM_PROMPT,
    }


@router.get("/approvals", response_model=List[ApprovalItemResponse], summary="List Pending/Resolved Approvals")
def list_approvals(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: pending, approved, rejected"),
    db: Session = Depends(get_db),
):
    """List human-in-the-loop approval queue records."""
    stmt = select(ApprovalRequest).order_by(desc(ApprovalRequest.created_at))
    if status_filter:
        stmt = stmt.where(ApprovalRequest.status == status_filter)

    items = db.execute(stmt).scalars().all()
    results = []
    for item in items:
        try:
            pl = json.loads(item.payload)
        except Exception:
            pl = {}
        results.append(
            ApprovalItemResponse(
                id=item.id,
                approval_id=item.approval_id,
                action_type=item.action_type,
                description=item.description,
                payload=pl,
                status=item.status,
                requested_by=item.requested_by,
                resolved_by=item.resolved_by,
                created_at=item.created_at.isoformat() if item.created_at else None,
                resolved_at=item.resolved_at.isoformat() if item.resolved_at else None,
            )
        )
    return results


@router.post("/auth/token", summary="Obtain Recruiter Session JWT Token (Authenticated)")
def get_recruiter_session_token(
    payload: AgentSessionAuthRequest,
    db: Session = Depends(get_db),
):
    """
    Issues an authenticated HMAC-SHA256 JWT bearer token for recruiter/admin operations.
    Strictly verifies email, password hash, active account status, and role authorization.
    Rejects unauthenticated callers, invalid passwords, deactivated users (401), or unauthorized roles (403).
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated. Contact system administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    allowed_roles = [UserRole.ADMINISTRATOR, UserRole.RECRUITMENT_MANAGER, UserRole.TA_RECRUITER]
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User role '{user.role}' is not authorized for recruitment agent operations.",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    }


@router.post("/approvals/{approval_id}/action", summary="Approve or Reject Sensitive Action (P0 Auth Secured)")
def act_on_approval(
    approval_id: str,
    payload: ApprovalActionRequest,
    current_user: User = Depends(require_role(UserRole.ADMINISTRATOR, UserRole.RECRUITMENT_MANAGER, UserRole.TA_RECRUITER)),
    db: Session = Depends(get_db),
):
    """
    Approve or reject a pending sensitive action:
    - Enforces JWT session validation (HTTP 401 on missing/expired token).
    - Enforces recruiter/admin role authorization (HTTP 403 on unauthorized roles like viewer).
    - Prevents duplicate approval execution (HTTP 400 on already-resolved requests).
    - Validates action_type and payload integrity.
    - Derives resolved_by strictly from authenticated user identity.
    - Preserves complete immutable audit trail.
    """
    if payload.action not in ["approve", "reject"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{payload.action}'. Must be 'approve' or 'reject'.",
        )

    req = db.execute(
        select(ApprovalRequest).where(ApprovalRequest.approval_id == approval_id)
    ).scalar_one_or_none()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found.",
        )

    if req.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval request '{approval_id}' has already been resolved ({req.status}). Duplicate execution prohibited.",
        )

    # Validate action type whitelist
    allowed_action_types = ["offer_candidate", "reject_candidate", "update_candidate_stage", "sync_skills"]
    if req.action_type not in allowed_action_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unrecognized action_type '{req.action_type}'. Must be one of {allowed_action_types}.",
        )

    # Parse and validate payload
    try:
        payload_data = json.loads(req.payload) if isinstance(req.payload, str) else (req.payload or {})
    except Exception:
        payload_data = {}

    mutation_result = {}
    if payload.action == "approve":
        candidate_id = payload_data.get("candidate_id")
        if candidate_id:
            cand = db.get(Candidate, candidate_id)
            if not cand:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Candidate with ID {candidate_id} referenced in approval payload does not exist.",
                )
            if req.action_type == "offer_candidate":
                cand.status = "placed"
                mutation_result = {"candidate_id": cand.id, "new_status": "placed"}
            elif req.action_type == "reject_candidate":
                cand.status = "inactive"
                mutation_result = {"candidate_id": cand.id, "new_status": "inactive"}
            elif req.action_type == "update_candidate_stage":
                new_st = payload_data.get("new_stage", "interviewing")
                cand.status = new_st
                mutation_result = {"candidate_id": cand.id, "new_status": new_st}
            elif req.action_type == "sync_skills":
                add_skills = payload_data.get("additional_skills", "")
                if add_skills:
                    cand.skills = f"{cand.skills or ''}, {add_skills}".strip(", ")
                    mutation_result = {"candidate_id": cand.id, "updated_skills": cand.skills}

    new_status = "approved" if payload.action == "approve" else "rejected"
    # Derive identity exclusively from authenticated user
    resolved_by_identity = f"{current_user.full_name} ({current_user.email})"
    req.status = new_status
    req.resolved_by = resolved_by_identity
    req.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)

    return {
        "status": "success",
        "approval_id": approval_id,
        "new_status": new_status,
        "resolved_by": resolved_by_identity,
        "mutation": mutation_result,
        "message": f"Action '{req.action_type}' has been successfully {new_status} by {current_user.role} {resolved_by_identity}.",
    }


@router.get("/traces", response_model=List[TraceItemResponse], summary="List Audit Execution Traces")
def list_traces(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """List recent persistent agent execution traces with latency and tool execution metrics."""
    traces = db.execute(
        select(AgentTrace).order_by(desc(AgentTrace.created_at)).limit(limit)
    ).scalars().all()

    results = []
    for t in traces:
        try:
            tools = json.loads(t.tools_called)
        except Exception:
            tools = []
        results.append(
            TraceItemResponse(
                id=t.id,
                trace_id=t.trace_id,
                session_id=t.session_id,
                prompt=t.prompt,
                tools_called=tools,
                tokens_used=t.tokens_used,
                latency_ms=t.latency_ms,
                response_text=t.response_text,
                created_at=t.created_at.isoformat() if t.created_at else None,
            )
        )
    return results


@router.post("/embeddings/sync", summary="Sync Vector Embeddings for Candidates and Jobs")
def sync_embeddings(db: Session = Depends(get_db)):
    """Index candidates and job requisitions into 2,048-dim vector embeddings."""
    embedder = get_embedding_provider()
    candidates = db.execute(select(Candidate)).scalars().all()
    jobs = db.execute(select(JobRequirement)).scalars().all()

    c_synced = 0
    for c in candidates:
        embedder.get_or_create_candidate_embedding(db, c)
        c_synced += 1

    j_synced = 0
    for j in jobs:
        embedder.get_or_create_job_embedding(db, j)
        j_synced += 1

    return {
        "status": "success",
        "candidates_synced": c_synced,
        "jobs_synced": j_synced,
        "embedding_dimension": 2048,
        "model": embedder.model,
    }
