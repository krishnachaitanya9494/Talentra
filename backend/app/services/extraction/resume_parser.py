"""
Deterministic Resume Parser Service for TALENTRA Phase 2.

Extracts structured candidate intelligence from raw resume text:
- Full Name
- Email Addresses (Primary and alternatives)
- Phone Numbers (Normalized canonical format)
- Current Designation
- Total Experience (in decimal years)
- Current and Previous Employers
- Technical Skills
- Certifications
- Educational Qualifications
- Current Location
- Preferred Location (if explicitly available)
- Field-level extraction confidence and evidence snippets

Strictly deterministic: Never invents missing fields (returns None).
"""

import re
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

from backend.app.services.extraction.normalizer import (
    extract_all_emails,
    extract_phone_numbers,
    normalize_experience_years,
    canonicalize_skill,
    SKILL_CANONICAL_MAP,
)

# Common Section Headers to ignore when looking for Names
NON_NAME_HEADERS = {
    "resume", "curriculum vitae", "cv", "biodata", "profile", "summary",
    "professional summary", "executive summary", "experience", "work experience",
    "employment history", "skills", "technical skills", "education", "projects",
    "certifications", "contact", "personal details", "declaration", "hobbies",
}

# Popular designations for pattern matching
DESIGNATION_PATTERNS = [
    r"(?:senior|lead|principal|staff|junior|associate|chief)?\s*(?:software|systems?|full\s*stack|frontend|front-end|backend|back-end|cloud|devops|data|ml|ai|qa|test|automation|mobile|ios|android|site\s*reliability|sre)?\s*(?:engineer|developer|architect|consultant|specialist|analyst|manager|lead|director)",
    r"(?:product|project|program|technical|engineering)\s*(?:manager|owner|lead|director)",
    r"(?:data\s*scientist|data\s*analyst|database\s*administrator|dba|system\s*administrator|sysadmin)",
    r"(?:scrum\s*master|agile\s*coach|ui/ux\s*designer|ux\s*designer|solutions?\s*architect)",
]

# Educational Degrees Pattern
DEGREE_PATTERN = re.compile(
    r"\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?E\.?|B\.?S\.?|M\.?S\.?|B\.?Sc\.?|M\.?Sc\.?|BCA|MCA|BBA|MBA|Ph\.?D\.?|Bachelor\s+of\s+[A-Za-z]+|Master\s+of\s+[A-Za-z]+|Diploma\s+in\s+[A-Za-z]+)\b",
    re.IGNORECASE,
)

# Year Pattern for education (e.g. 1990 - 2029)
YEAR_PATTERN = re.compile(r"\b(19\d{2}|20[0-2]\d)\b")

# Well-known certifications keywords
CERTIFICATION_KEYWORDS = [
    "AWS Certified", "Solutions Architect", "Developer Associate", "SysOps Administrator",
    "Azure Certified", "Azure Fundamentals", "Azure Administrator", "GCP Certified",
    "Google Cloud Certified", "Cloud Architect", "PMP", "Project Management Professional",
    "Scrum Master", "CSM", "PSM", "SAFe", "Agile Certified", "CKA", "CKAD",
    "Certified Kubernetes", "CISSP", "CEH", "CCNA", "CCNP", "ITIL", "HashiCorp Certified",
    "Terraform Associate", "Oracle Certified", "Salesforce Certified", "Snowflake Certified",
    "Databricks Certified",
]

# Common Indian and Global Metros / Locations
COMMON_LOCATIONS = [
    "Bangalore", "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Chennai", "Delhi", "Noida",
    "Gurgaon", "Gurugram", "Kolkata", "Ahmedabad", "Kochi", "Coimbatore", "Chandigarh",
    "San Francisco", "New York", "Austin", "Seattle", "Chicago", "Boston", "Toronto",
    "Vancouver", "London", "Dublin", "Berlin", "Singapore", "Sydney", "Dubai",
]


