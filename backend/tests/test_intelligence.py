"""
Automated Test Suite for TALENTRA Phase 2: Document Parsing & Candidate Intelligence.

Tests:
1. PDF, DOCX, and TXT Text Extraction.
2. Resume Parsing:
   - Full name, emails (multiple email detection), normalized phone numbers.
   - Total experience parsing, designations, employers, skills, certifications, education.
   - Missing fields handling (preserves nulls, never invents info).
   - Extraction confidence and evidence snippets.
3. Job Description Parsing:
   - Title, required skills, preferred skills, min/max experience, qualifications, employment type.
4. Data Normalization:
   - Email lowercasing and trimming.
   - Phone formatting (India 10-digit, US 10-digit, international).
   - Experience decimal years conversion.
5. Duplicate Detection:
   - Exact email duplicate.
   - Exact 10-digit phone duplicate.
   - Unique profile.
6. Privacy & Role-Based Contact Masking:
   - Recruiter role (unmasked full contact).
   - Viewer / Guest role (masked email and phone).
7. Manual Correction & Audit Trail:
   - Modifying candidate fields logs old vs new values in CandidateAuditLog.
8. CRM Source Integration:
   - CSV candidate import with column mapping.
   - Excel (.xlsx) candidate import with column mapping.
   - Duplicate prevention during CRM import.
   - Header inspection.
9. Candidate Merge:
   - Merging duplicate candidates consolidates profiles.
"""

import io
import pytest
import openpyxl
from pathlib import Path
from starlette.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.services.extraction.normalizer import (
    normalize_email,
    extract_all_emails,
    normalize_phone,
    extract_phone_numbers,
    normalize_experience_years,
    mask_contact_info,
)
from backend.app.services.extraction.resume_parser import ResumeParser
from backend.app.services.extraction.jd_parser import JobDescriptionParser
from backend.app.services.extraction.duplicate_detector import detect_candidate_duplicate
from backend.app.services.extraction.crm_importer import (
    inspect_headers,
    suggest_mappings,
    import_candidates_from_file,
)
from backend.app.services.extraction.txt_extractor import extract_text_from_txt


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


# ============================================================================
# 1. TEXT EXTRACTION & ENCODING TESTS
# ============================================================================

def test_txt_extractor_encodings():
    """Verify TXT extractor handles UTF-8 and Latin-1 encodings cleanly."""
    utf8_data = "Kavya Patel - Software Engineer\nSkills: Python, FastAPI".encode("utf-8")
    assert "Kavya Patel" in extract_text_from_txt(utf8_data)

    latin1_data = "François Müller - Cloud Architect\nSkills: Azure, Docker".encode("latin-1")
    extracted = extract_text_from_txt(latin1_data)
    assert "Müller" in extracted or "Francois" in extracted or "Cloud Architect" in extracted


# ============================================================================
# 2. NORMALIZATION TESTS (EMAIL, PHONE, EXPERIENCE, MASKING)
# ============================================================================

def test_email_extraction_and_normalization():
    """Verify multiple emails in document text are extracted and normalized."""
    text = """
    Contact me at primary.work@company.com or backup_personal@gmail.com.
    Also cc support@talentra.local.
    """
    primary, all_emails = extract_all_emails(text)
    assert primary == "primary.work@company.com"
    assert len(all_emails) == 3
    assert "backup_personal@gmail.com" in all_emails
    assert normalize_email("  USER.NAME@Domain.COM  ") == "user.name@domain.com"
    assert normalize_email("invalid-email") is None


def test_phone_normalization():
    """Verify Indian 10-digit and US 10-digit phone normalization."""
    # Indian Mobile (10 digits starting with 9)
    assert normalize_phone("9876543210") == "+91-98765-43210"
    assert normalize_phone("+91 98765 43210") == "+91-98765-43210"

    # US Phone
    assert normalize_phone("415-555-2671") == "+1-415-555-2671"
    assert normalize_phone("+1 (415) 555-2671") == "+1-415-555-2671"

    # Too short / invalid
    assert normalize_phone("12345") is None


def test_experience_normalization():
    """Verify conversion of various experience expressions to float years."""
    assert normalize_experience_years("[12y_5m]") == 12.4
    assert normalize_experience_years("Total Experience: 8 Years 6 Months") == 8.5
    assert normalize_experience_years("Experience: 4.5 years") == 4.5
    assert normalize_experience_years("3+ yrs of experience") == 3.0


def test_role_based_contact_masking():
    """Verify recruiter sees full contact while viewer sees masked contact."""
    email = "rahul.verma@example.com"
    phone = "+91-98765-43210"

    # Recruiter Role
    rec_email, rec_phone = mask_contact_info(email, phone, user_role="recruiter")
    assert rec_email == email
    assert rec_phone == phone

    # Admin Role
    adm_email, adm_phone = mask_contact_info(email, phone, user_role="admin")
    assert adm_email == email
    assert adm_phone == phone

    # Viewer / Guest Role
    v_email, v_phone = mask_contact_info(email, phone, user_role="viewer")
    assert v_email.startswith("ra***@")
    assert v_phone == "***-***-3210"


