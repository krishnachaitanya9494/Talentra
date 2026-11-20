import React from 'react';
import { Briefcase, MapPin, Clock, Users, Building, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const JDDetailModal = ({ isOpen, onClose, jd }) => {
  if (!jd) return null;

  const skillsList = jd.required_skills
    ? jd.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={jd.title}
      subtitle={`Requisition Code: ${jd.req_code} • Department: ${jd.department || 'Engineering'}`}
      maxWidth="max-w-3xl"
    >
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        {/* Quick Attribute Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand" size="md">
            <span className="capitalize">{jd.experience_level || 'Mid'} Level</span>
          </Badge>
          <Badge variant="emerald" size="md">
            <span className="capitalize">{jd.employment_type || 'Full Time'}</span>
          </Badge>
          <Badge variant="navy" size="md">
            <span>{jd.open_positions || 1} Opening(s)</span>
          </Badge>
          {jd.location && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{jd.location}</span>
            </span>
          )}
        </div>

        {/* Required Skills */}
        {skillsList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Target Skills & Technologies
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 text-brand-700 dark:text-brand-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full JD Content / Specification */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Job Specification & Details</span>
            </h4>
            {jd.source_file && (
              <span className="text-[11px] font-mono text-slate-400">
                Source: {jd.source_file}
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder font-sans text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {jd.full_text || jd.description}
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
