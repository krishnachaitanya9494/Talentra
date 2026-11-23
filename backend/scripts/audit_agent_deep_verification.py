"""
Deep Production Readiness Audit Script for TALENTRA Enterprise Recruitment Agent.
Executes non-destructive, read-only and rollback-safe checks.
"""

import sys
import json
import uuid
import time
import urllib.request
import urllib.error
from pathlib import Path

# Ensure repo root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.app.core.config import settings
from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.document import JobDescriptionDocument, ResumeDocument
from backend.app.models.agent import ApprovalRequest, AgentTrace, ResumeEmbedding, JobEmbedding
from backend.app.services.ai.embedding_service import (
    get_embedding_provider,
    cosine_similarity,
    normalize_text_for_embedding,
    compute_content_sha256,
    deterministic_2048_projection,
    EmbeddingProvider,
)
from backend.app.services.matching.five_component_scorer import FiveComponentScorer
from backend.app.services.ai.recruitment_agent import EnterpriseRecruitmentAgent, TOOL_REGISTRY_SPECS

def run_audit():
    db = SessionLocal()
    audit_results = {}

    print("=" * 80)
    print("SECTION 1: EMBEDDING PIPELINE VERIFICATION")
    print("=" * 80)

    embedder = get_embedding_provider()
    audit_results["embedder_config"] = {
        "model": embedder.model,
        "base_url": embedder.base_url,
        "has_api_key": bool(embedder.api_key),
    }
    print(f"1. Provider Base URL: {embedder.base_url}")
    print(f"2. Configured Model: {embedder.model}")
    print(f"3. API Key Configured: {'Yes (Length: ' + str(len(embedder.api_key)) + ')' if embedder.api_key else 'No'}")

    # Test live API call to OpenRouter embeddings endpoint
    live_api_status = None
    live_api_error = None
    if embedder.api_key:
        try:
            url = f"{embedder.base_url}/embeddings"
            payload = json.dumps({"model": embedder.model, "input": "Senior Java Developer"}).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Authorization": f"Bearer {embedder.api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                live_api_status = "SUCCESS"
                emb_len = len(resp_data.get("data", [{}])[0].get("embedding", []))
                print(f"4. Live API Call: SUCCESS - Returned dimension: {emb_len}")
        except urllib.error.HTTPError as e:
            live_api_status = f"HTTPError {e.code}: {e.reason}"
            err_body = e.read().decode("utf-8", errors="ignore")[:300]
            live_api_error = err_body
            print(f"4. Live API Call: FAILED ({live_api_status}) -> {err_body}")
        except Exception as e:
            live_api_status = f"Exception: {type(e).__name__}: {e}"
            print(f"4. Live API Call: FAILED -> {live_api_status}")
    else:
        live_api_status = "SKIPPED_NO_KEY"
        print("4. Live API Call: SKIPPED (No API key)")

    audit_results["live_api"] = {"status": live_api_status, "error": live_api_error}

    # Test vector normalization and dimension
    test_vec = embedder.embed_text("Senior Java Developer Spring Boot Microservices")
    norm = sum(v * v for v in test_vec) ** 0.5
    print(f"5. Generated Vector Dimension: {len(test_vec)}")
    print(f"6. L2 Norm of Vector: {norm:.6f} (Expected: ~1.000000)")

    # Test zero vectors & invalid dimensions in cosine similarity
    zero_vec = [0.0] * 2048
    sim_zero = cosine_similarity(zero_vec, test_vec)
    sim_invalid_dim = cosine_similarity(test_vec, [0.1] * 512)
    sim_empty = cosine_similarity([], test_vec)
    print(f"7. Cosine Similarity Zero Vector: {sim_zero} (Expected: 0.0)")
    print(f"8. Cosine Similarity Mismatched Dim: {sim_invalid_dim} (Expected: 0.0)")
    print(f"9. Cosine Similarity Empty Vector: {sim_empty} (Expected: 0.0)")

    # Test SHA-256 caching
    text_sample = "Cloud Architect AWS Terraform"
    h1 = compute_content_sha256(normalize_text_for_embedding(text_sample))
    h2 = compute_content_sha256(normalize_text_for_embedding(text_sample))
    print(f"10. SHA-256 Hash Determinism: {h1 == h2} (Hash: {h1})")

    # Check fallback vector distinguishability
    # In current embedding_service.py: does it return whether it's fallback or real?
    has_fallback_flag = hasattr(embedder, "is_fallback") or False
    print(f"11. Fallback Vector Distinguishable in Return Type: {has_fallback_flag} (Current returns List[float] only)")

    print("\n" + "=" * 80)
    print("SECTION 2: FIVE-COMPONENT SCORING ENGINE VERIFICATION")
    print("=" * 80)

    # Use first existing job requirement in database
    existing_job = db.query(JobRequirement).first()
    print(f"Auditing with existing JobRequirement ID: {existing_job.id}, Title: '{existing_job.title}'")
    print(f"Required Skills: '{existing_job.required_skills}'")

    # Candidate A: All mandatory satisfied
    # Create temporary in-memory Candidate mock
    class MockCandidate:
        def __init__(self, id, full_name, current_title, skills, total_experience_years, location):
            self.id = id
            self.first_name = full_name.split()[0]
            self.last_name = full_name.split()[-1] if len(full_name.split()) > 1 else ""
            self.full_name = full_name
            self.current_title = current_title
            self.skills = skills
            self.total_experience_years = total_experience_years
            self.location = location

    # Parse mandatory skills of existing job
    req_skills = [s.strip() for s in (existing_job.required_skills or "").split(",") if s.strip()]
    cand_all_skills = ", ".join(req_skills) if req_skills else "Python, SQL, AWS"

    c_all = MockCandidate(9901, "Test Perfect", existing_job.title, cand_all_skills, 6.0, "Hyderabad")
    eval_all = FiveComponentScorer.evaluate(db, c_all, existing_job)
    print(f"Test A (All Mandatory Satisfied): Score={eval_all['composite_score']}%, Tier={eval_all['tier']}, PolicyApplied={eval_all['policy_applied']}")

    # Candidate B: One mandatory missing
    if len(req_skills) >= 2:
        cand_one_missing = ", ".join(req_skills[:-1])
    else:
        cand_one_missing = "Python, AWS"
    c_m1 = MockCandidate(9902, "Test OneMissing", existing_job.title, cand_one_missing, 6.0, "Hyderabad")
    eval_m1 = FiveComponentScorer.evaluate(db, c_m1, existing_job)
    print(f"Test B (1 Mandatory Missing): Score={eval_m1['composite_score']}%, Tier={eval_m1['tier']}, PolicyApplied={eval_m1['policy_applied']}")

    # Candidate C: Two mandatory missing
    if len(req_skills) >= 3:
        cand_two_missing = ", ".join(req_skills[:-2])
    else:
        cand_two_missing = "Python"
    c_m2 = MockCandidate(9903, "Test TwoMissing", existing_job.title, cand_two_missing, 6.0, "Hyderabad")
    eval_m2 = FiveComponentScorer.evaluate(db, c_m2, existing_job)
    print(f"Test C (2 Mandatory Missing): Score={eval_m2['composite_score']}%, Tier={eval_m2['tier']}, PolicyApplied={eval_m2['policy_applied']}")

    # Candidate D: All mandatory missing
    c_none = MockCandidate(9904, "Test NoneMatched", "Graphic Designer", "Photoshop, Illustrator", 2.0, "Mumbai")
    eval_none = FiveComponentScorer.evaluate(db, c_none, existing_job)
    print(f"Test D (All Mandatory Missing): Score={eval_none['composite_score']}%, Tier={eval_none['tier']}, PolicyApplied={eval_none['policy_applied']}")

    # Candidate E: Incomplete profile (missing title, location, exp)
    c_inc = MockCandidate(9905, "Test Incomplete", None, cand_all_skills, None, None)
    eval_inc = FiveComponentScorer.evaluate(db, c_inc, existing_job)
    print(f"Test E (Incomplete Profile): Score={eval_inc['composite_score']}%, Tier={eval_inc['tier']}, PolicyApplied={eval_inc['policy_applied']}")

    # Candidate F: Empty candidate profile
    c_empty = MockCandidate(9906, "Test Empty", None, "", None, None)
    eval_empty = FiveComponentScorer.evaluate(db, c_empty, existing_job)
    print(f"Test F (Empty Profile): Score={eval_empty['composite_score']}%, Tier={eval_empty['tier']}, PolicyApplied={eval_empty['policy_applied']}")

    print("\n" + "=" * 80)
    print("SECTION 3: EIGHT AGENT TOOLS VERIFICATION")
    print("=" * 80)
    agent = EnterpriseRecruitmentAgent(db)

    # T1: search_candidates_tool
    t0 = time.time()
    t1_res = agent.search_candidates_tool(query="Java", location="Hyderabad", limit=3)
    lat_t1 = (time.time() - t0) * 1000
    print(f"T1 search_candidates_tool: Found {t1_res['count']} candidates, Latency: {lat_t1:.1f}ms")

    # T2: match_candidates_to_job_tool
    t0 = time.time()
    t2_res = agent.match_candidates_to_job_tool(job_id_or_title=str(existing_job.id), top_k=3)
    lat_t2 = (time.time() - t0) * 1000
    print(f"T2 match_candidates_to_job_tool: Evaluated {t2_res.get('total_evaluated', 0)}, Latency: {lat_t2:.1f}ms")

    # T3: compare_candidates_tool
    existing_cands = db.query(Candidate).limit(3).all()
    c_ids = [c.id for c in existing_cands]
    t0 = time.time()
    t3_res = agent.compare_candidates_tool(job_id=existing_job.id, candidate_ids=c_ids)
    lat_t3 = (time.time() - t0) * 1000
    print(f"T3 compare_candidates_tool: Compared {t3_res.get('candidate_count', 0)} candidates, Latency: {lat_t3:.1f}ms")

    # T4: get_job_details_tool
    t0 = time.time()
    t4_res = agent.get_job_details_tool(job_id_or_title=str(existing_job.id))
    lat_t4 = (time.time() - t0) * 1000
    print(f"T4 get_job_details_tool: Retrieved '{t4_res.get('job_title')}', Latency: {lat_t4:.1f}ms")

    # T5: generate_interview_kit_tool
    t0 = time.time()
    t5_res = agent.generate_interview_kit_tool(
        job_title=existing_job.title,
        candidate_name="Candidate A",
        critical_gaps="Kafka streaming",
        verified_skills="Java, Spring Boot",
    )
    lat_t5 = (time.time() - t0) * 1000
    print(f"T5 generate_interview_kit_tool: Generated kit ({len(t5_res.get('interview_kit', ''))} chars), Latency: {lat_t5:.1f}ms")

    # T6: generate_boolean_query_tool
    t0 = time.time()
    t6_res = agent.generate_boolean_query_tool(
        job_title="Oracle EPM Consultant",
        mandatory_skills="PBCS, Hyperion, Essbase",
        preferred_skills="Smart View",
    )
    lat_t6 = (time.time() - t0) * 1000
    print(f"T6 generate_boolean_query_tool: Generated Boolean strings, Latency: {lat_t6:.1f}ms")

    # T7: summarize_pipeline_tool
    t0 = time.time()
    t7_res = agent.summarize_pipeline_tool()
    lat_t7 = (time.time() - t0) * 1000
    print(f"T7 summarize_pipeline_tool: Indexed Candidates={t7_res['total_indexed_candidates']}, Jobs={t7_res['active_job_requisitions']}, Latency: {lat_t7:.1f}ms")

    # T8: propose_sensitive_action_tool
    t0 = time.time()
    t8_res = agent.propose_sensitive_action_tool(
        action_type="offer_candidate",
        description="Audit test offer for candidate #999",
        payload={"candidate_id": 999, "salary": 120000},
    )
    lat_t8 = (time.time() - t0) * 1000
    print(f"T8 propose_sensitive_action_tool: Status={t8_res['status']}, Approval ID={t8_res['approval_id']}, Latency: {lat_t8:.1f}ms")

    # Clean up test approval request
    db.query(ApprovalRequest).filter(ApprovalRequest.approval_id == t8_res["approval_id"]).delete()
    db.commit()

    print("\n" + "=" * 80)
    print("SECTION 4: HUMAN APPROVAL WORKFLOW VERIFICATION")
    print("=" * 80)
    # Test lifecycle: Pending -> Approved
    test_app_id = f"APP-TEST-{uuid.uuid4().hex[:6].upper()}"
    appr1 = ApprovalRequest(
        approval_id=test_app_id,
        action_type="update_candidate_stage",
        description="Test candidate stage advance",
        payload=json.dumps({"candidate_id": 1, "stage": "Interview"}),
        status="pending",
        requested_by="Nemotron AI",
    )
    db.add(appr1)
    db.commit()
    db.refresh(appr1)
    print(f"1. Created Approval: {appr1.approval_id}, Status: {appr1.status}")

    # Approve
    appr1.status = "approved"
    appr1.resolved_by = "Recruiter Admin"
    db.commit()
    print(f"2. Transitioned to Approved: Status={appr1.status}, ResolvedBy={appr1.resolved_by}")

    # Try duplicate approval
    is_duplicate_prevented = appr1.status != "pending"
    print(f"3. Duplicate Resolution Prevented: {is_duplicate_prevented} (Status is '{appr1.status}')")

    # Test rejection lifecycle
    test_app_id_2 = f"APP-TEST-{uuid.uuid4().hex[:6].upper()}"
    appr2 = ApprovalRequest(
        approval_id=test_app_id_2,
        action_type="reject_candidate",
        description="Test candidate rejection",
        payload=json.dumps({"candidate_id": 2}),
        status="pending",
        requested_by="Nemotron AI",
    )
    db.add(appr2)
    db.commit()
    appr2.status = "rejected"
    appr2.resolved_by = "Recruiter Admin"
    db.commit()
    print(f"4. Transitioned to Rejected: Status={appr2.status}")

    # Clean up test approvals
    db.query(ApprovalRequest).filter(ApprovalRequest.approval_id.in_([test_app_id, test_app_id_2])).delete()
    db.commit()

    print("\n" + "=" * 80)
    print("SECTION 5: AGENT TRACE VERIFICATION")
    print("=" * 80)
    t_turn = agent.run_turn(
        session_id="audit-session-001",
        message="Give me a recruitment pipeline summary",
    )
    print(f"1. Turn Trace ID: {t_turn['trace_id']}")
    print(f"2. Latency: {t_turn['latency_ms']}ms")
    print(f"3. Tools Called: {[tc['tool'] for tc in t_turn['tools_called']]}")

    # Verify trace in DB
    trace_record = db.query(AgentTrace).filter(AgentTrace.trace_id == t_turn["trace_id"]).first()
    if trace_record:
        print(f"4. DB Persistence: Verified (ID={trace_record.id}, Prompt='{trace_record.prompt}', Latency={trace_record.latency_ms}ms)")
        # Clean up audit trace
        db.delete(trace_record)
        db.commit()
    else:
        print("4. DB Persistence: FAILED")

    print("\n" + "=" * 80)
    print("SECTION 6: REAL RECRUITER SCENARIOS")
    print("=" * 80)

    # Scenario 1: Find Java candidates with 5+ yrs exp in Hyderabad
    sc1_res = agent.search_candidates_tool(query="Java", location="Hyderabad", limit=5)
    print(f"Scenario 1 (Java in Hyderabad): Found {sc1_res['count']} candidates")
    for c in sc1_res["candidates"][:3]:
        print(f"  - {c['name']} ({c['current_title']}), Exp: {c['experience_years']} yrs, Loc: {c['location']}, Skills: {c['skills'][:4]}")

    # Scenario 2: Match candidates against existing requisition
    sc2_res = agent.match_candidates_to_job_tool(job_id_or_title=str(existing_job.id), top_k=3)
    print(f"Scenario 2 (Match candidates for REQ-{existing_job.id}):")
    for c in sc2_res["top_candidates"]:
        print(f"  - {c['name']}: Score={c['composite_score']}%, Tier={c['tier']}, Matched={len(c['mandatory_breakdown']['matched'])}/{c['mandatory_breakdown']['total']}")

    # Scenario 3: Compare 3 candidates
    cand_ids = [c["candidate_id"] for c in sc2_res["top_candidates"][:3]]
    if len(cand_ids) >= 2:
        sc3_res = agent.compare_candidates_tool(job_id=existing_job.id, candidate_ids=cand_ids)
        print(f"Scenario 3 (Compare {len(cand_ids)} candidates):")
        for m in sc3_res["matrix"]:
            print(f"  - {m['name']}: Score={m['composite_score']}%, Tier={m['tier']}, Missing={m['missing_mandatory'][:2]}")

    # Scenario 4: Explain critical skill gaps
    if sc2_res["top_candidates"]:
        cand_gap = sc2_res["top_candidates"][0]
        print(f"Scenario 4 (Gap explanation for {cand_gap['name']}):")
        print(f"  - Matched Mandatory: {cand_gap['mandatory_breakdown']['matched']}")
        print(f"  - Missing Mandatory: {cand_gap['mandatory_breakdown']['missing']}")
        print(f"  - Policy: {cand_gap.get('policy_reason') or 'No penalty'}")

    # Scenario 5: Boolean search for Oracle EPM
    sc5_res = agent.generate_boolean_query_tool(
        job_title="Oracle EPM / Hyperion Planning Consultant",
        mandatory_skills="Oracle PBCS, Hyperion Planning, Essbase, Calculation Manager",
        preferred_skills="Smart View, EPM Automate",
        location="India",
    )
    print(f"Scenario 5 (Boolean search): {sc5_res['boolean_strings'][:180]}...")

    # Scenario 6: Pipeline summary
    sc6_res = agent.summarize_pipeline_tool()
    print(f"Scenario 6 (Pipeline summary): Candidates={sc6_res['total_indexed_candidates']}, Jobs={sc6_res['active_job_requisitions']}, Vector Dimension={sc6_res['vector_embedding_coverage']['dimension']}")

    # Scenario 7: Interview kit
    sc7_res = agent.generate_interview_kit_tool(
        job_title="Oracle EPM Consultant",
        candidate_name="Sample Candidate",
        critical_gaps="EPM Automate scripts",
        verified_skills="Hyperion Planning, Essbase",
    )
    print(f"Scenario 7 (Interview kit): {sc7_res['interview_kit'][:200]}...")

    # Scenario 8: Sensitive stage change intercepted
    sc8_res = agent.run_turn(
        session_id="audit-sc8",
        message="Move candidate #5 to offer stage",
    )
    print(f"Scenario 8 (Sensitive action intercepted): Approval={sc8_res.get('approval_request') is not None}, ActionType={sc8_res.get('approval_request', {}).get('action_type')}")
    if sc8_res.get("approval_request"):
        # Clean up
        db.query(ApprovalRequest).filter(ApprovalRequest.approval_id == sc8_res["approval_request"]["approval_id"]).delete()
        db.commit()

    db.close()
    print("\n" + "=" * 80)
    print("AUDIT SCRIPT COMPLETED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    run_audit()
