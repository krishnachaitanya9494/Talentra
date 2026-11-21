import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  HardDrive,
  Hash,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const DocumentViewerModal = ({ isOpen, onClose, document: doc, docType = 'jd' }) => {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!doc) return null;

  const copySha = () => {
    if (doc.sha256_hash) {
      navigator.clipboard.writeText(doc.sha256_hash);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  const copyContent = () => {
    if (doc.raw_text) {
      navigator.clipboard.writeText(doc.raw_text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const formattedSize =
    doc.file_size_bytes > 1024 * 1024
      ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(doc.file_size_bytes / 1024).toFixed(1)} KB`;

  const formattedDate = doc.uploaded_at
    ? new Date(doc.uploaded_at).toLocaleString()
    : 'Recently';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doc.original_filename}
      subtitle={`${docType === 'jd' ? 'Job Description Document' : 'Candidate Resume Document'} • ${doc.doc_id}`}
      maxWidth="max-w-4xl"
    >
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Document Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Document ID
            </span>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs mt-1 block truncate">
              {doc.doc_id}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              File Size
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1 block">
              {formattedSize}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Format / MIME
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300 text-xs mt-1 block truncate">
              {doc.file_extension} ({doc.mime_type})
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Status
            </span>
            <div className="mt-1">
              <Badge variant={doc.processing_status === 'processed' ? 'emerald' : 'neutral'} size="sm">
                {doc.processing_status}
              </Badge>
            </div>
          </div>
        </div>

        {/* SHA-256 & Storage Details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 font-mono text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <Hash className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500 shrink-0">SHA-256:</span>
              <span className="text-slate-800 dark:text-slate-200 truncate select-all">{doc.sha256_hash}</span>
            </div>
            <button
              onClick={copySha}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-surface-darkCard text-slate-600 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-surface-darkBorder shrink-0 cursor-pointer ml-2"
              title="Copy SHA-256 checksum"
            >
              {copiedSha ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSha ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 truncate">
              <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono truncate">{doc.file_path}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 ml-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </span>
          </div>
        </div>

        {/* Extracted Raw Text Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Extracted Document Text</span>
            </h4>
            {doc.raw_text && (
              <button
                type="button"
                onClick={copyContent}
                className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied Text' : 'Copy All Text'}</span>
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto select-text">
            {doc.raw_text || '[No text extracted or file format is binary]'}
          </div>
        </div>

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