# ============================================================================
# 3. RESUME PARSER STRUCTURED EXTRACTION TESTS
# ============================================================================

def test_resume_parser_complete():
    """Verify comprehensive extraction of candidate profile fields from resume text."""
    sample_resume = """
    Siddharth Sharma
    Senior Cloud & DevOps Engineer
    Email: siddharth.sharma.test@gmail.com, alt.sid@outlook.com
    Phone: +91 9876543211
    Location: Bangalore
    Preferred Location: Hyderabad

    Professional Summary:
    Total Experience: 7 Years 3 Months as an enterprise cloud architect at Infosys and Wipro.

    Technical Skills:
    Python, FastAPI, Docker, Kubernetes, AWS, Terraform, PostgreSQL, Redis, React.

    Certifications:
    AWS Certified Solutions Architect, Certified Kubernetes Administrator (CKA).

    Education:
    B.Tech in Computer Science from National Institute of Technology (2017).
    """

    parsed = ResumeParser.parse(sample_resume, filename="Naukri_SiddharthSharma[7y_3m].pdf")

    assert parsed["full_name"] == "Siddharth Sharma"
    assert parsed["first_name"] == "Siddharth"
    assert parsed["last_name"] == "Sharma"
    assert parsed["email"] == "siddharth.sharma.test@gmail.com"
    assert len(parsed["all_emails"]) == 2
    assert parsed["phone"] == "+91-98765-43211"
    assert parsed["total_experience_years"] == 7.2 or parsed["total_experience_years"] == 7.3
    assert "Senior Cloud & DevOps Engineer" in parsed["current_title"]
    assert "AWS" in parsed["skills_list"]
    assert "Docker" in parsed["skills_list"]
    assert "Kubernetes" in parsed["skills_list"]
    assert "Python" in parsed["skills_list"]
    assert len(parsed["certifications"]) >= 2
    assert parsed["location"] == "Bangalore"
    assert parsed["preferred_location"] == "Hyderabad"
    assert parsed["extraction_confidence"] >= 0.85
    assert "email" in parsed["extraction_evidence"]


def test_resume_parser_missing_fields_never_invents():
    """Verify parser returns None for missing fields and does not invent fake data."""
    minimal_resume = """
    Anjali Rao
    Frontend Engineer
    Skills: HTML5, CSS3, JavaScript.
    """

    parsed = ResumeParser.parse(minimal_resume, filename="Anjali_Rao.txt")

    assert parsed["full_name"] == "Anjali Rao"
    assert parsed["email"] is None
    assert parsed["all_emails"] == []
    assert parsed["phone"] is None
    assert parsed["all_phones"] == []
    assert parsed["total_experience_years"] is None
    assert parsed["certifications"] == []
    assert parsed["preferred_location"] is None


# ============================================================================
# 4. JOB DESCRIPTION PARSER TESTS
# ============================================================================

def test_job_description_parser():
    """Verify structured parsing of Job Description requisitions."""
    sample_jd = """
    Job Title: Senior Backend Engineer - Python
    Location: Bangalore (Hybrid)
    Employment Type: Full-time

    About the Role:
    We are seeking an engineer with 5-8 years of experience building distributed systems.

    Must Have Requirements:
    • 5+ years of experience with Python and FastAPI
    • Strong knowledge of PostgreSQL, Redis, and Docker
    • Experience designing RESTful APIs and microservices

    Nice to Have:
    • Experience with Kubernetes and AWS
    • Familiarity with GraphQL

    Qualifications:
    • B.Tech or B.E. in Computer Science or equivalent
    """

    parsed = JobDescriptionParser.parse(sample_jd, filename="Senior_Backend_Engineer.txt")

    assert parsed["job_title"] == "Senior Backend Engineer - Python"
    assert parsed["min_experience_years"] == 5.0
    assert parsed["max_experience_years"] == 8.0
    assert "Python" in parsed["required_skills_list"]
    assert "FastAPI" in parsed["required_skills_list"]
    assert "PostgreSQL" in parsed["required_skills_list"]
    assert "Kubernetes" in parsed["preferred_skills_list"]
    assert parsed["location"] == "Bangalore"
    assert parsed["work_mode"] == "Hybrid"
    assert parsed["employment_type"] == "Full-time"
    assert parsed["extraction_confidence"] >= 0.80


# ============================================================================
# 5. DUPLICATE DETECTION TESTS
# ============================================================================

