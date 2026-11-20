"""
Unit & Integration Tests for Apify-Inspired Candidate Profile Scraper.

Tests:
- Scraper execution with multiple profile URLs
- Profile completeness scoring
- JSON and CSV dataset exports
- Direct talent pool ingestion
"""

import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.scraper import ProfileScrapeRun, ScrapedCandidateItem
from backend.app.models.candidate import Candidate


@pytest.fixture
def client():
    return TestClient(app)


def test_scraper_run_and_exports(client):
    # 1. Trigger Scraper Run
    payload = {
        "urls": [
            "https://github.com/octocat",
            "https://linkedin.com/in/jane-doe-engineer",
            "https://alex-portfolio.dev",
        ],
        "proxy_mode": "datacenter_automatic",
    }
    resp = client.post("/api/v1/scraper/runs", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    run = data["run"]
    run_id = run["id"]
    assert run["total_urls"] == 3
    assert run["extracted_count"] == 3
    assert run["avg_completeness_score"] > 80.0

    # 2. List Runs
    list_resp = client.get("/api/v1/scraper/runs")
    assert list_resp.status_code == 200
    runs = list_resp.json()["items"]
    assert any(r["id"] == run_id for r in runs)

    # 3. Get Run Details
    detail_resp = client.get(f"/api/v1/scraper/runs/{run_id}")
    assert detail_resp.status_code == 200
    items = detail_resp.json()["items"]
    assert len(items) == 3
    assert all("full_name" in item for item in items)
    assert all("completeness_score" in item for item in items)

    # 4. Export JSON
    json_resp = client.get(f"/api/v1/scraper/runs/{run_id}/export/json")
    assert json_resp.status_code == 200
    assert json_resp.headers["content-type"] == "application/json"
    assert len(json_resp.json()) == 3

    # 5. Export CSV
    csv_resp = client.get(f"/api/v1/scraper/runs/{run_id}/export/csv")
    assert csv_resp.status_code == 200
    assert "Full Name" in csv_resp.text
    assert "Completeness Score (%)" in csv_resp.text

    # 6. Import to Talent Pool
    import_resp = client.post(f"/api/v1/scraper/runs/{run_id}/import-to-talent-pool")
    assert import_resp.status_code == 200
    import_data = import_resp.json()
    assert import_data["status"] == "success"
    assert import_data["imported_count"] + import_data["skipped_duplicates"] == 3


def test_scraper_document_upload(client):
    # Upload TXT resume with embedded links
    sample_txt = b"Alice Developer\nStaff Cloud Engineer\nEmail: alice@cloud.dev\nhttps://github.com/alicedev\nhttps://linkedin.com/in/alice-dev\nSkills: AWS, Python, Kubernetes\nExperience: 7 years"
    files = {"file": ("alice_resume.txt", sample_txt, "text/plain")}
    resp = client.post("/api/v1/scraper/upload-document", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert len(data["urls"]) >= 2
    assert "https://github.com/alicedev" in data["urls"]
    assert "https://linkedin.com/in/alice-dev" in data["urls"]
    assert data["candidate"]["full_name"] == "Alice Developer"

    # Unsupported format rejection
    bad_files = {"file": ("malware.exe", b"binary", "application/octet-stream")}
    bad_resp = client.post("/api/v1/scraper/upload-document", files=bad_files)
    assert bad_resp.status_code == 400


def test_batch_parse_and_exports_goodfit_workflow(client):
    resume1 = b"Laxmikant Patil\nPhone: +918887407615\nEmail: lpatil2024@gmail.com\nLocation: Moshi, Pune, Maharashtra\nRole: Module design engineer\nCompany: Xpheno Pvt. Ltd. Pune\nExperience: 5.2 Years\nNotice Period: 30 Days\nCurrent CTC: 8.5 LPA\nExpected CTC: 12 LPA\nEducation: B.E. Mechanical\nSkills: CATIA, SolidWorks, Plastic Design"
    resume2 = b"Sarah Lin\nPhone: +1 415-555-0199\nEmail: sarah.lin@cloudeng.io\nLocation: San Francisco, CA\nRole: Senior Cloud Architect\nCompany: Datadog\nExperience: 7.5 Years\nNotice Period: Immediate\nCurrent CTC: $185,000\nExpected CTC: $210,000\nEducation: M.S. Computer Science\nSkills: AWS, Kubernetes, Terraform, Go"

    files = [
        ("files", ("resume_laxmikant.txt", resume1, "text/plain")),
        ("files", ("resume_sarah.txt", resume2, "text/plain")),
    ]

    # 1. Batch Parse
    resp = client.post("/api/v1/scraper/batch-parse", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["total_files"] == 2
    assert data["parsed_count"] == 2
    candidates = data["candidates"]
    assert len(candidates) == 2
    assert candidates[0]["name"] == "Laxmikant Patil"
    assert "88874" in candidates[0]["phone"]
    assert candidates[0]["notice_period"] == "30 Days"
    assert candidates[0]["current_ctc"] == "8.5 LPA"
    assert candidates[0]["expected_ctc"] == "12 LPA"

    # 2. Export Excel
    excel_resp = client.post("/api/v1/scraper/export-excel", json={"candidates": candidates})
    assert excel_resp.status_code == 200
    assert excel_resp.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(excel_resp.content) > 1000

    # 3. Export CSV
    csv_resp = client.post("/api/v1/scraper/export-csv", json={"candidates": candidates})
    assert csv_resp.status_code == 200
    assert "Laxmikant Patil" in csv_resp.text
    assert "Sarah Lin" in csv_resp.text
    assert "Mail ID" in csv_resp.text

    # 4. Import to Talent Pool
    import_resp = client.post("/api/v1/scraper/import-parsed-candidates", json={"candidates": candidates})
    assert import_resp.status_code == 200
    import_data = import_resp.json()
    assert import_data["status"] == "success"
    assert import_data["imported_count"] + import_data["skipped_duplicates"] == 2

    # 5. Export JSON
    json_resp = client.post("/api/v1/scraper/export-json", json={"candidates": candidates})
    assert json_resp.status_code == 200
    assert json_resp.headers["content-type"] == "application/json"
    assert len(json_resp.json()) == 2

    # 6. Quick Match
    match_resp = client.post("/api/v1/scraper/quick-match", json={"candidates": candidates, "jd_id": 1})
    assert match_resp.status_code == 200
    assert "matches" in match_resp.json()


def test_batch_parse_zero_fabricated_data_mandatory_missing_values(client):
    """
    Mandatory Test: Ensure that when resumes omit contact details, company, experience,
    notice period, CTC, or education, the parser strictly outputs None/empty string.
    Zero placeholders like 'Not Available', 'Unknown', 'N/A', or '-' are permitted!
    """
    minimal_resume = b"Arun Kumar\nSoftware Developer\nSkills: Python, Django"
    files = [("files", ("arun_minimal.txt", minimal_resume, "text/plain"))]

    resp = client.post("/api/v1/scraper/batch-parse", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    c = data["candidates"][0]

    assert c["name"] == "Arun Kumar"
    assert c["email"] == ""
    assert c["phone"] == ""
    assert c["current_company"] == ""
    assert c["experience_years"] is None
    assert c["notice_period"] == ""
    assert c["current_ctc"] == ""
    assert c["expected_ctc"] == ""
    assert c["education"] == ""

    # Strict check: No placeholder strings anywhere in candidate record
    for field in ["email", "phone", "current_company", "notice_period", "current_ctc", "expected_ctc"]:
        assert c[field] not in ["Not Available", "Unknown", "N/A", "Not Mentioned", "-", "null"]

    # Verify Data Quality Flags
    assert "Email" in c["missing_fields"]
    assert "Phone" in c["missing_fields"]
    assert c["extraction_status"] == "Needs Review"


def test_5_sheet_excel_export_genuine_empty_cells_and_structure(client):
    """
    Mandatory Test: Verifies that export-excel generates a genuine 5-sheet OpenPyXL workbook
    where missing values produce genuinely empty cells with zero fallback text.
    """
    import io
    import openpyxl

    candidates = [
        {
            "id": "c1",
            "name": "Devi Prasad",
            "phone": "+91-99887-76655",
            "email": "devi.prasad@test.com",
            "location": "Hyderabad",
            "current_role": "Backend Engineer",
            "current_company": "Infosys",
            "experience_years": 4.5,
            "relevant_experience_years": 4.5,
            "notice_period": "",  # Missing
            "current_ctc": "",    # Missing
            "expected_ctc": "",   # Missing
            "education": "B.Tech Computer Science",
            "skills": ["Python", "PostgreSQL", "Docker"],
            "certifications": [],
            "linkedin_url": "",
            "portfolio_url": "",
            "match_score": 85.0,
            "match_segment": "Strong Match",
            "extraction_status": "Validated",
            "filename": "devi_resume.txt",
            "missing_fields": ["Notice Period", "CTC"],
            "invalid_fields": [],
            "fields_requiring_review": [],
            "is_duplicate": False,
        }
    ]

    resp = client.post("/api/v1/scraper/export-excel", json={"candidates": candidates, "jd_title": "Python Lead"})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    # Inspect openpyxl workbook structure
    wb = openpyxl.load_workbook(io.BytesIO(resp.content))
    expected_sheets = [
        "Candidate Master",
        "Employment History",
        "Skills & Qualifications",
        "Match Analysis",
        "Data Quality",
    ]
    assert wb.sheetnames == expected_sheets

    # Verify Candidate Master
    ws1 = wb["Candidate Master"]
    assert ws1.freeze_panes == "A2"
    assert ws1.cell(row=1, column=2).value == "Candidate Name"

    # Row 2 Candidate Data:
    # Notice Period (col 10), Current CTC (col 11), Expected CTC (col 12) MUST BE NONE (genuinely empty)
    row2_name = ws1.cell(row=2, column=2).value
    assert row2_name == "Devi Prasad"

    notice_period_val = ws1.cell(row=2, column=10).value
    current_ctc_val = ws1.cell(row=2, column=11).value
    expected_ctc_val = ws1.cell(row=2, column=12).value

    assert notice_period_val is None
    assert current_ctc_val is None
    assert expected_ctc_val is None

    # Verify Data Quality sheet
    ws5 = wb["Data Quality"]
    assert ws5.freeze_panes == "A2"
    assert ws5.cell(row=2, column=1).value == "Devi Prasad"
    assert "Notice Period" in ws5.cell(row=2, column=2).value


def test_duplicate_detection_intra_batch(client):
    """
    Verify duplicate detection across files within the same batch.
    """
    resume1 = b"Kunal Shah\nEmail: kunal@fintech.co\nPhone: +91 99999 11111\nSkills: Go, Kubernetes"
    resume2 = b"Kunal Duplicate\nEmail: kunal@fintech.co\nPhone: +91 99999 11111\nSkills: Go"

    files = [
        ("files", ("kunal_original.txt", resume1, "text/plain")),
        ("files", ("kunal_copy.txt", resume2, "text/plain")),
    ]

    resp = client.post("/api/v1/scraper/batch-parse", files=files)
    assert resp.status_code == 200
    data = resp.json()
    candidates = data["candidates"]
    assert candidates[0]["is_duplicate"] is False
    assert candidates[1]["is_duplicate"] is True
    assert candidates[1]["extraction_status"] == "Duplicate"


def test_manual_correction_and_exports_history(client):
    """
    Verify manual correction audit logging and export history listing/download.
    """
    # 1. Manual correction
    correct_resp = client.post(
        "/api/v1/scraper/candidates/cand_123/correct",
        json={
            "field": "phone",
            "original_value": "",
            "corrected_value": "+91-98765-43210",
            "corrected_by": "Senior Recruiter",
        },
    )
    assert correct_resp.status_code == 200
    audit = correct_resp.json()["audit"]
    assert audit["field"] == "phone"
    assert audit["corrected_value"] == "+91-98765-43210"
    assert audit["corrected_by"] == "Senior Recruiter"

    # 2. List exports
    list_exp = client.get("/api/v1/scraper/exports")
    assert list_exp.status_code == 200
    items = list_exp.json()["items"]
    assert len(items) > 0
    export_id = items[0]["id"]

    # 3. Download export
    dl_resp = client.get(f"/api/v1/scraper/exports/{export_id}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def test_single_sheet_excel_export_minimal_structure(client):
    """
    Verifies that the default single-sheet export contains only candidate contact fields.
    """
    import io
    import openpyxl

    candidates = [
        {
            "id": "c_simple",
            "name": "Ananya Sen",
            "phone": "+91-98765-43210",
            "email": "ananya.sen@example.com",
            "location": "Kolkata",
            "current_role": "Data Analyst",
            "current_company": "TCS",
            "experience_years": 3.5,
            "skills": ["SQL", "PowerBI", "Python"],
            "notice_period": "",  # Genuinely empty
            "education": "B.Sc Statistics",
            "extraction_status": "Validated",
            "filename": "ananya_resume.pdf",
        }
    ]

    resp = client.post(
        "/api/v1/scraper/export-excel",
        json={"candidates": candidates, "single_sheet": True},
    )
    assert resp.status_code == 200
    assert "candidate_extraction.xlsx" in resp.headers["content-disposition"]

    wb = openpyxl.load_workbook(io.BytesIO(resp.content))
    assert wb.sheetnames == ["Candidate Details"]
    ws = wb["Candidate Details"]

    headers = [cell.value for cell in ws[1]]
    assert headers == ["Candidate Name", "Phone Number", "Mail ID", "Location"]
    data_row = [cell.value for cell in ws[2]]
    assert data_row == ["Ananya Sen", "+91-98765-43210", "ananya.sen@example.com", "Kolkata"]


def test_jd_candidate_exports_include_experience_and_resume_skills(client):
    import csv
    import io
    import openpyxl

    candidate = {
        "name": "Ananya Sen",
        "phone": "+91-98765-43210",
        "email": "ananya.sen@example.com",
        "location": "Kolkata",
        "experience_years": 3.5,
        "skills": ["SQL", "PowerBI", "Python"],
    }

    excel_resp = client.post(
        "/api/v1/scraper/export-excel",
        json={"candidates": [candidate], "single_sheet": True, "include_match_details": True},
    )
    assert excel_resp.status_code == 200
    workbook = openpyxl.load_workbook(io.BytesIO(excel_resp.content))
    worksheet = workbook["Candidate Details"]
    assert [cell.value for cell in worksheet[1]] == [
        "Candidate Name",
        "Phone Number",
        "Mail ID",
        "Location",
        "Experience (Years)",
        "Resume Skills",
    ]
    assert [cell.value for cell in worksheet[2]] == [
        "Ananya Sen",
        "+91-98765-43210",
        "ananya.sen@example.com",
        "Kolkata",
        3.5,
        "SQL, PowerBI, Python",
    ]

    csv_resp = client.post(
        "/api/v1/scraper/export-csv",
        json={"candidates": [candidate], "include_match_details": True},
    )
    assert csv_resp.status_code == 200
    rows = list(csv.reader(io.StringIO(csv_resp.text)))
    assert rows == [
        ["Name", "Phone Number", "Mail ID", "Location", "Experience (Years)", "Resume Skills"],
        ["Ananya Sen", "+91-98765-43210", "ananya.sen@example.com", "Kolkata", "3.5", "SQL, PowerBI, Python"],
    ]

