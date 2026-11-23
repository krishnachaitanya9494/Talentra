import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Briefcase,
  Video,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { interviewApi } from '../api';

const ROUND_OPTIONS = [
  'Initial Screening',
  'Technical Round 1',
  'Technical Round 2',
  'System Design Round',
  'Managerial Round',
  'HR Round',
  'Final Discussion',
  'Client Evaluation',
];

const MODE_OPTIONS = [
  { value: 'virtual_google_meet', label: 'Google Meet', icon: Video },
  { value: 'virtual_ms_teams', label: 'Microsoft Teams', icon: Video },
  { value: 'virtual_zoom', label: 'Zoom Video', icon: Video },
  { value: 'in_person', label: 'In-Person / Office', icon: MapPin },
  { value: 'phone', label: 'Phone Interview', icon: Clock },
];

export const AddInterviewModal = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  defaultStartTime = '10:00',
  defaultInterviewerId = null,
  interviewers = [],
}) => {
  const [candidates, setCandidates] = useState([]);
  const [jds, setJds] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [internalInterviewers, setInternalInterviewers] = useState(interviewers || []);

  // Form states
  const [candidateId, setCandidateId] = useState('');
  const [jdId, setJdId] = useState('');
  const [roundName, setRoundName] = useState('Technical Round 1');
  const [interviewDate, setInterviewDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState('11:00');
  const [timezone, setTimezone] = useState('UTC');
  const [mode, setMode] = useState('virtual_google_meet');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [instructions, setInstructions] = useState('Please join with video enabled and a quiet workspace.');
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState(
    defaultInterviewerId ? [defaultInterviewerId] : []
  );

  // Sync / fetch interviewers
  useEffect(() => {
    if (interviewers && interviewers.length > 0) {
      setInternalInterviewers(interviewers);
      if (selectedInterviewerIds.length === 0) {
        setSelectedInterviewerIds([defaultInterviewerId || interviewers[0].id]);
      }
    } else if (isOpen) {
      interviewApi.getInterviewers().then((data) => {
        if (data && data.length > 0) {
          setInternalInterviewers(data);
          if (selectedInterviewerIds.length === 0) {
            setSelectedInterviewerIds([defaultInterviewerId || data[0].id]);
          }
        }
      }).catch((err) => console.error('Failed fetching interviewers', err));
    }
  }, [interviewers, isOpen, defaultInterviewerId]);

  // Availability & conflict state
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load candidates and JDs on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingLookups(true);

    Promise.all([
      interviewApi.getCandidates(),
      interviewApi.getJobRequisitions(),
    ])
      .then(([candData, jdData]) => {
        if (!isMounted) return;
        setCandidates(candData);
        setJds(jdData);
        if (candData.length > 0 && !candidateId) {
          setCandidateId(candData[0].id);
        }
        if (jdData.length > 0 && !jdId) {
          setJdId(jdData[0].id);
        }
        if (defaultInterviewerId && selectedInterviewerIds.length === 0) {
          setSelectedInterviewerIds([defaultInterviewerId]);
        }
      })
      .catch((err) => {
        console.error('Failed loading lookup options', err);
      })
      .finally(() => {
        if (isMounted) setLoadingLookups(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync defaultDate / defaultStartTime
  useEffect(() => {
    if (defaultDate) setInterviewDate(defaultDate);
    if (defaultStartTime) {
      setStartTime(defaultStartTime);
      // set end time 1 hour later
      const [h, m] = defaultStartTime.split(':').map(Number);
      const endH = String(Math.min(h + 1, 23)).padStart(2, '0');
      setEndTime(`${endH}:${String(m).padStart(2, '0')}`);
    }
  }, [defaultDate, defaultStartTime]);

  // Real-time conflict validation whenever times/interviewers change
  useEffect(() => {
    if (!isOpen || !interviewDate || !startTime || !endTime) return;
    if (selectedInterviewerIds.length === 0 && !candidateId) return;

    let isCancelled = false;
    setCheckingAvailability(true);
    setErrorMsg(null);

    interviewApi.checkAvailability({
      interview_date: interviewDate,
      start_time: startTime,
      end_time: endTime,
      candidate_id: candidateId ? Number(candidateId) : null,
      interviewer_ids: selectedInterviewerIds,
    })
      .then((res) => {
        if (!isCancelled) {
          setAvailabilityResult(res);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Availability check failed', err);
        }
      })
      .finally(() => {
        if (!isCancelled) setCheckingAvailability(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, interviewDate, startTime, endTime, candidateId, selectedInterviewerIds]);

  if (!isOpen) return null;

  const toggleInterviewer = (id) => {
    if (selectedInterviewerIds.includes(id)) {
      setSelectedInterviewerIds(selectedInterviewerIds.filter((x) => x !== id));
    } else {
      setSelectedInterviewerIds([...selectedInterviewerIds, id]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!candidateId) {
      setErrorMsg('Please select a candidate.');
      return;
    }
    if (selectedInterviewerIds.length === 0) {
      setErrorMsg('Please assign at least one interviewer to the panel.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const selectedCand = candidates.find((c) => String(c.id) === String(candidateId));
    const selectedJd = jds.find((j) => String(j.id) === String(jdId));

    const candName = selectedCand
      ? (selectedCand.full_name || `${selectedCand.first_name || ''} ${selectedCand.last_name || ''}`.trim() || selectedCand.name)
      : undefined;

    const payload = {
      candidate_id: Number(candidateId),
      candidate_name: candName,
      candidate_email: selectedCand?.email,
      jd_id: jdId ? Number(jdId) : null,
      jd_title: selectedJd?.title || selectedJd?.job_title,
      round_name: roundName,
      interview_type: roundName.toLowerCase().includes('hr') ? 'behavioral' : 'technical',
      interview_date: interviewDate,
      start_time: startTime,
      end_time: endTime,
      timezone: timezone,
      mode: mode,
      location_or_link: locationOrLink.trim() || undefined,
      instructions: instructions.trim() || undefined,
      recruiter_notes: recruiterNotes.trim() || undefined,
      panel_interviewer_ids: selectedInterviewerIds,
    };

    try {
      const created = await interviewApi.scheduleInterview(payload);
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to schedule interview.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Schedule Candidate Interview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign panel members, check real-time availability, and coordinate timetables.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Availability Conflict Notice (Informative, non-blocking) */}
          {availabilityResult && !availabilityResult.is_available && availabilityResult.conflicts?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Availability Notice ({availabilityResult.conflicts.length} warning{availabilityResult.conflicts.length > 1 ? 's' : ''}):</span>
              </div>
              <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 pl-5 list-disc">
                {availabilityResult.conflicts.map((c, i) => (
                  <li key={i}>
                    <strong>{c.person_name}</strong>: {c.reason || 'Has conflicting session'} ({c.conflict_time})
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                Note: You can still proceed to schedule this interview if needed.
              </p>
            </div>
          )}

          {availabilityResult && availabilityResult.is_available && selectedInterviewerIds.length > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>All selected interviewers and the candidate are available for this time window.</span>
            </div>
          )}

          {/* Row 1: Candidate & Requisition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Candidate *
              </label>
              <div className="relative">
                <select
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  className="w-full text-xs py-2 px-3 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">Select Candidate from Repository...</option>
                  {candidates.map((cand) => {
                    const cName = cand.full_name || `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Candidate';
                    const cTitle = cand.current_title || cand.current_designation || 'Candidate';
                    return (
                      <option key={cand.id} value={cand.id}>
                        {cName} ({cTitle} — {cand.email || 'No email'})
                      </option>
                    );
                  })}
                </select>
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Job Requisition
              </label>
              <div className="relative">
                <select
                  value={jdId}
                  onChange={(e) => setJdId(e.target.value)}
                  className="w-full text-xs py-2 px-3 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select Requisition...</option>
                  {jds.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title || j.job_title || j.req_code} ({j.client_name || 'Talentra'})
                    </option>
                  ))}
                </select>
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Round & Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interview Round *
              </label>
              <select
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {ROUND_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interview Delivery Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {MODE_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Date, Start Time, End Time, Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Zone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="UTC">UTC (Coordinated Universal)</option>
                <option value="Asia/Kolkata">IST (UTC +5:30)</option>
                <option value="America/New_York">EST (UTC -5:00)</option>
                <option value="America/Los_Angeles">PST (UTC -8:00)</option>
                <option value="Europe/London">GMT / BST (London)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Meeting Link or Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meeting URL or Room Location
            </label>
            <input
              type="text"
              placeholder="e.g. https://meet.google.com/abc-defg-hij or Conference Room 3B"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Row 5: Multi-Interviewer Panel Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                Select Evaluation Panel Members ({selectedInterviewerIds.length} assigned)
              </label>
              <span className="text-[11px] text-slate-400">
                Click to add/remove interviewers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {(internalInterviewers || []).map((inv) => {
                const isSelected = selectedInterviewerIds.includes(inv.id);
                const invName = inv.full_name || inv.name || `Recruiter ${inv.id}`;
                const initials = invName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={inv.id}
                    onClick={() => toggleInterviewer(inv.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition select-none ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-brand-700 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{invName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {inv.role || 'Evaluator'} {inv.specialization ? `• ${inv.specialization}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {inv.scheduled_count || 0} scheduled
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 6: Candidate Instructions & Recruiter Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Candidate Instructions (Included in invite)
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions sent to the candidate..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Private Recruiter Notes (Internal only)
              </label>
              <textarea
                rows={2}
                value={recruiterNotes}
                onChange={(e) => setRecruiterNotes(e.target.value)}
                placeholder="Focus areas, salary expectations, or screening notes..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {checkingAvailability ? 'Checking availability...' : 'Conflict detection active'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || !candidateId || selectedInterviewerIds.length === 0}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-700 hover:bg-brand-800 active:bg-brand-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {submitting ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
