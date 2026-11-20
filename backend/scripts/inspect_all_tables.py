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

db = SessionLocal()

print("--- JobRequirement Dependencies ---")
for jd_id in [8, 9, 10, 14, 45]:
    sub_count = db.query(CandidateSubmission).filter(CandidateSubmission.job_requirement_id == jd_id).count()
    assign_count = db.query(CandidateAssignment).filter(CandidateAssignment.job_requirement_id == jd_id).count()
    parsed_count = db.query(ParsedJobRequirement).filter(ParsedJobRequirement.job_id == jd_id).count()
    match_count = db.query(CandidateMatch).filter(CandidateMatch.jd_id == jd_id).count()
    print(f"JD ID {jd_id}: submissions={sub_count}, assignments={assign_count}, parsed={parsed_count}, matches={match_count}")

print("\n--- Candidate Dependencies for duplicates ---")
for c_id in [102, 106, 120, 122, 153, 154]:
    sub_count = db.query(CandidateSubmission).filter(CandidateSubmission.candidate_id == c_id).count()
    assign_count = db.query(CandidateAssignment).filter(CandidateAssignment.candidate_id == c_id).count()
    link_count = db.query(CandidateResumeLink).filter(CandidateResumeLink.candidate_id == c_id).count()
    match_count = db.query(CandidateMatch).filter(CandidateMatch.candidate_id == c_id).count()
    print(f"Candidate ID {c_id}: submissions={sub_count}, assignments={assign_count}, links={link_count}, matches={match_count}")

db.close()
