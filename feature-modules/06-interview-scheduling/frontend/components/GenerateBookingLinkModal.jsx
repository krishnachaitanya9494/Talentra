import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Copy, Check, AlertCircle, Link2, Users } from 'lucide-react';
import { interviewApi } from '../api';

export const GenerateBookingLinkModal = ({ isOpen, onClose, interviewers = [], candidates = [] }) => {
  const [candidateId, setCandidateId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jdTitle, setJdTitle] = useState('Senior Full Stack Engineer');
  const [roundName, setRoundName] = useState('Technical Round 1');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState([]);
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
  const [expirationDays, setExpirationDays] = useState(7);

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

  useEffect(() => {
    if (interviewers.length > 0 && selectedInterviewerIds.length === 0) {
      setSelectedInterviewerIds([interviewers[0].id]);
    }
  }, [interviewers, selectedInterviewerIds]);

  if (!isOpen) return null;

  const toggleInterviewer = (id) => {
    setSelectedInterviewerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (selectedInterviewerIds.length === 0) {
      setError('Please select at least one panel interviewer.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await interviewApi.createBookingLink({
        candidate_id: Number(candidateId) || 1,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        jd_title: jdTitle,
        round_name: roundName,
        duration_minutes: Number(durationMinutes),
        interviewer_ids: selectedInterviewerIds,
        start_date: startDate,
        end_date: endDate,
        expiration_days: Number(expirationDays),
      });

      const fullUrl = `${window.location.origin}/candidate-booking/${res.token}`;
      setGeneratedLink(fullUrl);
    } catch (err) {
      setError(err.message || 'Failed to create candidate self-booking link.');
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
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">
                Generate Self-Booking Link
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                F03 • Allow candidate to select from real-time mutual openings
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
            <div className="space-y-4 p-5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 text-[#4F46B8] dark:text-purple-300 font-bold text-sm">
                <Check className="w-5 h-5" />
                <span>Self-Booking Link Ready!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                The candidate can open this link, see live available 60-minute time slots where all selected panel members are free, and select their preferred slot.
              </p>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#D9DEE8] dark:border-slate-700 rounded-xl p-2.5">
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
                <span>Real-time double-booking prevention • Atomic slot locking</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Candidate */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Candidate
                </label>
                {candidates.length > 0 ? (
                  <select
                    value={candidateId}
                    onChange={(e) => {
                      setCandidateId(e.target.value);
                      const c = candidates.find((x) => String(x.id) === String(e.target.value));
                      if (c) {
                        setCandidateName(c.full_name || c.name);
                        setCandidateEmail(c.email || '');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
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
                    placeholder="Candidate Name"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                )}
              </div>

              {/* Panel Interviewers Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                  Panel Interviewers (slots will be calculated based on their mutual free time)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-[#D9DEE8] dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  {interviewers.map((inv) => {
                    const isSelected = selectedInterviewerIds.includes(inv.id);
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => toggleInterviewer(inv.id)}
                        className={`p-2 rounded-lg text-left border text-xs transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#4F46B8]/10 border-[#4F46B8] text-[#4F46B8] font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{inv.full_name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Round & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Round Name
                  </label>
                  <input
                    type="text"
                    value={roundName}
                    onChange={(e) => setRoundName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172033] dark:text-white"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
              </div>

              {/* Date Window */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1">
                    Start Window Date
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
                    End Window Date
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

              {/* Footer */}
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
                  <span>{loading ? 'Creating...' : 'Create Self-Booking Link'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
