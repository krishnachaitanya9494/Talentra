import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  ClipboardPaste,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { uploadSingleJD, bulkUploadJDs, pasteJobDescription } from '../../services/api';

export const UploadJDModal = ({ isOpen, onClose, onSuccess }) => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' vs 'paste'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setSelectedFiles([]);
    setPasteTitle('');
    setPasteText('');
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

    if (uploadMode === 'paste') {
      if (!pasteText.trim() || pasteText.trim().length < 20) {
        setError('Please paste a job description of at least 20 characters.');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await pasteJobDescription({
          text: pasteText.trim(),
          title: pasteTitle.trim() || undefined,
        });
        setUploadResult({
          total_files: 1,
          successful_count: 1,
          duplicate_count: 0,
          failed_count: 0,
          results: [
            {
              filename: res.job_requirement?.title || 'Pasted Job Description',
              success: true,
              is_duplicate: false,
              doc_id: res.job_requirement?.req_code,
              message: res.message,
            },
          ],
        });
        if (onSuccess) onSuccess();
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to ingest pasted Job Description.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one Job Description file (.pdf, .docx, .txt, .json).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      if (selectedFiles.length === 1) {
        const res = await uploadSingleJD(selectedFiles[0]);
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
        const res = await bulkUploadJDs(selectedFiles, (progress) => {
          setUploadProgress(progress);
        });
        setUploadResult(res);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload Job Description documents.');
    } finally {
      setLoading(false);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Job Requisition"
      subtitle="Ingest new requisitions via file upload or raw text description"
      maxWidth="max-w-xl"
    >
      <div className="p-5 space-y-4">
        {/* Ingestion Mode Switcher */}
        {!uploadResult && (
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder">
            <button
              type="button"
              onClick={() => {
                setUploadMode('file');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer ${
                uploadMode === 'file'
                  ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('paste');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer ${
                uploadMode === 'paste'
                  ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>
          </div>
        )}

        {uploadResult ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Summary metrics header */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder text-center">
                <span className="text-[10px] font-medium text-slate-500">Processed</span>
                <p className="text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">{uploadResult.total_files}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder text-center">
                <span className="text-[10px] font-medium text-slate-500">Registered</span>
                <p className="text-lg font-semibold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">{uploadResult.successful_count}</p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-surface-darkBorder rounded-lg p-2.5 bg-slate-50/50 dark:bg-slate-900/40">
              {uploadResult.results.map((res, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-2 bg-white dark:bg-surface-darkCard rounded-md border border-slate-200/80 dark:border-surface-darkBorder"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{res.filename}</span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
                    {res.doc_id || 'Parsed & Ready'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-150 cursor-pointer"
              >
                Add another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-lg transition-colors duration-150 cursor-pointer shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {uploadMode === 'file' ? (
              <>
                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-150 ${
                    isDragging
                      ? 'border-slate-500 bg-slate-50 dark:bg-slate-800'
                      : selectedFiles.length > 0
                      ? 'border-slate-400 bg-slate-50/50 dark:bg-slate-900/50'
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/30 dark:bg-slate-900/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.pdf,.docx,.doc,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-2.5">
                    {selectedFiles.length > 1 ? (
                      <Layers className="w-5 h-5" />
                    ) : selectedFiles.length === 1 ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 text-center">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected (${(totalBytes / 1024).toFixed(1)} KB)`
                      : 'Drag and drop files here, or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 text-center">
                    PDF, DOCX, TXT (up to 15MB)
                  </p>
                </div>

                {/* Selected files preview list */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Selected files ({selectedFiles.length})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-rose-600 hover:text-rose-700 text-[11px] cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 dark:border-surface-darkBorder rounded-lg p-2 bg-slate-50/50 dark:bg-slate-900/40">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs px-2.5 py-1 bg-white dark:bg-surface-darkCard rounded-md border border-slate-100 dark:border-surface-darkBorder"
                        >
                          <div className="flex items-center gap-2 truncate max-w-sm">
                            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate text-slate-700 dark:text-slate-300">{file.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(idx);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Paste JD Text Form */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Job title <span className="text-slate-400 font-normal">(Optional — inferred if blank)</span>
                  </label>
                  <input
                    type="text"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    placeholder="e.g. Lead Full-Stack Cloud Architect"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Job description content <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste the full job description text, responsibilities, and qualifications..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono leading-relaxed resize-none"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>
                    Structured extraction automatically parses required skills, experience level, and core responsibilities.
                  </span>
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {loading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {uploadMode === 'paste'
                      ? 'Analyzing job specifications...'
                      : 'Uploading and parsing documents...'}
                  </span>
                  <span className="font-mono tabular-nums">{uploadProgress > 0 ? `${uploadProgress}%` : 'Parsing'}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-slate-900 dark:bg-slate-100 h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${Math.max(uploadProgress, 40)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-surface-darkBorder">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  (uploadMode === 'file' ? selectedFiles.length === 0 : !pasteText.trim())
                }
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors duration-150 cursor-pointer shadow-2xs"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {loading
                    ? 'Processing...'
                    : uploadMode === 'paste'
                    ? 'Analyze & save'
                    : selectedFiles.length > 1
                    ? `Ingest ${selectedFiles.length} JDs`
                    : 'Upload & parse'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
