"""
Document Parsing Service for TALENTRA.

Extracts text and structured attributes from Job Descriptions and Resumes
in various formats (.txt, .pdf, .docx, .json).
"""

import os
import re
import json
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
import pypdf
import docx

# Silence pypdf verbose warnings on non-standard PDF streams
logging.getLogger("pypdf").setLevel(logging.ERROR)


def extract_text_from_file(file_path: Path | str) -> str:
    """Extract plain text from .txt, .pdf, .docx, or .json files."""
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")

    suffix = path.suffix.lower()

    if suffix in [".txt", ".md"]:
        try:
            return path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            return path.read_text(encoding="latin-1", errors="ignore")

    elif suffix == ".pdf":
        try:
            reader = pypdf.PdfReader(str(path))
            pages_text = []
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    pages_text.append(txt)
            return "\n".join(pages_text)
        except Exception as e:
            return f"[Error reading PDF: {e}]"

    elif suffix in [".docx", ".doc"]:
        try:
            doc = docx.Document(str(path))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_text:
                        paragraphs.append(row_text)
            return "\n".join(paragraphs)
        except Exception as e:
            return f"[Error reading DOCX: {e}]"

    elif suffix == ".json":
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"[Error reading JSON: {e}]"

    return ""


def clean_text(text: str) -> str:
    """Normalize whitespace and strip null bytes."""
    if not text:
        return ""
    text = text.replace("\x00", "")
    return re.sub(r"\s+", " ", text).strip()


