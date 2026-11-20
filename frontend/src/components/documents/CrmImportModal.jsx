import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { inspectCrmHeaders, importCrmCandidates } from '../../services/api';

const TARGET_FIELDS = [
  { key: 'full_name', label: 'Candidate Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'current_title', label: 'Current Designation / Title' },
  { key: 'current_company', label: 'Current Employer / Company' },
  { key: 'total_experience_years', label: 'Total Experience (Years)' },
  { key: 'skills', label: 'Technical Skills' },
  { key: 'location', label: 'Current Location' },
  { key: 'external_crm_id', label: 'External CRM Record ID' },
];

export const CrmImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [sourceName, setSourceName] = useState('Salesforce CRM');
  const [detectedHeaders, setDetectedHeaders] = useState([]);
  const [mappings, setMappings] = useState({});
  const [inspecting, setInspecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setDetectedHeaders([]);
    setMappings({});
    setError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setImportResult(null);

      // Automatically inspect headers
      try {
        setInspecting(true);
        const res = await inspectCrmHeaders(selected);
        setDetectedHeaders(res.detected_headers || []);
        setMappings(res.suggested_mappings || {});
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to inspect file headers.');
      } finally {
        setInspecting(false);
      }
    }
  };

  const handleMappingChange = (header, targetField) => {
    setMappings((prev) => {
      const next = { ...prev };
      if (!targetField) {
        delete next[header];
      } else {
        next[header] = targetField;
      }
      return next;
    });
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    try {
      setImporting(true);
      setError(null);
      const res = await importCrmCandidates(file, mappings, sourceName);
      setImportResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to import candidates from CRM file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="External CRM Candidate Ingestion"
      subtitle="Import candidate talent profiles from CSV or Excel (.xlsx, .xls) with custom schema mapping"
      maxWidth="max-w-3xl"
    >
      <div className="p-6 space-y-5">
        {importResult ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Import Metrics Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                <p className="text-xl font-bold text-navy-900 dark:text-slate-100">{importResult.total_rows}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Imported New</span>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{importResult.imported_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Duplicates Skipped</span>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{importResult.duplicate_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Errors</span>
                <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{importResult.error_count}</p>
              </div>
            </div>

            {/* Individual Records breakdown */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-surface-darkBorder rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
              {importResult.results.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-surface-darkCard border border-slate-100 dark:border-surface-darkBorder"
                >
                  <div className="flex items-center gap-2 truncate max-w-sm">
                    <span className="font-mono text-slate-400 text-[10px]">Row {r.row}:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono truncate">{r.email}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'imported'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : r.status === 'duplicate'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetState}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Import Another File
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
          <div className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* File Drop & Source Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    file
                      ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                      : 'border-slate-300 dark:border-surface-darkBorder hover:border-brand-400 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-2">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-navy-900 dark:text-slate-100 text-center">
                    {file ? file.name : 'Select or drag & drop CRM CSV or Excel (.xlsx)'}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-0.5">Supports CSV, XLSX, and XLS exports</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  CRM Source System
                </label>
                <select
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-xl text-navy-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="Salesforce CRM">Salesforce CRM</option>
                  <option value="HubSpot CRM">HubSpot CRM</option>
                  <option value="Zoho Recruit">Zoho Recruit</option>
                  <option value="Workday HCM">Workday HCM</option>
                  <option value="Greenhouse ATS">Greenhouse ATS</option>
                  <option value="Custom CRM Export">Custom CRM Export</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Provenances records under this source identifier for auditing.
                </p>
              </div>
            </div>

            {/* Header Mapping Section */}
            {inspecting ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                <span>Inspecting external file columns & schema...</span>
              </div>
            ) : (
              detectedHeaders.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                      <span>Schema Column Mapping ({detectedHeaders.length} Columns Detected)</span>
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Auto-mappings suggested
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-surface-darkBorder rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                    {detectedHeaders.map((header) => (
                      <div
                        key={header}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-surface-darkCard border border-slate-100 dark:border-surface-darkBorder"
                      >
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300 truncate max-w-xs" title={header}>
                          {header}
                        </span>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <select
                            value={mappings[header] || ''}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                          >
                            <option value="">(Ignore Column)</option>
                            {TARGET_FIELDS.map((tf) => (
                              <option key={tf.key} value={tf.key}>
                                {tf.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-surface-darkBorder">
              <button
                type="button"
                onClick={handleClose}
                disabled={importing}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing || !file || detectedHeaders.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-subtle"
              >
                {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{importing ? 'Importing & Normalizing...' : 'Execute CRM Ingestion'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
