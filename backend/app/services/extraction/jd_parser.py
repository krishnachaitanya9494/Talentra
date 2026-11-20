"""
Deterministic Job Description Parser Service for TALENTRA Phase 2.

Extracts structured job specification data:
- Job Title
- Required Technical Skills
- Preferred Skills
- Minimum and Maximum Experience (in years)
- Required Educational Qualifications
- Certifications
- Job Location
- Employment Type (Full-time, Contract, Remote, Hybrid)
- Mandatory Requirements
- Preferred Requirements
- Field-level extraction confidence and evidence snippets
"""

import re
from typing import Dict, List, Optional, Any, Tuple
from backend.app.services.extraction.normalizer import (
    SKILL_CANONICAL_MAP,
    canonicalize_skill,
)
from backend.app.services.extraction.resume_parser import (
    DEGREE_PATTERN,
    CERTIFICATION_KEYWORDS,
    COMMON_LOCATIONS,
)

# Common Employment Types
EMPLOYMENT_TYPES = ["Full-time", "Contract", "Part-time", "Internship", "Temporary"]


class JobDescriptionParser:
    """
    Rule-based extractor for Job Description requirements.
    """

    @classmethod
    def parse(
        cls,
        text: str,
        filename: Optional[str] = None,
        jd_doc_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Parses Job Description text and returns structured requisition data.
        """
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        evidence: Dict[str, str] = {}
        confidences: Dict[str, float] = {}

        # 1. Job Title Extraction
        job_title, title_evidence, title_conf = cls._extract_job_title(lines, filename, text)
        evidence["job_title"] = title_evidence
        confidences["job_title"] = title_conf

        # 2. Experience Requirements (Min and Max years)
        min_exp, max_exp, exp_evidence = cls._extract_experience_range(text)
        if min_exp is not None or max_exp is not None:
            evidence["experience"] = exp_evidence
            confidences["experience"] = 0.90
        else:
            confidences["experience"] = 0.0

        # 3. Required & Preferred Skills
        req_skills, pref_skills = cls._extract_skills(text)
        evidence["required_skills"] = f"Found {len(req_skills)} required skills: {', '.join(req_skills[:8])}"
        confidences["required_skills"] = 0.90 if req_skills else 0.0

        # 4. Location & Remote/Hybrid Mode
        location, emp_mode = cls._extract_location_and_mode(text)
        if location:
            evidence["location"] = f"Location: {location} ({emp_mode})"
            confidences["location"] = 0.85

        # 5. Employment Type
        emp_type = cls._extract_employment_type(text)

        # 6. Educational Qualifications & Certifications
        qualifications = cls._extract_qualifications(text)
        certifications = cls._extract_certifications(text)

        # 7. Mandatory vs Preferred Requirements
        mandatory_reqs, preferred_reqs = cls._extract_requirements_sections(text, lines)

        # Overall Confidence calculation
        weights = {
            "job_title": 0.35,
            "required_skills": 0.35,
            "experience": 0.15,
            "location": 0.15,
        }
        overall_confidence = sum(confidences.get(k, 0.0) * w for k, w in weights.items())
        overall_confidence = round(min(max(overall_confidence, 0.0), 1.0), 2)

        return {
            "job_title": job_title,
            "required_skills": ", ".join(req_skills) if req_skills else None,
            "required_skills_list": req_skills,
            "preferred_skills": ", ".join(pref_skills) if pref_skills else None,
            "preferred_skills_list": pref_skills,
            "min_experience_years": min_exp,
            "max_experience_years": max_exp,
            "required_qualifications": ", ".join(qualifications) if qualifications else None,
            "certifications": ", ".join(certifications) if certifications else None,
            "location": location,
            "employment_type": emp_type,
            "work_mode": emp_mode,
            "mandatory_requirements": mandatory_reqs,
            "preferred_requirements": preferred_reqs,
            "jd_doc_id": jd_doc_id,
            "original_filename": filename,
            "extraction_confidence": overall_confidence,
            "extraction_evidence": evidence,
        }

    @staticmethod
    def _format_title(title_str: str) -> str:
        acronyms = {"sap", "aws", "gcp", "ai", "ml", "qa", "ui", "ux", "devops", "grc", "fiori", "plm", "erp", "crm", "epm", "pbcs"}
        words = title_str.split()
        res = []
        for w in words:
            clean_w = re.sub(r"[^\w/]", "", w).lower()
            if clean_w in acronyms:
                res.append(w.upper())
            elif "/" in w:
                parts = [p.upper() if p.lower() in acronyms else p.capitalize() for p in w.split("/")]
                res.append("/".join(parts))
            else:
                res.append(w.capitalize())
        return " ".join(res)

    @classmethod
    def _extract_job_title(
        cls,
        lines: List[str],
        filename: Optional[str],
        text: str,
    ) -> Tuple[Optional[str], str, float]:
        """
        Extracts Job Title from header lines or regex match.
        """
        # Pattern match: "Job Title: Senior Software Engineer"
        label_match = re.search(
            r"(?:job\s*title|position|role|title)[\s:=-]+([A-Za-z0-9\s/.-]+)",
            text,
            re.IGNORECASE,
        )
        if label_match:
            cand = label_match.group(1).split("\n")[0].strip()
            if (
                3 <= len(cand) <= 60
                and not re.match(r"^(summary|overview|responsibilities|requirements|description)\b", cand, re.IGNORECASE)
            ):
                return cls._format_title(cand), f"Matched title label: '{cand}'", 0.95

        # Check first 5 lines for typical engineering titles
        for line in lines[:5]:
            clean = line.strip()
            if 4 <= len(clean) <= 60 and not clean.lower().startswith(("about", "company", "overview", "http")):
                # Check if line contains words like Engineer, Developer, Architect, Specialist, Manager
                if re.search(r"\b(engineer|developer|architect|specialist|manager|lead|consultant|analyst)\b", clean, re.IGNORECASE):
                    return cls._format_title(clean), f"Extracted from document header line: '{clean}'", 0.90

        # Fallback to filename
        if filename:
            stem = filename.replace(".txt", "").replace(".docx", "").replace(".pdf", "").replace("_", " ").strip()
            if 3 <= len(stem) <= 50:
                return cls._format_title(stem), f"Derived from filename: '{filename}'", 0.70

        return None, "Job title could not be determined", 0.0

    @classmethod
    def _extract_experience_range(cls, text: str) -> Tuple[Optional[float], Optional[float], str]:
        """
        Extracts minimum and maximum required experience years (e.g. '5-8 years', '3+ years', 'min 4 years').
        """
        # Range: "5 - 8 years" or "5 to 8 yrs"
        range_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:\+?\s*years?|yrs?)", text, re.IGNORECASE)
        if range_match:
            mn = float(range_match.group(1))
            mx = float(range_match.group(2))
            return mn, mx, f"Experience range found: {mn} - {mx} years"

        # Plus / Minimum: "5+ years" or "minimum 5 years"
        min_match = re.search(r"(?:minimum|at\s*least|min)?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)", text, re.IGNORECASE)
        if min_match:
            mn = float(min_match.group(1))
            return mn, None, f"Minimum experience required: {mn} years"

        return None, None, "No specific experience duration found"

    @classmethod
    def _extract_skills(cls, text: str) -> Tuple[List[str], List[str]]:
        """
        Extracts required and preferred skills by scanning text and checking section context.
        """
        req_skills: List[str] = []
        pref_skills: List[str] = []
        seen = set()

        # Split text by "Good to have" / "Preferred" if present
        parts = re.split(r"(?:preferred|nice\s*to\s*have|good\s*to\s*have|bonus\s*skills)[\s:=-]+", text, flags=re.IGNORECASE)
        main_part = parts[0]
        pref_part = parts[1] if len(parts) > 1 else ""

        for raw_kw, canonical in SKILL_CANONICAL_MAP.items():
            if raw_kw == "go" and not re.search(
                r"\b(?:golang|go programming(?: language)?|go language|go developer|go engineer)\b",
                text,
                re.IGNORECASE,
            ):
                continue
            pattern = rf"(?<![a-zA-Z0-9_]){re.escape(raw_kw)}(?![a-zA-Z0-9_])"
            if re.search(pattern, main_part, re.IGNORECASE):
                if canonical not in seen:
                    seen.add(canonical)
                    req_skills.append(canonical)
            elif pref_part and re.search(pattern, pref_part, re.IGNORECASE):
                if canonical not in seen:
                    seen.add(canonical)
                    pref_skills.append(canonical)

        req_skills.sort()
        pref_skills.sort()
        return req_skills, pref_skills

    @classmethod
    def _extract_location_and_mode(cls, text: str) -> Tuple[Optional[str], str]:
        """
        Extracts location and remote / hybrid work mode.
        """
        mode = "On-site"
        if re.search(r"\bremote\b", text, re.IGNORECASE):
            mode = "Remote"
        elif re.search(r"\bhybrid\b", text, re.IGNORECASE):
            mode = "Hybrid"

        for loc in COMMON_LOCATIONS:
            if re.search(rf"\b{re.escape(loc)}\b", text, re.IGNORECASE):
                return loc, mode

        return None, mode

    @classmethod
    def _extract_employment_type(cls, text: str) -> str:
        for et in EMPLOYMENT_TYPES:
            if re.search(rf"\b{re.escape(et)}\b", text, re.IGNORECASE):
                return et
        return "Full-time"

    @classmethod
    def _extract_qualifications(cls, text: str) -> List[str]:
        matches = DEGREE_PATTERN.findall(text)
        seen = set()
        clean = []
        for m in matches:
            val = m.strip()
            if val.upper() not in seen:
                seen.add(val.upper())
                clean.append(val)
        return clean

    @classmethod
    def _extract_certifications(cls, text: str) -> List[str]:
        certs = []
        for kw in CERTIFICATION_KEYWORDS:
            if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
                certs.append(kw)
        return certs

    @classmethod
    def _extract_requirements_sections(cls, text: str, lines: List[str]) -> Tuple[Optional[str], Optional[str]]:
        """
        Extracts bulleted mandatory requirements and preferred requirements.
        """
        mandatory_bullets = []
        preferred_bullets = []
        current_section = "general"

        for line in lines:
            lower = line.lower()
            if any(h in lower for h in ["mandatory", "must have", "requirements", "qualifications", "what you need"]):
                current_section = "mandatory"
                continue
            elif any(h in lower for h in ["preferred", "nice to have", "good to have", "bonus"]):
                current_section = "preferred"
                continue

            # Check bullet lines
            if line.startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5.")):
                clean_bullet = line.lstrip("-*• 0123456789.").strip()
                if clean_bullet:
                    if current_section == "preferred":
                        preferred_bullets.append(clean_bullet)
                    else:
                        mandatory_bullets.append(clean_bullet)

        mand_str = "\n".join(f"• {b}" for b in mandatory_bullets[:15]) if mandatory_bullets else None
        pref_str = "\n".join(f"• {b}" for b in preferred_bullets[:10]) if preferred_bullets else None
        return mand_str, pref_str
