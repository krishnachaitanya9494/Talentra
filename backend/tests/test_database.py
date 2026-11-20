"""
Automated Database Foundation and Relational Integrity Tests for TALENTRA.

Uses an isolated temporary SQLite database for every test session,
ensuring zero mutations to the development database (data/talentra_dev.db).
Tests foreign key enforcement, uniqueness constraints, cascade deletions,
and relationship traversals across all 5 core entities.
"""

from datetime import datetime, timezone, timedelta, date
import pytest
from sqlalchemy import create_engine, select, text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError

from backend.app.models import (
    Base,
    Client,
    Candidate,
    JobRequirement,
    CandidateSubmission,
    Interview,
)


@pytest.fixture(scope="function")
def test_db_session(tmp_path):
    """
    Creates an isolated temporary SQLite database per test function,
    enables SQLite foreign keys, creates all tables, and yields a test session.
    """
    db_file = tmp_path / "test_talentra.db"
    test_db_url = f"sqlite:///{db_file}"

    test_engine = create_engine(
        test_db_url,
        connect_args={"check_same_thread": False},
        echo=False,
    )

    # Enforce SQLite foreign key constraints
    @event.listens_for(test_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Create all schema tables
    Base.metadata.create_all(bind=test_engine)

    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestSession()

    try:
        yield session
    finally:
        session.close()
        test_engine.dispose()


# ====================================================================
# 1. Database Connectivity & Table Presence Tests
# ====================================================================

def test_database_connectivity(test_db_session: Session):
    """Verifies low-level database execution and connectivity via SELECT 1."""
    result = test_db_session.execute(text("SELECT 1")).scalar()
    assert result == 1


def test_tables_created(test_db_session: Session):
    """Verifies that all 5 core entity tables exist in the schema."""
    engine = test_db_session.get_bind()
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    assert "clients" in tables
    assert "candidates" in tables
    assert "job_requirements" in tables
    assert "candidate_submissions" in tables
    assert "interviews" in tables


# ====================================================================
# 2. Client & Job Requirement Relationships
# ====================================================================

def test_client_creation_and_requirements_relationship(test_db_session: Session):
    """
    Tests creating a client, attaching multiple job requirements,
    and navigating the 1-to-many relationship bidirectionally.
    """
    client = Client(
        client_code="CLI-TECH-001",
        name="Apex Technologies Inc.",
        industry="Enterprise Software",
        website="https://apextech.example.com",
        contact_name="Sarah Connor",
        contact_email="sconnor@apextech.example.com",
        contact_phone="+1-555-0199",
        status="active",
    )
    test_db_session.add(client)
    test_db_session.commit()

    assert client.id is not None
    assert client.created_at is not None
    assert client.updated_at is not None

    req1 = JobRequirement(
        req_code="REQ-2026-0001",
        client_id=client.id,
        title="Senior Python Backend Engineer",
        department="Platform Infrastructure",
        description="Design and scale distributed microservices with FastAPI and SQLAlchemy.",
        experience_level="senior",
        employment_type="full_time",
        location="San Francisco, CA",
        is_remote=True,
        open_positions=2,
        min_salary=160000.00,
        max_salary=195000.00,
        status="open",
        priority="high",
        required_skills="Python, FastAPI, PostgreSQL, Docker",
    )
    req2 = JobRequirement(
        req_code="REQ-2026-0002",
        client_id=client.id,
        title="AI Workforce Solutions Architect",
        department="AI Innovations",
        description="Lead enterprise agentic intelligence and workforce automation workflows.",
        experience_level="lead",
        employment_type="full_time",
        location="Remote",
        is_remote=True,
        open_positions=1,
        min_salary=200000.00,
        max_salary=240000.00,
        status="open",
        priority="urgent",
        required_skills="Python, PyTorch, LLMs, System Architecture",
    )

    test_db_session.add_all([req1, req2])
    test_db_session.commit()

    # Re-query client and assert child requirements
    refreshed_client = test_db_session.scalar(select(Client).where(Client.client_code == "CLI-TECH-001"))
    assert len(refreshed_client.job_requirements) == 2
    assert {r.req_code for r in refreshed_client.job_requirements} == {"REQ-2026-0001", "REQ-2026-0002"}

    # Assert child back_populates relationship
    assert req1.client.name == "Apex Technologies Inc."


# ====================================================================
# 3. Candidate Creation & Constraints
# ====================================================================

def test_candidate_creation_and_unique_constraints(test_db_session: Session):
    """
    Tests candidate creation, field defaults, and verifies that duplicate email
    or candidate_code triggers an IntegrityError.
    """
    candidate1 = Candidate(
        candidate_code="CAN-2026-0001",
        first_name="Alexander",
        last_name="Wright",
        email="alex.wright@example.com",
        phone="+1-555-0144",
        current_title="Senior Full-Stack Engineer",
        current_company="Nexus Labs",
        total_experience_years=8.5,
        location="Seattle, WA",
        skills="Python, React, TypeScript, FastAPI, SQLite",
        status="available",
    )
    test_db_session.add(candidate1)
    test_db_session.commit()

    assert candidate1.id is not None
    assert candidate1.full_name == "Alexander Wright"
    assert candidate1.status == "available"

    # Attempt duplicate email -> must fail
    duplicate_email_candidate = Candidate(
        candidate_code="CAN-2026-0002",
        first_name="Alex",
        last_name="Other",
        email="alex.wright@example.com",  # Duplicate email
    )
    test_db_session.add(duplicate_email_candidate)
    with pytest.raises(IntegrityError):
        test_db_session.commit()
    test_db_session.rollback()

    # Attempt duplicate candidate_code -> must fail
    duplicate_code_candidate = Candidate(
        candidate_code="CAN-2026-0001",  # Duplicate code
        first_name="Jane",
        last_name="Doe",
        email="jane.doe@example.com",
    )
    test_db_session.add(duplicate_code_candidate)
    with pytest.raises(IntegrityError):
        test_db_session.commit()
    test_db_session.rollback()


# ====================================================================
# 4. Candidate Submissions (N:M Association)
# ====================================================================

def test_candidate_submission_relationship_and_uniqueness(test_db_session: Session):
    """
    Tests associating a candidate to multiple job requirements through CandidateSubmission,
    and confirms the unique constraint (candidate_id, job_requirement_id) prevents
    duplicate submissions for the same position.
    """
    # 1. Setup client and 2 requirements
    client = Client(client_code="CLI-CORP-010", name="Horizon Media")
    test_db_session.add(client)
    test_db_session.commit()

    req_a = JobRequirement(
        req_code="REQ-HRZ-01",
        client_id=client.id,
        title="Backend Developer",
        description="Python backend development",
    )
    req_b = JobRequirement(
        req_code="REQ-HRZ-02",
        client_id=client.id,
        title="Data Engineer",
        description="ETL pipelines and SQL warehousing",
    )
    test_db_session.add_all([req_a, req_b])

    # 2. Setup candidate
    candidate = Candidate(
        candidate_code="CAN-2026-0088",
        first_name="Elena",
        last_name="Rostova",
        email="elena.rostova@example.com",
    )
    test_db_session.add(candidate)
    test_db_session.commit()

    # 3. Submit candidate to both requirements (valid multi-requirement association)
    sub1 = CandidateSubmission(
        submission_code="SUB-2026-0001",
        candidate_id=candidate.id,
        job_requirement_id=req_a.id,
        status="submitted",
        match_score=92.50,
        submitted_by="Krishna C.",
    )
    sub2 = CandidateSubmission(
        submission_code="SUB-2026-0002",
        candidate_id=candidate.id,
        job_requirement_id=req_b.id,
        status="reviewing",
        match_score=84.00,
        submitted_by="Krishna C.",
    )
    test_db_session.add_all([sub1, sub2])
    test_db_session.commit()

    # Assert bidirectional navigation
    refreshed_cand = test_db_session.scalar(select(Candidate).where(Candidate.id == candidate.id))
    assert len(refreshed_cand.submissions) == 2
    assert {s.job_requirement.req_code for s in refreshed_cand.submissions} == {"REQ-HRZ-01", "REQ-HRZ-02"}

    # 4. Attempt duplicate submission of candidate to req_a -> must fail UniqueConstraint
    duplicate_sub = CandidateSubmission(
        submission_code="SUB-2026-0003",
        candidate_id=candidate.id,
        job_requirement_id=req_a.id,  # Duplicate!
        status="submitted",
    )
    test_db_session.add(duplicate_sub)
    with pytest.raises(IntegrityError):
        test_db_session.commit()
    test_db_session.rollback()


# ====================================================================
# 5. Interview Rounds & Submission Relationship
# ====================================================================

def test_submission_and_interviews_lifecycle(test_db_session: Session):
    """
    Tests creating multiple interview rounds for a submission,
    verifying relationship traversal and cascade deletion.
    """
    client = Client(client_code="CLI-FIN-001", name="Goldman Financial")
    test_db_session.add(client)
    test_db_session.commit()

    req = JobRequirement(
        req_code="REQ-FIN-01",
        client_id=client.id,
        title="Quant Developer",
        description="High-frequency algorithmic platform development",
    )
    candidate = Candidate(
        candidate_code="CAN-FIN-01",
        first_name="Marcus",
        last_name="Vance",
        email="marcus.vance@example.com",
    )
    test_db_session.add_all([req, candidate])
    test_db_session.commit()

    submission = CandidateSubmission(
        submission_code="SUB-FIN-01",
        candidate_id=candidate.id,
        job_requirement_id=req.id,
        status="interviewing",
        match_score=95.00,
    )
    test_db_session.add(submission)
    test_db_session.commit()

    now = datetime.now(timezone.utc)
    interview_round1 = Interview(
        interview_code="INT-FIN-01-R1",
        submission_id=submission.id,
        round_number=1,
        interview_type="screening",
        scheduled_start=now + timedelta(days=1),
        scheduled_end=now + timedelta(days=1, minutes=45),
        interviewer_names="Rachel Green (Senior Recruiter)",
        status="completed",
        rating=5,
        feedback="Exceptional communication and deep understanding of financial data structures.",
        recommendation="strong_hire",
    )
    interview_round2 = Interview(
        interview_code="INT-FIN-01-R2",
        submission_id=submission.id,
        round_number=2,
        interview_type="technical",
        scheduled_start=now + timedelta(days=3),
        scheduled_end=now + timedelta(days=3, hours=1),
        interviewer_names="David Kim (Principal Architect)",
        meeting_link="https://meet.example.com/fin-quant-r2",
        status="scheduled",
    )
    test_db_session.add_all([interview_round1, interview_round2])
    test_db_session.commit()

    # Verify interview navigation
    refreshed_sub = test_db_session.scalar(select(CandidateSubmission).where(CandidateSubmission.id == submission.id))
    assert len(refreshed_sub.interviews) == 2
    assert interview_round1.submission.submission_code == "SUB-FIN-01"

    # Test cascade delete: Deleting submission removes associated interviews
    test_db_session.delete(refreshed_sub)
    test_db_session.commit()

    remaining_interviews = test_db_session.scalars(select(Interview)).all()
    assert len(remaining_interviews) == 0


# ====================================================================
# 6. Foreign Key Constraint Enforcement
# ====================================================================

def test_foreign_key_constraints_enforced(test_db_session: Session):
    """
    Verifies that SQLite PRAGMA foreign_keys=ON rejects orphaned records
    with invalid foreign key references.
    """
    # 1. Insert job requirement with non-existent client_id -> must fail
    invalid_req = JobRequirement(
        req_code="REQ-ORPHAN-01",
        client_id=99999,  # Does not exist
        title="Orphan Job",
        description="Testing foreign key integrity",
    )
    test_db_session.add(invalid_req)
    with pytest.raises(IntegrityError):
        test_db_session.commit()
    test_db_session.rollback()

    # 2. Insert submission with non-existent candidate_id -> must fail
    client = Client(client_code="CLI-VALID", name="Valid Corp")
    test_db_session.add(client)
    test_db_session.commit()

    valid_req = JobRequirement(
        req_code="REQ-VALID-01",
        client_id=client.id,
        title="Valid Job",
        description="Valid description",
    )
    test_db_session.add(valid_req)
    test_db_session.commit()

    invalid_sub = CandidateSubmission(
        submission_code="SUB-ORPHAN-01",
        candidate_id=88888,  # Does not exist
        job_requirement_id=valid_req.id,
        status="submitted",
    )
    test_db_session.add(invalid_sub)
    with pytest.raises(IntegrityError):
        test_db_session.commit()
    test_db_session.rollback()
