from backend.app.database.session import SessionLocal
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument, ResumeDocument
from backend.app.models.candidate_intelligence import (
    CandidateResumeLink, CandidateEducation, CandidateEmployer, CandidateCertification,
    CandidateAuditLog, ParsedJobRequirement
)
from backend.app.models.matching import CandidateMatch, MatchingRun
from backend.app.models.assignment import CandidateAssignment
from backend.app.models.submission import CandidateSubmission
from backend.app.models.interview import Interview
from collections import Counter

db = SessionLocal()

print("================== 1. JOB REQUIREMENTS ==================")
jds = db.query(JobRequirement).all()
print(f"Total JobRequirement: {len(jds)}")
title_map = {}
for jd in jds:
    t = (jd.title or "").strip()
    title_map.setdefault(t, []).append(jd)

for t, group in title_map.items():
    if len(group) > 1:
        print(f"  Title '{t}': {len(group)} duplicates (IDs: {[j.id for j in group]}, reqs: {[j.req_code for j in group]})")

print("\n================== 2. JOB DESCRIPTION DOCUMENTS ==================")
jd_docs = db.query(JobDescriptionDocument).all()
print(f"Total JD Documents: {len(jd_docs)}")
jd_hash_map = {}
for d in jd_docs:
    jd_hash_map.setdefault(d.sha256_hash, []).append(d)
for h, group in jd_hash_map.items():
    if len(group) > 1:
        print(f"  Hash duplicate: {len(group)} docs -> IDs: {[d.id for d in group]}, files: {[d.original_filename for d in group]}")

jd_fn_map = {}
for d in jd_docs:
    jd_fn_map.setdefault(d.original_filename, []).append(d)
for fn, group in jd_fn_map.items():
    if len(group) > 1:
        print(f"  Filename duplicate '{fn}': {len(group)} docs -> IDs: {[d.id for d in group]}")

print("\n================== 3. RESUME DOCUMENTS ==================")
res_docs = db.query(ResumeDocument).all()
print(f"Total Resume Documents: {len(res_docs)}")
res_hash_map = {}
for d in res_docs:
    res_hash_map.setdefault(d.sha256_hash, []).append(d)
dup_res_hashes = {h: v for h, v in res_hash_map.items() if len(v) > 1}
print(f"Duplicate Resume sha256_hash count: {len(dup_res_hashes)}")

res_fn_map = {}
for d in res_docs:
    res_fn_map.setdefault(d.original_filename, []).append(d)
dup_res_fns = {fn: v for fn, v in res_fn_map.items() if len(v) > 1}
print(f"Duplicate Resume filenames count: {len(dup_res_fns)}")

print("\n================== 4. CANDIDATES ==================")
candidates = db.query(Candidate).all()
print(f"Total Candidates: {len(candidates)}")
c_email_map = {}
for c in candidates:
    email = (c.email or "").strip().lower()
    if email:
        c_email_map.setdefault(email, []).append(c)
dup_emails = {k: v for k, v in c_email_map.items() if len(v) > 1}
print(f"Duplicate Candidate emails count: {len(dup_emails)}")

c_phone_map = {}
for c in candidates:
    phone = (c.phone or "").strip()
    digits = "".join([ch for ch in phone if ch.isdigit()])
    if len(digits) >= 10:
        c_phone_map.setdefault(digits[-10:], []).append(c)
dup_phones = {k: v for k, v in c_phone_map.items() if len(v) > 1}
print(f"Duplicate Candidate phones count: {len(dup_phones)}")
for k, v in list(dup_phones.items())[:10]:
    names = [f"{c.first_name} {c.last_name}".strip() for c in v]
    print(f"  Phone ...{k}: {len(v)} candidates -> IDs: {[c.id for c in v]}, Names: {names}")

c_name_map = {}
for c in candidates:
    name = f"{c.first_name} {c.last_name}".strip().lower()
    if name:
        c_name_map.setdefault(name, []).append(c)
dup_names = {k: v for k, v in c_name_map.items() if len(v) > 1}
print(f"Duplicate Candidate full names count: {len(dup_names)}")
for k, v in list(dup_names.items())[:10]:
    print(f"  Name '{k}': {len(v)} candidates -> IDs: {[c.id for c in v]}, emails: {[c.email for c in v]}")

print("\n================== 5. CANDIDATE MATCHES ==================")
matches = db.query(CandidateMatch).all()
print(f"Total CandidateMatch: {len(matches)}")
match_pairs = {}
for m in matches:
    key = (m.job_requirement_id, m.candidate_id)
    match_pairs.setdefault(key, []).append(m)
dup_matches = {k: v for k, v in match_pairs.items() if len(v) > 1}
print(f"Duplicate (job_id, candidate_id) matches: {len(dup_matches)}")

print("\n================== 6. CANDIDATE ASSIGNMENTS ==================")
assignments = db.query(CandidateAssignment).all()
print(f"Total CandidateAssignment: {len(assignments)}")
assign_pairs = {}
for a in assignments:
    key = (a.candidate_id, a.recruiter_id, a.job_requirement_id)
    assign_pairs.setdefault(key, []).append(a)
dup_assigns = {k: v for k, v in assign_pairs.items() if len(v) > 1}
print(f"Duplicate CandidateAssignments: {len(dup_assigns)}")

db.close()
