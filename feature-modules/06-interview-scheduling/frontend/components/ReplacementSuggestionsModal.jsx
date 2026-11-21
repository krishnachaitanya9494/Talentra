import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertTriangle, Sparkles, Check, Clock, Briefcase, ThumbsUp } from 'lucide-react';
import { interviewApi } from '../api';

export const ReplacementSuggestionsModal = ({
  isOpen,
  onClose,
  interview,
  currentInterviewerId,
  onReplacementSuccess,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReplacementId, setSelectedReplacementId] = useState(null);
  const [reason, setReason] = useState('Primary interviewer unavailable due to scheduling conflict');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isOpen && interview?.id) {
      loadSuggestions();
    }
  }, [isOpen, interview]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.getReplacementSuggestions(interview.id, currentInterviewerId);
      setSuggestions(data);
      if (data.length > 0) {
        setSelectedReplacementId(data[0].interviewer_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch replacement suggestions.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !interview) return null;

  const handleConfirmReplacement = async () => {
    if (!selectedReplacementId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await interviewApi.replaceInterviewer(interview.id, {
        old_interviewer_id: currentInterviewerId || (interview.panel && interview.panel[0]?.interviewer_id) || 1,
        new_interviewer_id: selectedReplacementId,
        reason,
        approved_by: 'Recruiter Lead',
      });
      setSuccessMessage('Interviewer replaced successfully with audit logging.');
      if (onReplacementSuccess) onReplacementSuccess(res);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to replace interviewer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#D9DEE8] dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9DEE8] dark:border-slate-800 flex items-center justify-between bg-[#F5F6FA] dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">
                Automatic Replacement Suggestions
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                F04 • Ranked alternative evaluators matching domain expertise and availability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Target Interview Context */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-[#D9DEE8] dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#172033] dark:text-white">{interview.candidate_name}</span>
              <span className="text-[#64748B] dark:text-slate-400 ml-2">({interview.round_name})</span>
            </div>
            <div className="font-mono text-[#4F46B8] dark:text-purple-400 font-semibold">
              {interview.interview_date} • {interview.start_time} - {interview.end_time}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Evaluating panel specialization, workload capacity, and calendar availability...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No alternative interviewers found with open slots at this specific time.
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-[#172033] dark:text-slate-200">
                Recommended Evaluators (Ranked by Match Score & Capacity)
              </div>
              {suggestions.map((s) => {
                const isSelected = selectedReplacementId === s.interviewer_id;
                const matchPct = Math.round(s.match_score * 100);
                return (
                  <div
                    key={s.interviewer_id}
                    onClick={() => setSelectedReplacementId(s.interviewer_id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#4F46B8] bg-[#4F46B8]/5 ring-1 ring-[#4F46B8]'
                        : 'border-[#D9DEE8] dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {s.interviewer_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033] dark:text-white flex items-center gap-2">
                          <span>{s.interviewer_name}</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {s.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {s.specialization}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {s.daily_count} / {s.max_daily_interviews} Today
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {matchPct}% Match
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {s.is_available ? 'Slot Open' : 'Has Buffer'}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#4F46B8] bg-[#4F46B8]' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Justification / Reason */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Reason for Replacement (Logged for Audit Compliance)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D9DEE8] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReplacement}
              disabled={submitting || !selectedReplacementId}
              className="px-4 py-2 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{submitting ? 'Approving...' : 'Approve & Replace Interviewer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
