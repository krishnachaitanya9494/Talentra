from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.document import JobDescriptionDocument
from backend.app.models.user import User, UserRole
from backend.app.models.assignment import CandidateAssignment, AssignmentStatus
from backend.app.models.outreach import OutreachCampaign, CandidateCommunication, CampaignStatus
from datetime import datetime, timezone, timedelta
import random

db = SessionLocal()
try:
    candidates = db.query(Candidate).all()
    jds = db.query(JobDescriptionDocument).all()
    tas = db.query(User).filter(User.role == UserRole.TA_RECRUITER).all()

    print(f"Candidates: {len(candidates)}, JDs: {len(jds)}, TAs: {len(tas)}")

    if len(tas) < 3:
        existing_emails = [u.email for u in tas]
        default_tas = [
            {'full_name': 'Marcus Vance', 'email': 'marcus.v@talentra.ai', 'team': 'Talent Operations', 'role': UserRole.TA_RECRUITER},
            {'full_name': 'Sarah Lin', 'email': 'sarah.l@talentra.ai', 'team': 'Engineering TA', 'role': UserRole.TA_RECRUITER},
            {'full_name': 'Priya Sharma', 'email': 'priya.s@talentra.ai', 'team': 'Enterprise TA', 'role': UserRole.TA_RECRUITER},
        ]
        for d in default_tas:
            if d['email'] not in existing_emails:
                u = User(**d, hashed_password='dummy_hash_pbkdf2_sha256', is_active=True)
                db.add(u)
        db.commit()
        tas = db.query(User).filter(User.role == UserRole.TA_RECRUITER).all()

    print(f"Total active TAs: {len(tas)}")

    existing_assign_cand_ids = set(a.candidate_id for a in db.query(CandidateAssignment).all())
    now = datetime.now(timezone.utc)

    sample_cands = [c for c in candidates if c.id not in existing_assign_cand_ids][:85]
    statuses = [
        AssignmentStatus.ASSIGNED,
        AssignmentStatus.CONTACTED,
        AssignmentStatus.CONTACTED,
        AssignmentStatus.INTERESTED,
        AssignmentStatus.SHORTLISTED,
        AssignmentStatus.SHORTLISTED,
        AssignmentStatus.FOLLOW_UP_REQUIRED,
    ]

    created_assignments = 0
    for i, c in enumerate(sample_cands):
        assigned_jd = jds[i % len(jds)]
        assigned_ta = tas[i % len(tas)]
        st = statuses[i % len(statuses)]
        assign_time = now - timedelta(hours=random.randint(2, 72))
        
        a = CandidateAssignment(
            candidate_id=c.id,
            jd_id=assigned_jd.id,
            ta_user_id=assigned_ta.id,
            status=st,
            assigned_at=assign_time,
            notes='Qualified candidate for technical screening.'
        )
        db.add(a)
        created_assignments += 1

    db.commit()
    print(f"Created {created_assignments} candidate assignments.")

    for jd in jds:
        existing_camp = db.query(OutreachCampaign).filter(OutreachCampaign.jd_id == jd.id).first()
        if not existing_camp:
            clean_name = jd.original_filename.replace('.txt', '').replace('_', ' ').title()
            camp = OutreachCampaign(
                name=f"{clean_name} Outreach",
                jd_id=jd.id,
                template_id=1,
                provider_account_id=None,
                mode='mode_b',
                status=CampaignStatus.COMPLETED,
                target_segment='All Matches',
                created_by_user_id=1,
                approved_by_user_id=1,
                total_recipients=15,
                sent_count=12,
                delivered_count=12,
                reply_count=3,
                started_at=now - timedelta(hours=24),
                completed_at=now - timedelta(hours=23)
            )
            db.add(camp)
    db.commit()
    print("Campaigns verified across all JDs.")

    contacted_assignments = db.query(CandidateAssignment).filter(
        CandidateAssignment.status.in_([AssignmentStatus.CONTACTED, AssignmentStatus.INTERESTED, AssignmentStatus.SHORTLISTED])
    ).all()

    existing_comm_cand_ids = set(cm.candidate_id for cm in db.query(CandidateCommunication).all())

    created_comms = 0
    for i, asgn in enumerate(contacted_assignments):
        if asgn.candidate_id in existing_comm_cand_ids:
            continue
        cand = db.query(Candidate).filter(Candidate.id == asgn.candidate_id).first()
        if not cand:
            continue
        
        sent_time = asgn.assigned_at + timedelta(minutes=random.randint(4, 18))
        has_reply = i % 3 == 0
        reply_time = sent_time + timedelta(hours=random.randint(1, 12)) if has_reply else None
        
        comm = CandidateCommunication(
            candidate_id=asgn.candidate_id,
            assignment_id=asgn.id,
            sender_user_id=asgn.ta_user_id,
            recipient_email=cand.email or f"candidate_{cand.id}@gmail.com",
            subject="Exciting Opportunity at TALENTRA Partners",
            body=f"Hi {cand.full_name or 'Candidate'}, we reviewed your background and would love to connect.",
            status='replied' if has_reply else 'delivered',
            sent_at=sent_time,
            delivered_at=sent_time + timedelta(seconds=2),
            reply_received_at=reply_time,
            reply_snippet="Thank you for reaching out! I am interested in discussing this role further." if has_reply else None
        )
        db.add(comm)
        created_comms += 1

    db.commit()
    print(f"Created {created_comms} candidate communications.")
finally:
    db.close()
