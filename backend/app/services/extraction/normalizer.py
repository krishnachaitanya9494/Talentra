"""
Data Normalization & Sanitization Service for TALENTRA Phase 2.

Provides deterministic cleaning and normalization for:
- Email addresses (multiple email detection, RFC-compliant normalization)
- Phone numbers (international, national, digit stripping, formatting)
- Work experience duration (years and months extraction to float)
- Technical skill canonicalization
- Privacy-aware contact masking based on user role
"""

import re
from typing import List, Tuple, Optional, Set

# Regex pattern for email detection
EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    re.IGNORECASE,
)

# Regex pattern for phone number detection (supports international +, parentheses, hyphens, spaces)
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}",
)

# Common Indian mobile pattern (10 digits starting with 6, 7, 8, or 9)
INDIA_PHONE_REGEX = re.compile(r"(?:\+91[\s-]?)?[6-9]\d{9}")

# Common US/Canada phone pattern
US_PHONE_REGEX = re.compile(r"(?:\+1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}")


def normalize_email(email_str: Optional[str]) -> Optional[str]:
    """
    Normalizes an email address by stripping whitespace and converting to lowercase.
    Returns None if empty or invalid.
    """
    if not email_str:
        return None
    cleaned = email_str.strip().lower()
    if "@" in cleaned and "." in cleaned.split("@")[-1]:
        return cleaned
    return None


def extract_all_emails(text: str) -> Tuple[Optional[str], List[str]]:
    """
    Finds all unique email addresses in a text document.
    Returns:
        (primary_email, list_of_all_emails)
    """
    if not text:
        return None, []

    matches = EMAIL_REGEX.findall(text)
    unique_emails: List[str] = []
    seen: Set[str] = set()

    for m in matches:
        # Strip trailing punctuation like period or comma
        clean = m.strip(".,;:()<>[] \t\n\r").lower()
        if clean and clean not in seen and "@" in clean:
            # Filter obvious false positives like file extensions or dummy placeholder domains
            domain = clean.split("@")[-1]
            if len(domain) > 3 and "." in domain and not domain.endswith((".png", ".jpg", ".pdf")):
                seen.add(clean)
                unique_emails.append(clean)

    primary = unique_emails[0] if unique_emails else None
    return primary, unique_emails


def normalize_phone(phone_str: Optional[str]) -> Optional[str]:
    """
    Normalizes a phone number to standard international / clean format.
    Strips non-digit characters while preserving leading '+' if present.
    """
    if not phone_str:
        return None

    stripped = phone_str.strip()
    has_plus = stripped.startswith("+")
    digits_only = re.sub(r"\D", "", stripped)

    if not digits_only or len(digits_only) < 7:
        return None

    # Handle Indian 10-digit mobile
    if len(digits_only) == 10 and digits_only[0] in "6789":
        return f"+91-{digits_only[:5]}-{digits_only[5:]}"
    elif len(digits_only) == 12 and digits_only.startswith("91"):
        return f"+91-{digits_only[2:7]}-{digits_only[7:]}"

    # Handle US 10-digit phone
    if len(digits_only) == 10:
        return f"+1-{digits_only[:3]}-{digits_only[3:6]}-{digits_only[6:]}"
    elif len(digits_only) == 11 and digits_only.startswith("1"):
        return f"+1-{digits_only[1:4]}-{digits_only[4:7]}-{digits_only[7:]}"

    # General international fallback
    prefix = "+" if has_plus else ""
    return f"{prefix}{digits_only}"


def extract_phone_numbers(text: str) -> Tuple[Optional[str], List[str]]:
    """
    Extracts phone numbers from text using multi-pattern matching.
    Returns (primary_phone, all_phones).
    """
    if not text:
        return None, []

    candidates: List[str] = []
    seen_digits: Set[str] = set()

    # Priority 1: Indian numbers
    for m in INDIA_PHONE_REGEX.findall(text):
        norm = normalize_phone(m)
        if norm:
            digits = re.sub(r"\D", "", norm)
            if digits not in seen_digits:
                seen_digits.add(digits)
                candidates.append(norm)

    # Priority 2: US numbers
    for m in US_PHONE_REGEX.findall(text):
        norm = normalize_phone(m)
        if norm:
            digits = re.sub(r"\D", "", norm)
            if digits not in seen_digits:
                seen_digits.add(digits)
                candidates.append(norm)

    # Priority 3: General phone regex
    for m in PHONE_REGEX.findall(text):
        digits = re.sub(r"\D", "", m)
        if 9 <= len(digits) <= 15 and digits not in seen_digits:
            norm = normalize_phone(m)
            if norm:
                seen_digits.add(digits)
                candidates.append(norm)

    primary = candidates[0] if candidates else None
    return primary, candidates