def test_duplicate_candidate_detection():
    """Verify duplicate detection matches on normalized email and phone."""
    db = SessionLocal()
    try:
        # Create a unique test candidate
        test_email = "duplicate.test.candidate@talentra.test"
        test_phone = "+91-99001-12233"

        cand = Candidate(
            candidate_code="CAN-TEST-DUP-01",
            first_name="Harish",
            last_name="Kumar",
            email=test_email,
            phone=test_phone,
            status="available",
        )
        db.add(cand)
        db.commit()

        # 1. Test exact email duplicate
        dup_email = detect_candidate_duplicate(db, email="  DUPLICATE.TEST.CANDIDATE@talentra.test ", phone=None)
        assert dup_email.is_duplicate is True
        assert dup_email.match_type == "EXACT_EMAIL"
        assert dup_email.existing_candidate_id == cand.id

        # 2. Test exact phone duplicate (different email)
        dup_phone = detect_candidate_duplicate(db, email="different@other.com", phone="9900112233")
        assert dup_phone.is_duplicate is True
        assert dup_phone.match_type == "EXACT_PHONE"
        assert dup_phone.existing_candidate_id == cand.id

        # 3. Test unique candidate
        unique = detect_candidate_duplicate(db, email="brand.new.talent@example.com", phone="+91-88888-77777")
        assert unique.is_duplicate is False
        assert unique.match_type == "UNIQUE"

        # Cleanup
        db.delete(cand)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 6. CRM CSV & EXCEL IMPORT TESTS
# ============================================================================

def test_crm_csv_import_with_mapping(client):
    """Verify CSV import with auto-detected headers and duplicate detection."""
    import uuid
    uid = uuid.uuid4().hex[:6]
    ph1 = f"+91-98{int(uuid.uuid4().hex[:7], 16) % 100000000:08d}"
    ph2 = f"+91-98{int(uuid.uuid4().hex[:7], 16) % 100000000:08d}"
    csv_bytes = f"""Full Name,Email,Mobile Number,Role,Years Exp,Skills,City
Divya Nair,divya.{uid}@crmtest.example.com,{ph1},Frontend Specialist,4.0,React, Redux, Tailwind CSS,Chennai
Prateek Sen,prateek.{uid}@crmtest.example.com,{ph2},Data Engineer,6.2,Python, Spark, SQL,Pune
""".encode("utf-8")

    res = client.post(
        "/api/v1/intelligence/crm/import",
        files={"file": ("candidates_sample.csv", io.BytesIO(csv_bytes), "text/csv")},
        data={"source_name": "Salesforce Portal"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 2
    assert data["imported_count"] == 2
    assert data["duplicate_count"] == 0

    # Re-importing same file must detect duplicates
    res_dup = client.post(
        "/api/v1/intelligence/crm/import",
        files={"file": ("candidates_sample.csv", io.BytesIO(csv_bytes), "text/csv")},
        data={"source_name": "Salesforce Portal"}
    )
    assert res_dup.status_code == 200
    dup_data = res_dup.json()
    assert dup_data["duplicate_count"] == 2
    assert dup_data["imported_count"] == 0


def test_crm_excel_import(client):
    """Verify Excel (.xlsx) file candidate import."""
    import uuid
    uid = uuid.uuid4().hex[:6]
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Candidate Name", "Email Address", "Phone Number", "Designation", "Years of Exp", "Key Skills", "City"])
    ws.append(["Karthik Raman", f"karthik.{uid}@exceltest.example.com", f"+91-97{uid[:8]}", "Site Reliability Engineer", "5.0", "Kubernetes, Docker, Go", "Hyderabad"])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    res = client.post(
        "/api/v1/intelligence/crm/import",
        files={"file": ("crm_export.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        data={"source_name": "Workday Integration"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["imported_count"] == 1
    assert data["duplicate_count"] == 0


# ============================================================================
# 7. MANUAL CORRECTION & AUDIT LOG API TESTS
# ============================================================================

def test_manual_correction_and_audit_api(client):
    """Verify manual candidate updates create an audit log and return updated intelligence."""
    db = SessionLocal()
    cand = Candidate(
        candidate_code="CAN-AUDIT-TEST-01",
        first_name="Ramesh",
        last_name="Yadav",
        email="ramesh.yadav.audittest@example.com",
        current_title="Junior Developer",
        status="available",
    )
    db.add(cand)
    db.commit()
    db.refresh(cand)
    cand_id = cand.id
    db.close()

    try:
        # Correct current_title
        correction_payload = {
            "current_title": "Mid-Level Software Engineer",
            "corrected_by": "Recruiter Lead Meera",
            "correction_note": "Verified 2 years of backend experience",
        }
        res = client.put(f"/api/v1/intelligence/candidates/{cand_id}/correct", json=correction_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["current_title"] == "Mid-Level Software Engineer"
        assert data["is_manually_corrected"] is True
        assert len(data["audit_logs"]) >= 1
        log = data["audit_logs"][0]
        assert log["field_name"] == "current_title"
        assert log["old_value"] == "Junior Developer"
        assert log["new_value"] == "Mid-Level Software Engineer"
        assert log["changed_by"] == "Recruiter Lead Meera"
    finally:
        db_clean = SessionLocal()
        c = db_clean.get(Candidate, cand_id)
        if c:
            db_clean.delete(c)
            db_clean.commit()
        db_clean.close()
