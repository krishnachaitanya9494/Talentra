import React, { useState, useEffect } from 'react';
import { X, Mail, Download, Copy, Check, Info, Calendar } from 'lucide-react';
import { interviewApi } from '../api';

export const InvitationPreviewModal = ({
  isOpen,
  onClose,
  interview,
}) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !interview) return;
    setLoading(true);
    interviewApi.getInvitationPreview(interview.id)
      .then((data) => setPreview(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, interview]);

  if (!isOpen || !interview) return null;

  const handleCopyBody = () => {
    if (!preview) return;
    navigator.clipboard.writeText(preview.body_plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIcs = () => {
    if (!interview) return;
    window.location.href = interviewApi.getIcsDownloadUrl(interview.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Calendar Invitation Preview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {interview.round_name} • {interview.candidate_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Note Banner */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <strong>Local Calendar Provider (RFC 5545):</strong> Direct email transmission is disabled until production SMTP/Google/Outlook OAuth credentials are configured. You can export the standard <code>.ics</code> calendar file or copy the text.
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Generating invitation preview...
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Email Subject
                </label>
                <div className="mt-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {preview.subject}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Recipients & Attendees ({preview.attendee_emails.length})
                </label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {preview.attendee_emails.map((att, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                    >
                      {att}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Invitation Body (Plaintext)
                </label>
                <pre className="mt-1 p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
                  {preview.body_plain}
                </pre>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Raw iCalendar (.ics) snippet
                </label>
                <pre className="mt-1 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono whitespace-pre max-h-24 overflow-y-auto border border-slate-200 dark:border-slate-700">
                  {preview.ics_content}
                </pre>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={handleCopyBody}
            disabled={loading || !preview}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Body' : 'Copy Message'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-xl"
            >
              Close
            </button>
            <button
              onClick={handleDownloadIcs}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download .ICS File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
