"""
Phase 5C 5-Component Weighted Deterministic + Semantic Scorer for TALENTRA.

Formula:
Total Score = w_m * S_mandatory + w_p * S_preferred + w_e * S_experience + w_d * S_domain + w_s * S_semantic

Weights:
- Mandatory Skills: 35%
- Preferred Skills: 20%
- Experience Fit: 15%
- Domain Relevance: 10%
- Semantic Vector Relevance (2,048-dim Cosine): 20%

Mandatory Requirement Protection Policy:
- Missing 1 mandatory skill -> Tier capped at 'Potential Match' (max score capped at 64.9 if higher).
- Missing >= 2 mandatory skills -> Tier capped at 'Partial Match' (max score capped at 44.9 if higher).
- Missing all mandatory skills -> Tier capped at 'Needs Review' / 'Not Suitable'.
"""

import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.services.extraction.normalizer import canonicalize_skill
from backend.app.services.ai.embedding_service import get_embedding_provider


class FiveComponentScorer:
    """Enterprise 5-Component Scorer combining deterministic verification with 2,048-dim vector embeddings."""

    WEIGHTS_FULL = {
        "mandatory": 0.35,
        "preferred": 0.20,
        "experience": 0.15,
        "domain": 0.10,
        "semantic": 0.20,
    }

    # Proportional re-normalization when semantic vector is fallback/unavailable:
    # 0.35 / 0.80 = 0.4375 (43.75%)
    # 0.20 / 0.80 = 0.2500 (25.00%)
    # 0.15 / 0.80 = 0.1875 (18.75%)
    # 0.10 / 0.80 = 0.1250 (12.50%)
    # Semantic: 0.0000 (0.00%)
    # Sum = 1.0000 (100.0%)
    WEIGHTS_FALLBACK = {
        "mandatory": 0.4375,
        "preferred": 0.2500,
        "experience": 0.1875,
        "domain": 0.1250,
        "semantic": 0.0,
    }

    WEIGHTS = WEIGHTS_FULL

    @classmethod
    def evaluate(
        cls,
        db: Session,
        candidate: Candidate,
        job: JobRequirement,
        parsed_spec: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate candidate against job requirement using the 5-component weighted architecture.
        Strictly enforces fallback transparency and proportional weight re-normalization.
        """
        # --- Candidate Skills Set ---
        cand_skills_raw = candidate.skills or ""
        cand_skills = set()
        for s in re.split(r"[,;|/\n]+", cand_skills_raw):
            clean_s = s.strip()
            if clean_s:
                canon = canonicalize_skill(clean_s).lower()
                cand_skills.add(canon)
                cand_skills.add(clean_s.lower())

        def matches(skill_name: str) -> bool:
            clean = skill_name.lower().strip()
            canon = canonicalize_skill(skill_name).lower()
            return clean in cand_skills or canon in cand_skills or any(clean in cs for cs in cand_skills)

        # --- 1. Mandatory Skills (35%) ---
        mandatory_list = []
        if parsed_spec and parsed_spec.get("mandatory_requirements"):
            mandatory_list = [s.strip() for s in re.split(r"[,;\n]+", str(parsed_spec["mandatory_requirements"])) if s.strip()]
        if not mandatory_list:
            req_s = getattr(job, "required_skills", None) or getattr(job, "primary_skills", None) or ""
            mandatory_list = [s.strip() for s in req_s.split(",") if s.strip()]

        matched_mandatory = [s for s in mandatory_list if matches(s)]
        missing_mandatory = [s for s in mandatory_list if not matches(s)]

        if mandatory_list:
            s_mandatory = round((len(matched_mandatory) / len(mandatory_list)) * 100.0, 1)
        else:
            s_mandatory = 70.0  # Neutral baseline if no mandatory skills specified

        # --- 2. Preferred Skills (20%) ---
        preferred_list = []
        if parsed_spec and parsed_spec.get("preferred_requirements"):
            preferred_list = [s.strip() for s in re.split(r"[,;\n]+", str(parsed_spec["preferred_requirements"])) if s.strip()]
        pref_s = getattr(job, "preferred_skills", None) or ""
        if not preferred_list and pref_s:
            preferred_list = [s.strip() for s in pref_s.split(",") if s.strip()]

        matched_preferred = [s for s in preferred_list if matches(s)]
        missing_preferred = [s for s in preferred_list if not matches(s)]

        if preferred_list:
            s_preferred = round((len(matched_preferred) / len(preferred_list)) * 100.0, 1)
        else:
            s_preferred = 80.0  # No penalty if role has no secondary requirements

        # --- 3. Experience Fit (15%) ---
        cand_exp = float(candidate.total_experience_years) if candidate.total_experience_years is not None else 0.0
        req_min = float(getattr(job, "min_experience", 0.0) or getattr(job, "min_experience_years", 0.0) or 0.0)
        req_max = float(getattr(job, "max_experience", 0.0) or getattr(job, "max_experience_years", 0.0) or (req_min + 4.0))

        if req_min <= 0:
            s_experience = 85.0
        elif req_min <= cand_exp <= req_max:
            s_experience = 100.0
        elif cand_exp > req_max:
            diff = cand_exp - req_max
            s_experience = max(65.0, round(100.0 - (diff * 4.0), 1))
        else:
            # Deficit
            deficit_ratio = cand_exp / req_min if req_min > 0 else 1.0
            s_experience = round(deficit_ratio * 75.0, 1)

        # --- 4. Domain Relevance (10%) ---
        cand_title = (candidate.current_title or "").lower()
        job_title = (getattr(job, "title", None) or getattr(job, "job_title", "")).lower()
        domain_tokens = set(re.findall(r"\w+", job_title)) - {"senior", "lead", "staff", "junior", "engineer", "developer", "consultant"}
        cand_tokens = set(re.findall(r"\w+", cand_title))
        overlap = domain_tokens.intersection(cand_tokens)

        if cand_title == job_title or (job_title in cand_title) or (cand_title in job_title):
            s_domain = 100.0
        elif overlap:
            s_domain = 85.0
        elif any(t in cand_tokens for t in ["engineer", "developer", "architect", "analyst"]):
            s_domain = 65.0
        else:
            s_domain = 45.0

        # --- 5. Semantic Vector Relevance (20% or 0% fallback) ---
        embedder = get_embedding_provider()
        sem_res = embedder.compute_semantic_score(db, candidate, job)

        if isinstance(sem_res, dict):
            is_fallback = bool(sem_res.get("is_fallback", False))
            semantic_available = bool(sem_res.get("semantic_available", False))
            s_semantic = float(sem_res.get("semantic_score", 0.0))
            semantic_status = str(sem_res.get("semantic_status", ""))
        else:
            s_semantic = float(sem_res)
            semantic_available = s_semantic > 0.0
            is_fallback = not semantic_available
            semantic_status = "Grounded neural vector cosine similarity." if semantic_available else "Semantic matching unavailable — score calculated using verified structured criteria."

        # Proportional weight selection:
        # If semantic vector is fallback or unavailable, weights re-normalize to 100%:
        # mandatory: 43.75%, preferred: 25.0%, experience: 18.75%, domain: 12.5%, semantic: 0%
        if is_fallback or not semantic_available:
            active_weights = cls.WEIGHTS_FALLBACK
            s_semantic = 0.0
            semantic_available = False
            semantic_status = "Semantic matching unavailable — score calculated using verified structured criteria."
        else:
            active_weights = cls.WEIGHTS_FULL

        # --- Unadjusted Composite Score ---
        raw_composite = (
            active_weights["mandatory"] * s_mandatory
            + active_weights["preferred"] * s_preferred
            + active_weights["experience"] * s_experience
            + active_weights["domain"] * s_domain
            + active_weights["semantic"] * s_semantic
        )
        raw_score = round(min(max(raw_composite, 0.0), 100.0), 1)

        # --- Mandatory Requirement Protection Policy ---
        # 1 missing mandatory skill -> cap tier at Potential Match (max 64.9)
        # >= 2 missing mandatory skills -> cap tier at Partial Match (max 44.9)
        # all missing -> Needs Review / Not Suitable (max 39.0)
        num_missing = len(missing_mandatory)
        policy_applied = False
        policy_reason = None
        adjusted_score = raw_score

        if mandatory_list and len(matched_mandatory) == 0:
            eligibility_tier = "Needs Review"
            adjusted_score = min(adjusted_score, 39.0)
            policy_applied = True
            policy_reason = f"Lacks all {len(mandatory_list)} mandatory requirements."
        elif num_missing >= 2:
            eligibility_tier = "Partial Match"
            if adjusted_score > 44.9:
                adjusted_score = 44.9
                policy_applied = True
                policy_reason = f"Missing {num_missing} mandatory skills ({', '.join(missing_mandatory[:3])}); tier capped at Partial Match."
        elif num_missing == 1:
            eligibility_tier = "Potential Match"
            if adjusted_score > 64.9:
                adjusted_score = 64.9
                policy_applied = True
                policy_reason = f"Missing 1 mandatory skill ({missing_mandatory[0]}); tier capped at Potential Match."
        else:
            if adjusted_score >= 85.0:
                eligibility_tier = "Excellent Match"
            elif adjusted_score >= 75.0:
                eligibility_tier = "Strong Match"
            elif adjusted_score >= 60.0:
                eligibility_tier = "Potential Match"
            elif adjusted_score >= 40.0:
                eligibility_tier = "Partial Match"
            else:
                eligibility_tier = "Needs Review"

        scoring_methodology = (
            "Proportional 4-Component Re-normalization (Mandatory: 43.75%, Preferred: 25.0%, Experience: 18.75%, Domain: 12.5%, Semantic Vector: 0.0%)"
            if is_fallback or not semantic_available
            else "Standard 5-Component (Mandatory: 35.0%, Preferred: 20.0%, Experience: 15.0%, Domain: 10.0%, Semantic Vector: 20.0%)"
        )

        return {
            "raw_score": raw_score,
            "adjusted_score": adjusted_score,
            "composite_score": adjusted_score,  # Backward-compatible alias
            "tier": eligibility_tier,  # Backward-compatible alias
            "eligibility_tier": eligibility_tier,
            "policy_applied": policy_applied,
            "policy_reason": policy_reason,
            "mandatory_skills_satisfied": matched_mandatory,
            "mandatory_skills_missing": missing_mandatory,
            "semantic_score": s_semantic,
            "semantic_available": semantic_available,
            "semantic_status": semantic_status,
            "scoring_methodology": scoring_methodology,
            "is_fallback": is_fallback,
            "weights_used": active_weights,
            "component_scores": {
                "mandatory_skills": s_mandatory,
                "preferred_skills": s_preferred,
                "experience_fit": s_experience,
                "domain_relevance": s_domain,
                "semantic_vector": s_semantic,
            },
            "mandatory_breakdown": {
                "total": len(mandatory_list),
                "matched": matched_mandatory,
                "missing": missing_mandatory,
            },
            "preferred_breakdown": {
                "total": len(preferred_list),
                "matched": matched_preferred,
                "missing": missing_preferred,
            },
            "evidence_quote": f"Matched skills [{', '.join(matched_mandatory[:5])}]; Experience: {cand_exp} yrs (Target: {req_min}-{req_max} yrs).",
        }
