import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Clock,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { getMatchExplanation } from '../../services/api';

/**
 * Transparent, Explainable Candidate-to-JD Match Explanation Modal.
 *
 * Breaks down the 7 evaluation dimensions with evidence snippets,
 * matched vs missing skills, and mandatory mismatch alerts.
 */
export const MatchExplanationModal = ({ matchId, isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && matchId) {
      loadExplanation();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, matchId]);

  const loadExplanation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMatchExplanation(matchId);
      setData(res);
    } catch (err) {
      console.error('Failed to load match explanation:', err);
      setError('Unable to load match explanation details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getDimensionIcon = (dim) => {
    switch (dim) {
      case 'Required Skills':
      case 'Preferred Skills':
        return <Layers className="w-4 h-4 text-brand-500" />;
      case 'Experience':
        return <Clock className="w-4 h-4 text-indigo-500" />;
      case 'Role Relevance':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'Qualifications':
        return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      case 'Certifications':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'Location Compatibility':
        return <MapPin className="w-4 h-4 text-rose-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-brand-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed_match':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Confirmed Match</span>
          </span>
        );
      case 'partial_match':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/80">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Partial Match</span>
          </span>
        );
      case 'confirmed_mismatch':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/80">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Critical Mismatch</span>
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Unconfirmed / Neutral</span>
          </span>
        );
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300';
    if (score >= 65) return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-300';
    if (score >= 45) return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-300';
    return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-300';
  };

  const getSegmentVariant = (segment) => {
    switch (segment) {
      case 'Strong Match': return 'emerald';
      case 'Potential Match': return 'blue';
      case 'Partial Match': return 'amber';
      case 'Not Suitable': return 'rose';
      default: return 'neutral';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl max-w-3xl w-full border border-slate-200/80 dark:border-surface-darkBorder shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200/60 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                Match Intelligence Explanation
              </h3>
              <p className="text-xs text-slate-500">
                Transparent 7-dimension scoring breakdown & verifiable evidence snippets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Sparkles className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-500" />
              <p className="font-medium text-sm">Evaluating match evidence...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Critical Mismatch Banner */}
              {data.has_critical_mismatch && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-100">
                      Confirmed Critical Mismatch
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                      This candidate failed a non-negotiable mandatory requirement (e.g. 0 matching required skills or severe experience deficit). Optional criteria cannot override this finding.
                    </p>
                  </div>
                </div>
              )}

              {/* Candidate Summary Header Card */}
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-surface-darkBorder flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                    {data.candidate_name}
                  </h4>
                  <p className="text-slate-500 mt-0.5">
                    {data.current_title || 'Software Professional'} • {data.experience ? `${data.experience} yrs experience` : 'Exp unstated'} • {data.location || 'Location unstated'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Overall Score
                    </span>
                    <span className={`text-xl font-extrabold px-3 py-0.5 rounded-xl border ${getScoreBadgeClass(data.overall_score)}`}>
                      {data.overall_score} / 100
                    </span>
                  </div>
                  <Badge variant={getSegmentVariant(data.segment)} size="md">
                    {data.segment}
                  </Badge>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-2">
                    Matched Skills ({data.matched_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.matched_skills.length > 0 ? (
                      data.matched_skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80"
                        >
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">None verified</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-2">
                    Missing Skills ({data.missing_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.missing_skills.length > 0 ? (
                      data.missing_skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80"
                        >
                          ✕ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-emerald-600 font-semibold">Zero missing skills!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 7 Dimensions Evidence List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Dimension Evaluation & Verifiable Evidence
                </h4>
                <div className="space-y-2.5">
                  {data.evidences.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/70 dark:border-surface-darkBorder hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {getDimensionIcon(ev.dimension)}
                          <span className="font-bold text-navy-900 dark:text-white">
                            {ev.dimension}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (Weight: {Math.round(ev.weight * 100)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-navy-900 dark:text-white text-xs">
                            {ev.score} pts
                          </span>
                          {getStatusBadge(ev.status)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 pl-6 border-l-2 border-slate-100 dark:border-surface-darkBorder">
                        {ev.evidence_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Completeness Footer */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs">
                <span>Profile Data Completeness:</span>
                <span className="font-bold text-navy-900 dark:text-white">
                  {data.data_completeness}% verified
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-navy-900 dark:text-slate-100 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
