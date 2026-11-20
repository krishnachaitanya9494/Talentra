"""
Data Ingestion and Synchronization Service for TALENTRA.

Connects the SQLite database with Job Descriptions and Resumes located
in data/jds and data/resumes, and processes new uploaded files.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.app.models.client import Client
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.services.document_parser import (
    parse_job_description,
    parse_resume,
    extract_text_from_file,
)

logger = logging.getLogger("talentra.ingestion")

DATA_DIR = Path("data").resolve()
JDS_DIR = DATA_DIR / "jds"
RESUMES_DIR = DATA_DIR / "resumes"
JD_UPLOADS_DIR = JDS_DIR / "uploads"
RESUME_UPLOADS_DIR = RESUMES_DIR / "uploads"


def get_or_create_default_client(db: Session) -> Client:
    """Retrieve or create the primary default client for unassigned requisitions."""
    stmt = select(Client).where(Client.client_code == "CLI-TALENTRA")
    client = db.scalar(stmt)
    if not client:
        client = Client(
            client_code="CLI-TALENTRA",
            name="Talentra Enterprise (Direct Ingestion)",
            industry="Talent Operations & Recruitment",
            status="active",
            billing_address="Headquarters",
        )
        db.add(client)
        db.commit()
        db.refresh(client)
    return client


def ingest_all_local_data(db: Session, max_resumes: Optional[int] = None) -> Dict[str, Any]:
    """
    Scan data/jds and data/resumes, parsing each file and inserting into SQLite.
    Skips files that are already present in the database.
    """
    JD_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    RESUME_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    default_client = get_or_create_default_client(db)

    # 1. Ingest Job Descriptions
    jds_synced = 0
    jds_skipped = 0

    jd_files = []
    if JDS_DIR.exists():
        jd_files = [f for f in JDS_DIR.glob("*.txt") if f.is_file()]

    # Also check if jd_sources.json is available
    jd_sources_file = JDS_DIR / "jd_sources.json"
    sources_meta = {}
    if jd_sources_file.exists():
        try:
            sources_data = json.loads(jd_sources_file.read_text(encoding="utf-8"))
            for item in sources_data.get("sources", []):
                file_rel = item.get("local_extracted_file_path", "")
                if file_rel:
                    sources_meta[Path(file_rel).name] = item
        except Exception as e:
            logger.warning("Failed to parse jd_sources.json: %s", e)

    # Existing requisition codes in DB
    existing_req_codes = set(db.scalars(select(JobRequirement.req_code)).all())
    existing_titles = set(db.scalars(select(JobRequirement.title)).all())

    req_counter = len(existing_req_codes) + 1

    for jd_path in jd_files:
        meta = sources_meta.get(jd_path.name, {})
        req_code = meta.get("jd_id") or f"REQ-{req_counter:04d}"

        # If already exists by code or matching title, skip
        if req_code in existing_req_codes:
            jds_skipped += 1
            continue

        parsed = parse_job_description(jd_path)
        if parsed["title"] in existing_titles:
            jds_skipped += 1
            continue

        job_req = JobRequirement(
            client_id=default_client.id,
            req_code=req_code,
            title=meta.get("job_title") or parsed["title"],
            department=meta.get("domain") or "Engineering",
            description=parsed["description"],
            experience_level=parsed["experience_level"],
            employment_type=parsed["job_type"],
            location=parsed["location"],
            is_remote=parsed["work_model"] in ["remote", "hybrid"],
            open_positions=parsed["openings_count"],
            status="open",
            priority="medium",
            required_skills=parsed["primary_skills"],
        )
        db.add(job_req)
        existing_req_codes.add(req_code)
        existing_titles.add(job_req.title)
        jds_synced += 1
        req_counter += 1

    db.commit()

    # 2. Ingest Resumes
    resumes_synced = 0
    resumes_skipped = 0

    existing_emails = set(db.scalars(select(Candidate.email)).all())
    existing_resumes = set(
        db.scalars(select(Candidate.resume_url).where(Candidate.resume_url.is_not(None))).all()
    )

    candidate_count = db.scalar(select(func.count(Candidate.id))) or 0
    cand_counter = candidate_count + 1

    resume_files = []
    if RESUMES_DIR.exists():
        for ext in ["*.pdf", "*.docx", "*.doc", "*.txt"]:
            resume_files.extend([f for f in RESUMES_DIR.glob(ext) if f.is_file()])

    if max_resumes is not None:
        resume_files = resume_files[:max_resumes]

    for resume_path in resume_files:
        path_str = str(resume_path.as_posix())
        if path_str in existing_resumes:
            resumes_skipped += 1
            continue

        try:
            parsed = parse_resume(resume_path)
            email = parsed["email"]

            if email in existing_emails:
                email = f"candidate_{cand_counter:05d}_{email}"

            candidate_code = f"CND-{cand_counter:05d}"
            exp_years = round(parsed["total_experience_months"] / 12.0, 1)

            candidate = Candidate(
                candidate_code=candidate_code,
                first_name=parsed["first_name"],
                last_name=parsed["last_name"],
                email=email,
                phone=parsed["phone"],
                current_title=parsed["current_title"],
                total_experience_years=exp_years,
                location=parsed["location"],
                skills=parsed["primary_skills"],
                status="available",
                resume_url=path_str,
            )
            db.add(candidate)
            existing_emails.add(email)
            existing_resumes.add(path_str)
            resumes_synced += 1
            cand_counter += 1

            # Commit periodically to keep memory bounded
            if resumes_synced % 50 == 0:
                db.commit()

        except Exception as e:
            logger.error("Failed to parse resume %s: %s", resume_path.name, e)
            resumes_skipped += 1

    db.commit()

    total_jds = db.scalar(select(func.count(JobRequirement.id))) or 0
    total_candidates = db.scalar(select(func.count(Candidate.id))) or 0

    return {
        "jds_synced": jds_synced,
        "jds_skipped": jds_skipped,
        "resumes_synced": resumes_synced,
        "resumes_skipped": resumes_skipped,
        "total_jds": total_jds,
        "total_candidates": total_candidates,
    }


def save_and_ingest_uploaded_jd(
    content: bytes,
    filename: str,
    db: Session,
    client_id: Optional[int] = None,
    title_override: Optional[str] = None,
    skills_override: Optional[str] = None,
) -> JobRequirement:
    """Save an uploaded Job Description file and register it in SQLite."""
    JD_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    target_path = JD_UPLOADS_DIR / filename

    # Avoid overwriting existing files
    base_stem = target_path.stem
    counter = 1
    while target_path.exists():
        target_path = JD_UPLOADS_DIR / f"{base_stem}_{counter}{target_path.suffix}"
        counter += 1

    target_path.write_bytes(content)

    parsed = parse_job_description(target_path)

    target_title = (title_override or parsed.get("title", "")).strip()
    if target_title:
        existing_jd = db.scalar(
            select(JobRequirement).where(func.lower(JobRequirement.title) == target_title.lower())
        )
        if existing_jd:
            logger.info("Found existing JobRequirement for '%s' (ID: %d). Skipping duplicate creation.", target_title, existing_jd.id)
            return existing_jd

    if not client_id:
        default_client = get_or_create_default_client(db)
        client_id = default_client.id

    # Generate sequential requisition code
    count = db.scalar(select(func.count(JobRequirement.id))) or 0
    req_code = f"REQ-UP-{count + 1:04d}"

    job_req = JobRequirement(
        client_id=client_id,
        req_code=req_code,
        title=target_title or f"Job Requisition {req_code}",
        department="Talent Operations",
        description=parsed.get("description", f"Uploaded Job Description: {filename}"),
        experience_level=parsed.get("experience_level", "mid"),
        employment_type=parsed.get("job_type", "full_time"),
        location=parsed.get("location", "Remote / Hybrid"),
        is_remote=parsed.get("work_model") in ["remote", "hybrid"],
        open_positions=1,
        status="open",
        priority="medium",
        required_skills=skills_override or parsed.get("primary_skills", "General Engineering"),
    )
    db.add(job_req)
    db.commit()
    db.refresh(job_req)
    return job_req


def save_and_ingest_uploaded_resume(
    content: bytes,
    filename: str,
    db: Session,
) -> Candidate:
    """Save an uploaded Resume file and register it in SQLite."""
    RESUME_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    target_path = RESUME_UPLOADS_DIR / filename

    # Avoid overwriting existing files
    base_stem = target_path.stem
    counter = 1
    while target_path.exists():
        target_path = RESUME_UPLOADS_DIR / f"{base_stem}_{counter}{target_path.suffix}"
        counter += 1

    target_path.write_bytes(content)

    parsed = parse_resume(target_path)

    # Check for existing candidate by clean email or 10-digit phone
    email = (parsed.get("email") or "").strip().lower()
    phone = (parsed.get("phone") or "").strip()
    digits = re.sub(r"\D", "", phone)
    phone_10 = digits[-10:] if len(digits) >= 10 else ""

    existing = None
    if email and "talentra.local" not in email and "external" not in email:
        existing = db.scalar(select(Candidate).where(func.lower(Candidate.email) == email))

    if not existing and phone_10:
        for c in db.query(Candidate).all():
            cand_digits = re.sub(r"\D", "", str(c.phone or ""))
            if cand_digits[-10:] == phone_10:
                existing = c
                break

    if existing:
        logger.info("Found existing candidate '%s %s' (ID: %d). Updating record without duplicate.", existing.first_name, existing.last_name, existing.id)
        if not existing.phone and phone:
            existing.phone = phone
        if parsed.get("primary_skills") and (not existing.skills or len(parsed["primary_skills"]) > len(existing.skills)):
            existing.skills = parsed["primary_skills"]
        db.commit()
        db.refresh(existing)
        return existing

    count = db.scalar(select(func.count(Candidate.id))) or 0
    cand_code = f"CND-UP-{count + 1:05d}"
    exp_years = round(parsed["total_experience_months"] / 12.0, 1)

    candidate = Candidate(
        candidate_code=cand_code,
        first_name=parsed["first_name"],
        last_name=parsed["last_name"],
        email=email or f"cand_{cand_code.lower()}@talentra.local",
        phone=parsed["phone"],
        current_title=parsed["current_title"],
        total_experience_years=exp_years,
        location=parsed["location"],
        skills=parsed["primary_skills"],
        status="available",
        resume_url=str(target_path.as_posix()),
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate
