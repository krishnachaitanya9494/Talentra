import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { uploadSingleResume, bulkUploadResumes } from '../../services/api';

export const UploadResumeModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setSelectedFiles([]);
    setLoading(false);
    setUploadProgress(0);
    setError(null);
    setUploadResult(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
      setError(null);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one candidate resume file (.pdf, .docx, .txt).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      if (selectedFiles.length === 1) {
        const res = await uploadSingleResume(selectedFiles[0]);
        setUploadResult({
          total_files: 1,
          successful_count: res.is_duplicate ? 0 : 1,
          duplicate_count: res.is_duplicate ? 1 : 0,
          failed_count: 0,
          results: [
            {
              filename: selectedFiles[0].name,
              success: true,
              is_duplicate: res.is_duplicate,
              doc_id: res.document?.doc_id,
              message: res.message,
            },
          ],
        });
      } else {
        const res = await bulkUploadResumes(selectedFiles, (progress) => {
          setUploadProgress(progress);
        });
        setUploadResult(res);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload Candidate Resumes.');
    } finally {
      setLoading(false);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Candidate Resumes"
      subtitle="Upload individual resumes or bulk upload 200+ profiles (.pdf, .docx, .txt) to the repository"
      maxWidth="max-w-2xl"
    >
      <div className="p-6 space-y-5">
        {uploadResult ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Processed</span>
                <p className="text-xl font-bold text-navy-900 dark:text-slate-100">{uploadResult.total_files}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Stored New</span>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{uploadResult.successful_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Duplicates (SHA-256)</span>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{uploadResult.duplicate_count}</p>
              </div>
            </div>

            {/* Individual Item Results */}
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-surface-darkBorder rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
              {uploadResult.results.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-surface-darkCard border border-slate-100 dark:border-surface-darkBorder"
                >
                  <div className="flex items-center gap-2 truncate max-w-sm">
                    {r.success ? (
                      r.is_duplicate ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{r.filename}</span>
                    {r.doc_id && (
                      <span className="font-mono text-[10px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-1.5 py-0.5 rounded">
                        {r.doc_id}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      r.success
                        ? r.is_duplicate
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {r.is_duplicate ? 'Duplicate' : r.success ? 'Stored' : 'Rejected'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Upload More Resumes
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors cursor-pointer shadow-subtle"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/40 scale-[0.99]'
                  : selectedFiles.length > 0
                  ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                  : 'border-slate-300 dark:border-surface-darkBorder hover:border-brand-400 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.docx,.doc"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3">
                {selectedFiles.length > 1 ? (
                  <Layers className="w-6 h-6" />
                ) : selectedFiles.length === 1 ? (
                  <FileText className="w-6 h-6" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-semibold text-navy-900 dark:text-slate-100 text-center">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`
                  : 'Drag & drop Candidate Resumes here, or click to browse'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                Supports single or bulk upload of 200+ resumes (PDF, DOCX, TXT up to 25MB each)
              </p>
            </div>

            {/* Selected files preview list */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Selected Files ({selectedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-rose-500 hover:text-rose-700 text-[11px] cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-surface-darkBorder rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/40">
                  {selectedFiles.slice(0, 50).map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-white dark:bg-surface-darkCard rounded-lg border border-slate-100 dark:border-surface-darkBorder"
                    >
                      <div className="flex items-center gap-2 truncate max-w-sm">
                        <FileText className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="truncate text-slate-700 dark:text-slate-300">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {selectedFiles.length > 50 && (
                    <p className="text-[11px] text-center text-slate-400 py-1">
                      ...and {selectedFiles.length - 50} more files queued for bulk ingestion
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {loading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Streaming files to server & computing SHA-256...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-surface-darkBorder">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedFiles.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-subtle"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {loading
                    ? 'Ingesting Documents...'
                    : selectedFiles.length > 1
                    ? `Bulk Ingest ${selectedFiles.length} Resumes`
                    : 'Upload & Store Resume'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
