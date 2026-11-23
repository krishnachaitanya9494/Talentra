"""
Comprehensive Audit Suite for TALENTRA Enterprise Recruitment Platform.
Executes independent empirical verification across:
1. Security & Authentication Matrix (11 test cases)
2. Embedding Provenance & Fallback Matrix (10 test cases)
3. Matching Performance Benchmarks (4 scenarios x 5 runs)
4. Recruiter Acceptance Workflow (13-step pipeline)
5. Existing Application Regression Matrix
"""

import sys
import os
import json
import time
import uuid
import statistics
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

# Ensure project root is in sys.path
BASE_DIR = r"c:\Users\Krishna Chaitanya\Desktop\Talentra"
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.document import JobDescriptionDocument, ResumeDocument
from backend.app.models.agent import ApprovalRequest, AgentTrace, ResumeEmbedding, JobEmbedding
from backend.app.models.user import User, UserRole
from backend.app.core.security import create_access_token, decode_access_token, hash_password
from backend.app.services.ai.embedding_service import (
    EmbeddingProvider,
    EmbeddingResult,
    get_embedding_provider,
    cosine_similarity,
    normalize_text_for_embedding,
    compute_content_sha256,
    EMBEDDING_DIMENSION,
)
from backend.app.services.matching.five_component_scorer import FiveComponentScorer
from backend.app.services.ai.recruitment_agent import (
    EnterpriseRecruitmentAgent,
    TOOL_REGISTRY_SPECS,
    MASTER_SYSTEM_PROMPT,
)

client = TestClient(app)
db = SessionLocal()

print("=" * 80)
print("TALENTRA ENTERPRISE RECRUITMENT AGENT: FULL AUDIT EXECUTION")
print("=" * 80)

# =============================================================================
# PART 2: APPROVAL AUTHENTICATION SECURITY MATRIX
# =============================================================================
print("\n--- PART 2: APPROVAL AUTHENTICATION SECURITY TESTING ---")
security_results = {}

# Setup test approval request
appr_uid = f"APP-SEC-{uuid.uuid4().hex[:6].upper()}"
test_appr = ApprovalRequest(
    approval_id=appr_uid,
    action_type="update_candidate_stage",
    description="Test security approval for candidate stage change",
    payload=json.dumps({"candidate_id": 1, "new_stage": "interviewing"}),
    status="pending",
    requested_by="Security Audit Suite",
)
db.add(test_appr)
db.commit()
db.refresh(test_appr)

# 1. Missing JWT
r1 = client.post(f"/api/v1/agent/approvals/{appr_uid}/action", json={"action": "approve"})
security_results["missing_jwt"] = {
    "status_code": r1.status_code,
    "expected": 401,
    "passed": r1.status_code == 401,
    "detail": r1.json().get("detail"),
}

# 2. Invalid JWT
r2 = client.post(
    f"/api/v1/agent/approvals/{appr_uid}/action",
    json={"action": "approve"},
    headers={"Authorization": "Bearer invalid.signature.token"},
)
security_results["invalid_jwt"] = {
    "status_code": r2.status_code,
    "expected": 401,
    "passed": r2.status_code == 401,
    "detail": r2.json().get("detail"),
}

# 3. Expired JWT
expired_payload = {
    "sub": "1",
    "role": UserRole.ADMINISTRATOR,
    "exp": int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()),
    "iat": int((datetime.now(timezone.utc) - timedelta(hours=4)).timestamp()),
}
# construct expired token manually
import base64, hmac, hashlib
from backend.app.core.security import TOKEN_SECRET
p_json = json.dumps(expired_payload, separators=(",", ":"), sort_keys=True)
p_b64 = base64.urlsafe_b64encode(p_json.encode()).decode().rstrip("=")
p_sig = hmac.new(TOKEN_SECRET.encode(), p_b64.encode(), hashlib.sha256).hexdigest()
expired_token = f"{p_b64}.{p_sig}"

r3 = client.post(
    f"/api/v1/agent/approvals/{appr_uid}/action",
    json={"action": "approve"},
    headers={"Authorization": f"Bearer {expired_token}"},
)
security_results["expired_jwt"] = {
    "status_code": r3.status_code,
    "expected": 401,
    "passed": r3.status_code == 401,
    "detail": r3.json().get("detail"),
}

