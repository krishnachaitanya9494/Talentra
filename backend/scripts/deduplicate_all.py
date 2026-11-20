"""
TALENTRA Platform-Wide Deduplication Migration Script.

Performs deterministic, relational deduplication across all database entities:
1. JobRequirements (merging/cleaning duplicate JDs, re-pointing submissions/matches).
2. Candidates (clustering by phone, clean email, and normalized name; merging submissions,
   assignments, resume links, educations, employers, matches; removing duplicate candidates).
3. CandidateMatches (removing redundant or orphaned duplicate match rows).
4. Updating metrics and counters.
"""

import re
from collections import defaultdict
from sqlalchemy import func, select, or_
from backend.app.database.session import SessionLocal
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.candidate import Candidate
from backend.app.models.submission import CandidateSubmission
from backend.app.models.assignment import CandidateAssignment, AssignmentHistory, AssignmentNote
from backend.app.models.matching import CandidateMatch, MatchingRun
from backend.app.models.candidate_intelligence import (
    CandidateResumeLink, CandidateEducation, CandidateEmployer,
    CandidateCertification, CandidateAuditLog, ParsedJobRequirement
)
from backend.app.models.outreach import CandidateCommunication
from backend.app.models.sourcing import SourcingSearchResult


def clean_phone(p):
    if not p:
        return ""
    digits = re.sub(r"\D", "", str(p))
    return digits[-10:] if len(digits) >= 10 else ""


def clean_email(e):
    if not e:
        return ""
    e = str(e).strip().lower()
    # Strip artificial prefixes like candidate_00120_... or c_1_...
    m = re.search(r"(?:candidate_\d+_|c_\d+_)(.+@.+)", e)
    if m:
        return m.group(1)
    if "profile_doc-res-" in e:
        return ""
    return e


def clean_name(c):
    full = f"{c.first_name} {c.last_name}".lower().strip()
    full = re.sub(r"\b(mr|ms|mrs|dr|lead|engineer|architect|manager|senior|jr|sr|consultant|developer)\b", "", full)
    full = re.sub(r"\s+", " ", full).strip()
    return full


def deduplicate_job_requirements(db):
    print("\n--- 1. Deduplicating Job Requirements ---")
    jds = db.query(JobRequirement).order_by(JobRequirement.id).all()
    print(f"Current JobRequirements count: {len(jds)}")

    # Group by normalized title
    groups = defaultdict(list)
    for jd in jds:
        title_key = (jd.title or "").strip().lower()
        groups[title_key].append(jd)

    total_jds_removed = 0
    for title_key, group in groups.items():
        if len(group) <= 1:
            continue

        master = group[0]
        duplicates = group[1:]
        print(f"Merging {len(duplicates)} duplicates of '{master.title}' (Master ID: {master.id})")

        for dup in duplicates:
            dup_id = dup.id
            # 1. CandidateSubmissions
            dup_subs = db.query(CandidateSubmission).filter(CandidateSubmission.job_requirement_id == dup_id).all()
            for sub in dup_subs:
                existing = db.query(CandidateSubmission).filter(
                    CandidateSubmission.job_requirement_id == master.id,
                    CandidateSubmission.candidate_id == sub.candidate_id
                ).first()
                if existing:
                    db.delete(sub)
                else:
                    sub.job_requirement_id = master.id

            # 2. CandidateMatches
            matches = db.query(CandidateMatch).filter(CandidateMatch.jd_id == dup_id).all()
            for m in matches:
                existing_m = db.query(CandidateMatch).filter(
                    CandidateMatch.jd_id == master.id,
                    CandidateMatch.candidate_id == m.candidate_id,
                    CandidateMatch.run_id == m.run_id
                ).first()
                if existing_m:
                    db.delete(m)
                else:
                    m.jd_id = master.id

            # Delete the duplicate JobRequirement
            db.delete(dup)
            total_jds_removed += 1

    db.commit()
    remaining = db.query(JobRequirement).count()
    print(f"Finished JobRequirements deduplication: removed {total_jds_removed}, remaining {remaining}")


