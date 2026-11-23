"""
Intelligent Candidate Matching & Segmentation Service for TALENTRA Phase 3.

Evaluates candidates against Job Descriptions using transparent, deterministic,
explainable scoring across 7 dimensions:
1. Required Technical Skills (35%)
2. Preferred Technical Skills (10%)
3. Professional Experience (20%)
4. Role / Designation Relevance (15%)
5. Qualifications & Education (5%)
6. Certifications (5%)
7. Location Compatibility (10%)

Features:
- Configurable weights and segmentation thresholds.
- Critical mandatory mismatch protection (a high optional score never conceals a hard mismatch).
- Distinguishes confirmed match, confirmed mismatch, and unknown evidence.
- Explains every scoring dimension with human-readable evidence snippets.
"""

import json
import re
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session

from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.candidate_intelligence import ParsedJobRequirement
from backend.app.models.matching import (
    MatchingConfiguration,
    MatchingRun,
    CandidateMatch,
    MatchEvidence,
)
from backend.app.services.extraction.normalizer import canonicalize_skill, SKILL_CANONICAL_MAP


class MatchingEngine:
    """
    Deterministic scoring and explainability engine for candidate-to-JD matching.
    """

    DEFAULT_WEIGHTS = {
        "required_skills": 0.35,
        "preferred_skills": 0.10,
        "experience": 0.20,
        "role_relevance": 0.15,
        "qualifications": 0.05,
        "certifications": 0.05,
        "location": 0.10,
    }

    DEFAULT_THRESHOLDS = {
        "strong": 80.0,
        "potential": 65.0,
        "partial": 45.0,
    }

    @classmethod
    def evaluate_candidate(
        cls,
        candidate: Candidate,
        jd_spec: Dict[str, Any],
        weights: Optional[Dict[str, float]] = None,
        thresholds: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates a single candidate against a Job Description specification.
        Returns overall score (0-100), segment, dimension scores, and evidence list.
        """
        w = weights or cls.DEFAULT_WEIGHTS
        th = thresholds or cls.DEFAULT_THRESHOLDS

        evidences: List[Dict[str, Any]] = []
        has_critical_mismatch = False

        # --- 1. Required Technical Skills (Weight: ~35%) ---
        cand_skills_raw = candidate.skills or ""
        cand_skills = set()
        for s in re.split(r"[,;|/\n]+", cand_skills_raw):
            clean_s = s.strip()
            if clean_s:
                canon = canonicalize_skill(clean_s)
                cand_skills.add(canon.lower())
                cand_skills.add(clean_s.lower())

        sap_context_skills = {
            "sap security",
            "sap grc",
            "sap grc access control",
        }
        has_sap_context = bool(cand_skills.intersection(sap_context_skills))
        contextual_sap_acronyms = {"ara", "arm", "brm", "eam"}

        def matches_skill(target: str) -> bool:
            target_lower = target.lower().strip()
            target_canon = canonicalize_skill(target).lower()
            if target_canon in contextual_sap_acronyms and not has_sap_context:
                return False
            return (
                target_lower in cand_skills
                or target_canon in cand_skills
                or any(target_canon in candidate_skill for candidate_skill in cand_skills)
            )

        req_skills_list = jd_spec.get("required_skills_list") or []
        if not req_skills_list and jd_spec.get("required_skills"):
            req_skills_list = [s.strip() for s in jd_spec["required_skills"].split(",") if s.strip()]

        matched_req_skills = []
        missing_req_skills = []

        if req_skills_list and not cand_skills:
            skills_score = 50.0
            ev_status = "unknown"
            ev_text = "Candidate skills are not present in the available profile."
        elif req_skills_list:
            for req in req_skills_list:
                if matches_skill(req):
                    matched_req_skills.append(req)
                else:
                    missing_req_skills.append(req)

            skills_match_ratio = len(matched_req_skills) / len(req_skills_list)
            skills_score = round(skills_match_ratio * 100.0, 1)

            if not matched_req_skills:
                has_critical_mismatch = True
                ev_status = "confirmed_mismatch"
                ev_text = (
                    f"Candidate lacks all {len(req_skills_list)} mandatory required skills: "
                    f"{', '.join(req_skills_list[:6])}"
                )
            elif len(missing_req_skills) == 0:
                ev_status = "confirmed_match"
                ev_text = f"Matched all {len(matched_req_skills)} required skills: {', '.join(matched_req_skills)}"
            else:
                ev_status = "partial_match"
                ev_text = f"Matched {len(matched_req_skills)}/{len(req_skills_list)} required skills ({', '.join(matched_req_skills)}). Missing: {', '.join(missing_req_skills)}"
        else:
            # If JD has no specified required skills, neutral baseline
            skills_score = 70.0
            ev_status = "unknown"
            ev_text = "No explicit mandatory skills specified in JD."

        evidences.append({
            "dimension": "Required Skills",
            "status": ev_status,
            "score": skills_score,
            "weight": w.get("required_skills", 0.35),
            "evidence_text": ev_text,
        })

        # --- 2. Preferred Technical Skills (Weight: ~10%) ---
        pref_skills_list = jd_spec.get("preferred_skills_list") or []
        if not pref_skills_list and jd_spec.get("preferred_skills"):
            pref_skills_list = [s.strip() for s in jd_spec["preferred_skills"].split(",") if s.strip()]

        matched_pref_skills = []
        if pref_skills_list:
            for pref in pref_skills_list:
                if matches_skill(pref):
                    matched_pref_skills.append(pref)
            pref_ratio = len(matched_pref_skills) / len(pref_skills_list)
            pref_score = round(pref_ratio * 100.0, 1)
            ev_pref_status = "confirmed_match" if matched_pref_skills else "unknown"
            ev_pref_text = (
                f"Matched {len(matched_pref_skills)}/{len(pref_skills_list)} preferred bonus skills: {', '.join(matched_pref_skills)}"
                if matched_pref_skills else "No optional preferred skills matched (no penalty applied)."
            )
        else:
            pref_score = 75.0
            ev_pref_status = "unknown"
            ev_pref_text = "No preferred skills specified in JD."

        evidences.append({
            "dimension": "Preferred Skills",
            "status": ev_pref_status,
            "score": pref_score,
            "weight": w.get("preferred_skills", 0.10),
            "evidence_text": ev_pref_text,
        })

        # --- 3. Professional Experience (Weight: ~20%) ---
        cand_exp = float(candidate.total_experience_years) if candidate.total_experience_years is not None else None
        min_exp = float(jd_spec["min_experience_years"]) if jd_spec.get("min_experience_years") is not None else None
        max_exp = float(jd_spec["max_experience_years"]) if jd_spec.get("max_experience_years") is not None else None

        if cand_exp is not None and (min_exp is not None or max_exp is not None):
            min_target = min_exp or 0.0
            max_target = max_exp or (min_target + 4.0)

            if min_target <= cand_exp <= max_target:
                exp_score = 100.0
                exp_status = "confirmed_match"
                exp_text = f"Candidate has {cand_exp} yrs exp, precisely within requested target ({min_target}–{max_target} yrs)."
            elif cand_exp > max_target:
                # Overqualified by some years
                diff = cand_exp - max_target
                exp_score = max(70.0, round(100.0 - (diff * 5.0), 1))
                exp_status = "partial_match"
                exp_text = f"Candidate has {cand_exp} yrs exp (senior to requested range of {min_target}–{max_target} yrs)."
            else:
                # Underqualified
                deficit = min_target - cand_exp
                if cand_exp < (min_target * 0.5) and min_target >= 4.0:
                    exp_score = 25.0
                    exp_status = "confirmed_mismatch"
                    has_critical_mismatch = True
                    exp_text = f"Critical experience gap: Candidate has {cand_exp} yrs exp vs mandatory minimum of {min_target} yrs."
                else:
                    ratio = max(0.0, cand_exp / min_target)
                    exp_score = round(ratio * 80.0, 1)
                    exp_status = "partial_match"
                    exp_text = f"Candidate has {cand_exp} yrs exp, slightly below target minimum of {min_target} yrs."
        elif cand_exp is not None:
            exp_score = 80.0
            exp_status = "confirmed_match"
            exp_text = f"Candidate has {cand_exp} yrs total experience (no specific range required by JD)."
        else:
            exp_score = 50.0
            exp_status = "unknown"
            exp_text = "Candidate experience years not stated in profile."

        evidences.append({
            "dimension": "Experience",
            "status": exp_status,
            "score": exp_score,
            "weight": w.get("experience", 0.20),
            "evidence_text": exp_text,
        })

        # --- 4. Role / Designation Relevance (Weight: ~15%) ---
        cand_title = (candidate.current_title or "").lower().strip()
        jd_title = (jd_spec.get("job_title") or "").lower().strip()

        if cand_title and jd_title:
            cand_tokens = set(re.findall(r"\w+", cand_title))
            jd_tokens = set(re.findall(r"\w+", jd_title))
            overlap = cand_tokens.intersection(jd_tokens) - {"senior", "lead", "staff", "junior", "associate", "engineer", "developer"}

            if cand_title == jd_title or jd_title in cand_title or cand_title in jd_title:
                role_score = 100.0
                role_status = "confirmed_match"
                role_text = f"Direct title alignment: Candidate '{candidate.current_title}' matches JD '{jd_spec.get('job_title')}'."
            elif overlap:
                role_score = 85.0
                role_status = "confirmed_match"
                role_text = f"Strong domain title match on tokens: {', '.join(overlap)}."
            elif any(t in cand_tokens for t in ["engineer", "developer", "architect", "lead"]):
                role_score = 65.0
                role_status = "partial_match"
                role_text = f"Related engineering title '{candidate.current_title}'."
            else:
                role_score = 40.0
                role_status = "partial_match"
                role_text = f"Title '{candidate.current_title}' diverges from role '{jd_spec.get('job_title')}'."
        elif cand_title:
            role_score = 75.0
            role_status = "unknown"
            role_text = f"Candidate current title: '{candidate.current_title}'."
        else:
            role_score = 50.0
            role_status = "unknown"
            role_text = "Candidate current title unconfirmed."

        evidences.append({
            "dimension": "Role Relevance",
            "status": role_status,
            "score": role_score,
            "weight": w.get("role_relevance", 0.15),
            "evidence_text": role_text,
        })

        # --- 5. Qualifications & Education (Weight: ~5%) ---
        jd_quals = (jd_spec.get("required_qualifications") or "").lower()
        has_degree = False
        if hasattr(candidate, "educations") and candidate.educations:
            has_degree = True
            degrees_found = [e.degree for e in candidate.educations if e.degree]
            deg_summary = ", ".join(degrees_found) if degrees_found else "Degree Verified"
        else:
            # Check candidate notes or raw representation
            deg_summary = "Educational qualifications present" if getattr(candidate, "source", None) else "Education not listed"
            has_degree = False

        if jd_quals and ("b.tech" in jd_quals or "degree" in jd_quals or "bachelor" in jd_quals):
            qual_score = 95.0 if has_degree else 60.0
            qual_status = "confirmed_match" if has_degree else "unknown"
            qual_text = f"Academic requirement {'satisfied' if has_degree else 'not verified'}: {deg_summary}."
        else:
            qual_score = 85.0
            qual_status = "unknown" if not has_degree else "confirmed_match"
            qual_text = f"Qualification: {deg_summary}."

        evidences.append({
            "dimension": "Qualifications",
            "status": qual_status,
            "score": qual_score,
            "weight": w.get("qualifications", 0.05),
            "evidence_text": qual_text,
        })

        # --- 6. Certifications (Weight: ~5%) ---
        jd_certs = (jd_spec.get("certifications") or "").lower()
        if jd_certs:
            cand_certs = []
            if hasattr(candidate, "certifications") and candidate.certifications:
                cand_certs = [c.name.lower() for c in candidate.certifications if c.name]
            matched_c = [c for c in cand_certs if any(kw in c for kw in jd_certs.split(","))]
            if matched_c:
                cert_score = 100.0
                cert_status = "confirmed_match"
                cert_text = f"Holds certified credential: {', '.join(matched_c)}."
            else:
                cert_score = 50.0
                cert_status = "unknown"
                cert_text = f"JD suggests cert ({jd_certs[:40]}); not explicitly verified on candidate."
        else:
            cert_score = 80.0
            cert_status = "confirmed_match"
            cert_text = "No mandatory certifications required for this requisition."

        evidences.append({
            "dimension": "Certifications",
            "status": cert_status,
            "score": cert_score,
            "weight": w.get("certifications", 0.05),
            "evidence_text": cert_text,
        })

        # --- 7. Location Compatibility (Weight: ~10%) ---
        jd_loc = (jd_spec.get("location") or "").lower().strip()
        jd_mode = (jd_spec.get("work_mode") or "").lower().strip()
        cand_loc = (candidate.location or "").lower().strip()
        cand_pref_loc = (getattr(candidate, "preferred_location", None) or "").lower().strip()

        if "remote" in jd_mode or "remote" in jd_loc or not jd_loc:
            loc_score = 100.0
            loc_status = "confirmed_match"
            loc_text = "Role offers Remote / Distributed work mode."
        elif cand_loc and (cand_loc in jd_loc or jd_loc in cand_loc):
            loc_score = 100.0
            loc_status = "confirmed_match"
            loc_text = f"Candidate location '{candidate.location}' directly matches JD location '{jd_spec.get('location')}'."
        elif cand_pref_loc and (cand_pref_loc in jd_loc or jd_loc in cand_pref_loc):
            loc_score = 95.0
            loc_status = "confirmed_match"
            loc_text = f"Candidate preferred location '{getattr(candidate, 'preferred_location', '')}' matches JD '{jd_spec.get('location')}'."
        elif not cand_loc:
            loc_score = 65.0
            loc_status = "unknown"
            loc_text = "Candidate current city unstated; relocatable candidate."
        else:
            # Different locations
            if "hybrid" in jd_mode or "onsite" in jd_mode:
                loc_score = 40.0
                loc_status = "partial_match"
                loc_text = f"Candidate in '{candidate.location}' vs JD on-site/hybrid location '{jd_spec.get('location')}'."
            else:
                loc_score = 70.0
                loc_status = "partial_match"
                loc_text = f"Candidate in '{candidate.location}', JD in '{jd_spec.get('location')}' (relocation possible)."

        evidences.append({
            "dimension": "Location Compatibility",
            "status": loc_status,
            "score": loc_score,
            "weight": w.get("location", 0.10),
            "evidence_text": loc_text,
        })

        # --- Aggregate Overall Weighted Score (0 - 100) ---
        raw_weighted_score = (
            (skills_score * w.get("required_skills", 0.35)) +
            (pref_score * w.get("preferred_skills", 0.10)) +
            (exp_score * w.get("experience", 0.20)) +
            (role_score * w.get("role_relevance", 0.15)) +
            (qual_score * w.get("qualifications", 0.05)) +
            (cert_score * w.get("certifications", 0.05)) +
            (loc_score * w.get("location", 0.10))
        )
        overall_score = round(min(max(raw_weighted_score, 0.0), 100.0), 1)

        # --- Determine Segmentation ---
        # Critical rule: High optional score can never conceal a confirmed critical mandatory mismatch
        strong_th = th.get("strong", 80.0)
        potential_th = th.get("potential", 65.0)
        partial_th = th.get("partial", 45.0)

        if has_critical_mismatch:
            segment = "Not Suitable"
            overall_score = min(overall_score, 44.0)  # Clamp so score visually reflects non-suitability
        elif overall_score >= strong_th and len(missing_req_skills) <= 1:
            segment = "Strong Match"
        elif overall_score >= potential_th:
            segment = "Potential Match"
        elif overall_score >= partial_th:
            segment = "Partial Match"
        else:
            segment = "Not Suitable"

        # Calculate profile data completeness percentage
        fields = [
            candidate.first_name or candidate.full_name,
            candidate.email,
            candidate.phone,
            candidate.skills,
            candidate.total_experience_years is not None,
            candidate.current_title,
            candidate.location,
        ]
        completeness = round((sum(1 for f in fields if f) / len(fields)) * 100.0, 1)

        return {
            "overall_score": overall_score,
            "segment": segment,
            "matched_skills": matched_req_skills,
            "missing_skills": missing_req_skills,
            "dimension_scores": {
                "skills": skills_score,
                "experience": exp_score,
                "role": role_score,
                "qualifications": qual_score,
                "certifications": cert_score,
                "location": loc_score,
            },
            "has_critical_mismatch": has_critical_mismatch,
            "data_completeness": completeness,
            "evidences": evidences,
        }

    @classmethod
    def execute_matching_run(
        cls,
        db: Session,
        jd_id: int,
        user_id: Optional[int] = None,
        custom_weights: Optional[Dict[str, float]] = None,
        custom_thresholds: Optional[Dict[str, float]] = None,
    ) -> MatchingRun:
        """
        Executes an end-to-end matching run against all candidate records for a specific JD.
        Persists MatchingRun, CandidateMatch, and MatchEvidence records to SQLite.
        """
        jd_doc = db.query(JobDescriptionDocument).filter(JobDescriptionDocument.id == jd_id).first()
        if not jd_doc:
            raise ValueError(f"Job Description Document with id {jd_id} not found")

        # Load or extract structured parsed JD requirements
        parsed_jd = db.query(ParsedJobRequirement).filter(ParsedJobRequirement.jd_doc_id == jd_doc.doc_id).first()
        import os
        from backend.app.services.extraction.jd_parser import JobDescriptionParser

        raw_text = jd_doc.raw_text or ""
        if not raw_text and jd_doc.file_path and os.path.exists(jd_doc.file_path):
            ext = (jd_doc.file_extension or "").lower()
            try:
                if ext == ".pdf":
                    from backend.app.services.extraction.pdf_extractor import extract_text_from_pdf
                    raw_text = extract_text_from_pdf(jd_doc.file_path)
                elif ext in (".docx", ".doc"):
                    from backend.app.services.extraction.docx_extractor import extract_text_from_docx
                    raw_text = extract_text_from_docx(jd_doc.file_path)
                else:
                    from backend.app.services.extraction.txt_extractor import extract_text_from_txt
                    raw_text = extract_text_from_txt(jd_doc.file_path)
            except Exception:
                pass

        if parsed_jd and (parsed_jd.is_manually_corrected or not raw_text):
            req_list = [s.strip() for s in (parsed_jd.required_skills or "").split(",") if s.strip()]
            pref_list = [s.strip() for s in (parsed_jd.preferred_skills or "").split(",") if s.strip()]
            jd_spec = {
                "job_title": parsed_jd.job_title,
                "required_skills": parsed_jd.required_skills,
                "required_skills_list": req_list,
                "preferred_skills": parsed_jd.preferred_skills,
                "preferred_skills_list": pref_list,
                "min_experience_years": parsed_jd.min_experience_years,
                "max_experience_years": parsed_jd.max_experience_years,
                "required_qualifications": parsed_jd.required_qualifications,
                "certifications": parsed_jd.certifications,
                "location": parsed_jd.location,
                "work_mode": parsed_jd.work_mode,
            }
        else:
            parsed = JobDescriptionParser.parse(raw_text or jd_doc.original_filename, filename=jd_doc.original_filename, jd_doc_id=jd_doc.doc_id)
            jd_spec = parsed

        from backend.app.services.resume_repository_sync import sync_repository_resumes_to_candidates

        sync_repository_resumes_to_candidates(db)

        # Fetch all active candidates
        candidates = db.query(Candidate).all()

        run = MatchingRun(
            jd_id=jd_id,
            run_by_user_id=user_id,
            status="running",
            engine_version="3.0.0",
            total_evaluated=len(candidates),
        )
        db.add(run)
        db.flush()

        strong_cnt = 0
        potential_cnt = 0
        partial_cnt = 0
        unsuitable_cnt = 0

        for cand in candidates:
            res = cls.evaluate_candidate(
                candidate=cand,
                jd_spec=jd_spec,
                weights=custom_weights,
                thresholds=custom_thresholds,
            )

            seg = res["segment"]
            if seg == "Strong Match":
                strong_cnt += 1
            elif seg == "Potential Match":
                potential_cnt += 1
            elif seg == "Partial Match":
                partial_cnt += 1
            else:
                unsuitable_cnt += 1

            match_rec = CandidateMatch(
                run_id=run.id,
                candidate_id=cand.id,
                jd_id=jd_id,
                overall_score=res["overall_score"],
                segment=seg,
                matched_skills=json.dumps(res["matched_skills"]),
                missing_skills=json.dumps(res["missing_skills"]),
                skills_score=res["dimension_scores"]["skills"],
                experience_score=res["dimension_scores"]["experience"],
                role_score=res["dimension_scores"]["role"],
                qualifications_score=res["dimension_scores"]["qualifications"],
                certifications_score=res["dimension_scores"]["certifications"],
                location_score=res["dimension_scores"]["location"],
                has_critical_mismatch=res["has_critical_mismatch"],
                data_completeness=res["data_completeness"],
            )
            db.add(match_rec)
            db.flush()

            for ev in res["evidences"]:
                ev_rec = MatchEvidence(
                    candidate_match_id=match_rec.id,
                    dimension=ev["dimension"],
                    status=ev["status"],
                    score=ev["score"],
                    weight=ev["weight"],
                    evidence_text=ev["evidence_text"],
                )
                db.add(ev_rec)

        run.status = "completed"
        run.strong_matches = strong_cnt
        run.potential_matches = potential_cnt
        run.partial_matches = partial_cnt
        run.not_suitable = unsuitable_cnt

        db.commit()
        db.refresh(run)
        return run
