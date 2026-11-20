from backend.app.database.session import SessionLocal
from backend.app.models.matching import CandidateMatch, MatchingRun
from backend.app.models.assignment import CandidateAssignment
from backend.app.models.submission import CandidateSubmission
from collections import Counter

db = SessionLocal()

print("--- CandidateMatch Duplicates ---")
matches = db.query(CandidateMatch).all()
print(f"Total CandidateMatch: {len(matches)}")
pair_counts = Counter([(m.run_id, m.candidate_id) for m in matches])
dup_m = {k: v for k, v in pair_counts.items() if v > 1}
print(f"Duplicate (run_id, candidate_id) in matches: {len(dup_m)}")

jd_cand_counts = Counter([(m.jd_id, m.candidate_id) for m in matches])
dup_jc = {k: v for k, v in jd_cand_counts.items() if v > 1}
print(f"Duplicate (jd_id, candidate_id) across all runs: {len(dup_jc)}")

print("--- CandidateSubmission Duplicates ---")
subs = db.query(CandidateSubmission).all()
print(f"Total CandidateSubmission: {len(subs)}")
sub_counts = Counter([(s.job_requirement_id, s.candidate_id) for s in subs])
dup_s = {k: v for k, v in sub_counts.items() if v > 1}
print(f"Duplicate (job_requirement_id, candidate_id) in submissions: {len(dup_s)}")

print("--- CandidateAssignment Duplicates ---")
assigns = db.query(CandidateAssignment).all()
print(f"Total CandidateAssignment: {len(assigns)}")
assign_counts = Counter([(a.candidate_id, a.jd_id) for a in assigns])
dup_a = {k: v for k, v in assign_counts.items() if v > 1}
print(f"Duplicate (candidate_id, jd_id) in assignments: {len(dup_a)}")

db.close()
