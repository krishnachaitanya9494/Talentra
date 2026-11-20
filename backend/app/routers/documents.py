"""
Document and Ingestion Router for TALENTRA.

Provides RESTful endpoints for:
- Uploading Job Descriptions (PDF, DOCX, TXT)
- Uploading Resumes (PDF, DOCX, TXT)
- Synchronizing local data files with SQLite
- Listing and searching JDs and Candidates from SQLite
"""

from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.core.config import settings
from backend.app.models.client import Client
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement
from backend.app.models.submission import CandidateSubmission
from backend.app.schemas.documents import (
    JobRequirementItem,
    JobRequirementDetailItem,
    CandidateItem,
    CandidateDetailItem,
    PaginatedJDsResponse,
    PaginatedCandidatesResponse,
    DataSummaryResponse,
    SyncResponse,
    UploadJDResponse,
    UploadResumeResponse,
)
from backend.app.services.document_parser import extract_text_from_file
from backend.app.services.data_ingestion import (
    ingest_all_local_data,
    save_and_ingest_uploaded_jd,
    save_and_ingest_uploaded_resume,
)

router = APIRouter(prefix="/api/v1", tags=["Documents & Talent Intelligence"])


@router.get(
    "/data/summary",
    response_model=DataSummaryResponse,
    summary="Data Infrastructure Summary",
    description="Returns aggregate entity counts from the SQLite database.",
)
def get_data_summary(db: Session = Depends(get_db)) -> DataSummaryResponse:
    total_jds = db.scalar(select(func.count(JobRequirement.id))) or 0
    total_candidates = db.scalar(select(func.count(Candidate.id))) or 0
    total_clients = db.scalar(select(func.count(Client.id))) or 0
    total_submissions = db.scalar(select(func.count(CandidateSubmission.id))) or 0

    return DataSummaryResponse(
        total_jds=total_jds,
        total_candidates=total_candidates,
        total_clients=total_clients,
        total_submissions=total_submissions,
        database_file=settings.DATABASE_URL.replace("sqlite:///", ""),
    )


@router.post(
    "/data/sync",
    response_model=SyncResponse,
    summary="Synchronize Local Files with SQLite",
    description="Scans data/jds and data/resumes, parses files, and inserts non-duplicated records into SQLite.",
)
def sync_data(
    max_resumes: Optional[int] = Query(None, description="Optional cap on resumes to process"),
    db: Session = Depends(get_db),
) -> SyncResponse:
    res = ingest_all_local_data(db, max_resumes=max_resumes)
    return SyncResponse(
        message="Local data files synchronized successfully with SQLite.",
        jds_synced=res["jds_synced"],
        jds_skipped=res["jds_skipped"],
        resumes_synced=res["resumes_synced"],
        resumes_skipped=res["resumes_skipped"],
        total_jds=res["total_jds"],
        total_candidates=res["total_candidates"],
    )


@router.post(
    "/jds/upload",
    response_model=UploadJDResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Job Description",
    description="Upload a Job Description file (.txt, .pdf, .docx, .json). Parses and stores in SQLite.",
)
async def upload_job_description(
    file: UploadFile = File(..., description="Job Description file"),
    title: Optional[str] = Form(None, description="Optional manual override for title"),
    skills: Optional[str] = Form(None, description="Optional manual override for required skills"),
    client_id: Optional[int] = Form(None, description="Optional target client ID"),
    db: Session = Depends(get_db),
) -> UploadJDResponse:
    allowed_exts = [".txt", ".pdf", ".docx", ".doc", ".json"]
    ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(allowed_exts)}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        job_req = save_and_ingest_uploaded_jd(
            content=content,
            filename=file.filename,
            db=db,
            client_id=client_id,
            title_override=title,
            skills_override=skills,
        )
        return UploadJDResponse(
            message=f"Job requirement '{job_req.title}' registered successfully with code {job_req.req_code}.",
            job_requirement=JobRequirementItem.model_validate(job_req),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and ingest Job Description: {str(e)}",
        )


@router.post(
    "/resumes/upload",
    response_model=UploadResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Resume",
    description="Upload a Resume file (.pdf, .docx, .txt). Parses candidate profile and stores in SQLite.",
)
async def upload_resume(
    file: UploadFile = File(..., description="Resume file"),
    db: Session = Depends(get_db),
) -> UploadResumeResponse:
    allowed_exts = [".pdf", ".docx", ".doc", ".txt"]
    ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(allowed_exts)}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded resume file is empty.",
        )

    try:
        candidate = save_and_ingest_uploaded_resume(
            content=content,
            filename=file.filename,
            db=db,
        )
        return UploadResumeResponse(
            message=f"Candidate '{candidate.full_name}' ({candidate.email}) registered successfully with code {candidate.candidate_code}.",
            candidate=CandidateItem.model_validate(candidate),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and ingest Resume: {str(e)}",
        )


