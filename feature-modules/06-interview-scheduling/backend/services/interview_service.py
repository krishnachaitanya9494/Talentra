"""
Core Business Logic and Validation Engine for Module 06 — Advanced Interview Scheduling & Coordination System.
Inspired by Ashby interview scheduling.

Implements:
- Shared Availability & Working-Hour Engine (F07)
- Interviewer Workload Calculations & Capacity Enforcement (F02)
- Candidate Availability Collection & Matching (F01)
- Transaction-Safe Candidate Self-Booking (F03)
- Automatic Replacement Suggestions with Recruiter Approval (F04)
- Multi-Stage Interview Templates (F05)
- Candidate Rescheduling Portal (F08)
- RFC 5545 iCalendar (.ics) generation & Invitation Previews
"""

import json
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

try:
    from ..models.interview_models import (
        InterviewSchedule,
        InterviewPanelMember,
        InterviewAvailability,
        InterviewerWorkingHours,
        CandidateAvailabilityRequest,
        CandidateAvailabilitySlot,
        CandidateBookingRequest,
        InterviewTemplate,
        InterviewTemplateStage,
        InterviewRescheduleRequest as RescheduleRequestModel,
        InterviewHistory,
    )
    from ...contracts.interview_schemas import (
        InterviewCreateRequest,
        InterviewUpdateRequest,
        InterviewRescheduleRequest,
        InterviewCancelRequest,
        AvailabilityCheckRequest,
        AvailabilityCheckResponse,
        AvailabilityConflict,
        InvitationPreviewResponse,
        InterviewerWorkloadResponse,
        WorkingHoursUpdateRequest,
        AvailabilityRequestCreate,
        AvailabilitySubmissionRequest,
        BookingLinkCreateRequest,
        CandidateBookingConfirmRequest,
        ReplacementSuggestion,
        InterviewerReplacementRequest,
        InterviewTemplateCreateRequest,
        RescheduleSubmitRequest,
        RescheduleResolutionRequest,
    )
except (ImportError, ValueError):
    from backend.models.interview_models import (
        InterviewSchedule,
        InterviewPanelMember,
        InterviewAvailability,
        InterviewerWorkingHours,
        CandidateAvailabilityRequest,
        CandidateAvailabilitySlot,
        CandidateBookingRequest,
        InterviewTemplate,
        InterviewTemplateStage,
        InterviewRescheduleRequest as RescheduleRequestModel,
        InterviewHistory,
    )
    from contracts.interview_schemas import (
        InterviewCreateRequest,
        InterviewUpdateRequest,
        InterviewRescheduleRequest,
        InterviewCancelRequest,
        AvailabilityCheckRequest,
        AvailabilityCheckResponse,
        AvailabilityConflict,
        InvitationPreviewResponse,
        InterviewerWorkloadResponse,
        WorkingHoursUpdateRequest,
        AvailabilityRequestCreate,
        AvailabilitySubmissionRequest,
        BookingLinkCreateRequest,
        CandidateBookingConfirmRequest,
        ReplacementSuggestion,
        InterviewerReplacementRequest,
        InterviewTemplateCreateRequest,
        RescheduleSubmitRequest,
        RescheduleResolutionRequest,
    )


class SchedulingConflictException(Exception):
    """Raised when an interview violates candidate, interviewer, or workload availability."""
    def __init__(self, conflicts: List[Dict[str, Any]], message: str = "Scheduling conflict detected"):
        super().__init__(message)
        self.conflicts = conflicts
        self.message = message


