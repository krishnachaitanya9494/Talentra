import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { getEmailTemplates, previewEmailTemplate, sendManualEmail } from '../../services/api';

/**
 * Mode A: Manual Candidate Email Review & Send Modal.
 *
 * Allows recruiters to select a template, review personalized variables,
 * edit subject/body, and explicitly confirm send.
 */
export const ManualEmailModal = ({
  isOpen,
  onClose,
  candidate,
  jdId,
  assignmentId,
  onSuccess,
}) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [renderingPreview, setRenderingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setSentResult(null);
      setError(null);
    }
  }, [isOpen, candidate]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await getEmailTemplates();
      const items = res.items || [];
      setTemplates(items);
      if (items.length > 0) {
        setSelectedTemplateId(items[0].id);
        renderPreview(items[0].id);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Unable to load email templates.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    renderPreview(templateId);
  };

  const renderPreview = async (templateId) => {
    if (!candidate || !templateId) return;
    try {
      setRenderingPreview(true);
      const res = await previewEmailTemplate({
        template_id: Number(templateId),
        candidate_id: candidate.id || candidate.candidate_id,
        jd_id: jdId ? Number(jdId) : null,
      });
      setSubject(res.rendered_subject);
      setBody(res.rendered_body);
    } catch (err) {
      console.error('Preview failed:', err);
    } finally {
      setRenderingPreview(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!candidate || !selectedTemplateId) return;

    try {
      setSending(true);
      setError(null);
      const res = await sendManualEmail({
        candidate_id: candidate.id || candidate.candidate_id,
        template_id: Number(selectedTemplateId),
        custom_subject: subject,
        custom_body: body,
        assignment_id: assignmentId,
        jd_id: jdId,
      });
      setSentResult(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      console.error('Send failed:', err);
      setError(err.response?.data?.detail || 'Failed to send recruitment email.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in text-xs">
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl max-w-2xl w-full border border-slate-200/80 dark:border-surface-darkBorder shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200/60 text-brand-600 dark:text-brand-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Review & Send Recruitment Email (Mode A)
              </h3>
              <p className="text-xs text-slate-500">
                Personalized direct outreach with explicit recruiter confirmation
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
          {sentResult ? (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Message Dispatched Successfully!</span>
              </div>
              <p className="text-xs">
                Delivered to: <strong>{sentResult.recipient_email}</strong>
              </p>
              <div className="p-3 bg-white/80 dark:bg-slate-900/40 rounded-xl space-y-1 font-mono text-[11px]">
                <div><span className="text-slate-400">Subject:</span> {sentResult.subject}</div>
                <div><span className="text-slate-400">Provider Msg ID:</span> {sentResult.provider_message_id}</div>
                <div><span className="text-slate-400">Sent At:</span> {new Date(sentResult.sent_at).toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Candidate Info Bar */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-surface-darkBorder flex items-center justify-between">
                <div>
                  <span className="font-bold text-navy-900 dark:text-white">
                    {candidate?.full_name || candidate?.candidate_name}
                  </span>
                  <span className="text-slate-400 ml-2">({candidate?.email})</span>
                </div>
                <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                  {candidate?.current_title || 'Candidate'}
                </span>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5 text-[11px]">
                  Select Outreach Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-navy-900 dark:text-white text-xs font-medium cursor-pointer"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Input */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1 text-[11px]">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-navy-900 dark:text-white text-xs font-semibold focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Message Body Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold uppercase tracking-wider text-slate-500 text-[11px]">
                    Message Body (Personalized Preview)
                  </label>
                  {renderingPreview && (
                    <span className="text-[10px] text-brand-500 animate-pulse">Personalizing variables...</span>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-navy-900 dark:text-white text-xs font-normal leading-relaxed focus:ring-1 focus:ring-brand-500 font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-400">
                  ⚡ Mode A: Delivers via authorized provider; records audit trail.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !subject || !body}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? 'Sending...' : 'Confirm & Send Email'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {sentResult && (
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

