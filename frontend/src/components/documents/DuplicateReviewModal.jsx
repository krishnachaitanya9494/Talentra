import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  GitMerge,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Mail,
  Phone,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { getDuplicateCandidates, mergeCandidates } from '../../services/api';

export const DuplicateReviewModal = ({ isOpen, onClose, onMerged }) => {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mergingId, setMergingId] = useState(null);
  const [error, setError] = useState(null);
  const [mergeSuccess, setMergeSuccess] = useState(null);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDuplicateCandidates();
      setDuplicates(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to scan candidate duplicates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDuplicates();
      setMergeSuccess(null);
    }
  }, [isOpen]);

  const handleMerge = async (pair) => {
    const primaryId = pair.candidate_a.id;
    const secondaryId = pair.candidate_b.id;
    try {
      setMergingId(secondaryId);
      setError(null);
      const res = await mergeCandidates({
        primary_candidate_id: primaryId,
        secondary_candidate_id: secondaryId,
        merged_by: 'Recruiter Admin',
      });
      setMergeSuccess(res.message);
      // Remove merged pair from list
      setDuplicates((prev) =>
        prev.filter(
          (p) =>
            !(
              (p.candidate_a.id === primaryId && p.candidate_b.id === secondaryId) ||
              (p.candidate_a.id === secondaryId && p.candidate_b.id === primaryId)
            )
        )
      );
      if (onMerged) onMerged();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to merge candidates.');
    } finally {
      setMergingId(null);
    }
  };

  const dismissPair = (index) => {
    setDuplicates((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Review & Resolution Hub"
      subtitle="Detects candidates sharing normalized emails or phone numbers. Safely consolidate duplicates with full provenance"
      maxWidth="max-w-4xl"
    >
      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        {mergeSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mergeSuccess}</span>
            </div>
            <button onClick={() => setMergeSuccess(null)} className="font-bold text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            <span>Scanning candidate database for duplicate identities...</span>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Zero Unresolved Duplicate Candidates Found
            </p>
            <p className="text-slate-400">
              All candidate profiles in the database have distinct normalized email addresses and phone numbers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{duplicates.length} duplicate cluster(s) detected</span>
              <span className="text-[11px] text-slate-400">
                Merging transfers all linked resumes and audit records to Primary profile.
              </span>
            </div>

            <div className="space-y-3.5">
              {duplicates.slice(0, 20).map((pair, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3"
                >
                  {/* Match Type Banner */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-surface-darkBorder">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {pair.match_type === 'EXACT_EMAIL'
                          ? 'Exact Email Match'
                          : pair.match_type === 'EXACT_PHONE'
                          ? 'Exact 10-Digit Phone Match'
                          : 'High Name Similarity Match'}
                      </span>
                      <span className="font-mono text-[11px] bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                        Matched: {pair.matched_field}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {(pair.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Candidate A (Primary) */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-surface-darkBorder space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                          {pair.candidate_a.candidate_code}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Primary Candidate</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{pair.candidate_a.name}</p>
                      <p className="text-slate-600 dark:text-slate-400 truncate">{pair.candidate_a.title || 'Engineer'}</p>
                      <p className="font-mono text-[11px] text-slate-500 truncate">{pair.candidate_a.email}</p>
                      <p className="font-mono text-[11px] text-slate-500">{pair.candidate_a.phone || '-'}</p>
                    </div>

                    {/* Candidate B (Duplicate to merge) */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-surface-darkBorder space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {pair.candidate_b.candidate_code}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Secondary Candidate</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{pair.candidate_b.name}</p>
                      <p className="text-slate-600 dark:text-slate-400 truncate">{pair.candidate_b.title || 'Engineer'}</p>
                      <p className="font-mono text-[11px] text-slate-500 truncate">{pair.candidate_b.email}</p>
                      <p className="font-mono text-[11px] text-slate-500">{pair.candidate_b.phone || '-'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => dismissPair(idx)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Keep Separate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMerge(pair)}
                      disabled={mergingId === pair.candidate_b.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-subtle"
                    >
                      {mergingId === pair.candidate_b.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <GitMerge className="w-3.5 h-3.5" />
                      )}
                      <span>Merge into {pair.candidate_a.candidate_code}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-surface-darkBorder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors cursor-pointer shadow-subtle"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
