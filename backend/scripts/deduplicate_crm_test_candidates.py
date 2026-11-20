"""
Merge repeated CRM/Excel test candidates and name-matched duplicate candidates.
"""

from collections import defaultdict
from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.submission import CandidateSubmission
from backend.app.models.assignment import CandidateAssignment, AssignmentHistory, AssignmentNote
from backend.app.models.matching import CandidateMatch
from backend.app.models.candidate_intelligence import (
    CandidateResumeLink, CandidateEducation, CandidateEmployer,
    CandidateCertification, CandidateAuditLog
)
from backend.app.models.outreach import CandidateCommunication
from backend.app.models.sourcing import SourcingSearchResult


def main():
    db = SessionLocal()
    candidates = db.query(Candidate).order_by(Candidate.id).all()
    print(f"Current candidates: {len(candidates)}")

    # Group by normalized full name
    name_groups = defaultdict(list)
    for c in candidates:
        fn = f"{c.first_name} {c.last_name}".strip().lower()
        # Clean title words
        import re
        clean_fn = re.sub(r"\b(mr|ms|mrs|dr|lead|engineer|architect|manager|senior|jr|sr|consultant|developer)\b", "", fn)
        clean_fn = re.sub(r"\s+", " ", clean_fn).strip()
        if len(clean_fn) > 3:
            name_groups[clean_fn].append(c)

    removed = 0
    for clean_fn, group in name_groups.items():
        if len(group) <= 1:
            continue

        # Skip "ex ag" if emails are totally different real people
        if clean_fn == "ex ag":
            continue

        master = group[0]
        duplicates = group[1:]
        print(f"Merging {len(duplicates)} duplicates of '{clean_fn}' into Master ID {master.id}")

        for dup in duplicates:
            dup_id = dup.id

            # 1. CandidateSubmissions
            for sub in db.query(CandidateSubmission).filter(CandidateSubmission.candidate_id == dup_id).all():
                existing = db.query(CandidateSubmission).filter(
                    CandidateSubmission.candidate_id == master.id,
                    CandidateSubmission.job_requirement_id == sub.job_requirement_id
                ).first()
                if existing:
                    db.delete(sub)
                else:
                    sub.candidate_id = master.id

            # 2. CandidateAssignments
            for assign in db.query(CandidateAssignment).filter(CandidateAssignment.candidate_id == dup_id).all():
                existing = db.query(CandidateAssignment).filter(
                    CandidateAssignment.candidate_id == master.id,
                    CandidateAssignment.jd_id == assign.jd_id
                ).first()
                if existing:
                    for h in db.query(AssignmentHistory).filter(AssignmentHistory.assignment_id == assign.id).all():
                        h.assignment_id = existing.id
                    for nt in db.query(AssignmentNote).filter(AssignmentNote.assignment_id == assign.id).all():
                        nt.assignment_id = existing.id
                    for cm in db.query(CandidateCommunication).filter(CandidateCommunication.assignment_id == assign.id).all():
                        cm.assignment_id = existing.id
                    db.delete(assign)
                else:
                    assign.candidate_id = master.id

            # 3. CandidateResumeLink
            for link in db.query(CandidateResumeLink).filter(CandidateResumeLink.candidate_id == dup_id).all():
                existing = db.query(CandidateResumeLink).filter(
                    CandidateResumeLink.candidate_id == master.id,
                    CandidateResumeLink.resume_doc_id == link.resume_doc_id
                ).first()
                if existing:
                    db.delete(link)
                else:
                    link.candidate_id = master.id

            # 4. Education, Employer, Certs, Audit, Comm
            for edu in db.query(CandidateEducation).filter(CandidateEducation.candidate_id == dup_id).all():
                edu.candidate_id = master.id
            for emp in db.query(CandidateEmployer).filter(CandidateEmployer.candidate_id == dup_id).all():
                emp.candidate_id = master.id
            for cert in db.query(CandidateCertification).filter(CandidateCertification.candidate_id == dup_id).all():
                cert.candidate_id = master.id
            for log in db.query(CandidateAuditLog).filter(CandidateAuditLog.candidate_id == dup_id).all():
                log.candidate_id = master.id
            for comm in db.query(CandidateCommunication).filter(CandidateCommunication.candidate_id == dup_id).all():
                comm.candidate_id = master.id

            # 5. SourcingSearchResult
            for sr in db.query(SourcingSearchResult).filter(SourcingSearchResult.candidate_id == dup_id).all():
                existing = db.query(SourcingSearchResult).filter(
                    SourcingSearchResult.search_id == sr.search_id,
                    SourcingSearchResult.candidate_id == master.id
                ).first()
                if existing:
                    db.delete(sr)
                else:
                    sr.candidate_id = master.id

            # 6. CandidateMatch
            for m in db.query(CandidateMatch).filter(CandidateMatch.candidate_id == dup_id).all():
                existing = db.query(CandidateMatch).filter(
                    CandidateMatch.candidate_id == master.id,
                    CandidateMatch.run_id == m.run_id,
                    CandidateMatch.jd_id == m.jd_id
                ).first()
                if existing:
                    db.delete(m)
                else:
                    m.candidate_id = master.id

            # Delete the duplicate candidate
            db.delete(dup)
            removed += 1

    db.commit()
    remaining = db.query(Candidate).count()
    print(f"Deduplicated name matches: removed {removed}, remaining candidates: {remaining}")
    db.close()


if __name__ == "__main__":
    main()
