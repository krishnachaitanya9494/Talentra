import React from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  document: doc,
  loading = false,
  docType = 'jd',
}) => {
  if (!doc) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Document"
      subtitle="Confirm deletion of document from storage and SQLite"
      maxWidth="max-w-md"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900 dark:text-rose-100">
              Are you sure you want to delete this document?
            </p>
            <p className="mt-1">
              This will permanently delete the file from the <code className="font-mono bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded">data/documents/</code> directory and remove its metadata record from the database.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Document ID:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{doc.doc_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Filename:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[220px]" title={doc.original_filename}>
              {doc.original_filename}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Type:</span>
            <span className="uppercase text-[11px] font-semibold text-slate-500">{docType === 'jd' ? 'Job Description' : 'Candidate Resume'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-surface-darkBorder">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-subtle disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
