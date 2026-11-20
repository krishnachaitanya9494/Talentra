"""
Candidate and Requisition Validation Service for TALENTRA Phase 2.

Performs data quality checks, field format validation, and integrity flags.
Ensures that missing fields are recorded gracefully without raising exceptions.
"""

import re
from typing import Dict, Any, List, Tuple


def validate_candidate_data(data: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
    """
    Validates candidate fields and returns (is_valid, errors, warnings).
    Non-fatal missing fields are logged as warnings to allow human review.
    """
    errors: List[str] = []
    warnings: List[str] = []

    # 1. Full Name / First Name validation
    first_name = data.get("first_name")
    if not first_name or len(first_name.strip()) < 2:
        errors.append("First name is missing or too short.")

    # 2. Email Validation
    email = data.get("email")
    if not email:
        warnings.append("No email address detected; candidate profile requires manual contact entry.")
    elif "@" not in email or "." not in email.split("@")[-1]:
        errors.append(f"Invalid email address format: '{email}'")

    # 3. Phone Validation
    phone = data.get("phone")
    if not phone:
        warnings.append("No phone number detected.")
    else:
        digits = re.sub(r"\D", "", phone)
        if len(digits) < 7:
            warnings.append(f"Phone number '{phone}' has fewer than 7 digits.")

    # 4. Experience Validation
    exp = data.get("total_experience_years")
    if exp is not None:
        try:
            exp_val = float(exp)
            if exp_val < 0 or exp_val > 50:
                warnings.append(f"Total experience of {exp_val} years is outside standard 0-50y boundary.")
        except (ValueError, TypeError):
            warnings.append(f"Experience value '{exp}' could not be converted to a decimal number.")

    # 5. Skills Validation
    skills = data.get("skills")
    if not skills:
        warnings.append("No technical skills were verified from document text.")

    is_valid = len(errors) == 0
    return is_valid, errors, warnings