def parse_job_description(file_path: Path | str, raw_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Parse a Job Description file into structured fields suitable for JobRequirement model.
    """
    path = Path(file_path)
    text = raw_text if raw_text is not None else extract_text_from_file(path)
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # Default title from filename or first line
    stem = path.stem.replace("_", " ").replace("-", " ")
    # remove leading jd_001_ prefixes
    clean_stem = re.sub(r"^jd\s*\d+\s*", "", stem, flags=re.IGNORECASE).title()

    title = clean_stem if clean_stem else "Job Requirement"
    if lines:
        first_line = lines[0]
        if len(first_line) < 100 and not first_line.startswith("="):
            title = first_line.strip("#= ")

    # Experience detection
    experience_level = "mid"
    min_exp_years = 3
    exp_match = re.search(r"(\d+)\+?\s*(?:-\s*\d+)?\s*years?", text, re.IGNORECASE)
    if exp_match:
        try:
            min_exp_years = int(exp_match.group(1))
            if min_exp_years >= 8:
                experience_level = "lead"
            elif min_exp_years >= 5:
                experience_level = "senior"
            elif min_exp_years <= 2:
                experience_level = "entry"
        except ValueError:
            pass

    # Skills detection
    skills = []
    # Common tech patterns in JDs
    skill_patterns = [
        "Oracle", "Hyperion", "Essbase", "PBCS", "EPBCS", "SAP", "SAP PS", "SAP CPI",
        "SAP Security", "GRC", "S/4HANA", "Fiori", "Siemens Teamcenter", "PLM",
        "Java", "Spring Boot", "Microservices", "Python", "FastAPI", "Docker", "Kubernetes",
        "AWS", "Azure", "GCP", "SQL", "PostgreSQL", "React", ".NET", "C#", "C++",
        "DevOps", "CI/CD", "Linux", "REST API", "GraphQL"
    ]
    for pattern in skill_patterns:
        if re.search(rf"\b{re.escape(pattern)}\b", text, re.IGNORECASE):
            skills.append(pattern)

    primary_skills = ", ".join(skills[:8]) if skills else "Technical Recruitment, Core Engineering"
    secondary_skills = ", ".join(skills[8:15]) if len(skills) > 8 else None

    # Role summary / description
    description = text[:3000] if text else f"Job Requirement for {title}"

    return {
        "title": title,
        "experience_level": experience_level,
        "primary_skills": primary_skills,
        "secondary_skills": secondary_skills,
        "description": description,
        "location": "Bangalore / Hybrid",
        "work_model": "hybrid",
        "job_type": "full_time",
        "openings_count": 1,
    }


def parse_resume(file_path: Path | str, raw_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Parse a resume file and filename into candidate attributes.
    """
    path = Path(file_path)
    text = raw_text if raw_text is not None else extract_text_from_file(path)
    stem = path.stem

    # 1. Parse name from filename heuristics:
    # e.g., ".net developer _PoojaSingh[9y_0m]_bangalore"
    # or "SWATHI_RTL Design & Integration_Bangalore_8 Years"
    # or "Vishnu_Prasad_SAP_Basis_Resume"
    first_name = "Candidate"
    last_name = stem[:20]
    total_experience_months = 36  # default 3 years

    # Extract [Xy_Ym] or "X Years"
    exp_bracket = re.search(r"\[(\d+)y(?:_(\d+)m)?\]", stem, re.IGNORECASE)
    if exp_bracket:
        years = int(exp_bracket.group(1))
        months = int(exp_bracket.group(2)) if exp_bracket.group(2) else 0
        total_experience_months = years * 12 + months
    else:
        exp_words = re.search(r"(\d+(?:\.\d+)?)\s*(?:Years?|yrs?)", stem, re.IGNORECASE)
        if exp_words:
            total_experience_months = int(float(exp_words.group(1)) * 12)

    # Extract name from bracket format: e.g. _PoojaSingh[
    name_bracket = re.search(r"_([A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)*)\[", stem)
    if name_bracket:
        extracted = name_bracket.group(1)
        # split PascalCase
        parts = re.findall(r"[A-Z][a-z]*", extracted)
        if len(parts) >= 2:
            first_name = parts[0]
            last_name = " ".join(parts[1:])
        elif parts:
            first_name = parts[0]
            last_name = "Talent"
    else:
        # Check underscore patterns e.g. Vishnu_Prasad_SAP
        clean_parts = [p.strip() for p in stem.replace("-", "_").split("_") if p.strip()]
        if len(clean_parts) >= 2:
            first_name = clean_parts[0]
            last_name = clean_parts[1]
        elif clean_parts:
            first_name = clean_parts[0]
            last_name = "Candidate"

    # 2. Extract email from text or create stable unique synthetic email
    email = None
    email_match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b", text)
    if email_match:
        email = email_match.group(0).lower()
    else:
        # Fallback to unique hash-based email so candidate uniqueness constraint is satisfied
        stem_hash = hashlib.md5(stem.encode("utf-8")).hexdigest()[:8]
        safe_name = re.sub(r"[^a-zA-Z0-9]", "", first_name.lower()) or "candidate"
        email = f"{safe_name}.{stem_hash}@talentra.local"

    # 3. Extract phone
    phone = None
    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    if phone_match:
        phone = phone_match.group(0).strip()

    # 4. Extract current title
    current_title = "Software Engineer"
    title_matches = [
        ".NET Developer", "Full Stack Developer", "Java Developer", "Python Developer",
        "SAP Consultant", "Oracle EPM Consultant", "PLM Engineer", "DevOps Engineer",
        "Frontend Engineer", "Backend Engineer", "QA Engineer", "Data Engineer",
        "Solutions Architect", "Support Engineer"
    ]
    for tm in title_matches:
        if re.search(rf"\b{re.escape(tm)}\b", stem, re.IGNORECASE) or re.search(rf"\b{re.escape(tm)}\b", text[:500], re.IGNORECASE):
            current_title = tm
            break

    # 5. Extract location
    location = "Bangalore, India"
    loc_matches = ["Bangalore", "Hyderabad", "Pune", "Chennai", "Gurugram", "Noida", "Mumbai", "Bhubaneswar"]
    for loc in loc_matches:
        if re.search(rf"\b{re.escape(loc)}\b", stem, re.IGNORECASE) or re.search(rf"\b{re.escape(loc)}\b", text[:1000], re.IGNORECASE):
            location = f"{loc}, India"
            break

    # 6. Extract key skills
    skills_found = []
    sample_skills = [
        "C#", ".NET", "ASP.NET", "React", "Angular", "Vue", "JavaScript", "TypeScript",
        "Python", "FastAPI", "Django", "Java", "Spring Boot", "SQL", "Oracle", "SAP",
        "Docker", "Kubernetes", "AWS", "Azure", "Git", "REST APIs", "Microservices"
    ]
    for s in sample_skills:
        if re.search(rf"\b{re.escape(s)}\b", text, re.IGNORECASE):
            skills_found.append(s)

    primary_skills = ", ".join(skills_found[:8]) if skills_found else "Software Engineering"

    summary = clean_text(text[:800]) if text else f"Resume profile for {first_name} {last_name}"

    return {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "current_title": current_title,
        "total_experience_months": total_experience_months,
        "primary_skills": primary_skills,
        "location": location,
        "summary": summary,
        "status": "active",
        "resume_url": str(path.as_posix()),
    }