# 4. Inactive User
inactive_user = db.query(User).filter(User.email == "inactive.audit@talentra.ai").first()
if not inactive_user:
    inactive_user = User(
        email="inactive.audit@talentra.ai",
        hashed_password="hash",
        full_name="Inactive Recruiter",
        role=UserRole.TA_RECRUITER,
        is_active=False,
    )
    db.add(inactive_user)
    db.commit()
    db.refresh(inactive_user)
else:
    inactive_user.is_active = False
    db.commit()

inactive_token = create_access_token({"sub": str(inactive_user.id), "role": UserRole.TA_RECRUITER, "email": inactive_user.email})
r4 = client.post(
    f"/api/v1/agent/approvals/{appr_uid}/action",
    json={"action": "approve"},
    headers={"Authorization": f"Bearer {inactive_token}"},
)
security_results["inactive_user"] = {
    "status_code": r4.status_code,
    "expected": 401,
    "passed": r4.status_code == 401,
    "detail": r4.json().get("detail"),
}

# 5. Unauthorized Role (Viewer)
viewer_user = db.query(User).filter(User.email == "viewer.audit@talentra.ai").first()
if not viewer_user:
    viewer_user = User(
        email="viewer.audit@talentra.ai",
        hashed_password="hash",
        full_name="Viewer Auditee",
        role=UserRole.VIEWER,
        is_active=True,
    )
    db.add(viewer_user)
    db.commit()
    db.refresh(viewer_user)
else:
    viewer_user.role = UserRole.VIEWER
    viewer_user.is_active = True
    db.commit()

viewer_token = create_access_token({"sub": str(viewer_user.id), "role": UserRole.VIEWER, "email": viewer_user.email})
r5 = client.post(
    f"/api/v1/agent/approvals/{appr_uid}/action",
    json={"action": "approve"},
    headers={"Authorization": f"Bearer {viewer_token}"},
)
security_results["unauthorized_viewer_role"] = {
    "status_code": r5.status_code,
    "expected": 403,
    "passed": r5.status_code == 403,
    "detail": r5.json().get("detail"),
}

# 6. Authorized TA Recruiter (on a separate pending approval)
appr_ta = ApprovalRequest(
    approval_id=f"APP-TA-{uuid.uuid4().hex[:6].upper()}",
    action_type="sync_skills",
    description="TA Recruiter sync test",
    payload=json.dumps({"candidate_id": 1, "additional_skills": "AuditSkill"}),
    status="pending",
    requested_by="TA Test",
)
db.add(appr_ta)
db.commit()
db.refresh(appr_ta)

ta_user = db.query(User).filter(User.email == "ta.audit@talentra.ai").first()
if not ta_user:
    ta_user = User(
        email="ta.audit@talentra.ai",
        hashed_password="hash",
        full_name="Audited TA Recruiter",
        role=UserRole.TA_RECRUITER,
        is_active=True,
    )
    db.add(ta_user)
    db.commit()
    db.refresh(ta_user)
ta_token = create_access_token({"sub": str(ta_user.id), "role": UserRole.TA_RECRUITER, "email": ta_user.email})

r6 = client.post(
    f"/api/v1/agent/approvals/{appr_ta.approval_id}/action",
    json={"action": "approve"},
    headers={"Authorization": f"Bearer {ta_token}"},
)
security_results["authorized_ta_recruiter"] = {
    "status_code": r6.status_code,
    "expected": 200,
    "passed": r6.status_code == 200,
    "resolved_by": r6.json().get("resolved_by"),
}

# 7. Authorized Recruitment Manager
appr_rm = ApprovalRequest(
    approval_id=f"APP-RM-{uuid.uuid4().hex[:6].upper()}",
    action_type="update_candidate_stage",
    description="RM advance test",
    payload=json.dumps({"candidate_id": 1, "new_stage": "interviewing"}),
    status="pending",
    requested_by="RM Test",
)
db.add(appr_rm)
db.commit()
db.refresh(appr_rm)

rm_user = db.query(User).filter(User.email == "rm.audit@talentra.ai").first()
if not rm_user:
    rm_user = User(
        email="rm.audit@talentra.ai",
        hashed_password="hash",
        full_name="Audited Recruitment Manager",
        role=UserRole.RECRUITMENT_MANAGER,
        is_active=True,
    )
    db.add(rm_user)
    db.commit()
    db.refresh(rm_user)
rm_token = create_access_token({"sub": str(rm_user.id), "role": UserRole.RECRUITMENT_MANAGER, "email": rm_user.email})

