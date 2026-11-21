import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { interviewApi } from '../api';

const ROUND_OPTIONS = [
  'Initial Screening',
  'Technical Round 1',
  'Technical Round 2',
  'Managerial Round',
  'HR Discussion',
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

export const EditInterviewModal = ({ isOpen, onClose, interview, onSuccess }) => {
  const [roundName, setRoundName] = useState('');
  const [mode, setMode] = useState('virtual_google_meet');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (interview && isOpen) {
      setRoundName(interview.round_name || 'Technical Round 1');
      setMode(interview.mode || 'virtual_google_meet');
      setLocationOrLink(interview.location_or_link || '');
      setInstructions(interview.instructions || '');
      setRecruiterNotes(interview.recruiter_notes || '');
      setStatus(interview.status || 'scheduled');
      setErrorMsg(null);
    }
  }, [interview, isOpen]);

  if (!isOpen || !interview) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      round_name: roundName,
      mode: mode,
      location_or_link: locationOrLink.trim() || undefined,
      instructions: instructions.trim() || undefined,
      recruiter_notes: recruiterNotes.trim() || undefined,
      status: status,
    };

    try {
      const updated = await interviewApi.updateInterview(interview.id, payload);
      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update interview details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46B8] dark:text-purple-300 flex items-center justify-center font-bold">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Interview Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                #{interview.interview_code} • {interview.candidate_name}
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Round Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Interview Round
            </label>
            <select
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4F46B8] focus:outline-none"
            >
              {ROUND_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Delivery Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4F46B8] focus:outline-none"
            >
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Link or Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Meeting URL or Location
            </label>
            <input
              type="text"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder="e.g. https://meet.google.com/xyz or Room 402"
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4F46B8] focus:outline-none"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Candidate Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions sent to candidate in invite..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4F46B8] focus:outline-none"
            />
          </div>

          {/* Recruiter Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Internal Recruiter Notes
            </label>
            <textarea
              rows={2}
              value={recruiterNotes}
              onChange={(e) => setRecruiterNotes(e.target.value)}
              placeholder="Evaluation focus, compensation notes..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4F46B8] focus:outline-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-white bg-[#4F46B8] hover:bg-[#3730A3] active:bg-indigo-900 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
