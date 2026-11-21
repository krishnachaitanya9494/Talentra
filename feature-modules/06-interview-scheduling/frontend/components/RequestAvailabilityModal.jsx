import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, Calendar, Clock, AlertCircle, Link2, Sparkles } from 'lucide-react';
import { interviewApi } from '../api';

export const RequestAvailabilityModal = ({ isOpen, onClose, candidates = [] }) => {
  const [candidateId, setCandidateId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jdTitle, setJdTitle] = useState('Senior Full Stack Engineer');
  const [roundName, setRoundName] = useState('Technical Assessment');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [preferredStartTime, setPreferredStartTime] = useState('09:00');
  const [preferredEndTime, setPreferredEndTime] = useState('17:00');
  const [instructions, setInstructions] = useState('Please select at least 3 preferred 1-hour time windows when you will be available for video interview.');
  const [expirationDays, setExpirationDays] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (candidates.length > 0 && !candidateId) {
      setCandidateId(String(candidates[0].id));
      setCandidateName(candidates[0].full_name || candidates[0].name || '');
      setCandidateEmail(candidates[0].email || '');
    }
  }, [candidates, candidateId]);

  if (!isOpen) return null;

  const handleCandidateChange = (cId) => {
    setCandidateId(cId);
    const cand = candidates.find((c) => String(c.id) === String(cId));
    if (cand) {
      setCandidateName(cand.full_name || cand.name || '');
      setCandidateEmail(cand.email || '');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await interviewApi.createAvailabilityRequest({
        candidate_id: Number(candidateId) || 1,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        jd_title: jdTitle,
        round_name: roundName,
        start_date_range: startDate,
        end_date_range: endDate,
        preferred_start_time: preferredStartTime,
        preferred_end_time: preferredEndTime,
        instructions,
        expiration_days: Number(expirationDays),
      });

      const fullUrl = `${window.location.origin}/candidate-availability/${res.token}`;
      setGeneratedLink(fullUrl);
    } catch (err) {
      setError(err.message || 'Failed to create availability request.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setGeneratedLink('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#D9DEE8] dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9DEE8] dark:border-slate-800 flex items-center justify-between bg-[#F5F6FA] dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4F46B8]/10 text-[#4F46B8] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">
                Request Candidate Availability
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                F01 • Generate secure candidate self-scheduling link
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {generatedLink ? (
            <div className="space-y-4 p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Availability Link Generated Successfully!</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Share this secure tokenized link with the candidate. They can submit their available time slots without logging in.
              </p>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="bg-transparent text-xs text-[#172033] dark:text-white flex-1 font-mono outline-hidden select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-[#4F46B8] text-white text-xs font-semibold hover:bg-[#3730A3] transition flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="text-[11px] text-[#64748B] dark:text-slate-400 flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Link expires in {expirationDays} days • One-time cryptographic token</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Candidate Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Candidate
                </label>
                {candidates.length > 0 ? (
                  <select
                    value={candidateId}
                    onChange={(e) => handleCandidateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#4F46B8]"
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name || c.name} {c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Candidate Full Name"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                )}
              </div>

              {/* Target Role & Round */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Job Requisition
                  </label>
                  <input
                    type="text"
                    value={jdTitle}
                    onChange={(e) => setJdTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Interview Round
                  </label>
                  <input
                    type="text"
                    value={roundName}
                    onChange={(e) => setRoundName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
              </div>

              {/* Date Range Window */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Earliest Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Latest Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
              </div>

              {/* Daily Hours Window */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Daily Window Start
                  </label>
                  <input
                    type="time"
                    value={preferredStartTime}
                    onChange={(e) => setPreferredStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Daily Window End
                  </label>
                  <input
                    type="time"
                    value={preferredEndTime}
                    onChange={(e) => setPreferredEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Candidate Prompt & Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D9DEE8] dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{loading ? 'Generating...' : 'Generate Availability Link'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
