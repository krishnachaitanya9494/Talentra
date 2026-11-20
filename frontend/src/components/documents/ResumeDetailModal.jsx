import React from 'react';
import { User, Mail, Phone, MapPin, Briefcase, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const ResumeDetailModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  const skillsList = candidate.skills
    ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${candidate.first_name} ${candidate.last_name}`}
      subtitle={`Candidate Code: ${candidate.candidate_code} • ${candidate.current_title || 'Software Engineer'}`}
      maxWidth="max-w-3xl"
    >
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        {/* Profile Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Experience</span>
            <span className="font-bold text-navy-900 dark:text-slate-100 text-sm mt-0.5 block">
              {candidate.total_experience_years ? `${candidate.total_experience_years} Years` : 'Not specified'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block truncate">
              {candidate.location || 'India'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] mt-0.5 block truncate" title={candidate.email}>
              {candidate.email}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
              {candidate.phone || 'Available in Resume'}
            </span>
          </div>
        </div>

        {/* Skills */}
        {skillsList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Verified Skills & Tools
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Resume Extracted Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Full Extracted Resume Content</span>
            </h4>
            {candidate.resume_filename && (
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs" title={candidate.resume_filename}>
                File: {candidate.resume_filename}
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto select-text">
            {candidate.full_text || candidate.summary || 'Resume content loaded.'}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-surface-darkBorder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors cursor-pointer shadow-subtle"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
