# Module 06 — Interview Scheduling & Multi-Interviewer Timetable

## Enterprise Recruitment Calendar, Multi-Interviewer Timetable & Conflict Engine

### Overview
Module 06 is an independent, portable microservice and UI package providing enterprise multi-interviewer calendar coordination, slot availability calculation, conflict prevention, candidate interview lifecycle management, and standard RFC 5545 `.ics` calendar invitation generation.

---

### Package Structure
```text
06-interview-scheduling/
├── frontend/
│   ├── components/
│   │   ├── AddInterviewModal.jsx        # Scheduling modal with real-time conflict checking
│   │   ├── CalendarGrid.jsx             # Multi-column interviewer availability timetable
│   │   ├── CancelInterviewModal.jsx     # Cancellation with audit logging
│   │   ├── InterviewHistoryModal.jsx    # Candidate evaluation audit timeline
│   │   ├── InvitationPreviewModal.jsx   # Email preview & .ics download
│   │   ├── RescheduleModal.jsx          # Rescheduling with conflict re-validation
│   │   └── RightPanel.jsx               # Day agenda & interview action center
│   ├── pages/
│   │   └── InterviewTimetablePage.jsx   # Full header, filters, timetable & side panel
│   ├── api.js                           # Decoupled REST client
│   ├── InterviewSchedulingModule.jsx    # Top-level mountable React component
│   └── index.js                         # Barrel export
├── backend/
│   ├── api/
│   │   └── interview_router.py          # FastAPI REST endpoints
│   ├── models/
│   │   └── interview_models.py          # SQLAlchemy models (Schedules, Panels, Busy blocks, Audit)
│   ├── services/
│   │   └── interview_service.py         # Conflict engine, double-booking prevention, RFC 5545 ICS
│   └── interview_app.py                 # Standalone FastAPI runner (port 8006)
├── contracts/
│   ├── interview_schemas.py             # Pydantic schemas
│   └── schemas.py                       # Re-exports
├── integration/
│   ├── FastAPIIntegration.py            # Backend host mount snippet
│   └── ReactIntegration.jsx             # Frontend host mount snippet
├── config/
│   └── .env.example
├── tests/
│   └── test_interview_scheduling.py     # Independent test suite
└── README.md
```

---

### Key Capabilities
1. **Multi-Interviewer Calendar Grid**:
   - Time positioning (08:00 to 19:00).
   - Interviewer columns with avatar, role, workload count.
   - Distinct colors for Screening, Technical, Managerial, and HR rounds.
   - Busy blocks (Lunch Break, Planning).
   - Current time horizontal indicator line.
2. **Deterministic Conflict & Double-Booking Prevention**:
   - Validates candidate availability against active interviews.
   - Validates all selected interviewers against concurrent interviews and busy blocks.
   - Overlap algorithm: `max(start_a, start_b) < min(end_a, end_b)`.
   - Explains exact person, round, and time slot causing conflict.
3. **Right-Side Management Panel**:
   - Candidate details, requisition, time, status, meeting link with copy/join.
   - Actions: Reschedule, Cancel, Invitation Preview, Candidate Interview History.
4. **RFC 5545 iCalendar (.ics) Export**:
   - Generates standard `.ics` files for Google Calendar / Outlook import.
   - Email invitation preview with plaintext and HTML templates.
5. **Full Audit Trail**:
   - Logs scheduling, rescheduling (with reason), and cancellations.

---

### Standalone Execution
```bash
# Run standalone backend on port 8006:
python feature-modules/06-interview-scheduling/backend/interview_app.py

# Run standalone test suite:
pytest feature-modules/06-interview-scheduling/tests/
```
