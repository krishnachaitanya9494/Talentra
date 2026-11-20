"""
Internal JD-to-Candidate Sourcing Service for TALENTRA.

Provides end-to-end functionality to:
1. Parse or retrieve Job Description requirements (uploaded file, pasted text, or existing repository JD).
2. Search exclusively across internal candidate profiles, resumes, and CRM imports.
3. Evaluate candidates with transparent 7-dimension scoring via Phase 3 MatchingEngine.
4. Detect duplicate records via normalized email and phone.
5. Extract structured candidate contact, professional, and matching evidence.
"""

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument, ResumeDocument
from backend.app.models.candidate_intelligence import (
    ParsedJobRequirement,
    CandidateResumeLink,
    CandidateEmployer,
    CandidateEducation,
    CandidateCertification,
)
from backend.app.models.sourcing import SourcingSearch, SourcingSearchResult
from backend.app.services.matching.matching_engine import MatchingEngine
from backend.app.services.extraction.jd_parser import JobDescriptionParser
from backend.app.services.extraction.normalizer import (
    normalize_email,
    normalize_phone,
    canonicalize_skill,
)


class SourcingService:
    """
    Orchestrates internal sourcing workflow: JD input -> Internal Search -> Matching -> Extraction.
    """

    @classmethod
    def parse_jd_input(
        cls,
        db: Session,
        text: Optional[str] = None,
        filename: Optional[str] = None,
        existing_jd_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Parses JD requirements from text or retrieves existing parsed specifications.
        """
        if existing_jd_id:
            jd_doc = db.query(JobDescriptionDocument).filter(JobDescriptionDocument.id == existing_jd_id).first()
            if not jd_doc:
                raise ValueError(f"Job Description ID #{existing_jd_id} not found in repository.")

            # Check if already parsed
            existing_req = db.query(ParsedJobRequirement).filter(
                ParsedJobRequirement.jd_doc_id == jd_doc.doc_id
            ).first()

            if existing_req:
                min_exp = float(existing_req.min_experience_years) if existing_req.min_experience_years is not None else 0.0
                max_exp = float(existing_req.max_experience_years) if existing_req.max_experience_years is not None else 15.0
                return {
                    "jd_id": jd_doc.id,
                    "jd_title": existing_req.job_title or jd_doc.original_filename,
                    "job_title": existing_req.job_title or jd_doc.original_filename,
                    "required_skills": existing_req.required_skills or "",
                    "preferred_skills": existing_req.preferred_skills or "",
                    "min_experience": min_exp,
                    "max_experience": max_exp,
                    "min_experience_years": min_exp,
                    "max_experience_years": max_exp,
                    "qualifications": existing_req.required_qualifications or "",
                    "required_qualifications": existing_req.required_qualifications or "",
                    "certifications": existing_req.certifications or "",
                    "location": existing_req.location or "Open",
                    "employment_type": existing_req.employment_type or "Full-time",
                    "work_mode": existing_req.work_mode or "Hybrid",
                    "mandatory_requirements": existing_req.mandatory_requirements or "",
                    "preferred_requirements": existing_req.preferred_requirements or "",
                    "raw_text": jd_doc.raw_text or "",
                }

            # If not yet parsed in ParsedJobRequirement, parse raw text
            text_to_parse = jd_doc.raw_text or jd_doc.original_filename
            parsed = JobDescriptionParser.parse(text_to_parse, filename=jd_doc.original_filename, jd_doc_id=jd_doc.doc_id)
            min_exp = float(parsed.get("min_experience_years") or parsed.get("min_experience") or 0.0)
            max_exp = float(parsed.get("max_experience_years") or parsed.get("max_experience") or 15.0)
            quals = parsed.get("required_qualifications") or parsed.get("qualifications") or ""
            return {
                "jd_id": jd_doc.id,
                "jd_title": parsed.get("job_title") or jd_doc.original_filename,
                "job_title": parsed.get("job_title") or jd_doc.original_filename,
                "required_skills": ", ".join(parsed.get("required_skills_list", [])) if parsed.get("required_skills_list") else (parsed.get("required_skills") or ""),
                "preferred_skills": ", ".join(parsed.get("preferred_skills_list", [])) if parsed.get("preferred_skills_list") else (parsed.get("preferred_skills") or ""),
                "min_experience": min_exp,
                "max_experience": max_exp,
                "min_experience_years": min_exp,
                "max_experience_years": max_exp,
                "qualifications": quals,
                "required_qualifications": quals,
                "certifications": parsed.get("certifications") or "",
                "location": parsed.get("location") or "Open",
                "employment_type": parsed.get("employment_type") or "Full-time",
                "work_mode": parsed.get("work_mode") or "Hybrid",
                "mandatory_requirements": parsed.get("mandatory_requirements") or "",
                "preferred_requirements": parsed.get("preferred_requirements") or "",
                "raw_text": text_to_parse,
            }

        # Otherwise parse provided text
        if not text or not text.strip():
            raise ValueError("No Job Description text or repository JD was provided.")

        parsed = JobDescriptionParser.parse(text, filename=filename)
        min_exp = float(parsed.get("min_experience_years") or parsed.get("min_experience") or 0.0)
        max_exp = float(parsed.get("max_experience_years") or parsed.get("max_experience") or 15.0)
        quals = parsed.get("required_qualifications") or parsed.get("qualifications") or ""
        return {
            "jd_id": None,
            "jd_title": parsed.get("job_title") or (filename if filename else "Direct Sourcing JD"),
            "job_title": parsed.get("job_title") or (filename if filename else "Direct Sourcing JD"),
            "required_skills": ", ".join(parsed.get("required_skills_list", [])) if parsed.get("required_skills_list") else (parsed.get("required_skills") or ""),
            "preferred_skills": ", ".join(parsed.get("preferred_skills_list", [])) if parsed.get("preferred_skills_list") else (parsed.get("preferred_skills") or ""),
            "min_experience": min_exp,
            "max_experience": max_exp,
            "min_experience_years": min_exp,
            "max_experience_years": max_exp,
            "qualifications": quals,
            "required_qualifications": quals,
            "certifications": parsed.get("certifications") or "",
            "location": parsed.get("location") or "Open",
            "employment_type": parsed.get("employment_type") or "Full-time",
            "work_mode": parsed.get("work_mode") or "Hybrid",
            "mandatory_requirements": parsed.get("mandatory_requirements") or "",
            "preferred_requirements": parsed.get("preferred_requirements") or "",
            "raw_text": text,
        }

    @classmethod
    def calculate_profile_completeness(cls, candidate: Candidate) -> float:
        """
        Calculates candidate data completeness percentage (0-100%).
        """
        fields = [
            bool(candidate.first_name and candidate.last_name),
            bool(candidate.email),
            bool(candidate.phone),
            bool(candidate.current_title),
            bool(candidate.current_company),
            bool(candidate.total_experience_years is not None),
            bool(candidate.skills),
            bool(candidate.location),
        ]
        return round((sum(1 for f in fields if f) / len(fields)) * 100.0, 1)

    @classmethod
    def run_sourcing_search(
        cls,
        db: Session,
        requirements: Dict[str, Any],
        filters: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None,
        input_source: str = "paste",
    ) -> Dict[str, Any]:
        """
        Searches internal candidate records, evaluates match against JD specifications,
        identifies duplicates, ranks talent, and saves the search session.
        """
        flt = filters or {}
        min_score_threshold = float(flt.get("min_score", 0.0))
        target_segments = flt.get("segments") or ["Strong Match", "Potential Match", "Partial Match", "Not Suitable"]
        location_filter = (flt.get("location") or "").strip().lower()
        experience_min = flt.get("min_experience")
        experience_max = flt.get("max_experience")

        # 1. Query all internal candidates
        candidates = db.query(Candidate).order_by(Candidate.id.asc()).all()
        total_searched = len(candidates)

        # 2. Internal Duplicate Tracking Map (by normalized email and phone)
        email_map: Dict[str, int] = {}
        phone_map: Dict[str, int] = {}
        duplicate_count = 0

        # Build jd_spec structure for MatchingEngine
        req_skills_str = requirements.get("required_skills") or ""
        pref_skills_str = requirements.get("preferred_skills") or ""
        req_skills_list = [s.strip() for s in re.split(r"[,;|/\n]+", req_skills_str) if s.strip()]
        pref_skills_list = [s.strip() for s in re.split(r"[,;|/\n]+", pref_skills_str) if s.strip()]

        jd_spec = {
            "job_title": requirements.get("job_title") or requirements.get("jd_title") or "Role",
            "required_skills": req_skills_str,
            "required_skills_list": req_skills_list,
            "preferred_skills": pref_skills_str,
            "preferred_skills_list": pref_skills_list,
            "min_experience": float(requirements.get("min_experience", 0.0)) if requirements.get("min_experience") is not None else 0.0,
            "max_experience": float(requirements.get("max_experience", 15.0)) if requirements.get("max_experience") is not None else 15.0,
            "qualifications": requirements.get("qualifications") or "",
            "certifications": requirements.get("certifications") or "",
            "location": requirements.get("location") or "Open",
            "employment_type": requirements.get("employment_type") or "Full-time",
            "mandatory_requirements": requirements.get("mandatory_requirements") or "",
            "preferred_requirements": requirements.get("preferred_requirements") or "",
        }

        # 3. Evaluate each internal candidate
        evaluated_candidates = []
        for cand in candidates:
            # Check duplicate status
            norm_email = normalize_email(cand.email)
            norm_phone = normalize_phone(cand.phone)
            phone_digits = re.sub(r"\D", "", norm_phone) if norm_phone else None

            is_dup = False
            dup_of = None
            dup_reason = None

            if norm_email and norm_email in email_map:
                is_dup = True
                dup_of = email_map[norm_email]
                dup_reason = f"Duplicate email: {cand.email}"
            elif phone_digits and len(phone_digits) >= 10 and phone_digits in phone_map:
                is_dup = True
                dup_of = phone_map[phone_digits]
                dup_reason = f"Duplicate phone: {cand.phone}"
            else:
                if norm_email:
                    email_map[norm_email] = cand.id
                if phone_digits and len(phone_digits) >= 10:
                    phone_map[phone_digits] = cand.id

            if is_dup:
                duplicate_count += 1

            # Run deterministic matching
            eval_res = MatchingEngine.evaluate_candidate(cand, jd_spec)
            score = eval_res["overall_score"]
            segment = eval_res["segment"]
            evidence = eval_res.get("evidences") or eval_res.get("evidence") or []
            has_critical = eval_res.get("has_critical_mismatch", False)

            # Extract matched / missing skills from eval_res
            matched_skills_list = eval_res.get("matched_skills") or []
            missing_skills_list = eval_res.get("missing_skills") or []
            matched_skills_str = ", ".join(matched_skills_list) if isinstance(matched_skills_list, list) else str(matched_skills_list)
            missing_skills_str = ", ".join(missing_skills_list) if isinstance(missing_skills_list, list) else str(missing_skills_list)

            exp_compat_str = "Compatible"
            match_explanation_str = ""
            for ev in evidence:
                dim = ev.get("dimension")
                if dim == "Required Skills":
                    match_explanation_str = ev.get("evidence_text", "")
                elif dim == "Experience":
                    exp_compat_str = ev.get("evidence_text", "")

            if not match_explanation_str and evidence:
                match_explanation_str = evidence[0].get("evidence_text", "Profile evaluation completed")

            # Filter checks
            if score < min_score_threshold:
                continue
            if segment not in target_segments:
                continue
            if location_filter and location_filter not in (cand.location or "").lower():
                continue
            cand_exp = float(cand.total_experience_years) if cand.total_experience_years is not None else 0.0
            if experience_min is not None and cand_exp < float(experience_min):
                continue
            if experience_max is not None and cand_exp > float(experience_max):
                continue

            completeness = cls.calculate_profile_completeness(cand)

            evaluated_candidates.append({
                "candidate": cand,
                "candidate_id": cand.id,
                "score": score,
                "segment": segment,
                "matched_skills": matched_skills_str,
                "missing_skills": missing_skills_str,
                "experience_compatibility": exp_compat_str,
                "match_explanation": match_explanation_str,
                "evidence": evidence,
                "has_critical_mismatch": has_critical,
                "profile_completeness": completeness,
                "is_duplicate": is_dup,
                "duplicate_of_id": dup_of,
                "duplicate_reason": dup_reason,
            })

        # 4. Sort candidates by score descending, then experience descending
        evaluated_candidates.sort(
            key=lambda x: (x["score"], float(x["candidate"].total_experience_years or 0)),
            reverse=True,
        )

        # 5. Persist SourcingSearch in database
        strong_count = sum(1 for c in evaluated_candidates if c["segment"] == "Strong Match")
        potential_count = sum(1 for c in evaluated_candidates if c["segment"] == "Potential Match")
        partial_count = sum(1 for c in evaluated_candidates if c["segment"] == "Partial Match")
        not_suitable_count = sum(1 for c in evaluated_candidates if c["segment"] == "Not Suitable")
        verified_contact_count = sum(1 for c in evaluated_candidates if c["candidate"].email and c["candidate"].phone)

        search_record = SourcingSearch(
            search_code=f"SRC-{uuid.uuid4().hex[:10].upper()}",
            jd_id=requirements.get("jd_id"),
            jd_title=jd_spec["job_title"],
            input_source=input_source,
            raw_jd_text=requirements.get("raw_text"),
            parsed_requirements_json=json.dumps(jd_spec),
            total_candidates_searched=total_searched,
            total_matches_found=len(evaluated_candidates),
            strong_matches_count=strong_count,
            potential_matches_count=potential_count,
            partial_matches_count=partial_count,
            not_suitable_count=not_suitable_count,
            duplicates_identified_count=duplicate_count,
            created_by_user_id=user_id or 1,
            status="completed",
        )
        db.add(search_record)
        db.commit()
        db.refresh(search_record)

        # 6. Persist ranked SourcingSearchResult records
        ranked_results = []
        for rank_idx, item in enumerate(evaluated_candidates, start=1):
            cand = item["candidate"]
            res_record = SourcingSearchResult(
                search_id=search_record.id,
                candidate_id=cand.id,
                rank=rank_idx,
                match_score=item["score"],
                match_segment=item["segment"],
                matched_skills=item["matched_skills"],
                missing_skills=item["missing_skills"],
                experience_compatibility=item["experience_compatibility"],
                match_explanation=item["match_explanation"],
                evidence_json=json.dumps(item["evidence"]),
                has_critical_mismatch=item["has_critical_mismatch"],
                profile_completeness_percent=item["profile_completeness"],
                is_duplicate=item["is_duplicate"],
                duplicate_of_id=item["duplicate_of_id"],
                duplicate_reason=item["duplicate_reason"],
            )
            db.add(res_record)

            # Retrieve associated resume document info if available
            resume_link = db.query(CandidateResumeLink).filter(CandidateResumeLink.candidate_id == cand.id).first()
            resume_filename = "CRM Profile / Extracted"
            if resume_link:
                res_doc = getattr(resume_link, "resume_document", None)
                if res_doc and hasattr(res_doc, "original_filename"):
                    resume_filename = res_doc.original_filename
                elif getattr(cand, "resume_url", None):
                    resume_filename = cand.resume_url.split("/")[-1].split("\\")[-1]

            ranked_results.append({
                "rank": rank_idx,
                "candidate_id": cand.id,
                "candidate_code": cand.candidate_code,
                "candidate_name": f"{cand.first_name} {cand.last_name or ''}".strip(),
                "email": cand.email or "",
                "phone": cand.phone or "",
                "current_designation": cand.current_title or "Not Available",
                "current_company": cand.current_company or "Not Available",
                "total_experience": float(cand.total_experience_years) if cand.total_experience_years is not None else 0.0,
                "location": cand.location or "Not Specified",
                "technical_skills": cand.skills or "",
                "primary_education": getattr(cand, "primary_education", None) or "Not Available",
                "certifications": getattr(cand, "certifications", None) or "None",
                "match_score": item["score"],
                "match_segment": item["segment"],
                "matched_skills": item["matched_skills"],
                "missing_skills": item["missing_skills"],
                "experience_compatibility": item["experience_compatibility"],
                "match_explanation": item["match_explanation"],
                "has_critical_mismatch": item["has_critical_mismatch"],
                "profile_completeness": item["profile_completeness"],
                "is_duplicate": item["is_duplicate"],
                "duplicate_of_id": item["duplicate_of_id"],
                "duplicate_reason": item["duplicate_reason"],
                "source_type": getattr(cand, "source_type", None) or "Resume Ingestion",
                "resume_filename": resume_filename,
            })

        db.commit()

        return {
            "search_id": search_record.id,
            "search_code": search_record.search_code,
            "jd_title": search_record.jd_title,
            "created_at": search_record.created_at.isoformat(),
            "summary": {
                "total_candidates_searched": total_searched,
                "total_candidates_found": len(ranked_results),
                "strong_matches": strong_count,
                "potential_matches": potential_count,
                "partial_matches": partial_count,
                "not_suitable": not_suitable_count,
                "verified_contact_count": verified_contact_count,
                "duplicates_identified": duplicate_count,
            },
            "candidates": ranked_results,
        }

    @classmethod
    def get_candidate_details(cls, db: Session, candidate_id: int) -> Dict[str, Any]:
        """
        Extracts full professional profile, employment history, educations,
        and linked source documents for an individual candidate.
        """
        cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not cand:
            raise ValueError(f"Candidate #{candidate_id} not found.")

        # Employers
        employers = db.query(CandidateEmployer).filter(
            CandidateEmployer.candidate_id == candidate_id
        ).order_by(CandidateEmployer.is_current.desc(), CandidateEmployer.end_date.desc()).all()

        emp_list = [
            {
                "company_name": e.company_name,
                "job_title": e.job_title,
                "is_current": e.is_current,
                "start_date": e.start_date,
                "end_date": e.end_date,
                "duration_months": e.duration_months,
            }
            for e in employers
        ]

        # Educations
        educations = db.query(CandidateEducation).filter(
            CandidateEducation.candidate_id == candidate_id
        ).all()
        edu_list = [
            {
                "degree": ed.degree,
                "institution": ed.institution,
                "graduation_year": ed.graduation_year,
            }
            for ed in educations
        ]

        # Certifications
        certs = db.query(CandidateCertification).filter(
            CandidateCertification.candidate_id == candidate_id
        ).all()
        cert_list = [c.certification_name for c in certs]

        # Resume links
        res_links = db.query(CandidateResumeLink).filter(
            CandidateResumeLink.candidate_id == candidate_id
        ).all()
        source_docs = [
            {
                "resume_id": getattr(r, "resume_doc_id", None),
                "filename": getattr(getattr(r, "resume_document", None), "original_filename", "CRM Source"),
                "file_path": getattr(getattr(r, "resume_document", None), "file_path", None),
                "is_primary": getattr(r, "is_primary", True),
            }
            for r in res_links
        ]

        return {
            "id": cand.id,
            "candidate_code": cand.candidate_code,
            "name": f"{cand.first_name} {cand.last_name or ''}".strip(),
            "first_name": cand.first_name,
            "last_name": cand.last_name,
            "email": cand.email,
            "phone": cand.phone,
            "current_title": cand.current_title,
            "current_company": cand.current_company,
            "total_experience_years": float(cand.total_experience_years) if cand.total_experience_years is not None else 0.0,
            "skills": cand.skills,
            "location": cand.location,
            "preferred_location": getattr(cand, "preferred_location", None),
            "primary_education": getattr(cand, "primary_education", None) or "Not Available",
            "certifications": getattr(cand, "certifications", None) or "None",
            "source_type": getattr(cand, "source_type", None) or "Resume Ingestion",
            "employers": emp_list,
            "educations": edu_list,
            "certification_list": cert_list,
            "source_documents": source_docs,
        }