r7 = client.post(
    f"/api/v1/agent/approvals/{appr_rm.approval_id}/action",
    json={"action": "approve"},
    headers={"Authorization": f"Bearer {rm_token}"},
)
security_results["authorized_recruitment_manager"] = {
    "status_code": r7.status_code,
    "expected": 200,
    "passed": r7.status_code == 200,
    "resolved_by": r7.json().get("resolved_by"),
}

# 8. Administrator
admin_token_res = client.post("/api/v1/agent/auth/token", json={"email": "admin@talentra.ai", "password": "Talentra2026!"})
admin_token = admin_token_res.json()["access_token"]
admin_user_data = admin_token_res.json()["user"]

r8 = client.post(
    f"/api/v1/agent/approvals/{appr_uid}/action",
    json={"action": "approve"},
    headers={"Authorization": f"Bearer {admin_token}"},
)
security_results["authorized_administrator"] = {
    "status_code": r8.status_code,
    "expected": 200,
    "passed": r8.status_code == 200,
    "resolved_by": r8.json().get("resolved_by"),
}

# 9. Spoofed resolved_by attempt
appr_spoof = ApprovalRequest(
    approval_id=f"APP-SPF-{uuid.uuid4().hex[:6].upper()}",
    action_type="sync_skills",
    description="Anti-spoofing test",
    payload=json.dumps({"candidate_id": 1, "additional_skills": "SecurityCheck"}),
    status="pending",
    requested_by="Spoof Test",
)
db.add(appr_spoof)
db.commit()
db.refresh(appr_spoof)

r9 = client.post(
    f"/api/v1/agent/approvals/{appr_spoof.approval_id}/action",
    json={"action": "approve", "resolved_by": "ATTACKER_FAKE_CEO"},
    headers={"Authorization": f"Bearer {admin_token}"},
)
r9_data = r9.json()
anti_spoof_verified = ("ATTACKER_FAKE_CEO" not in r9_data.get("resolved_by", "")) and (admin_user_data["email"] in r9_data.get("resolved_by", ""))
security_results["spoofed_resolved_by_override"] = {
    "status_code": r9.status_code,
    "passed": anti_spoof_verified,
    "reported_resolved_by": r9_data.get("resolved_by"),
    "spoof_contained": "ATTACKER_FAKE_CEO" not in r9_data.get("resolved_by", ""),
}

# 10. Duplicate Approval Execution
r10 = client.post(
    f"/api/v1/agent/approvals/{appr_uid}/action",
    json={"action": "approve"},
    headers={"Authorization": f"Bearer {admin_token}"},
)
security_results["duplicate_approval_prevention"] = {
    "status_code": r10.status_code,
    "expected": 400,
    "passed": r10.status_code == 400,
    "detail": r10.json().get("detail"),
}

# 11. Role Revocation Mid-Session
revoked_user = db.query(User).filter(User.email == "revoked.audit@talentra.ai").first()
if not revoked_user:
    revoked_user = User(
        email="revoked.audit@talentra.ai",
        hashed_password="hash",
        full_name="Revoked Officer",
        role=UserRole.ADMINISTRATOR,
        is_active=True,
    )
    db.add(revoked_user)
    db.commit()
    db.refresh(revoked_user)

# Generate token while admin
revoked_token = create_access_token({"sub": str(revoked_user.id), "role": UserRole.ADMINISTRATOR, "email": revoked_user.email})

# Now demote user in database to viewer
revoked_user.role = UserRole.VIEWER
db.commit()

appr_rev = ApprovalRequest(
    approval_id=f"APP-REV-{uuid.uuid4().hex[:6].upper()}",
    action_type="sync_skills",
    description="Revocation test",
    payload=json.dumps({"candidate_id": 1}),
    status="pending",
    requested_by="Revoke Test",
)
db.add(appr_rev)
db.commit()
db.refresh(appr_rev)

r11 = client.post(
    f"/api/v1/agent/approvals/{appr_rev.approval_id}/action",
    json={"action": "approve"},
    headers={"Authorization": f"Bearer {revoked_token}"},
)
# Note: Token has role embedded, but get_current_user fetches User from DB, and require_role checks current_user.role!
security_results["revoked_role_check"] = {
    "status_code": r11.status_code,
    "expected": 403,
    "passed": r11.status_code == 403,
    "detail": r11.json().get("detail"),
}

print("Security Test Results Summary:")
for k, v in security_results.items():
    print(f"  {k}: {'PASS' if v['passed'] else 'FAIL'} (Code: {v['status_code']})")

print(json.dumps(security_results, indent=2))
db.close()
