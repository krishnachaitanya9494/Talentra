import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import { Modal } from '../common/Modal';
import { manuallyCorrectCandidate } from '../../services/api';

export const ManualCorrectionModal = ({ isOpen, onClose, candidate, onCorrected }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_title: '',
    current_company: '',
    total_experience_years: '',
    location: '',
    skills: '',
    status: 'available',
    corrected_by: 'Recruiter Admin',
    correction_note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (candidate) {
      setFormData({
        first_name: candidate.first_name || '',
        last_name: candidate.last_name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        current_title: candidate.current_title || '',
        current_company: candidate.current_company || '',
        total_experience_years: candidate.total_experience_years !== null ? String(candidate.total_experience_years) : '',
        location: candidate.location || '',
        skills: candidate.skills || '',
        status: candidate.status || 'available',
        corrected_by: 'Recruiter Admin',
        correction_note: '',
      });
      setError(null);
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        current_title: formData.current_title.trim(),
        current_company: formData.current_company.trim(),
        total_experience_years: formData.total_experience_years ? parseFloat(formData.total_experience_years) : null,
        location: formData.location.trim(),
        skills: formData.skills.trim(),
        status: formData.status,
        corrected_by: formData.corrected_by.trim() || 'Recruiter Admin',
        correction_note: formData.correction_note.trim(),
      };

      const updated = await manuallyCorrectCandidate(candidate.id, payload);
      if (onCorrected) onCorrected(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to apply manual correction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Candidate Profile Correction"
      subtitle={`Correct extracted information for ${candidate.candidate_code} • Changes are recorded in Audit Trail`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="first_name"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="last_name"
              required
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Designation
            </label>
            <input
              type="text"
              name="current_title"
              value={formData.current_title}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Company / Employer
            </label>
            <input
              type="text"
              name="current_company"
              value={formData.current_company}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Experience (Years)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="50"
              name="total_experience_years"
              value={formData.total_experience_years}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Technical Skills (Comma-separated)
          </label>
          <textarea
            name="skills"
            rows={2}
            value={formData.skills}
            onChange={handleChange}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Corrected By
            </label>
            <input
              type="text"
              name="corrected_by"
              value={formData.corrected_by}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Correction Reason / Note
            </label>
            <input
              type="text"
              name="correction_note"
              placeholder="e.g. Verified from updated resume"
              value={formData.correction_note}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-surface-darkBorder">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-subtle"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{loading ? 'Saving Correction...' : 'Save & Log Audit Trail'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
