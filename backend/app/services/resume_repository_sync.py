"""Synchronize repository resumes into matchable candidate profiles."""

import re
from typing import Dict

from sqlalchemy.orm import Session

from backend.app.models.candidate import Candidate
from backend.app.models.candidate_intelligence import CandidateResumeLink
from backend.app.models.document import ResumeDocument
from backend.app.services.extraction.resume_parser import ResumeParser


def sync_repository_resumes_to_candidates(db: Session) -> Dict[str, int]:
    """Link resumes to candidates by verified email and enrich missing profile data."""
    candidates = db.query(Candidate).all()
    candidates_by_email = {
        candidate.email.strip().lower(): candidate
        for candidate in candidates
        if candidate.email
    }
    links = db.query(CandidateResumeLink).all()
    linked_pairs = {(link.candidate_id, link.resume_doc_id) for link in links}
    primary_candidate_ids = {link.candidate_id for link in links if link.is_primary}

    documents = (
        db.query(ResumeDocument)
        .filter(ResumeDocument.processing_status == "processed")
        .order_by(ResumeDocument.id.asc())
        .all()
    )
    created = 0
    linked = 0
    enriched = 0

    for document in documents:
        if not document.raw_text:
            continue

        parsed = ResumeParser.parse(
            document.raw_text,
            filename=document.original_filename,
            resume_doc_id=document.doc_id,
        )
        email = (parsed.get("email") or "").strip().lower()
        if not email:
            continue

        candidate = candidates_by_email.get(email)
        if not candidate:
            full_name = (parsed.get("full_name") or "").strip()
            first_name = (parsed.get("first_name") or "").strip()
            last_name = (parsed.get("last_name") or "").strip()
            placeholder_names = {"candidate", "unknown", "unknown candidate", "candidate name"}
            if (
                not full_name
                or not first_name
                or not last_name
                or first_name.casefold() in {"candidate", "unknown"}
                or full_name.casefold() in placeholder_names
            ):
                continue

            candidate_code = f"CND-RES-{document.id:06d}"
            suffix = 1
            while db.query(Candidate.id).filter(Candidate.candidate_code == candidate_code).first():
                candidate_code = f"CND-RES-{document.id:06d}-{suffix}"
                suffix += 1

            candidate = Candidate(
                candidate_code=candidate_code,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=parsed.get("phone"),
                current_title=parsed.get("current_title"),
                total_experience_years=parsed.get("total_experience_years"),
                location=parsed.get("location"),
                skills=parsed.get("skills"),
                status="available",
                resume_url=document.file_path,
            )
            db.add(candidate)
            db.flush()
            candidates_by_email[email] = candidate
            created += 1
        else:
            profile_changed = False
            parsed_skills = parsed.get("skills_list") or []
            existing_skills = [
                skill.strip()
                for skill in re.split(r"[,;\n]+", candidate.skills or "")
                if skill.strip()
            ]
            combined_skills = []
            seen_skills = set()
            for skill in existing_skills + parsed_skills:
                key = skill.casefold()
                if key not in seen_skills:
                    seen_skills.add(key)
                    combined_skills.append(skill)
            if combined_skills:
                merged_skills = ", ".join(combined_skills)
                if merged_skills != candidate.skills:
                    candidate.skills = merged_skills
                    profile_changed = True
            if not candidate.phone and parsed.get("phone"):
                candidate.phone = parsed["phone"]
                profile_changed = True
            if not candidate.current_title and parsed.get("current_title"):
                candidate.current_title = parsed["current_title"]
                profile_changed = True
            if candidate.total_experience_years is None and parsed.get("total_experience_years") is not None:
                candidate.total_experience_years = parsed["total_experience_years"]
                profile_changed = True
            if not candidate.location and parsed.get("location"):
                candidate.location = parsed["location"]
                profile_changed = True
            if not candidate.resume_url and document.file_path:
                candidate.resume_url = document.file_path
                profile_changed = True
            if profile_changed:
                enriched += 1

        pair = (candidate.id, document.doc_id)
        if pair not in linked_pairs:
            db.add(CandidateResumeLink(
                candidate_id=candidate.id,
                resume_doc_id=document.doc_id,
                is_primary=candidate.id not in primary_candidate_ids,
            ))
            linked_pairs.add(pair)
            primary_candidate_ids.add(candidate.id)
            linked += 1

    if created or linked or enriched:
        db.commit()
    return {
        "candidates_created": created,
        "resume_links_created": linked,
        "candidate_profiles_enriched": enriched,
    }
