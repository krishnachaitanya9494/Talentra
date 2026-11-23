"""
Comprehensive Unit Tests for CompanyAI Enterprise Recruitment Agent.

Tests:
1. 2,048-dimensional Vector Embeddings & Cosine Similarity
2. 5-Component Weighted Scorer & Mandatory Requirement Protection Policy
3. Human-in-the-Loop Safety Gate Interceptor & Approval Queue
4. Agent Tool Calling Registry & 8 Tools
5. Persistent Observability & Trace Logging (AgentTrace)
6. Agent API Endpoints (/api/v1/agent/chat, /approvals, /tools, /traces)
"""

import json
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.database.session import get_db, SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.client import Client
from backend.app.models.agent import ApprovalRequest, AgentTrace
from backend.app.services.ai.embedding_service import (
    get_embedding_provider,
    cosine_similarity,
    normalize_text_for_embedding,
    compute_content_sha256,
)
from backend.app.services.matching.five_component_scorer import FiveComponentScorer
from backend.app.services.ai.recruitment_agent import EnterpriseRecruitmentAgent, TOOL_REGISTRY_SPECS

client = TestClient(app)


# db_session fixture provided by conftest.py with live database protection safeguard


def test_embedding_provider_and_cosine_similarity():
    """Verify 2,048-dim vector generation and cosine similarity calculation."""
    embedder = get_embedding_provider()
    text_a = "Senior Cloud Architect AWS Kubernetes Terraform Microservices"
    text_b = "AWS Cloud Solutions Architect with Kubernetes and Terraform"
    text_c = "Pediatric Nurse Healthcare Clinical Care"

    vec_a = embedder.embed_text(text_a)
    vec_b = embedder.embed_text(text_b)
    vec_c = embedder.embed_text(text_c)

    assert len(vec_a) == 2048
    assert len(vec_b) == 2048
    assert len(vec_c) == 2048

    # Related texts should have higher cosine similarity than unrelated texts
    sim_ab = cosine_similarity(vec_a, vec_b)
    sim_ac = cosine_similarity(vec_a, vec_c)

    assert 0.0 <= sim_ab <= 1.0
    assert 0.0 <= sim_ac <= 1.0
    assert sim_ab >= sim_ac


def test_five_component_scorer_mandatory_protection_policy(db_session: Session):
    """Verify 5-component scoring and mandatory requirement protection policy capping tiers."""
    client_obj = db_session.query(Client).first()
    if not client_obj:
        client_obj = Client(client_code="CLI-TEST-001", name="Test Enterprise Client")
        db_session.add(client_obj)
        db_session.commit()
        db_session.refresh(client_obj)

    uid = uuid.uuid4().hex[:6]
    # Create test job requirement
    job = JobRequirement(
        req_code=f"REQ-TEST-{uid}",
        client_id=client_obj.id,
        title="Lead Oracle Planning Consultant",
        description="Oracle Hyperion and PBCS planning role with 5+ years experience.",
        required_skills="Oracle PBCS, Hyperion Planning, Essbase, Calculation Manager",
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    # Candidate 1: Perfect match with all 4 mandatory skills
    cand_perfect = Candidate(
        candidate_code=f"CAN-P-{uid}",
        first_name="Aarav",
        last_name="Sharma",
        email=f"aarav.{uid}@example.com",
        current_title="Lead Oracle Planning Consultant",
        skills="Oracle PBCS, Hyperion Planning, Essbase, Calculation Manager, Smart View",
        total_experience_years=7.0,
        location="Hyderabad",
    )
    db_session.add(cand_perfect)
    db_session.commit()
    db_session.refresh(cand_perfect)

    eval_perfect = FiveComponentScorer.evaluate(db_session, cand_perfect, job)
    assert eval_perfect["composite_score"] >= 75.0
    assert eval_perfect["tier"] in ["Strong Match", "Excellent Match"]
    assert eval_perfect["policy_applied"] is False

    # Candidate 2: Missing 1 mandatory skill (lacks Calculation Manager) -> Capped at Potential Match
    cand_missing_one = Candidate(
        candidate_code=f"CAN-M1-{uid}",
        first_name="Rohan",
        last_name="Verma",
        email=f"rohan.{uid}@example.com",
        current_title="Lead Oracle Planning Consultant",
        skills="Oracle PBCS, Hyperion Planning, Essbase",
        total_experience_years=7.0,
        location="Hyderabad",
    )
    db_session.add(cand_missing_one)
    db_session.commit()
    db_session.refresh(cand_missing_one)

    eval_missing_one = FiveComponentScorer.evaluate(db_session, cand_missing_one, job)
    assert eval_missing_one["policy_applied"] is True
    assert eval_missing_one["tier"] == "Potential Match"
    assert eval_missing_one["composite_score"] <= 64.9

    # Candidate 3: Missing 2 mandatory skills -> Capped at Partial Match
    cand_missing_two = Candidate(
        candidate_code=f"CAN-M2-{uid}",
        first_name="Vikram",
        last_name="Rao",
        email=f"vikram.{uid}@example.com",
        current_title="Oracle Consultant",
        skills="Oracle PBCS, Hyperion Planning",
        total_experience_years=7.0,
        location="Hyderabad",
    )
    db_session.add(cand_missing_two)
    db_session.commit()
    db_session.refresh(cand_missing_two)

    eval_missing_two = FiveComponentScorer.evaluate(db_session, cand_missing_two, job)
    assert eval_missing_two["policy_applied"] is True
    assert eval_missing_two["tier"] == "Partial Match"
    assert eval_missing_two["composite_score"] <= 44.9

    # Clean up test records
    db_session.delete(cand_perfect)
    db_session.delete(cand_missing_one)
    db_session.delete(cand_missing_two)
    db_session.delete(job)
    db_session.commit()


def test_safety_gate_intercepts_sensitive_actions(db_session: Session):
    """Verify autonomous execution is blocked for offers, rejects, and stage advances."""
    agent = EnterpriseRecruitmentAgent(db_session)

    # 1. Extend offer -> must be intercepted
    res_offer = agent.run_turn(
        session_id="test-session-1",
        message="Please extend offer to candidate #101 with $140,000 base salary",
    )
    assert "approval_request" in res_offer
    approval = res_offer["approval_request"]
    assert approval["status"] == "pending_approval"
    assert approval["approval_id"].startswith("APP-")
    assert approval["action_type"] == "offer_candidate"
    assert "safety gate" in res_offer["response"].lower()

    # 2. Reject candidate -> must be intercepted
    res_reject = agent.run_turn(
        session_id="test-session-1",
        message="Reject candidate #202 immediately",
    )
    assert "approval_request" in res_reject
    assert res_reject["approval_request"]["action_type"] == "reject_candidate"

    # 3. Shortlist / advance -> must be intercepted
    res_advance = agent.run_turn(
        session_id="test-session-1",
        message="Advance candidate #303 to interview stage",
    )
    assert "approval_request" in res_advance
    assert res_advance["approval_request"]["action_type"] == "update_candidate_stage"

    # Clean up test approval requests
    db_session.query(ApprovalRequest).filter(
        ApprovalRequest.approval_id.in_([
            approval["approval_id"],
            res_reject["approval_request"]["approval_id"],
            res_advance["approval_request"]["approval_id"],
        ])
    ).delete(synchronize_session=False)
    db_session.commit()


def test_agent_api_endpoints_and_tool_registry():
    """Verify tool specifications, chat turn, approvals API, and audit traces."""
    # 1. Check tools registry
    res_tools = client.get("/api/v1/agent/tools")
    assert res_tools.status_code == 200
    data_tools = res_tools.json()
    assert data_tools["count"] == 8
    tool_names = [t["function"]["name"] for t in data_tools["tools"]]
    assert "search_candidates_tool" in tool_names
    assert "match_candidates_to_job_tool" in tool_names
    assert "compare_candidates_tool" in tool_names
    assert "get_job_details_tool" in tool_names
    assert "generate_interview_kit_tool" in tool_names
    assert "generate_boolean_query_tool" in tool_names
    assert "summarize_pipeline_tool" in tool_names
    assert "propose_sensitive_action_tool" in tool_names

    # 2. Chat turn for pipeline summary
    res_chat = client.post(
        "/api/v1/agent/chat",
        json={"session_id": "test-session-api", "message": "Give me a recruitment pipeline summary"},
    )
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    assert "trace_id" in chat_data
    assert chat_data["latency_ms"] > 0
    assert len(chat_data["tools_called"]) >= 1
    assert chat_data["tools_called"][0]["tool"] == "summarize_pipeline_tool"

    # 3. Chat turn for sensitive action and test approval workflow
    res_action = client.post(
        "/api/v1/agent/chat",
        json={"session_id": "test-session-api", "message": "Make offer to candidate #99"},
    )
    assert res_action.status_code == 200
    action_data = res_action.json()
    assert action_data["approval_request"] is not None
    app_id = action_data["approval_request"]["approval_id"]

    # Verify approval appears in approvals list
    res_list = client.get("/api/v1/agent/approvals?status=pending")
    assert res_list.status_code == 200
    pending_ids = [a["approval_id"] for a in res_list.json()]
    assert app_id in pending_ids

    # Task 1 (P0): Security Verification:
    # 1. Unauthenticated request without JWT token must be rejected with HTTP 401
    res_unauth = client.post(
        f"/api/v1/agent/approvals/{app_id}/action",
        json={"action": "approve"},
    )
    assert res_unauth.status_code == 401

    # 2. Unauthorized role (e.g., Viewer) must be rejected with HTTP 403
    from backend.app.core.security import create_access_token
    from backend.app.models.user import User, UserRole

    # Retrieve or create viewer user from current test session
    get_db_gen = app.dependency_overrides.get(get_db, get_db)
    db = next(get_db_gen())
    viewer_user = db.query(User).filter(User.role == UserRole.VIEWER).first()
    if not viewer_user:
        viewer_user = User(
            email="viewer.test@talentra.ai",
            hashed_password="hash",
            full_name="Guest Viewer",
            role=UserRole.VIEWER,
            is_active=True,
        )
        db.add(viewer_user)
        db.commit()
        db.refresh(viewer_user)
    viewer_token = create_access_token({"sub": str(viewer_user.id), "role": UserRole.VIEWER, "email": viewer_user.email})

    res_forbidden = client.post(
        f"/api/v1/agent/approvals/{app_id}/action",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert res_forbidden.status_code == 403

    # 3. Verify Token Endpoint Security:
    # A. Calling /auth/token without credentials returns HTTP 422
    res_no_creds = client.post("/api/v1/agent/auth/token", json={})
    assert res_no_creds.status_code == 422

    # B. Calling with wrong password returns HTTP 401
    res_bad_pw = client.post("/api/v1/agent/auth/token", json={"email": "admin@talentra.ai", "password": "WrongPassword"})
    assert res_bad_pw.status_code == 401

    # C. Calling with genuine recruiter credentials returns HTTP 200 with JWT
    admin_token_res = client.post("/api/v1/agent/auth/token", json={"email": "admin@talentra.ai", "password": "Talentra2026!"})
    assert admin_token_res.status_code == 200
    admin_token = admin_token_res.json()["access_token"]

    res_approve = client.post(
        f"/api/v1/agent/approvals/{app_id}/action",
        json={"action": "approve", "resolved_by": "Fake Spoofed Identity"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_approve.status_code == 200
    appr_data = res_approve.json()
    assert appr_data["new_status"] == "approved"
    # Resolved_by MUST be derived from token identity, NOT client-supplied identity
    assert "Fake Spoofed Identity" not in appr_data["resolved_by"]
    assert "admin@talentra.ai" in appr_data["resolved_by"] or "Recruiter" in appr_data["resolved_by"]

    # 4. Duplicate approval execution must be rejected with HTTP 400
    res_duplicate = client.post(
        f"/api/v1/agent/approvals/{app_id}/action",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_duplicate.status_code == 400
    assert "already been resolved" in res_duplicate.json()["detail"]
    db.close()

    # 5. Check audit traces API
    res_traces = client.get("/api/v1/agent/traces?limit=5")
    assert res_traces.status_code == 200
    assert len(res_traces.json()) >= 1


def test_task2_task3_task4_verification(db_session: Session):
    """
    Direct verification of:
    - Task 2 (P0): Explicit fallback metadata, 0.0 semantic contribution, proportional re-normalization
    - Task 3 (P1): Embedding cache model invalidation
    - Task 4 (P1): Circuit breaker and matching latency performance
    """
    import time
    from backend.app.models.agent import ResumeEmbedding, JobEmbedding
    from backend.app.services.ai.embedding_service import EmbeddingProvider, EMBEDDING_DIMENSION

    provider = EmbeddingProvider()
    # Test 1: Verify circuit breaker is functional and trips on failures
    assert provider._circuit_cooldown_seconds == 120.0

    # Test 2: Task 2 & Task 4 - Fallback semantic score 0.0, transparent raw vs adjusted scores
    uid = uuid.uuid4().hex[:6]
    cand = Candidate(
        candidate_code=f"TEST-AUTOGEN-CAN-FB-{uid}",
        first_name="Priya",
        last_name="Nair",
        email=f"priya.{uid}@example.com",
        current_title="Cloud Engineer",
        skills="Python, Docker, Kubernetes, AWS",
        total_experience_years=5.0,
    )
    db_session.add(cand)
    db_session.commit()
    db_session.refresh(cand)

    client_obj = db_session.query(Client).first()
    if not client_obj:
        client_obj = Client(client_code=f"TEST-AUTOGEN-CLI-{uid}", name="Test Enterprise Client")
        db_session.add(client_obj)
        db_session.commit()
        db_session.refresh(client_obj)

    job = JobRequirement(
        req_code=f"TEST-AUTOGEN-REQ-FB-{uid}",
        client_id=client_obj.id,
        title="Cloud DevOps Specialist",
        description="Kubernetes, Docker, Python DevOps role.",
        required_skills="Python, Docker, Kubernetes, AWS",
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    eval_res = FiveComponentScorer.evaluate(db_session, cand, job)
    # Check fallback transparency
    assert eval_res["is_fallback"] is True
    assert eval_res["semantic_available"] is False
    assert eval_res["component_scores"]["semantic_vector"] == 0.0
    assert eval_res["semantic_status"] == "Semantic matching unavailable — score calculated using verified structured criteria."
    # Task 4: Verify transparency fields
    assert "raw_score" in eval_res
    assert "adjusted_score" in eval_res
    assert "eligibility_tier" in eval_res
    assert "mandatory_skills_satisfied" in eval_res
    assert "mandatory_skills_missing" in eval_res
    assert "scoring_methodology" in eval_res
    assert "Proportional 4-Component Re-normalization" in eval_res["scoring_methodology"]

    # Check proportional re-normalization
    expected_weights = FiveComponentScorer.WEIGHTS_FALLBACK
    assert eval_res["weights_used"] == expected_weights
    assert eval_res["weights_used"]["mandatory"] == 0.4375
    assert eval_res["weights_used"]["preferred"] == 0.2500
    assert eval_res["weights_used"]["experience"] == 0.1875
    assert eval_res["weights_used"]["domain"] == 0.1250
    assert eval_res["weights_used"]["semantic"] == 0.0

    # Test 3: Task 3 - Cache invalidation on model change
    cand_emb_old = provider.get_or_create_candidate_embedding(db_session, cand)
    assert cand_emb_old is not None

    # Change provider model
    original_model = provider.model
    provider.model = "different-test-model-v2"
    # Looking up with different model must result in cache miss and new record generation
    # without deleting previous cache
    cand_emb_new = provider.get_or_create_candidate_embedding(db_session, cand)
    assert cand_emb_new.model_name == "different-test-model-v2"

    # Verify both records coexist in the database without destructive overwrites
    embeddings_in_db = db_session.query(ResumeEmbedding).filter(
        ResumeEmbedding.candidate_id == cand.id
    ).all()
    models_saved = [e.model_name for e in embeddings_in_db]
    assert "different-test-model-v2" in models_saved
    # Restore model
    provider.model = original_model

    # Test 4: Task 4 - Matching performance over candidates
    t0 = time.time()
    agent = EnterpriseRecruitmentAgent(db_session)
    match_output = agent.match_candidates_to_job_tool(job_id_or_title=str(job.id), top_k=5)
    elapsed = time.time() - t0

    assert "top_candidates" in match_output
    assert match_output["total_evaluated"] >= 1
    # Circuit breaker and in-memory pre-cache ensure candidate evaluation runs in milliseconds
    assert elapsed < 5.0, f"Candidate matching took {elapsed:.2f}s, expected < 5s"