def normalize_experience_years(text: str) -> Optional[float]:
    """
    Parses years and months of experience from text or filename tokens.
    Examples:
        - "12y_5m" -> 12.4
        - "5 years 6 months" -> 5.5
        - "8.5 years" -> 8.5
        - "Experience: 4.5 years" -> 4.5
        - "3+ years" -> 3.0
    """
    if not text:
        return None

    # Priority 1: Explicit phrase "Experience: 4.5 Years" or "Total Experience: 8 Years 6 Months"
    ym_phrase = re.search(
        r"(?:total\s+experience|experience|exp)[\s:=-]+(\d+)\s*(?:years?|yrs?)\s*(?:and)?\s*(\d+)\s*(?:months?|mos?)",
        text,
        re.IGNORECASE,
    )
    if ym_phrase:
        years = int(ym_phrase.group(1))
        months = int(ym_phrase.group(2))
        return round(years + (months / 12.0), 1)

    phrase_match = re.search(
        r"(?:total\s+experience|experience|exp)[\s:=-]+(\d+(?:\.\d+)?)\s*(?:\+?\s*years?|yrs?)",
        text,
        re.IGNORECASE,
    )
    if phrase_match:
        val = float(phrase_match.group(1))
        if 0 <= val <= 50:
            return round(val, 1)

    # Priority 2: Pattern: [12y_5m] or 12y 5m or 12y
    bracket_match = re.search(r"(\d+)\s*y(?:ears?)?(?:[_\s]+(\d+)\s*m(?:onths?)?)?", text, re.IGNORECASE)
    if bracket_match:
        years = int(bracket_match.group(1))
        months = int(bracket_match.group(2)) if bracket_match.group(2) else 0
        if 0 <= years <= 50:
            return round(years + (months / 12.0), 1)

    # Priority 3: General "X years Y months"
    ym_match = re.search(r"(\d+)\s*(?:years?|yrs?)\s*(?:and)?\s*(\d+)\s*(?:months?|mos?)", text, re.IGNORECASE)
    if ym_match:
        years = int(ym_match.group(1))
        months = int(ym_match.group(2))
        return round(years + (months / 12.0), 1)

    # Priority 4: Decimal or plus standalone "4.5 years", "3+ years", "3+ yrs"
    plus_match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)", text, re.IGNORECASE)
    if plus_match:
        val = float(plus_match.group(1))
        if 0 <= val <= 50:
            return round(val, 1)

    return None


# Canonical skills mapping dictionary
SKILL_CANONICAL_MAP = {
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "react native": "React Native",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "python": "Python",
    "python3": "Python",
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "graphql": "GraphQL",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "ts": "TypeScript",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "java": "Java",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "golang": "Go",
    "go": "Go",
    "c++": "C++",
    "c#": "C#",
    ".net": ".NET",
    "dotnet": ".NET",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "ci/cd": "CI/CD",
    "jenkins": "Jenkins",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "linux": "Linux",
    "agile": "Agile / Scrum",
    "scrum": "Agile / Scrum",
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scikit-learn": "Scikit-Learn",
    "spark": "Apache Spark",
    "kafka": "Apache Kafka",
}


def canonicalize_skill(skill_raw: str) -> str:
    """
    Returns canonical skill name if recognized, or title-cased clean string.
    """
    cleaned = skill_raw.strip()
    lowered = cleaned.lower()
    return SKILL_CANONICAL_MAP.get(lowered, cleaned.title())


def mask_contact_info(
    email: Optional[str],
    phone: Optional[str],
    user_role: str = "recruiter",
) -> Tuple[Optional[str], Optional[str]]:
    """
    Restricts access to contact info based on viewer role.
    Recruiters and admins see full contact details.
    Viewers/Guests see masked strings (e.g. k***@example.com, +91-******3210).
    """
    if user_role.lower() in ("admin", "recruiter", "manager"):
        return email, phone

    masked_email = None
    if email:
        parts = email.split("@")
        if len(parts) == 2:
            name_part, domain = parts
            if len(name_part) <= 2:
                masked_email = f"{name_part[0]}***@{domain}"
            else:
                masked_email = f"{name_part[:2]}***@{domain}"
        else:
            masked_email = "***@***.com"

    masked_phone = None
    if phone:
        digits = re.sub(r"\D", "", phone)
        if len(digits) >= 4:
            masked_phone = f"***-***-{digits[-4:]}"
        else:
            masked_phone = "***-***-****"

    return masked_email, masked_phone
