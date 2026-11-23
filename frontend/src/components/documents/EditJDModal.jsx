import React, { useState } from 'react';
import { X, Save, Edit3, AlertCircle } from 'lucide-react';
import { updateStructuredJD } from '../../services/api';

export const EditJDModal = ({ isOpen, onClose, jd, onSaved }) => {
  if (!isOpen || !jd) return null;

  const [title, setTitle] = useState(jd.title || '');
  const [department, setDepartment] = useState(jd.department || 'Engineering & Delivery');
  const [location, setLocation] = useState(jd.location || 'Hyderabad / Remote');
  const [skills, setSkills] = useState(jd.skills || jd.required_skills || '');
  const [status, setStatus] = useState(jd.status || 'open');
  const [description, setDescription] = useState(jd.description || '');
  const [changeSummary, setChangeSummary] = useState('Recruiter manual specification refinement');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await updateStructuredJD(jd.id, {
        title,
        department,
        location,
        status,
        required_skills: skills,
        description,
        author: 'Krishna Chaitanya (Recruiter Admin)',
        change_summary: changeSummary,
      });
      if (onSaved) onSaved(res);
      onClose();
    } catch (err) {
      console.error('Failed to update JD:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Edit Requisition — <span className="font-mono tabular-nums">{jd.req_code || `REQ-${jd.id}`}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Specification update creates a new version audit snapshot.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Job title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Department *
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hyderabad / Remote"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Requisition status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="open">Open (Active)</option>
                <option value="interviewing">Interviewing</option>
                <option value="on_hold">On Hold</option>
                <option value="filled">Filled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Technical skills (Comma separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Oracle PBCS, Hyperion, Essbase, Calculation Manager"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Job description & scope
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Audit change summary
            </label>
            <input
              type="text"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium cursor-pointer shadow-2xs disabled:opacity-40 transition-colors duration-150"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Requisition'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
