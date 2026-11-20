"""
Manual TA Distribution & Candidate Ownership Service for TALENTRA Phase 4.

Provides business logic for human-controlled candidate distribution,
duplicate assignment prevention, audit history tracking, notes, and workload analytics.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from backend.app.models.user import User, UserRole
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.matching import CandidateMatch
from backend.app.models.assignment import (
    CandidateAssignment,
    AssignmentStatus,
    AssignmentHistory,
    AssignmentNote,
    AssignmentNotification,
)
from backend.app.core.security import hash_password


class AssignmentService:
    """
    Service managing manual candidate-to-TA distribution workflows.
    """

    @classmethod
    def get_or_create_default_tas(cls, db: Session) -> List[User]:
        """
        Retrieves active TAs and Managers from users table, bootstrapping
        initial enterprise directory accounts if none exist.
        """
        tas = db.query(User).filter(
            User.role.in_([UserRole.TA_RECRUITER, UserRole.RECRUITMENT_MANAGER]),
            User.is_active == True,
        ).all()

        if not tas:
            default_profiles = [
                {
                    "email": "sarah.j@talentra.ai",
                    "full_name": "Sarah Jenkins",
                    "role": UserRole.TA_RECRUITER,
                    "team": "Cloud & DevOps",
                    "specialization": "Kubernetes, AWS, Docker, Python, Terraform",
                    "phone": "+1 (555) 234-5678",
                },
                {
                    "email": "david.c@talentra.ai",
                    "full_name": "David Chen",
                    "role": UserRole.TA_RECRUITER,
                    "team": "Enterprise & Data",
                    "specialization": "SAP, Oracle, Hyperion, Data Engineering, SQL",
                    "phone": "+1 (555) 345-6789",
                },
                {
                    "email": "aisha.p@talentra.ai",
                    "full_name": "Aisha Patel",
                    "role": UserRole.TA_RECRUITER,
                    "team": "Full Stack & Web",
                    "specialization": "React, TypeScript, Java, Spring Boot, Node.js",
                    "phone": "+91 98765 43210",
                },
                {
                    "email": "marcus.v@talentra.ai",
                    "full_name": "Marcus Vance",
                    "role": UserRole.RECRUITMENT_MANAGER,
                    "team": "Talent Operations",
                    "specialization": "Engineering Staffing & Requisition Management",
                    "phone": "+1 (555) 456-7890",
                },
            ]

            for p in default_profiles:
                u = User(
                    email=p["email"],
                    hashed_password=hash_password("Talentra2026!"),
                    full_name=p["full_name"],
                    role=p["role"],
                    team=p["team"],
                    technical_specialization=p["specialization"],
                    work_phone=p["phone"],
                    is_active=True,
                )
                db.add(u)
            db.commit()
            tas = db.query(User).filter(
                User.role.in_([UserRole.TA_RECRUITER, UserRole.RECRUITMENT_MANAGER]),
                User.is_active == True,
            ).all()

        return tas

    @classmethod
    def get_ta_directory(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Returns full TA directory with live assignment counts and active workload.
        """
        tas = cls.get_or_create_default_tas(db)
        results = []

        for ta in tas:
            active_count = db.query(CandidateAssignment).filter(
                CandidateAssignment.ta_user_id == ta.id,
                CandidateAssignment.is_active == True,
            ).count()

            completed_count = db.query(CandidateAssignment).filter(
                CandidateAssignment.ta_user_id == ta.id,
                CandidateAssignment.status == AssignmentStatus.COMPLETED,
            ).count()

            results.append({
                "id": ta.id,
                "full_name": ta.full_name,
                "email": ta.email,
                "role": ta.role,
                "team": ta.team or "General Staffing",
                "technical_specialization": ta.technical_specialization or "General",
                "work_phone": ta.work_phone or "—",
                "is_active": ta.is_active,
                "active_assignments": active_count,
                "completed_assignments": completed_count,
            })

        return results

    @classmethod
    def assign_candidates_to_ta(
        cls,
        db: Session,
        candidate_ids: List[int],
        jd_id: int,
        ta_user_id: int,
        assigned_by_user_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Manually assigns a list of candidates against a Job Description to a TA.
        Prevents duplicate active assignments and logs assignment history.
        """
        ta = db.query(User).filter(User.id == ta_user_id, User.is_active == True).first()
        if not ta:
            raise ValueError(f"Talent Acquisition Specialist with id {ta_user_id} not found or inactive.")

        jd = db.query(JobDescriptionDocument).filter(JobDescriptionDocument.id == jd_id).first()
        if not jd:
            raise ValueError(f"Job Description Document with id {jd_id} not found.")

        created_count = 0
        reassigned_count = 0
        skipped_duplicates = 0

        for cand_id in candidate_ids:
            cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
            if not cand:
                continue

            # Look up recent matching score snapshot if available
            match_rec = db.query(CandidateMatch).filter(
                CandidateMatch.candidate_id == cand_id,
                CandidateMatch.jd_id == jd_id,
            ).order_by(desc(CandidateMatch.created_at)).first()

            score_val = match_rec.overall_score if match_rec else None
            segment_val = match_rec.segment if match_rec else "Unsegmented"

            # Check for existing active assignment for this candidate + JD
            existing = db.query(CandidateAssignment).filter(
                CandidateAssignment.candidate_id == cand_id,
                CandidateAssignment.jd_id == jd_id,
                CandidateAssignment.is_active == True,
            ).first()

            if existing:
                if existing.ta_user_id == ta_user_id:
                    # Duplicate: candidate is ALREADY actively assigned to this exact TA for this JD!
                    skipped_duplicates += 1
                    continue
                else:
                    # Reassignment: candidate was assigned to another TA; transfer ownership!
                    prev_ta_id = existing.ta_user_id
                    existing.ta_user_id = ta_user_id
                    existing.updated_at = datetime.now(timezone.utc)
                    if notes:
                        existing.notes = (existing.notes or "") + f"\n[{datetime.now(timezone.utc).strftime('%Y-%m-%d')}] {notes}"

                    hist = AssignmentHistory(
                        assignment_id=existing.id,
                        previous_ta_id=prev_ta_id,
                        new_ta_id=ta_user_id,
                        previous_status=existing.status,
                        new_status=existing.status,
                        action="reassigned",
                        changed_by_user_id=assigned_by_user_id,
                        note=notes or f"Reassigned to {ta.full_name}",
                    )
                    db.add(hist)
                    reassigned_count += 1
            else:
                # Brand new assignment
                assignment = CandidateAssignment(
                    candidate_id=cand_id,
                    jd_id=jd_id,
                    ta_user_id=ta_user_id,
                    assigned_by_user_id=assigned_by_user_id,
                    status=AssignmentStatus.ASSIGNED,
                    is_active=True,
                    matching_score=score_val,
                    segment=segment_val,
                    notes=notes,
                )
                db.add(assignment)
                db.flush()

                hist = AssignmentHistory(
                    assignment_id=assignment.id,
                    previous_ta_id=None,
                    new_ta_id=ta_user_id,
                    previous_status=None,
                    new_status=AssignmentStatus.ASSIGNED,
                    action="assigned",
                    changed_by_user_id=assigned_by_user_id,
                    note=notes or f"Assigned to {ta.full_name}",
                )
                db.add(hist)
                created_count += 1

        # Send in-app notification to the assigned TA
        total_assigned = created_count + reassigned_count
        if total_assigned > 0:
            notif = AssignmentNotification(
                recipient_user_id=ta_user_id,
                title="New Candidate Assignments",
                message=f"You have been assigned {total_assigned} candidate(s) for requisition [{jd.doc_id}] {jd.original_filename}.",
                notification_type="assignment",
            )
            db.add(notif)

        db.commit()

        return {
            "status": "success",
            "ta_id": ta.id,
            "ta_name": ta.full_name,
            "jd_id": jd_id,
            "jd_title": jd.original_filename,
            "assigned_count": created_count,
            "reassigned_count": reassigned_count,
            "skipped_duplicates": skipped_duplicates,
            "total_processed": len(candidate_ids),
        }

    @classmethod
    def unassign_candidate(
        cls,
        db: Session,
        assignment_id: int,
        changed_by_user_id: Optional[int] = None,
        note: Optional[str] = None,
    ) -> bool:
        """
        Deactivates an active assignment and records audit history.
        """
        assignment = db.query(CandidateAssignment).filter(CandidateAssignment.id == assignment_id).first()
        if not assignment:
            return False

        prev_ta_id = assignment.ta_user_id
        assignment.is_active = False
        assignment.updated_at = datetime.now(timezone.utc)

        hist = AssignmentHistory(
            assignment_id=assignment.id,
            previous_ta_id=prev_ta_id,
            new_ta_id=None,
            previous_status=assignment.status,
            new_status="Unassigned",
            action="unassigned",
            changed_by_user_id=changed_by_user_id,
            note=note or "Unassigned from candidate pool",
        )
        db.add(hist)
        db.commit()
        return True

    @classmethod
    def update_status(
        cls,
        db: Session,
        assignment_id: int,
        new_status: str,
        changed_by_user_id: Optional[int] = None,
        note: Optional[str] = None,
    ) -> bool:
        """
        Updates the assignment recruitment status and appends audit record.
        """
        if new_status not in AssignmentStatus.ALL_STATUSES:
            raise ValueError(f"Invalid assignment status: {new_status}")

        assignment = db.query(CandidateAssignment).filter(CandidateAssignment.id == assignment_id).first()
        if not assignment:
            return False

        prev_status = assignment.status
        assignment.status = new_status
        assignment.updated_at = datetime.now(timezone.utc)

        hist = AssignmentHistory(
            assignment_id=assignment.id,
            previous_ta_id=assignment.ta_user_id,
            new_ta_id=assignment.ta_user_id,
            previous_status=prev_status,
            new_status=new_status,
            action="status_changed",
            changed_by_user_id=changed_by_user_id,
            note=note or f"Status updated from {prev_status} to {new_status}",
        )
        db.add(hist)
        db.commit()
        return True

    @classmethod
    def add_note(
        cls,
        db: Session,
        assignment_id: int,
        author_user_id: int,
        content: str,
    ) -> AssignmentNote:
        """
        Adds an internal recruiter note to a candidate assignment.
        """
        note = AssignmentNote(
            assignment_id=assignment_id,
            author_user_id=author_user_id,
            content=content.strip(),
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    @classmethod
    def get_manager_dashboard_summary(cls, db: Session) -> Dict[str, Any]:
        """
        Calculates executive workload metrics across TAs, requisitions, and recruitment statuses.
        """
        total_active_tas = db.query(User).filter(
            User.role == UserRole.TA_RECRUITER,
            User.is_active == True,
        ).count()

        total_active_assignments = db.query(CandidateAssignment).filter(
            CandidateAssignment.is_active == True,
        ).count()

        contacted_count = db.query(CandidateAssignment).filter(
            CandidateAssignment.is_active == True,
            CandidateAssignment.status.in_([AssignmentStatus.CONTACTED, AssignmentStatus.INTERESTED, AssignmentStatus.SHORTLISTED]),
        ).count()

        shortlisted_count = db.query(CandidateAssignment).filter(
            CandidateAssignment.is_active == True,
            CandidateAssignment.status == AssignmentStatus.SHORTLISTED,
        ).count()

        pending_followup = db.query(CandidateAssignment).filter(
            CandidateAssignment.is_active == True,
            CandidateAssignment.status == AssignmentStatus.FOLLOW_UP_REQUIRED,
        ).count()

        # Breakdown by status
        status_counts = {}
        for st in AssignmentStatus.ALL_STATUSES:
            cnt = db.query(CandidateAssignment).filter(
                CandidateAssignment.is_active == True,
                CandidateAssignment.status == st,
            ).count()
            status_counts[st] = cnt

        # Breakdown by TA
        ta_breakdown = []
        tas = db.query(User).filter(
            User.role.in_([UserRole.TA_RECRUITER, UserRole.RECRUITMENT_MANAGER]),
            User.is_active == True,
        ).all()

        for t in tas:
            assigned = db.query(CandidateAssignment).filter(
                CandidateAssignment.ta_user_id == t.id,
                CandidateAssignment.is_active == True,
            ).count()
            ta_breakdown.append({
                "ta_id": t.id,
                "ta_name": t.full_name,
                "team": t.team or "General",
                "assigned_count": assigned,
            })

        return {
            "total_active_tas": total_active_tas,
            "total_active_assignments": total_active_assignments,
            "contacted_count": contacted_count,
            "shortlisted_count": shortlisted_count,
            "pending_followup": pending_followup,
            "status_breakdown": status_counts,
            "ta_workload": ta_breakdown,
        }
