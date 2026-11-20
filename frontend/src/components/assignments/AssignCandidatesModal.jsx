import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { getTADirectory, assignCandidatesToTA } from '../../services/api';

/**
 * Manual Candidate Distribution Modal for TALENTRA Phase 4.
 *
 * Allows Recruitment Managers to assign single or bulk candidates
 * against a Job Description to an individual Talent Acquisition Specialist.
 */
export const AssignCandidatesModal = ({
  isOpen,
  onClose,
  candidateIds = [],
  jdId,
  jdTitle,
  onSuccess,
}) => {
  const [tas, setTas] = useState([]);
  const [selectedTaId, setSelectedTaId] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingTas, setLoadingTas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTas();
      setResult(null);
      setError(null);
      setNotes('');
    }
  }, [isOpen]);

  const loadTas = async () => {
    try {
      setLoadingTas(true);
      const res = await getTADirectory();
      const items = res.items || [];
      setTas(items);
      if (items.length > 0 && !selectedTaId) {
        setSelectedTaId(items[0].id);
      }
    } catch (err) {
      console.error('Failed to load TA directory:', err);
      setError('Unable to load Talent Acquisition Specialist directory.');
    } finally {
      setLoadingTas(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTaId || !jdId || candidateIds.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await assignCandidatesToTA(
        candidateIds,
        Number(jdId),
        Number(selectedTaId),
        notes.trim() || null,
      );
      setResult(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      console.error('Assignment failed:', err);
      setError(err.response?.data?.detail || 'Assignment operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in text-xs">
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl max-w-lg w-full border border-slate-200/80 dark:border-surface-darkBorder shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200/60 text-brand-600 dark:text-brand-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Manual Candidate Assignment
              </h3>
              <p className="text-xs text-slate-500">
                Distribute selected candidate profiles to a Talent Acquisition Specialist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {result ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Assignment Confirmed!</span>
              </div>
              <p className="text-xs">
                Assigned to: <strong className="font-semibold">{result.ta_name}</strong>
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-2 bg-white/70 dark:bg-slate-900/40 rounded-lg">
                  <span className="block font-bold text-base text-emerald-700">{result.assigned_count}</span>
                  <span className="text-[10px] text-slate-500">New Assigned</span>
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-900/40 rounded-lg">
                  <span className="block font-bold text-base text-blue-700">{result.reassigned_count}</span>
                  <span className="text-[10px] text-slate-500">Reassigned</span>
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-900/40 rounded-lg">
                  <span className="block font-bold text-base text-amber-700">{result.skipped_duplicates}</span>
                  <span className="text-[10px] text-slate-500">Duplicates Skipped</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAssign} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Assignment Scope Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-surface-darkBorder">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Selected Candidates
                  </span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">
                    {candidateIds.length} Profile{candidateIds.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-navy-900 dark:text-slate-100 font-medium truncate">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{jdTitle || `Requisition ID: ${jdId}`}</span>
                </div>
              </div>

              {/* Select TA */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5 text-[11px]">
                  Choose Talent Acquisition Specialist
                </label>
                {loadingTas ? (
                  <div className="p-4 text-center text-slate-400">Loading TA directory...</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {tas.map((ta) => (
                      <label
                        key={ta.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          Number(selectedTaId) === ta.id
                            ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/30'
                            : 'border-slate-200 dark:border-surface-darkBorder hover:bg-slate-50/80'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedTa"
                          value={ta.id}
                          checked={Number(selectedTaId) === ta.id}
                          onChange={(e) => setSelectedTaId(e.target.value)}
                          className="mt-1 text-brand-600 focus:ring-brand-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-navy-900 dark:text-white">
                              {ta.full_name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                              {ta.active_assignments} active
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {ta.team} • {ta.technical_specialization}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5 text-[11px]">
                  Internal Assignment Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. High priority requisition; please focus on candidates with strong Kubernetes experience."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-navy-900 dark:text-white text-xs focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedTaId || candidateIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{submitting ? 'Assigning...' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {result && (
          <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 dark:border-surface-darkBorder bg-slate-50/50">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
