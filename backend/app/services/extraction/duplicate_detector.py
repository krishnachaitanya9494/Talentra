"""
Candidate Duplicate Detection Service for TALENTRA Phase 2.

Identifies potential or exact duplicate candidate profiles using:
- Normalized Email Address (Primary key for candidate identity)
- Normalized Phone Numbers (10-digit canonical comparison)
- Name + Contact combination

Prevents silent overwrites, avoids premature automatic merging of uncertain duplicates,
and provides structured match evidence for recruiter review.
"""

import re
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from backend.app.models.candidate import Candidate
from backend.app.services.extraction.normalizer import (
    normalize_email,
    normalize_phone,
)


class DuplicateMatchResult:
    """
    Structured outcome of a duplicate detection check.
    """
    def __init__(
        self,
        is_duplicate: bool,
        match_type: str,
        confidence: float,
        existing_candidate_id: Optional[int] = None,
        existing_candidate_code: Optional[str] = None,
        reason: Optional[str] = None,
    ):
        self.is_duplicate = is_duplicate
        self.match_type = match_type  # 'EXACT_EMAIL', 'EXACT_PHONE', 'POTENTIAL_NAME_MATCH', 'UNIQUE'
        self.confidence = confidence
        self.existing_candidate_id = existing_candidate_id
        self.existing_candidate_code = existing_candidate_code
        self.reason = reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_duplicate": self.is_duplicate,
            "match_type": self.match_type,
            "confidence": self.confidence,
            "existing_candidate_id": self.existing_candidate_id,
            "existing_candidate_code": self.existing_candidate_code,
            "reason": self.reason,
        }


def detect_candidate_duplicate(
    db: Session,
    email: Optional[str],
    phone: Optional[str],
    full_name: Optional[str] = None,
    exclude_candidate_id: Optional[int] = None,
) -> DuplicateMatchResult:
    """
    Checks if a candidate already exists in the database by normalized email or phone.
    """
    norm_email = normalize_email(email)
    norm_phone = normalize_phone(phone)
    phone_digits = re.sub(r"\D", "", norm_phone) if norm_phone else None

    # 1. Check exact normalized email
    if norm_email:
        stmt = select(Candidate).where(Candidate.email == norm_email)
        if exclude_candidate_id:
            stmt = stmt.where(Candidate.id != exclude_candidate_id)
        existing = db.scalar(stmt)
        if existing:
            return DuplicateMatchResult(
                is_duplicate=True,
                match_type="EXACT_EMAIL",
                confidence=1.0,
                existing_candidate_id=existing.id,
                existing_candidate_code=existing.candidate_code,
                reason=f"Candidate already exists with matching email address: '{norm_email}'",
            )

    # 2. Check exact normalized phone (last 10 digits match)
    if phone_digits and len(phone_digits) >= 10:
        last_10 = phone_digits[-10:]
        # Query candidates who have a phone number
        stmt = select(Candidate).where(Candidate.phone.is_not(None))
        if exclude_candidate_id:
            stmt = stmt.where(Candidate.id != exclude_candidate_id)
        candidates_with_phone = db.scalars(stmt).all()

        for cand in candidates_with_phone:
            cand_digits = re.sub(r"\D", "", cand.phone or "")
            if len(cand_digits) >= 10 and cand_digits[-10:] == last_10:
                return DuplicateMatchResult(
                    is_duplicate=True,
                    match_type="EXACT_PHONE",
                    confidence=0.95,
                    existing_candidate_id=cand.id,
                    existing_candidate_code=cand.candidate_code,
                    reason=f"Candidate exists with matching 10-digit phone number: '{cand.phone}'",
                )

    # 3. Check Potential Name + Company/Location
    if full_name:
        parts = full_name.strip().split()
        if len(parts) >= 2:
            fn, ln = parts[0], parts[-1]
            stmt = select(Candidate).where(
                Candidate.first_name.ilike(fn),
                Candidate.last_name.ilike(ln),
            )
            if exclude_candidate_id:
                stmt = stmt.where(Candidate.id != exclude_candidate_id)
            potential = db.scalar(stmt)
            if potential:
                return DuplicateMatchResult(
                    is_duplicate=True,
                    match_type="POTENTIAL_NAME_MATCH",
                    confidence=0.70,
                    existing_candidate_id=potential.id,
                    existing_candidate_code=potential.candidate_code,
                    reason=f"Potential duplicate: Candidate with identical legal name '{full_name}' exists ({potential.candidate_code})",
                )

    return DuplicateMatchResult(
        is_duplicate=False,
        match_type="UNIQUE",
        confidence=0.0,
        reason="No duplicate records detected in candidate database.",
    )


def scan_all_duplicates(db: Session) -> List[Dict[str, Any]]:
    """
    Scans the existing Candidate repository and identifies duplicate pairs/clusters.
    Used by the Duplicate Review Interface in the frontend.
    """
    candidates = db.scalars(select(Candidate).order_by(Candidate.id)).all()
    duplicates_list: List[Dict[str, Any]] = []
    seen_pairs = set()

    for i in range(len(candidates)):
        c1 = candidates[i]
        c1_digits = re.sub(r"\D", "", c1.phone or "")[-10:] if c1.phone else ""

        for j in range(i + 1, len(candidates)):
            c2 = candidates[j]
            pair_key = (min(c1.id, c2.id), max(c1.id, c2.id))
            if pair_key in seen_pairs:
                continue

            # Check email match
            if c1.email and c2.email and c1.email.strip().lower() == c2.email.strip().lower():
                seen_pairs.add(pair_key)
                duplicates_list.append({
                    "candidate_a": _candidate_summary(c1),
                    "candidate_b": _candidate_summary(c2),
                    "match_type": "EXACT_EMAIL",
                    "confidence": 1.0,
                    "matched_field": c1.email,
                })
                continue

            # Check phone match
            c2_digits = re.sub(r"\D", "", c2.phone or "")[-10:] if c2.phone else ""
            if c1_digits and c2_digits and len(c1_digits) == 10 and c1_digits == c2_digits:
                seen_pairs.add(pair_key)
                duplicates_list.append({
                    "candidate_a": _candidate_summary(c1),
                    "candidate_b": _candidate_summary(c2),
                    "match_type": "EXACT_PHONE",
                    "confidence": 0.95,
                    "matched_field": c1.phone,
                })
                continue

            # Check name match
            if (
                c1.first_name and c2.first_name and
                c1.last_name and c2.last_name and
                c1.first_name.strip().lower() == c2.first_name.strip().lower() and
                c1.last_name.strip().lower() == c2.last_name.strip().lower()
            ):
                seen_pairs.add(pair_key)
                duplicates_list.append({
                    "candidate_a": _candidate_summary(c1),
                    "candidate_b": _candidate_summary(c2),
                    "match_type": "POTENTIAL_NAME_MATCH",
                    "confidence": 0.70,
                    "matched_field": f"{c1.first_name} {c1.last_name}",
                })

    return duplicates_list


def _candidate_summary(c: Candidate) -> Dict[str, Any]:
    return {
        "id": c.id,
        "candidate_code": c.candidate_code,
        "name": f"{c.first_name} {c.last_name}",
        "email": c.email,
        "phone": c.phone,
        "title": c.current_title,
        "company": c.current_company,
        "experience": float(c.total_experience_years) if c.total_experience_years else None,
        "skills": c.skills,
        "status": c.status,
    }