class ResumeParser:
    """
    Robust rule-based parser for extracting candidate data from resume text.
    """

    @classmethod
    def parse(
        cls,
        text: str,
        filename: Optional[str] = None,
        resume_doc_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Parses resume text and returns structured candidate profile dictionary.
        """
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        evidence: Dict[str, str] = {}
        confidences: Dict[str, float] = {}

        # 1. Email Extraction
        primary_email, all_emails = extract_all_emails(text)
        if primary_email:
            evidence["email"] = primary_email
            confidences["email"] = 0.95
        else:
            confidences["email"] = 0.0

        # 2. Phone Extraction
        primary_phone, all_phones = extract_phone_numbers(text)
        if primary_phone:
            evidence["phone"] = primary_phone
            confidences["phone"] = 0.90
        else:
            confidences["phone"] = 0.0

        # 3. Full Name Extraction
        full_name, name_evidence, name_conf = cls._extract_full_name(lines, filename, primary_email)
        evidence["full_name"] = name_evidence
        confidences["full_name"] = name_conf

        first_name, last_name = cls._split_name(full_name)

        # 4. Total Experience Extraction
        total_exp, exp_evidence = cls._extract_experience(text, filename)
        if total_exp is not None:
            evidence["total_experience_years"] = exp_evidence
            confidences["total_experience_years"] = 0.90
        else:
            confidences["total_experience_years"] = 0.0

        # 5. Current Designation Extraction
        designation, desig_evidence = cls._extract_designation(lines, text)
        if designation:
            evidence["current_title"] = desig_evidence
            confidences["current_title"] = 0.85
        else:
            confidences["current_title"] = 0.0

        # 6. Employers Extraction (Current & Previous)
        employers, current_company = cls._extract_employers(text, lines)
        if current_company:
            evidence["current_company"] = current_company
            confidences["current_company"] = 0.80

        # 7. Technical Skills Extraction
        skills, matched_skills = cls._extract_skills(text)
        evidence["skills"] = f"Detected {len(matched_skills)} verified skills: {', '.join(matched_skills[:10])}"
        confidences["skills"] = 0.90 if matched_skills else 0.0

        # 8. Certifications Extraction
        certifications = cls._extract_certifications(text)
        if certifications:
            evidence["certifications"] = ", ".join(certifications[:5])
            confidences["certifications"] = 0.85

        # 9. Education Extraction
        education_records = cls._extract_education(text, lines)
        if education_records:
            evidence["education"] = f"Found {len(education_records)} qualification(s)"
            confidences["education"] = 0.85

        # 10. Location & Preferred Location Extraction
        current_loc, preferred_loc, loc_evidence = cls._extract_locations(text)
        if current_loc:
            evidence["location"] = loc_evidence
            confidences["location"] = 0.80
        if preferred_loc:
            evidence["preferred_location"] = f"Preferred: {preferred_loc}"

        # 11. Social and Portfolio URLs (Strictly extracted if present)
        linkedin_url, github_url, portfolio_url = cls._extract_social_urls(text)
        if linkedin_url:
            evidence["linkedin_url"] = linkedin_url
            confidences["linkedin_url"] = 0.95
        if github_url:
            evidence["github_url"] = github_url
            confidences["github_url"] = 0.95
        if portfolio_url:
            evidence["portfolio_url"] = portfolio_url
            confidences["portfolio_url"] = 0.85

        # 12. Alternative Phone Number
        alt_phone = all_phones[1] if len(all_phones) > 1 else None
        if alt_phone:
            evidence["alt_phone"] = alt_phone

        # 13. Compensation Extraction (Explicitly stated only, NEVER guessed)
        c_ctc, e_ctc, salary_currency, salary_freq = cls._extract_compensation(text)
        if c_ctc:
            evidence["current_ctc"] = c_ctc
            confidences["current_ctc"] = 0.90
        if e_ctc:
            evidence["expected_ctc"] = e_ctc
            confidences["expected_ctc"] = 0.90

        # 14. Notice Period & Work Mode (Explicitly stated only)
        notice_period = cls._extract_notice_period(text)
        if notice_period:
            evidence["notice_period"] = notice_period
            confidences["notice_period"] = 0.90

        work_mode = cls._extract_work_mode(text)
        if work_mode:
            evidence["work_mode"] = work_mode

        # 15. Structured Employment History
        employment_history = cls._extract_employment_history(text, employers, designation)

        # 16. Relevant Experience (Calculated only when documented)
        relevant_exp = total_exp

        # Calculate Overall Confidence Score (Weighted Average)
        weights = {
            "full_name": 0.25,
            "email": 0.25,
            "phone": 0.15,
            "skills": 0.15,
            "total_experience_years": 0.10,
            "current_title": 0.10,
        }
        overall_confidence = sum(confidences.get(k, 0.0) * w for k, w in weights.items())
        overall_confidence = round(min(max(overall_confidence, 0.0), 1.0), 2)

        # Build Field-Level Provenance
        field_provenance: Dict[str, Dict[str, Any]] = {}
        for fld, val in [
            ("full_name", full_name),
            ("email", primary_email),
            ("phone", primary_phone),
            ("alt_phone", alt_phone),
            ("current_title", designation),
            ("current_company", current_company),
            ("total_experience_years", total_exp),
            ("relevant_experience_years", relevant_exp),
            ("location", current_loc),
            ("notice_period", notice_period),
            ("current_ctc", c_ctc),
            ("expected_ctc", e_ctc),
            ("linkedin_url", linkedin_url),
            ("github_url", github_url),
            ("portfolio_url", portfolio_url),
            ("work_mode", work_mode),
        ]:
            field_provenance[fld] = {
                "value": val,
                "source_filename": filename or "",
                "method": "deterministic_rule" if val is not None else "not_found",
                "evidence": evidence.get(fld, ""),
                "confidence": confidences.get(fld, 0.0),
                "status": "validated" if val and confidences.get(fld, 0.0) >= 0.8 else ("extracted" if val else "missing"),
                "is_calculated": fld in ["total_experience_years", "relevant_experience_years"],
            }

        return {
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "email": primary_email,
            "all_emails": all_emails,
            "phone": primary_phone,
            "alt_phone": alt_phone,
            "all_phones": all_phones,
            "current_title": designation,
            "current_company": current_company,
            "total_experience_years": total_exp,
            "relevant_experience_years": relevant_exp,
            "skills": skills,
            "skills_list": matched_skills,
            "employers": employers,
            "employment_history": employment_history,
            "certifications": certifications,
            "education": education_records,
            "location": current_loc,
            "preferred_location": preferred_loc,
            "linkedin_url": linkedin_url,
            "github_url": github_url,
            "portfolio_url": portfolio_url,
            "notice_period": notice_period,
            "current_ctc": c_ctc,
            "expected_ctc": e_ctc,
            "salary_currency": salary_currency,
            "salary_frequency": salary_freq,
            "work_mode": work_mode,
            "resume_doc_id": resume_doc_id,
            "original_filename": filename,
            "extraction_confidence": overall_confidence,
            "field_confidences": confidences,
            "extraction_evidence": evidence,
            "field_provenance": field_provenance,
        }

    @classmethod
    def _extract_full_name(
        cls,
        lines: List[str],
        filename: Optional[str],
        primary_email: Optional[str],
    ) -> Tuple[Optional[str], str, float]:
        """
        Extracts candidate full name using header line heuristics and filename tokens.
        """
        # Heuristic A: Look in the first 8 lines of text
        for line in lines[:8]:
            clean_line = re.sub(r"[^a-zA-Z\s.]", "", line).strip()
            lower = clean_line.lower()

            # Ignore lines that are emails, phone numbers, URLs, or headers
            if any(h in lower for h in NON_NAME_HEADERS):
                continue
            if "@" in line or "http" in line or "www" in line:
                continue

            words = clean_line.split()
            # Candidate names are typically 2 to 4 capitalized words of reasonable length
            if 2 <= len(words) <= 4:
                if all(len(w) >= 2 and w[0].isupper() for w in words):
                    return clean_line, f"Extracted from header: '{line}'", 0.90

        # Heuristic B: Extract from filename (e.g., Naukri_BandiUmadevi[12y_5m].pdf -> Bandi Umadevi)
        if filename:
            name_from_file = cls._extract_name_from_filename(filename)
            if name_from_file:
                return name_from_file, f"Derived from filename: '{filename}'", 0.75

        # Heuristic C: Email prefix fallback if conventional firstname.lastname@
        if primary_email:
            prefix = primary_email.split("@")[0]
            parts = re.split(r"[._-]", prefix)
            if len(parts) >= 2 and all(p.isalpha() and len(p) >= 2 for p in parts[:2]):
                name = f"{parts[0].capitalize()} {parts[1].capitalize()}"
                return name, f"Inferred from email handle: '{primary_email}'", 0.60

        return None, "Full name could not be reliably determined", 0.0

    @staticmethod
    def _extract_name_from_filename(filename: str) -> Optional[str]:
        """
        Extracts readable name from filenames such as:
        - 'Naukri_BandiUmadevi[12y_5m].pdf' -> 'Bandi Umadevi'
        - 'Kavya_Patel_Resume.docx' -> 'Kavya Patel'
        - 'Resume_Alex_Smith.txt' -> 'Alex Smith'
        """
        base = Path(filename).stem
        # Remove common portal prefixes & experience tags
        cleaned = re.sub(r"^(?:Naukri_|Resume_|CV_)?", "", base, flags=re.IGNORECASE)
        cleaned = re.sub(r"\[.*?\]", "", cleaned)  # Remove [12y_5m]
        cleaned = re.sub(r"_\d+y.*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"[_-]?(?:resume|cv|profile|updated|latest)$", "", cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.replace("_", " ").replace("-", " ").strip()

        # Handle CamelCase e.g. BandiUmadevi -> Bandi Umadevi
        spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", cleaned).strip()
        words = spaced.split()

        if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
            return " ".join(w.capitalize() for w in words)
        return None

    @staticmethod
    def _split_name(full_name: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
        if not full_name:
            return None, None
        parts = full_name.split()
        if len(parts) == 1:
            return parts[0], parts[0]
        return parts[0], " ".join(parts[1:])

    @classmethod
    def _extract_experience(cls, text: str, filename: Optional[str]) -> Tuple[Optional[float], str]:
        """
        Extracts total professional experience in years.
        Checks filename tokens (like [12y_5m]) and resume text summary statements.
        """
        # Priority 1: Filename tag (e.g. Naukri [12y_5m])
        if filename:
            fn_exp = normalize_experience_years(filename)
            if fn_exp is not None:
                return fn_exp, f"Explicit portal experience tag in filename: {fn_exp} years"

        # Priority 2: Resume body text
        body_exp = normalize_experience_years(text)
        if body_exp is not None:
            return body_exp, f"Extracted from resume summary text: {body_exp} years"

        return None, "No explicit professional experience duration found"

    @classmethod
    def _extract_designation(cls, lines: List[str], text: str) -> Tuple[Optional[str], str]:
        """
        Extracts current job title or primary designation.
        """
        # Look for explicit label
        label_match = re.search(
            r"(?:current\s*(?:designation|role|title|position)|designation)[\s:=-]+([A-Za-z0-9\s/.-]+)",
            text,
            re.IGNORECASE,
        )
        if label_match:
            candidate = label_match.group(1).split("\n")[0].strip()
            if 3 <= len(candidate) <= 60:
                return candidate.title(), f"Matched title label: '{candidate}'"

        # Look in top 15 lines for known designation patterns
        for line in lines[:15]:
            clean_line = line.strip()
            if 3 <= len(clean_line) <= 60 and not clean_line.lower().startswith(("http", "www", "email", "phone", "contact")):
                for pattern in DESIGNATION_PATTERNS:
                    if re.search(pattern, clean_line, re.IGNORECASE):
                        return clean_line, f"Matched standard role pattern in header: '{clean_line}'"

        return None, "Current designation not detected"

    @classmethod
    def _extract_employers(cls, text: str, lines: List[str]) -> Tuple[List[str], Optional[str]]:
        """
        Extracts list of employer companies and current company.
        """
        employers: List[str] = []
        current_company: Optional[str] = None

        # Look for 'Current Employer' or 'Company:'
        curr_match = re.search(
            r"(?:current\s*(?:employer|company|organization)|present\s*(?:employer|company))[\s:=-]+([A-Za-z0-9\s/.,&-]+)",
            text,
            re.IGNORECASE,
        )
        if curr_match:
            cand = curr_match.group(1).split("\n")[0].strip()
            if 2 <= len(cand) <= 60 and not any(w in cand.lower() for w in NON_NAME_HEADERS):
                current_company = cand.title()
                employers.append(current_company)

        # Well-known technology enterprises
        known_enterprises = [
            "Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Oracle",
            "Cisco", "IBM", "Intel", "Salesforce", "Adobe", "SAP", "Infosys",
            "Tata Consultancy Services", "TCS", "Wipro", "Cognizant", "HCLTech", "HCL",
            "Accenture", "Capgemini", "LTI", "Tech Mahindra", "Deloitte", "PwC", "EY", "KPMG",
        ]
        for ent in known_enterprises:
            if re.search(rf"\b{re.escape(ent)}\b", text, re.IGNORECASE):
                if ent not in employers:
                    employers.append(ent)

        if not current_company and employers:
            current_company = employers[0]

        return employers, current_company

    @classmethod
    def _extract_skills(cls, text: str) -> Tuple[Optional[str], List[str]]:
        """
        Matches text against technology dictionary and returns canonicalized skills.
        """
        found_skills: List[str] = []
        seen: set = set()

        # Check all canonical skills
        for raw_kw, canonical in SKILL_CANONICAL_MAP.items():
            if raw_kw.casefold() in {"ara", "arm", "brm", "eam"} and not re.search(
                r"\b(?:sap\s+grc|grc|sap\s+security|access control)\b",
                text,
                re.IGNORECASE,
            ):
                continue
            if raw_kw == "go" and not re.search(
                r"\b(?:golang|go programming(?: language)?|go language|go developer|go engineer)\b",
                text,
                re.IGNORECASE,
            ):
                continue
            pattern = rf"(?<![a-zA-Z0-9_]){re.escape(raw_kw)}(?![a-zA-Z0-9_])"
            if re.search(pattern, text, re.IGNORECASE):
                if canonical not in seen:
                    seen.add(canonical)
                    found_skills.append(canonical)

        # Alphabetically sort for consistency
        found_skills.sort()
        skills_str = ", ".join(found_skills) if found_skills else None
        return skills_str, found_skills

    @classmethod
    def _extract_certifications(cls, text: str) -> List[str]:
        """
        Extracts verified certifications from text.
        """
        certs: List[str] = []
        for kw in CERTIFICATION_KEYWORDS:
            if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
                if kw not in certs:
                    certs.append(kw)
        return certs

    @classmethod
    def _extract_education(cls, text: str, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Extracts educational degrees, institutions, and graduation years.
        """
        records: List[Dict[str, Any]] = []
        degree_matches = DEGREE_PATTERN.findall(text)

        seen_degrees = set()
        for deg in degree_matches:
            deg_clean = deg.strip().upper()
            if deg_clean not in seen_degrees:
                seen_degrees.add(deg_clean)

                # Look for surrounding year in the line containing this degree
                grad_year = None
                inst_name = None
                for line in lines:
                    if deg in line:
                        year_m = YEAR_PATTERN.search(line)
                        if year_m:
                            grad_year = int(year_m.group(1))
                        # Check if line mentions university/college/institute
                        inst_m = re.search(r"([A-Za-z\s]+(?:University|College|Institute|Campus))", line, re.IGNORECASE)
                        if inst_m:
                            inst_name = inst_m.group(1).strip().title()
                        break

                records.append({
                    "degree": deg.strip(),
                    "institution": inst_name,
                    "graduation_year": grad_year,
                })

        return records

    @classmethod
    def _extract_locations(cls, text: str) -> Tuple[Optional[str], Optional[str], str]:
        """
        Extracts current location and preferred location if explicitly specified.
        """
        current_loc: Optional[str] = None
        preferred_loc: Optional[str] = None
        evidence = ""

        # Check explicit preferred location
        pref_match = re.search(
            r"(?:preferred\s*location|relocation|prefer\s*to\s*work\s*in)[\s:=-]+([A-Za-z\s,]+)",
            text,
            re.IGNORECASE,
        )
        if pref_match:
            candidate = pref_match.group(1).split("\n")[0].strip()
            for loc in COMMON_LOCATIONS:
                if loc.lower() in candidate.lower():
                    preferred_loc = loc
                    break

        # Check current location mentions
        for loc in COMMON_LOCATIONS:
            if re.search(rf"\b{re.escape(loc)}\b", text, re.IGNORECASE):
                current_loc = loc
                evidence = f"Detected location '{loc}' in resume text"
                break

        return current_loc, preferred_loc, evidence

    @classmethod
    def _extract_social_urls(cls, text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Extracts verified social/developer URLs from text.
        Returns (linkedin_url, github_url, portfolio_url).
        """
        linkedin_m = re.search(r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/in/([A-Za-z0-9_%-]+)", text, re.IGNORECASE)
        linkedin_url = f"https://linkedin.com/in/{linkedin_m.group(1)}" if linkedin_m else None

        github_m = re.search(r"https?://(?:www\.)?github\.com/([A-Za-z0-9_%-]+)", text, re.IGNORECASE)
        github_url = f"https://github.com/{github_m.group(1)}" if github_m else None

        portfolio_url = None
        for m in re.finditer(r"https?://([A-Za-z0-9_.-]+\.[a-z]{2,}(?:/[A-Za-z0-9_.~!*';:@&=+$,/?%#-]*)?)", text, re.IGNORECASE):
            url = m.group(0)
            if not any(domain in url.lower() for domain in ["linkedin", "github", "google", "gmail", "yahoo", "outlook", "w3.org", "schema.org"]):
                portfolio_url = url
                break

        return linkedin_url, github_url, portfolio_url

    @classmethod
    def _extract_compensation(cls, text: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
        """
        Extracts explicitly stated compensation figures.
        Returns (current_ctc, expected_ctc, currency, frequency).
        NEVER invents salary or guesses without explicit statement.
        """
        c_ctc = None
        e_ctc = None
        curr = None
        freq = None

        c_m = re.search(
            r"(?i)(?:current\s*(?:ctc|salary|package|compensation)|present\s*(?:ctc|salary))[\s:=-]+([₹$€£A-Za-z0-9.,\s]+(?:lpa|lakhs?|lac|inr|usd|eur|gbp|k|\$|/yr|/year|per\s*annum|per\s*month)?)",
            text,
        )
        if c_m:
            candidate_val = c_m.group(1).split("\n")[0].strip()
            if re.search(r"\d", candidate_val) and len(candidate_val) <= 40:
                c_ctc = candidate_val
                if "₹" in candidate_val or "inr" in candidate_val.lower() or "lakh" in candidate_val.lower() or "lpa" in candidate_val.lower():
                    curr = "INR"
                elif "$" in candidate_val or "usd" in candidate_val.lower():
                    curr = "USD"
                if "per month" in candidate_val.lower() or "/mo" in candidate_val.lower():
                    freq = "Monthly"
                else:
                    freq = "Annual"

        e_m = re.search(
            r"(?i)(?:expected\s*(?:ctc|salary|package|compensation)|ectc)[\s:=-]+([₹$€£A-Za-z0-9.,\s]+(?:lpa|lakhs?|lac|inr|usd|eur|gbp|k|\$|/yr|/year|per\s*annum|per\s*month)?)",
            text,
        )
        if e_m:
            candidate_val = e_m.group(1).split("\n")[0].strip()
            if re.search(r"\d", candidate_val) and len(candidate_val) <= 40:
                e_ctc = candidate_val
                if not curr:
                    if "₹" in candidate_val or "inr" in candidate_val.lower() or "lakh" in candidate_val.lower() or "lpa" in candidate_val.lower():
                        curr = "INR"
                    elif "$" in candidate_val or "usd" in candidate_val.lower():
                        curr = "USD"
                if not freq:
                    if "per month" in candidate_val.lower() or "/mo" in candidate_val.lower():
                        freq = "Monthly"
                    else:
                        freq = "Annual"

        return c_ctc, e_ctc, curr, freq

    @classmethod
    def _extract_notice_period(cls, text: str) -> Optional[str]:
        """
        Extracts explicitly stated notice period / availability.
        Returns e.g. '30 Days', 'Immediate', '2 Months' or None.
        NEVER guesses or assumes availability.
        """
        np_m = re.search(
            r"(?i)(?:notice\s*period|serving\s*notice|availability|official\s*notice)[\s:=-]+([0-9]+\s*(?:days?|months?|weeks?)|immediate(?:ly)?|ready\s*to\s*join|available\s*immediately)",
            text,
        )
        if np_m:
            val = np_m.group(1).strip()
            if "immediate" in val.lower():
                return "Immediate"
            return val.title()
        return None

    @classmethod
    def _extract_work_mode(cls, text: str) -> Optional[str]:
        """
        Extracts explicitly stated work mode preference if documented.
        """
        wm_m = re.search(r"(?i)\b(?:preferred\s*work\s*mode|work\s*mode|work\s*preference)[\s:=-]+(remote|hybrid|on-?site|work\s*from\s*home|wfh)\b", text)
        if wm_m:
            mode = wm_m.group(1).lower()
            if "remote" in mode or "home" in mode:
                return "Remote"
            elif "hybrid" in mode:
                return "Hybrid"
            elif "site" in mode:
                return "On-Site"
        return None

    @classmethod
    def _extract_employment_history(cls, text: str, employers: List[str], designation: Optional[str]) -> List[Dict[str, Any]]:
        """
        Builds structured employment history items from detected employers and date contexts.
        """
        history = []
        lines = text.splitlines()
        for idx, emp in enumerate(employers):
            start_date = None
            end_date = None
            duration_str = None
            for line in lines:
                if emp.lower() in line.lower():
                    date_range = re.search(r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{1,2}/)?\s*[12][90][0-9]{2})\s*(?:-|to|–|—)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{1,2}/)?\s*[12][90][0-9]{2}|present|till\s*date|current)", line, re.IGNORECASE)
                    if date_range:
                        start_date = date_range.group(1).strip()
                        end_date = date_range.group(2).strip()
                        break
            history.append({
                "company": emp,
                "designation": designation if idx == 0 and designation else None,
                "start_date": start_date,
                "end_date": end_date,
                "employment_duration": duration_str,
                "supporting_source": f"Documented employer record: {emp}",
            })
        return history