def deduplicate_candidates(db):
    print("\n--- 2. Deduplicating Candidates ---")
    candidates = db.query(Candidate).order_by(Candidate.id).all()
    print(f"Current Candidates count: {len(candidates)}")

    parent = {c.id: c.id for c in candidates}

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_j] = root_i

    # Index by phone
    phone_to_ids = defaultdict(list)
    for c in candidates:
        p = clean_phone(c.phone)
        if p and len(p) >= 10:
            phone_to_ids[p].append(c.id)

    for p, ids in phone_to_ids.items():
        for i in range(1, len(ids)):
            union(ids[0], ids[i])

    # Index by clean email
    email_to_ids = defaultdict(list)
    for c in candidates:
        e = clean_email(c.email)
        if e and "@" in e and "talentra.local" not in e and "external" not in e:
            email_to_ids[e].append(c.id)

    for e, ids in email_to_ids.items():
        for i in range(1, len(ids)):
            union(ids[0], ids[i])

    # Index by name
    name_to_ids = defaultdict(list)
    for c in candidates:
        n = clean_name(c)
        if len(n) > 6 and " " in n:
            name_to_ids[n].append(c.id)

    for n, ids in name_to_ids.items():
        if len(ids) > 1:
            first_c = db.query(Candidate).filter(Candidate.id == ids[0]).first()
            for other_id in ids[1:]:
                other_c = db.query(Candidate).filter(Candidate.id == other_id).first()
                if first_c and other_c:
                    p1 = clean_phone(first_c.phone)
                    p2 = clean_phone(other_c.phone)
                    if p1 and p2 and p1 != p2:
                        continue
                    union(ids[0], other_id)

    clusters = defaultdict(list)
    for c in candidates:
        root = find(c.id)
        clusters[root].append(c)

    total_candidates_removed = 0

    for root, cluster in clusters.items():
        if len(cluster) <= 1:
            continue

        def score_candidate(c):
            score = 0
            if c.email and not c.email.startswith("candidate_") and "talentra.local" not in c.email:
                score += 100
            if c.phone:
                score += 50
            if c.skills and len(c.skills) > 10:
                score += 20
            if c.total_experience_years:
                score += 10
            score -= (c.id * 0.001)
            return score

        cluster.sort(key=score_candidate, reverse=True)
        master = cluster[0]
        duplicates = cluster[1:]

        for dup in duplicates:
            if not master.phone and dup.phone:
                master.phone = dup.phone
            if (not master.email or "talentra.local" in master.email) and dup.email and "talentra.local" not in dup.email:
                master.email = clean_email(dup.email)
            if not master.current_company and dup.current_company:
                master.current_company = dup.current_company
            if (not master.total_experience_years or master.total_experience_years == 0) and dup.total_experience_years:
                master.total_experience_years = dup.total_experience_years

            dup_id = dup.id

            # 1. CandidateSubmissions
            dup_subs = db.query(CandidateSubmission).filter(CandidateSubmission.candidate_id == dup_id).all()
            for sub in dup_subs:
                existing = db.query(CandidateSubmission).filter(
                    CandidateSubmission.candidate_id == master.id,
                    CandidateSubmission.job_requirement_id == sub.job_requirement_id
                ).first()
                if existing:
                    db.delete(sub)
                else:
                    sub.candidate_id = master.id

            # 2. CandidateAssignments & their child rows
            dup_assigns = db.query(CandidateAssignment).filter(CandidateAssignment.candidate_id == dup_id).all()
            for assign in dup_assigns:
                existing = db.query(CandidateAssignment).filter(
                    CandidateAssignment.candidate_id == master.id,
                    CandidateAssignment.jd_id == assign.jd_id
                ).first()
                if existing:
                    # Re-point or delete children first before deleting assign
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
            dup_links = db.query(CandidateResumeLink).filter(CandidateResumeLink.candidate_id == dup_id).all()
            for link in dup_links:
                existing = db.query(CandidateResumeLink).filter(
                    CandidateResumeLink.candidate_id == master.id,
                    CandidateResumeLink.resume_doc_id == link.resume_doc_id
                ).first()
                if existing:
                    db.delete(link)
                else:
                    link.candidate_id = master.id

            # 4. CandidateEducation
            for edu in db.query(CandidateEducation).filter(CandidateEducation.candidate_id == dup_id).all():
                edu.candidate_id = master.id

            # 5. CandidateEmployer
            for emp in db.query(CandidateEmployer).filter(CandidateEmployer.candidate_id == dup_id).all():
                emp.candidate_id = master.id

            # 6. CandidateCertification
            for cert in db.query(CandidateCertification).filter(CandidateCertification.candidate_id == dup_id).all():
                cert.candidate_id = master.id

            # 7. CandidateAuditLog
            for log in db.query(CandidateAuditLog).filter(CandidateAuditLog.candidate_id == dup_id).all():
                log.candidate_id = master.id

            # 8. CandidateCommunications
            for comm in db.query(CandidateCommunication).filter(CandidateCommunication.candidate_id == dup_id).all():
                comm.candidate_id = master.id

            # 9. SourcingSearchResult
            dup_s_res = db.query(SourcingSearchResult).filter(SourcingSearchResult.candidate_id == dup_id).all()
            for sr in dup_s_res:
                existing = db.query(SourcingSearchResult).filter(
                    SourcingSearchResult.search_id == sr.search_id,
                    SourcingSearchResult.candidate_id == master.id
                ).first()
                if existing:
                    db.delete(sr)
                else:
                    sr.candidate_id = master.id

            # 10. CandidateMatch
            dup_matches = db.query(CandidateMatch).filter(CandidateMatch.candidate_id == dup_id).all()
            for m in dup_matches:
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
            total_candidates_removed += 1

    db.commit()
    remaining = db.query(Candidate).count()
    print(f"Finished Candidate deduplication: removed {total_candidates_removed}, remaining {remaining}")


def deduplicate_candidate_matches(db):
    print("\n--- 3. Deduplicating Candidate Matches ---")
    matches = db.query(CandidateMatch).order_by(CandidateMatch.id).all()
    print(f"Current CandidateMatches count: {len(matches)}")
    seen = {}
    removed = 0
    for m in matches:
        key = (m.run_id, m.candidate_id)
        if key in seen:
            db.delete(m)
            removed += 1
        else:
            seen[key] = m
    db.commit()
    print(f"CandidateMatches deduplicated: removed {removed}, remaining {len(seen)}")


def main():
    db = SessionLocal()
    try:
        deduplicate_job_requirements(db)
        deduplicate_candidates(db)
        deduplicate_candidate_matches(db)
        print("\nAll platform-wide deduplication operations completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
