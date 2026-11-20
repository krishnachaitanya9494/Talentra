import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  MapPin,
  Clock,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileText,
  Building,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { getParsedJD } from '../../services/api';

export const ParsedJDModal = ({ isOpen, onClose, jdDocId, jdTitle }) => {
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && jdDocId) {
      const fetchParsed = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await getParsedJD(jdDocId);
          setParsed(data);
        } catch (err) {
          setError(err.response?.data?.detail || err.message || 'Failed to parse Job Description requirements.');
        } finally {
          setLoading(false);
        }
      };
      fetchParsed();
    }
  }, [isOpen, jdDocId]);

  if (!isOpen) return null;

  const reqSkills = parsed?.required_skills
    ? parsed.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const prefSkills = parsed?.preferred_skills
    ? parsed.preferred_skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parsed ? parsed.job_title : jdTitle || 'Structured Job Specification'}
      subtitle={`Document Reference: ${jdDocId} • Extracted Requisition Requirements`}
      maxWidth="max-w-4xl"
    >
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            <span>Extracting structured job requirements & skills...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : parsed ? (
          <div className="space-y-6">
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Target Experience
                </span>
                <span className="font-bold text-navy-900 dark:text-slate-100 text-xs mt-1 block">
                  {parsed.min_experience_years !== null
                    ? `${parsed.min_experience_years}${parsed.max_experience_years ? ` - ${parsed.max_experience_years}` : '+'} Years`
                    : 'Not Specified'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Work Mode / Type
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1 block">
                  {parsed.work_mode || 'On-site'} • {parsed.employment_type || 'Full-time'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Location
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-xs mt-1 block truncate">
                  {parsed.location || 'Flexible / Global'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Extraction Confidence
                </span>
                <div className="mt-1">
                  <Badge variant="emerald" size="sm">
                    {(parsed.extraction_confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                </div>
              </div>
            </div>

            {/* Required Skills */}
            {reqSkills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Mandatory Technical Skills ({reqSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {reqSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred / Bonus Skills */}
            {prefSkills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Preferred / Bonus Skills ({prefSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {prefSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications & Certifications */}
            {(parsed.required_qualifications || parsed.certifications) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {parsed.required_qualifications && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Required Qualifications</span>
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{parsed.required_qualifications}</p>
                  </div>
                )}

                {parsed.certifications && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>Required / Preferred Certifications</span>
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{parsed.certifications}</p>
                  </div>
                )}
              </div>
            )}

            {/* Mandatory Requirements Section */}
            {parsed.mandatory_requirements && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Mandatory Requisition Prerequisites
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder font-sans text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {parsed.mandatory_requirements}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-surface-darkBorder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors cursor-pointer shadow-subtle"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
