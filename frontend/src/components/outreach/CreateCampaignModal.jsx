import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Users,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import axios from 'axios';

/**
 * CreateCampaignModal Component.
 *
 * Wizard to create an automated outreach campaign (Mode B).
 * Allows recruiters to configure target JD, segment criteria, and template,
 * then submit for explicit manager approval or save as draft.
 * Never initiates automatic sending without approval.
 */
export default function CreateCampaignModal({
  isOpen,
  onClose,
  onCreated,
  initialJdId = null,
}) {
  const [jds, setJds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [campaignName, setCampaignName] = useState('');
  const [selectedJdId, setSelectedJdId] = useState(initialJdId || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [targetSegment, setTargetSegment] = useState('Strong Match');
  const [submitForApproval, setSubmitForApproval] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialJdId) {
      setSelectedJdId(initialJdId);
    }
  }, [initialJdId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jdRes, tempRes] = await Promise.all([
        axios.get('/api/documents/jds'),
        axios.get('/api/v1/outreach/templates'),
      ]);

      const jdList = jdRes.data.items || jdRes.data || [];
      const tempList = tempRes.data.items || [];

      setJds(jdList);
      setTemplates(tempList);

      if (jdList.length > 0 && !selectedJdId) {
        setSelectedJdId(jdList[0].doc_id || jdList[0].id);
      }
      if (tempList.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(tempList[0].id);
      }
    } catch (err) {
      console.error('Failed to load campaign metadata:', err);
      setError('Could not fetch requisitions or email templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      setError('Please provide a campaign name.');
      return;
    }
    if (!selectedJdId) {
      setError('Please select a target Job Requisition.');
      return;
    }
    if (!selectedTemplateId) {
      setError('Please choose an email template.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Find integer id of JD if selected by doc_id
      const chosenJd = jds.find((j) => j.doc_id === selectedJdId || j.id === selectedJdId);
      const jdDatabaseId = chosenJd?.id || chosenJd?.doc_id;

      await axios.post('/api/v1/outreach/campaigns', {
        name: campaignName.trim(),
        jd_id: jdDatabaseId,
        template_id: parseInt(selectedTemplateId, 10),
        target_segment: targetSegment,
        mode: 'mode_b',
        submit_for_approval: submitForApproval,
      });

      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      console.error('Campaign creation failed:', err);
      setError(err.response?.data?.detail || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-surface-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">
                Create Outreach Campaign
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mode B &bull; Automated campaign requiring explicit manager approval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Campaign Name
            </label>
            <input
              type="text"
              required
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Q4 Senior Java Engineers Outreach Wave 1"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Target Job Requisition */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Target Job Requisition
            </label>
            <select
              value={selectedJdId}
              onChange={(e) => setSelectedJdId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            >
              {jds.map((jd) => (
                <option key={jd.id || jd.doc_id} value={jd.doc_id || jd.id}>
                  {jd.original_filename || jd.title || `Job Description #${jd.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Segment & Template Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" /> Target Match Tier
              </label>
              <select
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              >
                <option value="Strong Match">Strong Match (High Priority)</option>
                <option value="Potential Match">Potential Match</option>
                <option value="Partial Match">Partial Match</option>
                <option value="All">All Matched Candidates</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Email Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Safety & Compliance Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <span className="font-semibold block">Recruitment Guardrails Active:</span>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400/90">
                Mode B campaigns automatically suppress duplicate outreach, validate email format, filter opt-out candidates, and pause until approved by an authorized recruitment manager.
              </p>
            </div>
          </div>

          {/* Approval toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="approval-check"
              checked={submitForApproval}
              onChange={(e) => setSubmitForApproval(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="approval-check" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Submit directly for <span className="text-emerald-600 font-semibold">Manager Approval</span> upon creation
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-surface-darkBorder flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {submitForApproval ? 'Submit Campaign for Approval' : 'Save as Draft'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