class InterviewService:
    """
    Unified Shared Scheduling Engine providing deterministic conflict-free coordination.
    """

    @staticmethod
    def time_to_minutes(time_str: str) -> int:
        """Converts HH:MM string to total minutes from midnight."""
        parts = time_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])

    @staticmethod
    def minutes_to_time(minutes: int) -> str:
        """Converts total minutes from midnight to HH:MM string."""
        h = minutes // 60
        m = minutes % 60
        return f"{h:02d}:{m:02d}"

    @classmethod
    def check_time_overlap(
        cls, start_a: str, end_a: str, start_b: str, end_b: str
    ) -> bool:
        """
        Determines whether two time windows [start_a, end_a) and [start_b, end_b) overlap.
        Overlap exists if start_a < end_b and start_b < end_a.
        """
        s_a = cls.time_to_minutes(start_a)
        e_a = cls.time_to_minutes(end_a)
        s_b = cls.time_to_minutes(start_b)
        e_b = cls.time_to_minutes(end_b)
        return max(s_a, s_b) < min(e_a, e_b)

    # =========================================================================
    # MANDATORY FEATURE 07: WORKING HOURS & CONFLICT ENGINE
    # =========================================================================

    @classmethod
    def get_or_create_working_hours(cls, db: Session, interviewer_id: int, name: str = "Evaluator") -> InterviewerWorkingHours:
        """Retrieves or initializes default working hours for an interviewer."""
        wh = db.query(InterviewerWorkingHours).filter_by(interviewer_id=interviewer_id).first()
        if not wh:
            wh = InterviewerWorkingHours(
                interviewer_id=interviewer_id,
                interviewer_name=name,
                role="Technical Evaluator",
                specialization="Software Engineering",
                timezone="UTC",
                working_days_json="[0, 1, 2, 3, 4]",  # Mon-Fri
                start_time="09:00",
                end_time="18:00",
                lunch_start="12:30",
                lunch_end="13:30",
                max_daily_interviews=5,
                max_weekly_interviews=20,
                max_daily_hours=6.0,
                buffer_minutes=15,
                skills_json=json.dumps(["General", "Backend", "Frontend", "System Design"]),
            )
            db.add(wh)
            db.commit()
            db.refresh(wh)
        return wh

    @classmethod
    def check_availability(
        cls,
        db: Session,
        request: AvailabilityCheckRequest,
        interviewer_name_map: Optional[Dict[int, str]] = None,
    ) -> Tuple[bool, List[AvailabilityConflict]]:
        """
        Comprehensive conflict checker validating:
        1. Candidate availability against existing active interviews.
        2. Interviewers against existing active interviews.
        3. Interviewers against configured working-hour boundaries (F07).
        4. Interviewers against lunch breaks and busy blocks.
        5. Workload capacity warnings (F02).
        """
        conflicts: List[AvailabilityConflict] = []
        name_map = interviewer_name_map or {}

        # 1. Check Candidate Availability
        if request.candidate_id:
            cand_interviews_query = db.query(InterviewSchedule).filter(
                InterviewSchedule.candidate_id == request.candidate_id,
                InterviewSchedule.interview_date == request.interview_date,
                InterviewSchedule.status.notin_(["cancelled"]),
            )
            if request.exclude_interview_id:
                cand_interviews_query = cand_interviews_query.filter(
                    InterviewSchedule.id != request.exclude_interview_id
                )

            cand_interviews = cand_interviews_query.all()
            for ci in cand_interviews:
                if cls.check_time_overlap(request.start_time, request.end_time, ci.start_time, ci.end_time):
                    conflicts.append(
                        AvailabilityConflict(
                            type="candidate",
                            person_id=ci.candidate_id,
                            person_name=ci.candidate_name,
                            conflict_time=f"{ci.start_time} - {ci.end_time}",
                            reason=f"Candidate has concurrent session ({ci.round_name})",
                        )
                    )

        # Parse weekday for working hours check
        try:
            req_date = datetime.strptime(request.interview_date, "%Y-%m-%d")
            weekday = req_date.weekday()  # 0=Mon, 6=Sun
        except Exception:
            weekday = 0

        # 2. Check Interviewers
        for int_id in request.interviewer_ids:
            int_name = name_map.get(int_id, f"Interviewer #{int_id}")
            wh = cls.get_or_create_working_hours(db, int_id, int_name)

            # Check working day
            allowed_days = json.loads(wh.working_days_json or "[0,1,2,3,4]")
            if weekday not in allowed_days:
                conflicts.append(
                    AvailabilityConflict(
                        type="working_hours",
                        person_id=int_id,
                        person_name=int_name,
                        conflict_time=f"{request.start_time} - {request.end_time}",
                        reason=f"Date {request.interview_date} falls outside configured working days",
                    )
                )

            # Check daily working hour window
            if cls.time_to_minutes(request.start_time) < cls.time_to_minutes(wh.start_time) or \
               cls.time_to_minutes(request.end_time) > cls.time_to_minutes(wh.end_time):
                conflicts.append(
                    AvailabilityConflict(
                        type="working_hours",
                        person_id=int_id,
                        person_name=int_name,
                        conflict_time=f"{request.start_time} - {request.end_time}",
                        reason=f"Slot is outside working hours ({wh.start_time} - {wh.end_time})",
                    )
                )

            # Check lunch break overlap
            if wh.lunch_start and wh.lunch_end:
                if cls.check_time_overlap(request.start_time, request.end_time, wh.lunch_start, wh.lunch_end):
                    conflicts.append(
                        AvailabilityConflict(
                            type="busy_block",
                            person_id=int_id,
                            person_name=int_name,
                            conflict_time=f"{wh.lunch_start} - {wh.lunch_end}",
                            reason="Slot overlaps with scheduled lunch break",
                        )
                    )

            # Check busy blocks from InterviewAvailability
            busy_blocks = db.query(InterviewAvailability).filter(
                InterviewAvailability.interviewer_id == int_id,
                or_(
                    InterviewAvailability.specific_date == request.interview_date,
                    and_(
                        InterviewAvailability.specific_date.is_(None),
                        InterviewAvailability.day_of_week == weekday,
                    ),
                ),
            ).all()

            for bb in busy_blocks:
                if cls.check_time_overlap(request.start_time, request.end_time, bb.start_time, bb.end_time):
                    conflicts.append(
                        AvailabilityConflict(
                            type="busy_block",
                            person_id=int_id,
                            person_name=int_name,
                            conflict_time=f"{bb.start_time} - {bb.end_time}",
                            reason=f"Interviewer is unavailable: {bb.label}",
                        )
                    )

            # Check existing scheduled interviews with panel members
            scheduled_members = db.query(InterviewPanelMember).join(InterviewSchedule).filter(
                InterviewPanelMember.interviewer_id == int_id,
                InterviewSchedule.interview_date == request.interview_date,
                InterviewSchedule.status.notin_(["cancelled"]),
            )
            if request.exclude_interview_id:
                scheduled_members = scheduled_members.filter(
                    InterviewSchedule.id != request.exclude_interview_id
                )

            for sm in scheduled_members.all():
                sched = sm.interview
                if cls.check_time_overlap(request.start_time, request.end_time, sched.start_time, sched.end_time):
                    conflicts.append(
                        AvailabilityConflict(
                            type="interviewer",
                            person_id=int_id,
                            person_name=int_name,
                            conflict_time=f"{sched.start_time} - {sched.end_time}",
                            reason=f"Already booked for session {sched.interview_code} ({sched.candidate_name})",
                        )
                    )

        is_available = len([c for c in conflicts if c.type in ("interviewer", "candidate", "busy_block")]) == 0
        return is_available, conflicts

    # =========================================================================
    # MANDATORY FEATURE 02: INTERVIEWER WORKLOAD ENGINE
    # =========================================================================

    @classmethod
    def calculate_interviewer_workload(
        cls, db: Session, interviewer_id: int, target_date: str
    ) -> InterviewerWorkloadResponse:
        """
        Calculates exact real-time workload metrics for an interviewer:
        - Daily interview count & duration
        - Weekly interview count & duration
        - Capacity limit status: comfortable, approaching, exceeded
        """
        dt = datetime.strptime(target_date, "%Y-%m-%d")
        # Week range: Monday to Sunday
        start_of_week = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
        end_of_week = (dt + timedelta(days=6 - dt.weekday())).strftime("%Y-%m-%d")

        wh = cls.get_or_create_working_hours(db, interviewer_id)

        # Daily sessions
        daily_sessions = db.query(InterviewSchedule).join(InterviewPanelMember).filter(
            InterviewPanelMember.interviewer_id == interviewer_id,
            InterviewSchedule.interview_date == target_date,
            InterviewSchedule.status.notin_(["cancelled"]),
        ).all()

        daily_count = len(daily_sessions)
        daily_minutes = sum(s.duration_minutes for s in daily_sessions)
        daily_hours = round(daily_minutes / 60.0, 2)

        # Weekly sessions
        weekly_sessions = db.query(InterviewSchedule).join(InterviewPanelMember).filter(
            InterviewPanelMember.interviewer_id == interviewer_id,
            InterviewSchedule.interview_date >= start_of_week,
            InterviewSchedule.interview_date <= end_of_week,
            InterviewSchedule.status.notin_(["cancelled"]),
        ).all()

        weekly_count = len(weekly_sessions)
        weekly_minutes = sum(s.duration_minutes for s in weekly_sessions)
        weekly_hours = round(weekly_minutes / 60.0, 2)

        max_daily = wh.max_daily_interviews or 5
        max_weekly = wh.max_weekly_interviews or 20
        remaining_daily = max(0, max_daily - daily_count)

        pct = (daily_count / max_daily) * 100 if max_daily > 0 else 0

        if daily_count >= max_daily or daily_hours >= (wh.max_daily_hours or 6.0):
            load_status = "exceeded"
        elif daily_count >= max_daily * 0.7:
            load_status = "approaching"
        else:
            load_status = "comfortable"

        return InterviewerWorkloadResponse(
            interviewer_id=interviewer_id,
            interviewer_name=wh.interviewer_name,
            role=wh.role,
            specialization=wh.specialization,
            timezone=wh.timezone,
            daily_count=daily_count,
            weekly_count=weekly_count,
            daily_hours=daily_hours,
            weekly_hours=weekly_hours,
            max_daily_interviews=max_daily,
            max_weekly_interviews=max_weekly,
            max_daily_hours=wh.max_daily_hours or 6.0,
            remaining_daily_capacity=remaining_daily,
            load_status=load_status,
            utilization_percentage=round(pct, 1),
        )

    # =========================================================================
    # AVAILABLE SLOTS GENERATOR (FOR F01, F03, F08)
    # =========================================================================

    @classmethod
    def get_available_slots(
        cls,
        db: Session,
        interviewer_ids: List[int],
        date_str: str,
        duration_minutes: int = 60,
        buffer_minutes: int = 15,
    ) -> List[Dict[str, str]]:
        """
        Calculates all free, conflict-free time slots on `date_str` where ALL specified interviewers
        are within working hours, not on lunch, and have no conflicting sessions.
        """
        if not interviewer_ids:
            return []

        # Find day start and end intersection
        start_min = 9 * 60    # 09:00
        end_min = 18 * 60     # 18:00

        for int_id in interviewer_ids:
            wh = cls.get_or_create_working_hours(db, int_id)
            start_min = max(start_min, cls.time_to_minutes(wh.start_time))
            end_min = min(end_min, cls.time_to_minutes(wh.end_time))

        step = 30  # 30-minute intervals
        available_slots = []
        cur = start_min

        while cur + duration_minutes <= end_min:
            s_time = cls.minutes_to_time(cur)
            e_time = cls.minutes_to_time(cur + duration_minutes)

            # Check availability across all interviewers
            req = AvailabilityCheckRequest(
                interview_date=date_str,
                start_time=s_time,
                end_time=e_time,
                interviewer_ids=interviewer_ids,
            )
            is_avail, _ = cls.check_availability(db, req)

            if is_avail:
                available_slots.append({"start_time": s_time, "end_time": e_time, "date": date_str})
                cur += duration_minutes + buffer_minutes
            else:
                cur += step

        return available_slots

    # =========================================================================
    # MANDATORY FEATURE 04: AUTOMATIC REPLACEMENT SUGGESTIONS
    # =========================================================================

    @classmethod
    def find_replacement_suggestions(
        cls, db: Session, interview_id: int, exclude_interviewer_id: int
    ) -> List[ReplacementSuggestion]:
        """
        Recommends alternative interviewers when an assigned evaluator has a conflict.
        Evaluates technical specialization match, availability at slot, and workload.
        """
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            return []

        # Load all configured evaluators except the one being replaced
        all_evaluators = db.query(InterviewerWorkingHours).filter(
            InterviewerWorkingHours.interviewer_id != exclude_interviewer_id
        ).all()

        current_panel_ids = [
            p.interviewer_id for p in interview.panel_members if p.interviewer_id != exclude_interviewer_id
        ]

        suggestions: List[ReplacementSuggestion] = []

        for ev in all_evaluators:
            if ev.interviewer_id in current_panel_ids:
                continue  # already on panel

            reasons = []
            score = 50  # base score

            # 1. Check availability at exact time
            req = AvailabilityCheckRequest(
                interview_date=interview.interview_date,
                start_time=interview.start_time,
                end_time=interview.end_time,
                interviewer_ids=[ev.interviewer_id],
            )
            is_avail, conflicts = cls.check_availability(db, req)
            if is_avail:
                score += 30
                reasons.append("Fully available at the scheduled interview slot")
            else:
                score -= 30
                reasons.append(f"Has conflicts: {conflicts[0].reason if conflicts else 'Busy'}")

            # 2. Check specialization / skills match
            round_lower = interview.round_name.lower()
            skills_list = [s.lower() for s in json.loads(ev.skills_json or "[]")]
            spec_lower = (ev.specialization or "").lower()

            if any(k in round_lower for k in ["tech", "system", "coding", "software"]):
                if any(s in spec_lower or s in skills_list for s in ["technical", "software", "backend", "full stack"]):
                    score += 15
                    reasons.append(f"Domain match: {ev.specialization}")
                else:
                    reasons.append(f"Different specialization ({ev.specialization})")
            elif "manager" in round_lower and "manager" in ev.role.lower():
                score += 15
                reasons.append("Managerial qualification matched")
            elif "hr" in round_lower and "hr" in ev.role.lower():
                score += 15
                reasons.append("HR evaluation background matched")

            # 3. Check workload capacity
            workload = cls.calculate_interviewer_workload(db, ev.interviewer_id, interview.interview_date)
            if workload.load_status == "comfortable":
                score += 10
                reasons.append(f"Comfortable workload ({workload.daily_count}/{workload.max_daily_interviews} today)")
            elif workload.load_status == "approaching":
                score += 0
                reasons.append(f"Approaching capacity ({workload.daily_count}/{workload.max_daily_interviews} today)")
            else:
                score -= 20
                reasons.append(f"Capacity exceeded ({workload.daily_count}/{workload.max_daily_interviews} today)")

            final_score = max(5, min(98, score))

            suggestions.append(
                ReplacementSuggestion(
                    interviewer_id=ev.interviewer_id,
                    interviewer_name=ev.interviewer_name,
                    role=ev.role,
                    specialization=ev.specialization,
                    match_score=final_score,
                    is_available_at_slot=is_avail,
                    workload_status=workload.load_status,
                    daily_count=workload.daily_count,
                    max_daily=workload.max_daily_interviews,
                    reasons=reasons,
                )
            )

        # Sort by match score descending
        suggestions.sort(key=lambda s: s.match_score, reverse=True)
        return suggestions

    @classmethod
    def replace_interviewer(
        cls, db: Session, interview_id: int, req: InterviewerReplacementRequest
    ) -> Dict[str, Any]:
        """
        Executes a recruiter-approved replacement of an interviewer.
        Updates panel membership and logs an immutable audit trail.
        """
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError(f"Interview #{interview_id} not found.")

        # Find old panel member
        old_member = db.query(InterviewPanelMember).filter_by(
            interview_id=interview_id, interviewer_id=req.old_interviewer_id
        ).first()

        new_wh = cls.get_or_create_working_hours(db, req.new_interviewer_id)

        old_name = old_member.interviewer_name if old_member else f"Interviewer #{req.old_interviewer_id}"
        new_name = new_wh.interviewer_name

        if old_member:
            old_member.interviewer_id = req.new_interviewer_id
            old_member.interviewer_name = new_name
            old_member.interviewer_role = new_wh.role
            old_member.specialization = new_wh.specialization
        else:
            new_member = InterviewPanelMember(
                interview_id=interview_id,
                interviewer_id=req.new_interviewer_id,
                interviewer_name=new_name,
                interviewer_role=new_wh.role,
                specialization=new_wh.specialization,
                is_lead=False,
            )
            db.add(new_member)

        # Audit History Log
        history = InterviewHistory(
            interview_id=interview_id,
            action="replaced_interviewer",
            changed_by=req.approved_by,
            details=f"Replaced {old_name} with {new_name}. Reason: {req.reason}",
            old_values_json=json.dumps({"interviewer_id": req.old_interviewer_id, "interviewer_name": old_name}),
            new_values_json=json.dumps({"interviewer_id": req.new_interviewer_id, "interviewer_name": new_name}),
        )
        db.add(history)
        db.commit()
        db.refresh(interview)
        return interview.to_dict()

    # =========================================================================
    # MANDATORY FEATURE 01: CANDIDATE AVAILABILITY COLLECTION
    # =========================================================================

    @classmethod
    def create_availability_request(
        cls, db: Session, req: AvailabilityRequestCreate
    ) -> Dict[str, Any]:
        """Generates a secure candidate availability collection request with cryptographic token."""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.expiration_days)

        avail_req = CandidateAvailabilityRequest(
            token=token,
            candidate_id=req.candidate_id,
            candidate_name=req.candidate_name,
            candidate_email=req.candidate_email,
            jd_id=req.jd_id,
            jd_title=req.jd_title,
            round_name=req.round_name,
            duration_minutes=req.duration_minutes,
            date_range_start=req.date_range_start,
            date_range_end=req.date_range_end,
            time_windows_json=json.dumps(req.time_windows),
            status="request_sent",
            candidate_timezone="UTC",
            expires_at=expires_at,
        )
        db.add(avail_req)
        db.commit()
        db.refresh(avail_req)
        return avail_req.to_dict()

    @classmethod
    def submit_candidate_availability(
        cls, db: Session, token: str, submission: AvailabilitySubmissionRequest
    ) -> Dict[str, Any]:
        """Handles candidate submission of preferred dates and time slots."""
        avail_req = db.query(CandidateAvailabilityRequest).filter_by(token=token).first()
        if not avail_req:
            raise ValueError("Availability request link is invalid or not found.")

        if datetime.now(timezone.utc) > avail_req.expires_at.replace(tzinfo=timezone.utc if avail_req.expires_at.tzinfo is None else None):
            avail_req.status = "expired"
            db.commit()
            raise ValueError("This availability request link has expired.")

        # Clear existing slots if resubmitted
        db.query(CandidateAvailabilitySlot).filter_by(request_id=avail_req.id).delete()

        for s in submission.preferred_slots:
            slot = CandidateAvailabilitySlot(
                request_id=avail_req.id,
                preferred_date=s.preferred_date,
                start_time=s.start_time,
                end_time=s.end_time,
                slot_priority=s.slot_priority,
            )
            db.add(slot)

        avail_req.status = "submitted"
        avail_req.candidate_timezone = submission.candidate_timezone
        avail_req.candidate_notes = submission.candidate_notes
        avail_req.submitted_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(avail_req)
        return avail_req.to_dict()

    # =========================================================================
    # MANDATORY FEATURE 03: CANDIDATE SELF-BOOKING
    # =========================================================================

    @classmethod
    def create_booking_link(
        cls, db: Session, req: BookingLinkCreateRequest
    ) -> Dict[str, Any]:
        """Generates a secure candidate booking link with approved slots and window."""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.expiration_days)

        booking = CandidateBookingRequest(
            token=token,
            candidate_id=req.candidate_id,
            candidate_name=req.candidate_name,
            candidate_email=req.candidate_email,
            jd_id=req.jd_id,
            jd_title=req.jd_title,
            round_name=req.round_name,
            duration_minutes=req.duration_minutes,
            interviewer_ids_json=json.dumps(req.interviewer_ids),
            booking_window_start=req.booking_window_start,
            booking_window_end=req.booking_window_end,
            status="active",
            expires_at=expires_at,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking.to_dict()

    @classmethod
    def confirm_candidate_booking(
        cls, db: Session, token: str, confirm_req: CandidateBookingConfirmRequest
    ) -> Dict[str, Any]:
        """
        Transactional booking validation and creation for self-service candidate bookings.
        Validates availability, working hours, and workload to prevent race conditions.
        """
        booking = db.query(CandidateBookingRequest).filter_by(token=token).first()
        if not booking:
            raise ValueError("Booking link is invalid or does not exist.")

        if booking.status != "active":
            raise ValueError(f"Booking link is no longer active (status: {booking.status}).")

        if datetime.now(timezone.utc) > booking.expires_at.replace(tzinfo=timezone.utc if booking.expires_at.tzinfo is None else None):
            booking.status = "expired"
            db.commit()
            raise ValueError("Booking link has expired.")

        interviewer_ids = json.loads(booking.interviewer_ids_json or "[]")

        # Atomic availability check
        avail_check = AvailabilityCheckRequest(
            interview_date=confirm_req.selected_date,
            start_time=confirm_req.selected_start_time,
            end_time=confirm_req.selected_end_time,
            candidate_id=booking.candidate_id,
            interviewer_ids=interviewer_ids,
        )
        is_avail, conflicts = cls.check_availability(db, avail_check)
        if not is_avail:
            raise SchedulingConflictException(
                conflicts=[c.model_dump() for c in conflicts],
                message="The chosen slot has just become unavailable. Please choose an alternative slot."
            )

        # Create the confirmed interview schedule
        create_payload = InterviewCreateRequest(
            candidate_id=booking.candidate_id,
            candidate_name=booking.candidate_name,
            candidate_email=booking.candidate_email,
            jd_id=booking.jd_id,
            jd_title=booking.jd_title,
            round_name=booking.round_name,
            interview_date=confirm_req.selected_date,
            start_time=confirm_req.selected_start_time,
            end_time=confirm_req.selected_end_time,
            timezone=confirm_req.candidate_timezone,
            mode="virtual_google_meet",
            instructions="Self-booked interview session. Please join with camera enabled.",
            recruiter_notes=confirm_req.notes,
            panel_interviewer_ids=interviewer_ids,
        )

        interview_data = cls.schedule_interview(db, create_payload)

        # Update booking link state
        booking.status = "booked"
        booking.booked_interview_id = interview_data["id"]
        db.commit()

        return interview_data

    # =========================================================================
    # MANDATORY FEATURE 05: MULTI-STAGE INTERVIEW TEMPLATES
    # =========================================================================

    @classmethod
    def create_interview_template(
        cls, db: Session, req: InterviewTemplateCreateRequest
    ) -> Dict[str, Any]:
        """Creates a global or job-specific multi-stage interview template."""
        tmpl = InterviewTemplate(
            name=req.name,
            description=req.description,
            is_global=req.is_global,
            jd_id=req.jd_id,
            is_active=True,
        )
        db.add(tmpl)
        db.flush()

        for idx, st in enumerate(req.stages, start=1):
            stage = InterviewTemplateStage(
                template_id=tmpl.id,
                stage_order=st.stage_order or idx,
                stage_name=st.stage_name,
                interview_type=st.interview_type,
                duration_minutes=st.duration_minutes,
                interviewer_role=st.interviewer_role,
                required_specialization=st.required_specialization,
                min_panel_size=st.min_panel_size,
                buffer_minutes=st.buffer_minutes,
                is_mandatory=st.is_mandatory,
            )
            db.add(stage)

        db.commit()
        db.refresh(tmpl)
        return tmpl.to_dict()

    @classmethod
    def duplicate_interview_template(cls, db: Session, template_id: int) -> Dict[str, Any]:
        """Duplicates an existing template with all its constituent stages."""
        orig = db.query(InterviewTemplate).filter_by(id=template_id).first()
        if not orig:
            raise ValueError(f"Template #{template_id} not found.")

        copy_tmpl = InterviewTemplate(
            name=f"{orig.name} (Copy)",
            description=orig.description,
            is_global=orig.is_global,
            jd_id=orig.jd_id,
            is_active=True,
        )
        db.add(copy_tmpl)
        db.flush()

        for st in orig.stages:
            stage = InterviewTemplateStage(
                template_id=copy_tmpl.id,
                stage_order=st.stage_order,
                stage_name=st.stage_name,
                interview_type=st.interview_type,
                duration_minutes=st.duration_minutes,
                interviewer_role=st.interviewer_role,
                required_specialization=st.required_specialization,
                min_panel_size=st.min_panel_size,
                buffer_minutes=st.buffer_minutes,
                is_mandatory=st.is_mandatory,
            )
            db.add(stage)

        db.commit()
        db.refresh(copy_tmpl)
        return copy_tmpl.to_dict()

    # =========================================================================
    # MANDATORY FEATURE 08: CANDIDATE RESCHEDULING PORTAL
    # =========================================================================

    @classmethod
    def create_reschedule_portal_link(
        cls, db: Session, interview_id: int, mode: str = "self_service", expiration_days: int = 5
    ) -> Dict[str, Any]:
        """Generates a secure rescheduling portal token for a candidate."""
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError(f"Interview #{interview_id} not found.")

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=expiration_days)

        resched_req = RescheduleRequestModel(
            token=token,
            interview_id=interview_id,
            mode=mode,
            reason="Candidate requested time adjustment",
            status="pending",
            expires_at=expires_at,
        )
        db.add(resched_req)
        db.commit()
        db.refresh(resched_req)

        return {
            "token": token,
            "interview": interview.to_dict(),
            "mode": mode,
            "expires_at": expires_at.isoformat(),
        }

    @classmethod
    def confirm_reschedule_portal(
        cls, db: Session, token: str, req: RescheduleSubmitRequest
    ) -> Dict[str, Any]:
        """Processes candidate rescheduling submission (self-service or request-based)."""
        portal = db.query(RescheduleRequestModel).filter_by(token=token).first()
        if not portal:
            raise ValueError("Rescheduling link is invalid or not found.")

        if portal.status in ["completed", "rejected"]:
            raise ValueError(f"This rescheduling request has already been processed ({portal.status}).")

        interview = portal.interview
        if not interview:
            raise ValueError("Associated interview not found.")

        portal.reason = req.reason
        portal.candidate_notes = req.candidate_notes
        portal.requested_date = req.new_date
        portal.requested_start_time = req.new_start_time
        portal.requested_end_time = req.new_end_time

        if portal.mode == "self_service" and req.new_date and req.new_start_time and req.new_end_time:
            # Recheck conflicts
            panel_ids = [p.interviewer_id for p in interview.panel_members]
            avail_req = AvailabilityCheckRequest(
                interview_date=req.new_date,
                start_time=req.new_start_time,
                end_time=req.new_end_time,
                candidate_id=interview.candidate_id,
                interviewer_ids=panel_ids,
                exclude_interview_id=interview.id,
            )
            is_avail, conflicts = cls.check_availability(db, avail_req)
            if not is_avail:
                raise SchedulingConflictException(
                    conflicts=[c.model_dump() for c in conflicts],
                    message="Requested alternative slot is no longer available."
                )

            # Apply reschedule
            resched_cmd = InterviewRescheduleRequest(
                new_date=req.new_date,
                new_start_time=req.new_start_time,
                new_end_time=req.new_end_time,
                reason=f"Candidate Self-Service: {req.reason}",
                changed_by="Candidate",
            )
            updated = cls.reschedule_interview(db, interview.id, resched_cmd)
            portal.status = "completed"
            portal.resolved_at = datetime.now(timezone.utc)
            db.commit()
            return updated
        else:
            # Request-based: awaiting recruiter approval
            portal.status = "pending"
            db.commit()
            return portal.to_dict()

    # =========================================================================
    # CORE INTERVIEW CRUD OPERATIONS
    # =========================================================================

    @classmethod
    def schedule_interview(
        cls,
        db: Session,
        request: InterviewCreateRequest,
        interviewer_name_map: Optional[Dict[int, str]] = None,
        force_override: bool = False,
    ) -> Dict[str, Any]:
        """Creates an interview session with full conflict and capacity verification."""
        avail_req = AvailabilityCheckRequest(
            interview_date=request.interview_date,
            start_time=request.start_time,
            end_time=request.end_time,
            candidate_id=request.candidate_id,
            interviewer_ids=request.panel_interviewer_ids,
        )
        is_avail, conflicts = cls.check_availability(db, avail_req, interviewer_name_map)
        hard_conflicts = [c for c in conflicts if c.type in ("interviewer", "candidate")]
        if hard_conflicts and not force_override:
            raise SchedulingConflictException(
                conflicts=[c.model_dump() for c in hard_conflicts],
                message="Conflict detected: Conflicting candidate or panel availability detected."
            )

        date_clean = request.interview_date.replace("-", "")
        code_suffix = uuid.uuid4().hex[:4].upper()
        interview_code = f"INT-{date_clean}-{code_suffix}"

        s_min = cls.time_to_minutes(request.start_time)
        e_min = cls.time_to_minutes(request.end_time)
        duration = max(15, e_min - s_min)

        meeting_link = request.location_or_link
        if not meeting_link and "meet" in request.mode:
            meeting_link = f"https://meet.google.com/{uuid.uuid4().hex[:3]}-{uuid.uuid4().hex[:4]}-{uuid.uuid4().hex[:3]}"
        elif not meeting_link and "teams" in request.mode:
            meeting_link = f"https://teams.microsoft.com/l/meetup-join/{uuid.uuid4().hex}"
        elif not meeting_link and "zoom" in request.mode:
            meeting_link = f"https://zoom.us/j/{uuid.uuid4().int % 10000000000}"

        interview = InterviewSchedule(
            interview_code=interview_code,
            candidate_id=request.candidate_id,
            candidate_name=request.candidate_name or f"Candidate #{request.candidate_id}",
            candidate_email=request.candidate_email,
            jd_id=request.jd_id,
            jd_title=request.jd_title,
            template_id=request.template_id,
            stage_order=request.stage_order,
            round_name=request.round_name,
            interview_type=request.interview_type,
            interview_date=request.interview_date,
            start_time=request.start_time,
            end_time=request.end_time,
            duration_minutes=duration,
            timezone=request.timezone,
            mode=request.mode,
            location_or_link=meeting_link,
            instructions=request.instructions,
            recruiter_notes=request.recruiter_notes,
            status="scheduled",
        )
        db.add(interview)
        db.flush()

        name_map = interviewer_name_map or {}
        for idx, int_id in enumerate(request.panel_interviewer_ids):
            wh = cls.get_or_create_working_hours(db, int_id)
            panel_member = InterviewPanelMember(
                interview_id=interview.id,
                interviewer_id=int_id,
                interviewer_name=name_map.get(int_id, wh.interviewer_name),
                interviewer_role=wh.role,
                specialization=wh.specialization,
                is_lead=(idx == 0),
            )
            db.add(panel_member)

        # Audit history log
        history = InterviewHistory(
            interview_id=interview.id,
            action="scheduled",
            changed_by="Recruiter",
            details=f"Interview {interview_code} booked for {interview.candidate_name} on {interview.interview_date} ({interview.start_time}-{interview.end_time})",
            new_values_json=json.dumps(interview.to_dict()),
        )
        db.add(history)
        db.commit()
        db.refresh(interview)
        return interview.to_dict()

    @classmethod
    def reschedule_interview(
        cls, db: Session, interview_id: int, request: InterviewRescheduleRequest
    ) -> Dict[str, Any]:
        """Reschedules an interview and updates audit history."""
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError(f"Interview #{interview_id} not found.")

        panel_ids = [p.interviewer_id for p in interview.panel_members]
        avail_req = AvailabilityCheckRequest(
            interview_date=request.new_date,
            start_time=request.new_start_time,
            end_time=request.new_end_time,
            candidate_id=interview.candidate_id,
            interviewer_ids=panel_ids,
            exclude_interview_id=interview.id,
        )
        is_avail, conflicts = cls.check_availability(db, avail_req)
        hard_conflicts = [c for c in conflicts if c.type in ("interviewer", "candidate")]
        if hard_conflicts:
            raise SchedulingConflictException(
                conflicts=[c.model_dump() for c in hard_conflicts],
                message="Conflict detected: Cannot reschedule to slot due to overlapping availability conflicts."
            )

        old_values = {
            "interview_date": interview.interview_date,
            "start_time": interview.start_time,
            "end_time": interview.end_time,
        }

        s_min = cls.time_to_minutes(request.new_start_time)
        e_min = cls.time_to_minutes(request.new_end_time)
        duration = max(15, e_min - s_min)

        interview.interview_date = request.new_date
        interview.start_time = request.new_start_time
        interview.end_time = request.new_end_time
        interview.duration_minutes = duration
        interview.status = "rescheduled"

        new_values = {
            "interview_date": interview.interview_date,
            "start_time": interview.start_time,
            "end_time": interview.end_time,
        }

        history = InterviewHistory(
            interview_id=interview.id,
            action="rescheduled",
            changed_by=request.changed_by or "Recruiter",
            details=f"Rescheduled from {old_values['interview_date']} {old_values['start_time']} to {new_values['interview_date']} {new_values['start_time']}. Reason: {request.reason}",
            old_values_json=json.dumps(old_values),
            new_values_json=json.dumps(new_values),
        )
        db.add(history)
        db.commit()
        db.refresh(interview)
        return interview.to_dict()

    @classmethod
    def cancel_interview(
        cls, db: Session, interview_id: int, request: InterviewCancelRequest
    ) -> Dict[str, Any]:
        """Cancels an interview and frees up the calendar slot."""
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError(f"Interview #{interview_id} not found.")

        interview.status = "cancelled"

        history = InterviewHistory(
            interview_id=interview.id,
            action="cancelled",
            changed_by=request.cancelled_by or "Recruiter",
            details=f"Cancelled interview session. Reason: {request.cancellation_reason}",
        )
        db.add(history)
        db.commit()
        db.refresh(interview)
        return interview.to_dict()

    @classmethod
    def update_interview(
        cls, db: Session, interview_id: int, request: InterviewUpdateRequest
    ) -> Dict[str, Any]:
        """Updates metadata and state for an interview session."""
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            # Platform Interview model fallback for universal compatibility
            try:
                from backend.app.models.interview import Interview as PlatformInterview
                pi = db.query(PlatformInterview).filter_by(id=interview_id).first()
                if pi:
                    if request.status is not None:
                        pi.status = request.status
                    if hasattr(request, "feedback") and request.feedback is not None:
                        pi.feedback = request.feedback
                    if hasattr(request, "rating") and request.rating is not None:
                        pi.rating = request.rating
                    if hasattr(request, "recommendation") and request.recommendation is not None:
                        pi.recommendation = request.recommendation
                    db.commit()
                    db.refresh(pi)
                    p_dict = pi.to_dict() if hasattr(pi, "to_dict") else {
                        "id": pi.id, "status": pi.status, "rating": pi.rating,
                        "feedback": pi.feedback, "recommendation": pi.recommendation
                    }
                    return {"status": "success", "interview": p_dict, **p_dict}
            except Exception:
                pass
            raise ValueError(f"Interview #{interview_id} not found.")

        old_snap = interview.to_dict()

        if request.round_name is not None:
            interview.round_name = request.round_name
        if request.interview_type is not None:
            interview.interview_type = request.interview_type
        if request.status is not None:
            interview.status = request.status
        if request.mode is not None:
            interview.mode = request.mode
        if request.location_or_link is not None:
            interview.location_or_link = request.location_or_link
        if request.instructions is not None:
            interview.instructions = request.instructions
        if request.recruiter_notes is not None:
            interview.recruiter_notes = request.recruiter_notes

        history = InterviewHistory(
            interview_id=interview.id,
            action="updated",
            changed_by="Recruiter",
            details="Updated session metadata",
            old_values_json=json.dumps(old_snap),
            new_values_json=json.dumps(interview.to_dict()),
        )
        db.add(history)
        db.commit()
        db.refresh(interview)
        res_dict = interview.to_dict()
        return {"status": "success", "interview": res_dict, **res_dict}

    # =========================================================================
    # CALENDAR GRID COORDINATION
    # =========================================================================

    @classmethod
    def get_calendar_grid(
        cls,
        db: Session,
        start_date: str,
        end_date: str,
        interviewer_id: Optional[int] = None,
        interviewers_catalog: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Builds multi-interviewer columns, busy blocks, workload indicators, and interview slots."""
        evaluators = interviewers_catalog or [
            {"id": 1, "full_name": "Recruiter 1", "role": "Administrator", "specialization": "Full Stack, Cloud"},
            {"id": 2, "full_name": "Recruiter 2", "role": "Senior TA Lead", "specialization": "Kubernetes, AWS"},
            {"id": 3, "full_name": "Recruiter 3", "role": "Principal TA Recruiter", "specialization": "SAP, Oracle, Data"},
            {"id": 4, "full_name": "Recruiter 4", "role": "Engineering Manager", "specialization": "React, TypeScript, Java"},
            {"id": 5, "full_name": "Recruiter 5", "role": "Recruitment Manager", "specialization": "Staffing Operations"},
        ]

        if interviewer_id:
            evaluators = [e for e in evaluators if e["id"] == interviewer_id]

        interviews_query = db.query(InterviewSchedule).filter(
            InterviewSchedule.interview_date >= start_date,
            InterviewSchedule.interview_date <= end_date,
            InterviewSchedule.status.notin_(["cancelled"]),
        )
        all_interviews = interviews_query.all()

        columns = []
        for ev in evaluators:
            ev_id = ev["id"]
            wh = cls.get_or_create_working_hours(db, ev_id, ev.get("full_name", ""))

            # Calculate workload for start_date
            workload = cls.calculate_interviewer_workload(db, ev_id, start_date)

            # Assigned interviews
            ev_interviews = []
            for it in all_interviews:
                panel_ids = [p.interviewer_id for p in it.panel_members]
                if ev_id in panel_ids:
                    ev_interviews.append(it.to_dict())

            # Busy blocks and lunch breaks
            busy_blocks_query = db.query(InterviewAvailability).filter(
                InterviewAvailability.interviewer_id == ev_id,
                or_(
                    InterviewAvailability.specific_date.between(start_date, end_date),
                    InterviewAvailability.specific_date.is_(None),
                ),
            )
            raw_busy = [b.to_dict() for b in busy_blocks_query.all()]
            busy_blocks = [
                b for b in raw_busy
                if not (b.get("label", "").lower() == "lunch break" and wh.lunch_start and wh.lunch_end)
            ]

            # Add configured lunch break exactly ONCE from InterviewerWorkingHours
            if wh.lunch_start and wh.lunch_end:
                busy_blocks.append({
                    "start_time": wh.lunch_start,
                    "end_time": wh.lunch_end,
                    "is_busy_block": True,
                    "label": "Lunch Break",
                })

            columns.append({
                "interviewer": {
                    "id": ev_id,
                    "full_name": ev.get("full_name") or ev.get("name") or wh.interviewer_name,
                    "role": ev.get("role") or wh.role,
                    "specialization": ev.get("specialization") or wh.specialization,
                    "timezone": wh.timezone,
                },
                "workload": workload.model_dump(),
                "scheduled_count": len(ev_interviews),
                "interviews": ev_interviews,
                "busy_blocks": busy_blocks,
            })

        return {
            "start_date": start_date,
            "end_date": end_date,
            "columns": columns,
        }

    # =========================================================================
    # CALENDAR INVITATION & ICS GENERATION (RFC 5545)
    # =========================================================================

    @staticmethod
    def generate_ics(interview_data: Dict[str, Any]) -> str:
        """Constructs an RFC 5545 standard .ics calendar invitation string."""
        date_str = interview_data["interview_date"].replace("-", "")
        start_str = interview_data["start_time"].replace(":", "") + "00"
        end_str = interview_data["end_time"].replace(":", "") + "00"

        dtstart = f"{date_str}T{start_str}Z"
        dtend = f"{date_str}T{end_str}Z"
        dtstamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        uid = f"{interview_data.get('interview_code', 'INT')}-{date_str}@talentra.ai"

        summary = f"Interview: {interview_data.get('candidate_name', 'Candidate')} - {interview_data.get('round_name', 'Evaluation')}"
        location = interview_data.get("location_or_link") or "Virtual Meeting"
        description = f"Job Position: {interview_data.get('jd_title', 'Open Position')}\\nInstructions: {interview_data.get('instructions', 'Please join on time.')}"

        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//TALENTRA//Interview Scheduling System//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"LOCATION:{location}",
            "STATUS:CONFIRMED",
            "SEQUENCE:0",
            "END:VEVENT",
            "END:VCALENDAR",
        ]
        return "\r\n".join(ics_lines)

    @classmethod
    def preview_invitation(cls, interview_data: Dict[str, Any]) -> InvitationPreviewResponse:
        """Generates email preview texts and .ics calendar files."""
        candidate_name = interview_data.get("candidate_name", "Candidate")
        round_name = interview_data.get("round_name", "Evaluation Round")
        jd_title = interview_data.get("jd_title", "Open Requisition")
        date_val = interview_data.get("interview_date", "")
        start_val = interview_data.get("start_time", "")
        end_val = interview_data.get("end_time", "")
        link = interview_data.get("location_or_link", "")

        subject = f"Interview Confirmation: {round_name} with TALENTRA for {jd_title}"
        body_text = f"""Dear {candidate_name},

Your {round_name} has been confirmed.

Details:
Position: {jd_title}
Date: {date_val}
Time: {start_val} - {end_val}
Meeting Link: {link}

Instructions:
{interview_data.get('instructions', 'Please join 5 minutes early with video enabled.')}

Best regards,
Talent Acquisition Team
"""

        body_html = f"""<div style="font-family: sans-serif; line-height: 1.6; color: #172033;">
  <h2 style="color: #4F46B8;">Interview Confirmation: {round_name}</h2>
  <p>Dear <strong>{candidate_name}</strong>,</p>
  <p>Your upcoming evaluation has been confirmed for <strong>{jd_title}</strong>.</p>
  <div style="background: #F5F6FA; border: 1px solid #D9DEE8; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 4px 0;"><strong>Date:</strong> {date_val}</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> {start_val} - {end_val}</p>
    <p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="{link}">{link}</a></p>
  </div>
  <p>Best regards,<br/><strong>Talent Acquisition Team</strong></p>
</div>"""

        ics_content = cls.generate_ics(interview_data)
        panel_emails = [p.get("interviewer_email") for p in interview_data.get("panel", []) if p.get("interviewer_email")]

        return InvitationPreviewResponse(
            subject=subject,
            body_text=body_text,
            body_plain=body_text,
            body_html=body_html,
            ics_content=ics_content,
            candidate_email=interview_data.get("candidate_email"),
            panel_emails=panel_emails,
        )