@router.get(
    "/jds",
    response_model=PaginatedJDsResponse,
    summary="List Job Descriptions",
    description="List and search Job Requirements stored in SQLite.",
)
def list_job_descriptions(
    search: Optional[str] = Query(None, description="Search term for title, department, or skills"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedJDsResponse:
    query = select(JobRequirement)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                JobRequirement.title.ilike(search_pattern),
                JobRequirement.req_code.ilike(search_pattern),
                JobRequirement.required_skills.ilike(search_pattern),
                JobRequirement.department.ilike(search_pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.order_by(JobRequirement.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return PaginatedJDsResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[JobRequirementItem.model_validate(item) for item in items],
    )


@router.get(
    "/jds/{jd_id}",
    response_model=JobRequirementDetailItem,
    summary="Get Job Description Details with Full Text",
)
def get_job_description(jd_id: int, db: Session = Depends(get_db)) -> JobRequirementDetailItem:
    from pathlib import Path
    item = db.get(JobRequirement, jd_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")
    
    full_text = item.description
    # If there's an associated file in data/jds matching requisition code
    source_file = None
    jds_dir = Path("data/jds").resolve()
    for ext_file in jds_dir.glob("*.txt"):
        if ext_file.name.lower().startswith(item.req_code.lower().replace("-", "_")):
            try:
                full_text = extract_text_from_file(ext_file)
                source_file = ext_file.name
                break
            except Exception:
                pass

    detail = JobRequirementDetailItem.model_validate(item)
    detail.full_text = full_text
    detail.source_file = source_file
    return detail


@router.get(
    "/resumes",
    response_model=PaginatedCandidatesResponse,
    summary="List Candidates / Resumes",
    description="List and search Candidates / Resumes stored in SQLite with advanced filtering.",
)
def list_candidates(
    search: Optional[str] = Query(None, description="Search term for name, title, skills, or email"),
    location: Optional[str] = Query(None, description="Filter by candidate location"),
    status_filter: Optional[str] = Query(None, description="Filter by candidate status (available, interviewing, placed, etc.)"),
    experience_min: Optional[float] = Query(None, description="Minimum years of total experience"),
    experience_max: Optional[float] = Query(None, description="Maximum years of total experience"),
    sort_by: str = Query("id", description="Field to sort by: 'id', 'name', 'experience', 'created_at'"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedCandidatesResponse:
    query = select(Candidate)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Candidate.first_name.ilike(search_pattern),
                Candidate.last_name.ilike(search_pattern),
                Candidate.current_title.ilike(search_pattern),
                Candidate.skills.ilike(search_pattern),
                Candidate.email.ilike(search_pattern),
                Candidate.location.ilike(search_pattern),
                Candidate.candidate_code.ilike(search_pattern),
            )
        )

    if location:
        query = query.where(Candidate.location.ilike(f"%{location}%"))

    if status_filter:
        query = query.where(Candidate.status == status_filter.lower())

    if experience_min is not None:
        query = query.where(Candidate.total_experience_years >= experience_min)

    if experience_max is not None:
        query = query.where(Candidate.total_experience_years <= experience_max)

    # Sorting
    sort_col = Candidate.id
    if sort_by == "name":
        sort_col = Candidate.first_name
    elif sort_by == "experience":
        sort_col = Candidate.total_experience_years
    elif sort_by == "created_at":
        sort_col = Candidate.created_at

    if sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.offset((page - 1) * page_size).limit(page_size)
    ).all()

    return PaginatedCandidatesResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[CandidateItem.model_validate(item) for item in items],
    )


@router.get(
    "/resumes/{candidate_id}",
    response_model=CandidateDetailItem,
    summary="Get Candidate Resume Details with Full Text",
)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)) -> CandidateDetailItem:
    from pathlib import Path
    item = db.get(Candidate, candidate_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    
    full_text = f"Profile: {item.first_name} {item.last_name} ({item.current_title or 'Software Engineer'})"
    filename = None
    if item.resume_url:
        path = Path(item.resume_url)
        filename = path.name
        if path.is_file():
            try:
                extracted = extract_text_from_file(path)
                if extracted:
                    full_text = extracted
            except Exception as e:
                full_text = f"[Error extracting resume file content: {e}]"

    detail = CandidateDetailItem.model_validate(item)
    detail.full_text = full_text
    detail.resume_filename = filename
    return detail


@router.get(
    "/jds/{jd_id}/interview-kit",
    summary="Generate AI Technical Screening & Interview Kit for JD",
    description="Generates role-specific technical screening questions, model answers, evaluation scorecard, and company intelligence based on JD requirements.",
)
def get_jd_interview_kit(jd_id: int, db: Session = Depends(get_db)):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")

    title = jd.title or "Software Engineering Role"
    domain = jd.department or "Engineering"
    title_lower = title.lower()
    exp_level = (jd.experience_level or "mid").lower()
    if exp_level == "entry":
        exp_min, exp_max = 1, 3
    elif exp_level == "senior":
        exp_min, exp_max = 5, 8
    elif exp_level in ("lead", "principal", "executive"):
        exp_min, exp_max = 8, 12
    else:
        exp_min, exp_max = 3, 6

    # Extract skills
    skills_raw = jd.required_skills or ""
    if isinstance(skills_raw, list):
        skills = skills_raw
    else:
        skills = [s.strip() for s in str(skills_raw).split(",") if s.strip()]

    pref_skills = []

    top_skill_1 = skills[0] if len(skills) > 0 else "System Architecture"
    top_skill_2 = skills[1] if len(skills) > 1 else "Database Optimization"
    top_skill_3 = skills[2] if len(skills) > 2 else "API Design"

    # Role-specific questions & comprehensive model answers
    if "hyperion" in title_lower or "epm" in title_lower or any("hyperion" in s.lower() for s in skills):
        screening_questions = [
            {
                "id": "sq-1",
                "category": "Architecture & Implementation",
                "recommended_stage": "Technical Round 1",
                "difficulty": "Advanced",
                "question": "Can you walk through an end-to-end implementation of Oracle Planning and Budgeting Cloud Service (PBCS) or on-premise Hyperion where you designed calculation scripts and dimension hierarchies?",
                "model_answer": "In an end-to-end PBCS implementation, I begin by modeling the multidimensional outline in Essbase, strictly separating Dense dimensions (such as Accounts and Periods) from Sparse dimensions (such as Entity, Scenario, Version, and Cost Center) to optimize data block footprint and minimize disk I/O. I set up metadata using Dimension Management with Smart Lists and User Variables. For calculations, I author calculation scripts in Calculation Manager using targeted FIX...ENDFIX blocks, leveraging @CALCMODE(BLOCK) and @ISMBR to ensure optimal throughput. I implement Dynamic Calc for simple hierarchical rollups while reserving Stored members for historical actuals. For integration, I establish Data Management (FDMEE) locations with explicit and wildcard mapping rules, validating staging balances before promoting the application snapshot using Lifecycle Management (LCM).",
                "expected_signals": [
                    "Distinguishes Essbase block storage (BSO) vs aggregate storage (ASO) and Dense vs Sparse dimensions.",
                    "Explains calculation script structure: FIX statements, @CALCMODE(BLOCK), and avoiding cross-dimensional operators in large FIXes.",
                    "Details metadata management, Smart View validation, and automated LCM snapshot migration."
                ],
                "rubric": {
                    "below_bar": "Confuses Dense and Sparse dimensions; only worked as an end-user running reports in Smart View.",
                    "meets_bar": "Explains block storage, writes basic calculation scripts with FIX blocks, and loads data via Data Management.",
                    "exceeds_bar": "Masters Essbase memory cache tuning, complex allocation algorithms, LCM automation, and multi-currency consolidation."
                },
                "red_flags": [
                    "Only cites textbook definitions without real project examples.",
                    "Cannot explain why a calculation script causes memory exhaustion or endless loops."
                ],
            },
            {
                "id": "sq-2",
                "category": "Practical Problem Solving & Tuning",
                "recommended_stage": "Technical Deep Dive",
                "difficulty": "Expert",
                "question": "How do you troubleshoot and tune a long-running calculation script or consolidation job in Essbase?",
                "model_answer": "First, I examine the Essbase application log (essbase.log) to check elapsed execution time, block creation rates, and cache hit ratios. Next, I verify the Dense/Sparse dimension configuration: having too many Dense dimensions results in sparse blocks that bloat the database and cause severe paging. In the calculation script, I set CALCLOCKBLOCK HIGH, verify intelligent calculation status (SET UPDATECALC ON), and ensure FIX statements isolate only dirty or updated slices rather than scanning the entire outline. Finally, I tune the memory caches in essbase.cfg: sizing the index cache to hold all index pages, allocating sufficient data cache for decompression, and adjusting data file cache before performing full restructuring to eliminate index fragmentation.",
                "expected_signals": [
                    "Dense/Sparse dimension restructuring and avoiding bloated block sizes.",
                    "Memory cache hierarchy: Index cache, Data cache, and Data file cache configuration.",
                    "Script optimization: CALCLOCKBLOCK commands, SET UPDATECALC ON, and scoped FIX ranges."
                ],
                "rubric": {
                    "below_bar": "Suggests restarting the server or adding more CPUs without diagnostic telemetry.",
                    "meets_bar": "Checks essbase.log, verifies Dense/Sparse layout, and tunes basic calculation script FIX boundaries.",
                    "exceeds_bar": "Performs deep cache sizing, calculates exact block size in bytes, and re-sequences dimensions by sparsity."
                },
                "red_flags": [
                    "Never heard of essbase.cfg or Essbase application logs.",
                    "Does not understand what constitutes a database block or how blocks are indexed."
                ],
            },
            {
                "id": "sq-3",
                "category": "Integration & Automated Governance",
                "recommended_stage": "Recruiter Phone Screen",
                "difficulty": "Intermediate",
                "question": "How do you design and automate financial data ingestion between source ERPs (like SAP or Oracle ERP Cloud) and EPM Cloud?",
                "model_answer": "I configure Data Management / FDMEE using automated EPM Automate command-line scheduling or direct REST APIs. Source ERP balances are extracted as scheduled file drops or direct query adapters, passed through explicit, between, and multi-dimensional mapping rules in Data Management, and staged. I automate batch ingestion using shell or PowerShell scripts executing 'epmautomate runDMDataRule' and 'epmautomate runBusinessRule'. Before releasing data to planning users, automated reconciliation scripts compare ERP general ledger trial balances against EPM staging totals, halting the automated pipeline and alerting administrators if variances exceed preset thresholds.",
                "expected_signals": [
                    "FDMEE / Data Management import formats, locations, and mapping tables.",
                    "EPM Automate CLI batch scheduling with error handling and exit codes.",
                    "Automated reconciliation audits and variance exception notifications."
                ],
                "rubric": {
                    "below_bar": "Relies on manual Excel upload without automated scheduling or auditability.",
                    "meets_bar": "Creates Data Management rules and runs batch jobs via EPM Automate.",
                    "exceeds_bar": "Builds resilient REST API integrations, idempotent staging pipelines, and automated ERP reconciliation alerts."
                },
                "red_flags": [
                    "Unaware of EPM Automate commands or Data Management mapping logic.",
                    "No mechanism for error notifications or failed batch alerts."
                ],
            },
            {
                "id": "sq-4",
                "category": "Domain Knowledge & Financial Close",
                "recommended_stage": "Hiring Manager Round",
                "difficulty": "Intermediate",
                "question": "How do you handle intercompany eliminations, currency translation, and financial close compliance in multi-entity setups?",
                "model_answer": "For multi-entity consolidation, I define an Intercompany (ICP) dimension where matching entity pairs register bilateral transactions. During consolidation rules execution, automated elimination rules generate offsetting entries at the first common parent entity in the hierarchy. For multi-currency reporting, I configure exchange rate tables (Ending, Average, and Historical rates) and implement standard translation methods (e.g. Cumulative Translation Adjustment to equity). I enforce strict closing calendars by locking periods via Data Status and Process Management, ensuring SOX audit compliance with complete immutable logs of all metadata and data modifications.",
                "expected_signals": [
                    "Intercompany matching and elimination at the first common parent entity.",
                    "Currency translation tables: Ending, Average, and Historical rates with CTA accounting.",
                    "Period locking, Process Management approvals, and SOX auditability."
                ],
                "rubric": {
                    "below_bar": "Unfamiliar with intercompany balancing or manual netting adjustments in Excel.",
                    "meets_bar": "Explains first common parent elimination and standard currency translation.",
                    "exceeds_bar": "Understands statutory equity adjustments, minority interest eliminations, and complex ownership tracking."
                },
                "red_flags": [
                    "Claims intercompany entries are manually booked at year-end.",
                    "No understanding of CTA (Cumulative Translation Adjustment)."
                ],
            },
            {
                "id": "sq-5",
                "category": "Cloud Modernization & Lifecycle",
                "recommended_stage": "Technical Round 2",
                "difficulty": "Advanced",
                "question": "What is your approach to migrating legacy on-premise Hyperion applications to Oracle EPM Cloud (PBCS / EPBCS)?",
                "model_answer": "I follow a structured 5-phase cloud modernization blueprint: 1) Outline rationalization (purging unused members, restructuring Dense/Sparse dimensions to meet Cloud block limits); 2) Rule modernization (refactoring legacy MAXL/Calc scripts into Calculation Manager business rules or Groovy scripts); 3) Web form and dashboard conversion; 4) Integration transition from direct database links to Data Management and EPM Automate REST flows; and 5) Parallel financial close runs for 2 consecutive cycles to guarantee numerical parity before cutover.",
                "expected_signals": [
                    "Outline simplification and block size compliance for Cloud.",
                    "Converting legacy calc scripts to Groovy and Calculation Manager rules.",
                    "Dual-run parallel financial close reconciliation before decommissioning."
                ],
                "rubric": {
                    "below_bar": "Thinks migrating to Cloud is a simple 1:1 file copy without dimensional adjustments.",
                    "meets_bar": "Outlines LCM snapshot export, dimension cleanup, and basic form rebuilding.",
                    "exceeds_bar": "Leverages Groovy rules for dynamic grid calculation, automated LCM pipelines, and parallel-run audit reconciliation."
                },
                "red_flags": [
                    "No plan for parallel close runs or data reconciliation.",
                    "Unaware of Oracle EPM Cloud release cadence and monthly patch management."
                ],
            },
        ]
    else:
        # Dynamic synthesis for other engineering disciplines
        screening_questions = [
            {
                "id": "sq-1",
                "category": "Core Architecture & Design",
                "recommended_stage": "Technical Round 1",
                "difficulty": "Advanced",
                "question": f"Walk us through how you architected and scaled an enterprise application primarily utilizing {top_skill_1}. What trade-offs did you make regarding latency versus consistency?",
                "model_answer": f"When architecting with {top_skill_1}, I structure the service around bounded contexts, separating transactional write paths from read models via CQRS. To balance latency and consistency, I employ local caching (Redis) for hot read paths with TTL-based invalidation, while ensuring critical write operations maintain ACID guarantees using transactional outboxes and idempotency keys. Under peak load, asynchronous event streaming (Kafka) absorbs sudden traffic spikes, allowing downstream workers to process transactions with guaranteed at-least-once delivery.",
                "expected_signals": [
                    f"Demonstrates deep, non-trivial hands-on knowledge of {top_skill_1}.",
                    "Mentions clear trade-offs (e.g., caching strategies, asynchronous processing, idempotency).",
                    "Explains monitoring, telemetry, and recovery mechanisms in production."
                ],
                "rubric": {
                    "below_bar": "Only cites textbook definitions without real architectural examples.",
                    "meets_bar": "Explains system architecture, identifies trade-offs, and discusses database scaling.",
                    "exceeds_bar": "Masters distributed system resilience, zero-downtime migrations, and event-driven architectures."
                },
                "red_flags": [
                    "Only cites textbook definitions without real architectural examples.",
                    "Unable to explain failure modes or how scaling impacted other subsystems."
                ],
            },
            {
                "id": "sq-2",
                "category": "Technology Depth & Best Practices",
                "recommended_stage": "Technical Deep Dive",
                "difficulty": "Intermediate",
                "question": f"When implementing solutions with {top_skill_2}, what are the most common performance bottlenecks you have encountered, and how did you diagnose and resolve them?",
                "model_answer": f"The most prevalent bottleneck with {top_skill_2} involves unindexed queries or connection pool exhaustion under concurrent workload. I diagnose this using APM distributed traces and slow query logs to capture execution plans. Resolution involves establishing composite indexes aligned with WHERE and ORDER BY clauses, configuring connection pooling limits with aggressive timeouts, and offloading heavy analytical queries to read-replicas.",
                "expected_signals": [
                    "Mentions concrete profiling tools (APM, query analyzers, memory profilers).",
                    "Understands index structures, connection pooling, or event loop blocking.",
                    "Measures before and after latency/throughput metrics."
                ],
                "rubric": {
                    "below_bar": "Guesses solutions without instrumentation or root-cause isolation.",
                    "meets_bar": "Uses profilers, identifies index/memory bottlenecks, and implements fixes.",
                    "exceeds_bar": "Designs automated performance regression testing in CI and tunes low-level runtime parameters."
                },
                "red_flags": [
                    "Guesses solutions without instrumentation or root-cause isolation.",
                    "Relies purely on increasing server specs without query/code optimization."
                ],
            },
            {
                "id": "sq-3",
                "category": "Integration & Systems Resilience",
                "recommended_stage": "Recruiter Phone Screen",
                "difficulty": "Intermediate",
                "question": f"In a distributed environment involving {top_skill_3}, how do you ensure graceful degradation during external dependency outages or downstream rate-limits?",
                "model_answer": f"I implement resilience patterns using circuit breakers (Resilience4j / Polly) configured with sliding window failure thresholds. When downstream {top_skill_3} services become unresponsive, the circuit opens immediately, returning cached fallbacks or queuing requests into a dead-letter queue. Retries are governed by exponential backoff with random jitter to prevent thundering herd problems, and all outward calls carry distributed trace headers for end-to-end observability.",
                "expected_signals": [
                    "Applies circuit breakers, exponential backoff with jitter, and dead letter queues.",
                    "Designs idempotent APIs and distributed tracing headers (Traceparent/B3).",
                    "Implements health checks and automated fallback caches."
                ],
                "rubric": {
                    "below_bar": "Assumes network calls are synchronous and fail-safe.",
                    "meets_bar": "Implements retries with backoff and graceful error handling.",
                    "exceeds_bar": "Masters circuit breakers, bulkhead isolation, and chaos engineering verification."
                },
                "red_flags": [
                    "Assumes network calls are synchronous and fail-safe.",
                    "No strategy for cascading failure containment."
                ],
            },
            {
                "id": "sq-4",
                "category": "Quality, Testing & CI/CD",
                "recommended_stage": "Hiring Manager Round",
                "difficulty": "Intermediate",
                "question": f"Describe your testing methodology for critical production workflows in {domain}. How do you balance unit tests, integration tests, and contract testing in CI pipelines?",
                "model_answer": "I advocate for a robust testing pyramid: 70% fast unit tests testing isolated business logic with zero I/O, 20% integration tests using Testcontainers to spin up real database and broker instances, and 10% end-to-end contract tests using Pact. In CI, tests run concurrently; commits failing coverage gates or exhibiting test flakiness are rejected automatically before container image build.",
                "expected_signals": [
                    "Maintains a clear testing pyramid (fast unit tests, contract mocks, targeted integration tests).",
                    "Automates ephemeral test environments or dockerized service containers.",
                    "Focuses on test determinism and zero flaky test tolerance."
                ],
                "rubric": {
                    "below_bar": "Relies exclusively on manual QA or post-deployment user reports.",
                    "meets_bar": "Writes automated unit and integration tests with CI test runners.",
                    "exceeds_bar": "Maintains zero-flakiness pipelines, contract testing, and automated Canary deployments."
                },
                "red_flags": [
                    "Relies exclusively on manual QA or post-deployment user reports.",
                    "Cannot explain mock vs spy vs test-container trade-offs."
                ],
            },
            {
                "id": "sq-5",
                "category": "Mentorship & Technical Leadership",
                "recommended_stage": "Leadership Round",
                "difficulty": "Advanced",
                "question": f"With {exp_min} to {exp_max} years of experience expected for this role, give an example of a contentious technical decision or architectural refactor you led. How did you gain team alignment?",
                "model_answer": "I authored a formal Architecture Decision Record (ADR) outlining the technical motivations, benchmark measurements, and alternative options. I scheduled a dedicated RFC review meeting, actively addressing trade-offs raised by dissenting team members. Rather than mandating a large-bang migration, we agreed on a proof-of-concept phase with measurable SLA milestones. Once the prototype demonstrated a 45% reduction in latency, team consensus was achieved, and we executed the rollout incrementally.",
                "expected_signals": [
                    "Presents structured RFCs or ADRs (Architecture Decision Records).",
                    "Focuses on business outcomes and team velocity rather than dogmatic preferences.",
                    "Supports junior engineers through pair programming and code reviews."
                ],
                "rubric": {
                    "below_bar": "Imposes unilateral decisions without team consensus.",
                    "meets_bar": "Facilitates team discussions, gathers input, and documents decisions.",
                    "exceeds_bar": "Mentors engineers, drives organizational architectural alignment, and establishes engineering standards."
                },
                "red_flags": [
                    "Imposes unilateral decisions without team consensus.",
                    "Blames legacy code or past team members without constructive solutions."
                ],
            },
        ]

    # Enterprise Hiring Organization & Company Intelligence
    client_name = "Talentra Enterprise Delivery"
    client_industry = "Corporate Financial Systems & Global Sourcing"
    if jd.client_id:
        c = db.get(Client, jd.client_id)
        if c:
            client_name = c.name
            client_industry = c.industry or client_industry

    company_intelligence = {
        "company_name": client_name,
        "industry": client_industry,
        "headcount": "5,000 - 15,000 Employees",
        "global_presence": "Hyderabad, Bangalore, Mumbai, London, New York",
        "work_mode": "Hybrid (3 Days Office / 2 Days Remote)",
        "office_location": jd.location or "Hyderabad / Remote",
        "compensation_range": "₹18.0 LPA – ₹26.0 LPA Base + 15% Performance Bonus + ESOPs",
        "team_structure": {
            "department": jd.department or "Engineering & Delivery",
            "team_name": "Financial Systems & Enterprise Performance Architecture",
            "reporting_to": "Director of Enterprise Financial Systems & VP Technology",
            "team_size": "24 Enterprise Specialists across India & US hubs",
            "methodology": "Two-Week Sprints, SOX Auditable Release Governance",
        },
        "tech_stack": [
            {"category": "Core Platform", "items": ["Oracle EPM Cloud", "PBCS / EPBCS", "Essbase 21c", "Smart View"]},
            {"category": "Automation & Scripting", "items": ["Calculation Manager", "Groovy Rules", "EPM Automate CLI", "MAXL"]},
            {"category": "Integration & ETL", "items": ["FDMEE / Data Management", "REST APIs", "SQL Server", "Python"]},
            {"category": "Infrastructure & CI/CD", "items": ["Oracle Cloud Infrastructure (OCI)", "Jenkins", "GitLab CI", "Splunk"]},
        ],
        "culture_and_benefits": [
            "High-visibility engagement with the CFO office and global financial controllers.",
            "Fully sponsored annual Oracle certification and Cloud architecture credentials.",
            "Comprehensive health coverage including parents and family wellness allowance.",
            "Dedicated 10% innovation time for internal automation tooling and platform extensions.",
        ],
        "career_progression": [
            {"level": "Current", "role": title, "focus": "Platform architecture, calculation scripts, and delivery."},
            {"level": "Next (18-24 Mo)", "role": "Lead Enterprise EPM Architect", "focus": "Multi-region roadmap and client leadership."},
            {"level": "Future (3-5 Yrs)", "role": "Practice Director / VP Solutions", "focus": "Global enterprise practice management."},
        ],
        "sourcing_ecosystem": {
            "strategy": "Tier-1 Competitors & Parallel Ecosystems",
            "competitors": ["Oracle IDC", "Deloitte", "PwC", "EY", "KPMG", "Accenture", "Cognizant", "Infosys"],
            "off_limits_notice": "Do not poach from active client advisory accounts with non-solicitation clauses.",
        }
    }

    scenarios = [
        {
            "id": "sc-1",
            "title": f"High Concurrency Incident in {top_skill_1}",
            "scenario": f"During financial close, primary {top_skill_1} consolidation experiences a severe bottleneck with calculation jobs running past the SLA window. How do you triage this incident step-by-step?",
            "evaluation_criteria": [
                "Immediate mitigation (analyzing lock blocks, aborting orphan sessions, load shedding).",
                "Telemetry triage (isolating whether the bottleneck is memory paging, cache misconfiguration, or unconstrained calculation scripts).",
                "Post-mortem root cause analysis and permanent optimization."
            ]
        },
        {
            "id": "sc-2",
            "title": f"Data Integrity & Distributed State with {top_skill_2}",
            "scenario": f"A payment confirmation and inventory decrement service desynchronizes under network partitions, resulting in orphaned authorizations. How would you redesign this using transactional patterns?",
            "evaluation_criteria": [
                "Identifies need for Sagas or Two-Phase Commit with Outbox Pattern.",
                "Discusses idempotency keys and event-driven compensation transactions.",
                "Considers auditability and reconciliation jobs."
            ]
        }
    ]

    scorecard_dimensions = [
        {"name": "Technical Depth & Mastery", "weight": "30%", "description": f"Understanding of {top_skill_1}, {top_skill_2}, and foundational principles."},
        {"name": "System Architecture & Scalability", "weight": "25%", "description": "Enterprise design, trade-offs, concurrency, and reliability patterns."},
        {"name": "Troubleshooting & Problem Solving", "weight": "20%", "description": "Structured debugging, telemetry interpretation, root cause discovery."},
        {"name": "Engineering Rigor & CI/CD", "weight": "15%", "description": "Code quality, automated testing, deployment safety, and documentation."},
        {"name": "Communication & Collaboration", "weight": "10%", "description": "Clarity of articulation, architectural trade-off reasoning, and teamwork."},
    ]

    # Pre-render markdown export
    md_lines = [
        f"# TALENTRA Technical Screening & Interview Kit",
        f"**Position:** {title}",
        f"**Requisition Code:** {jd.req_code}",
        f"**Domain:** {domain} | **Experience Range:** {exp_min} - {exp_max} Years",
        f"**Hiring Organization:** {company_intelligence['company_name']} ({company_intelligence['industry']})",
        f"**Work Mode:** {company_intelligence['work_mode']} | **Location:** {company_intelligence['office_location']}",
        f"**Target CTC:** {company_intelligence['compensation_range']}",
        "\n---\n",
        "## Part 1: Core Technical Screening Questions & Model Answers",
    ]
    for q in screening_questions:
        md_lines.append(f"\n### {q['category']}: {q['question']}")
        md_lines.append(f"**Recommended Stage:** {q.get('recommended_stage', 'Technical Round')} | **Difficulty:** {q.get('difficulty', 'Intermediate')}")
        md_lines.append(f"\n**Ideal Model Answer:**\n{q.get('model_answer', 'N/A')}\n")
        md_lines.append("**Expected Positive Signals:**")
        for s in q['expected_signals']:
            md_lines.append(f"- [x] {s}")
        md_lines.append("**Potential Red Flags:**")
        for r in q['red_flags']:
            md_lines.append(f"- [!] {r}")

    md_lines.append("\n---\n## Part 2: Architecture & Troubleshooting Scenarios")
    for sc in scenarios:
        md_lines.append(f"\n### {sc['title']}")
        md_lines.append(f"*{sc['scenario']}*")
        md_lines.append("**Key Evaluation Criteria:**")
        for c in sc['evaluation_criteria']:
            md_lines.append(f"- {c}")

    md_lines.append("\n---\n## Part 3: Interviewer Evaluation Scorecard")
    md_lines.append("| Dimension | Weight | Description | Rating (1-5) |")
    md_lines.append("| :--- | :--- | :--- | :--- |")
    for dim in scorecard_dimensions:
        md_lines.append(f"| {dim['name']} | {dim['weight']} | {dim['description']} | [ ] / 5 |")
    md_lines.append("\n**Final Recommendation:** [ ] Strong Hire  [ ] Hire  [ ] Hold  [ ] No Hire")

    return {
        "status": "success",
        "jd_id": jd.id,
        "req_code": jd.req_code,
        "title": title,
        "domain": domain,
        "experience_range": f"{exp_min} - {exp_max} Years",
        "mandatory_skills": skills,
        "preferred_skills": pref_skills,
        "screening_questions": screening_questions,
        "company_intelligence": company_intelligence,
        "scenarios": scenarios,
        "scorecard_dimensions": scorecard_dimensions,
        "markdown_kit": "\n".join(md_lines),
    }


# ============================================================================
# CONVENTIONAL STRUCTURED JD WORKSPACE ENDPOINTS (WITHOUT AI)
# ============================================================================

@router.get(
    "/jds/{jd_id}/structured",
    summary="Get 10-Section Structured Job Description Representation",
    description="Deterministic structured representation covering 10 enterprise sections, validation report, and raw document toggle.",
)
def get_structured_jd(jd_id: int, db: Session = Depends(get_db)):
    from backend.app.services.structured_jd_service import get_structured_job_description
    data = get_structured_job_description(jd_id, db)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")
    return data


@router.put(
    "/jds/{jd_id}/structured",
    summary="Update Structured Job Description Fields",
    description="Recruiter manual edits to title, department, skills, responsibilities, or status.",
)
def update_structured_jd(jd_id: int, payload: dict, db: Session = Depends(get_db)):
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")

    if "title" in payload and payload["title"]:
        jd.title = payload["title"]
    if "department" in payload and payload["department"]:
        jd.department = payload["department"]
    if "location" in payload:
        jd.location = payload["location"]
    if "status" in payload and payload["status"]:
        jd.status = payload["status"]
    if "required_skills" in payload and payload["required_skills"]:
        if isinstance(payload["required_skills"], list):
            jd.required_skills = ", ".join(payload["required_skills"])
        else:
            jd.required_skills = payload["required_skills"]
    if "description" in payload and payload["description"]:
        jd.description = payload["description"]

    db.commit()
    db.refresh(jd)

    from backend.app.services.structured_jd_service import get_structured_job_description
    from backend.app.services.jd_version_service import create_jd_version
    
    # Register version record
    skills_list = [s.strip() for s in (jd.required_skills or "").split(",") if s.strip()]
    create_jd_version(
        jd_id=jd.id,
        author=payload.get("author", "Recruiter Admin"),
        change_summary=payload.get("change_summary", "Updated structured job details."),
        updated_data={"skills": skills_list, "status": jd.status},
    )

    return get_structured_job_description(jd_id, db)


@router.get(
    "/jds/{jd_id}/validation",
    summary="Rule-Based Job Description Quality & Validation Report",
    description="Deterministic validation checking missing fields, experience consistency, duplicate skills, and completeness score.",
)
def get_jd_validation(jd_id: int, db: Session = Depends(get_db)):
    from backend.app.services.structured_jd_service import get_structured_job_description
    structured = get_structured_job_description(jd_id, db)
    if not structured:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")
    return structured.get("validation", {})


@router.get(
    "/jds/{jd_id}/versions",
    summary="Get Version History for Requisition",
    description="Tracks v1, v2... timestamps, recruiter authors, and added/removed skills.",
)
def get_jd_version_history(jd_id: int, db: Session = Depends(get_db)):
    from backend.app.services.structured_jd_service import get_structured_job_description
    from backend.app.services.jd_version_service import get_jd_versions
    structured = get_structured_job_description(jd_id, db)
    if not structured:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")
    return get_jd_versions(jd_id, base_jd=structured)


@router.post(
    "/jds/{jd_id}/versions",
    summary="Create New JD Version",
    description="Snapshots current JD state into v2, v3... with change summary and skill diffs.",
)
def create_new_jd_version(jd_id: int, payload: dict, db: Session = Depends(get_db)):
    from backend.app.services.jd_version_service import create_jd_version
    jd = db.get(JobRequirement, jd_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Requirement not found")

    new_ver = create_jd_version(
        jd_id=jd_id,
        author=payload.get("author", "Recruiter Admin"),
        change_summary=payload.get("change_summary", "Updated requirements specifications."),
        updated_data=payload,
    )
    return new_ver


@router.get(
    "/jds/{jd_id}/versions/diff",
    summary="Compare Two JD Versions",
    description="Computes exact added, removed, and retained skills between two version numbers.",
)
def get_version_diff(
    jd_id: int,
    ver_a: int = Query(1, description="First version number (e.g. 1)"),
    ver_b: int = Query(2, description="Second version number (e.g. 2)"),
    db: Session = Depends(get_db),
):
    from backend.app.services.jd_version_service import diff_jd_versions
    diff = diff_jd_versions(jd_id, ver_a, ver_b)
    if "error" in diff:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=diff["error"])
    return diff


