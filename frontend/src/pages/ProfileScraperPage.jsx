import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Trash2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Edit2,
  Save,
} from 'lucide-react';

/**
 * TALENTRA — Simplified Resume Data Extraction Workspace.
 *
 * Focuses purely on the 4-step workflow:
 * 1. Upload Resumes (PDF, DOCX, TXT — max 25/batch)
 * 2. Extract Candidate Details (Single primary action)
 * 3. Review Extracted Information (11 essential columns, zero fabricated data)
 * 4. Download Excel (.xlsx) / CSV
 */
export const ProfileScraperPage = () => {
  // --------------------------------------------------------------------------
  // STATE: Files & Upload Queue
  // --------------------------------------------------------------------------
  const [fileQueue, setFileQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

  // --------------------------------------------------------------------------
  // STATE: Extracted Candidates & Table Controls
  // --------------------------------------------------------------------------
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // --------------------------------------------------------------------------
  // STATE: Candidate Detail Side Drawer
  // --------------------------------------------------------------------------
  const [drawerCandidate, setDrawerCandidate] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [isEditingInDrawer, setIsEditingInDrawer] = useState(false);
  const [drawerEditForm, setDrawerEditForm] = useState({});

  // --------------------------------------------------------------------------
  // ESCAPE KEY HANDLER FOR DRAWER
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerCandidate) {
        setDrawerCandidate(null);
        setIsEditingInDrawer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerCandidate]);

  // --------------------------------------------------------------------------
  // FILE SELECTION & DRAG-AND-DROP
  // --------------------------------------------------------------------------
  const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleBrowseFiles = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
  };

  const addFilesToQueue = (filesList) => {
    const validFiles = [];
    const rejectedFiles = [];

    filesList.forEach((file) => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (validExtensions.includes(ext)) {
        validFiles.push(file);
      } else {
        rejectedFiles.push(file.name);
      }
    });

    if (rejectedFiles.length > 0) {
      alert(`The following file(s) have unsupported formats: ${rejectedFiles.join(', ')}.\nPlease upload PDF, DOCX, or TXT documents.`);
    }

    if (validFiles.length === 0) return;

    // Check maximum batch limit of 25 files
    const totalFiles = fileQueue.length + validFiles.length;
    let filesToAdd = validFiles;
    if (totalFiles > 25) {
      const allowedCount = Math.max(0, 25 - fileQueue.length);
      filesToAdd = validFiles.slice(0, allowedCount);
      alert(`Maximum batch limit is 25 resumes. Adding first ${allowedCount} file(s).`);
    }

    const newQueueItems = filesToAdd.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      status: 'Ready', // 'Ready' | 'Processing' | 'Extracted' | 'Failed'
    }));

    setFileQueue((prev) => [...prev, ...newQueueItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFileFromQueue = (fileId) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== fileId));
  };

  const clearAllFiles = () => {
    setFileQueue([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --------------------------------------------------------------------------
  // PRIMARY ACTION: EXTRACT CANDIDATE DETAILS
  // --------------------------------------------------------------------------
  const handleExtractDetails = async () => {
    if (fileQueue.length === 0) {
      alert('Please select or drop at least one resume file to extract.');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: fileQueue.length });

    // Mark all items as processing
    setFileQueue((prev) => prev.map((f) => ({ ...f, status: 'Processing' })));

    try {
      const formData = new FormData();
      fileQueue.forEach((item) => formData.append('files', item.file));

      const response = await axios.post('/api/v1/scraper/batch-parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const parsedItems = response.data.candidates || [];

      // Merge newly parsed candidates with any existing ones (avoid duplicate IDs)
      setCandidates((prev) => {
        const existingFilenames = new Set(prev.map((c) => c.filename));
        const filteredNew = parsedItems.filter((c) => !existingFilenames.has(c.filename));
        const combined = [...prev, ...filteredNew];
        // Select all by default
        setSelectedIds(new Set(combined.map((c) => c.id)));
        return combined;
      });

      // Update file queue statuses based on parsed results
      setFileQueue((prev) =>
        prev.map((item) => {
          const match = parsedItems.find((c) => c.filename === item.name);
          return {
            ...item,
            status: match ? 'Extracted' : 'Failed',
          };
        })
      );
      setProcessingProgress({ current: fileQueue.length, total: fileQueue.length });
    } catch (err) {
      console.error('Extraction error:', err);
      alert('Failed to extract resumes: ' + (err.response?.data?.detail || err.message));
      setFileQueue((prev) => prev.map((f) => ({ ...f, status: 'Failed' })));
    } finally {
      setIsProcessing(false);
    }
  };

  // --------------------------------------------------------------------------
  // EXPORT HANDLERS: EXCEL & CSV
  // --------------------------------------------------------------------------
  const getExportCandidates = () => {
    if (selectedIds.size > 0) {
      return candidates.filter((c) => selectedIds.has(c.id));
    }
    return candidates;
  };

  const handleDownloadExcel = async () => {
    const exportData = getExportCandidates();
    if (exportData.length === 0) {
      alert('No candidate records available to export.');
      return;
    }

    setExportingExcel(true);
    try {
      const response = await axios.post(
        '/api/v1/scraper/export-excel',
        {
          candidates: exportData,
          single_sheet: true, // Generate clean single-sheet "Candidate Details"
          jd_title: 'Resume Data Extraction',
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'candidate_extraction.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel download failed:', err);
      alert('Failed to download Excel file. Please try again.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDownloadCsv = async () => {
    const exportData = getExportCandidates();
    if (exportData.length === 0) {
      alert('No candidate records available to export.');
      return;
    }

    setExportingCsv(true);
    try {
      const response = await axios.post(
        '/api/v1/scraper/export-csv',
        { candidates: exportData },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'candidate_extraction.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV download failed:', err);
      alert('Failed to download CSV file. Please try again.');
    } finally {
      setExportingCsv(false);
    }
  };

  // --------------------------------------------------------------------------
  // TABLE ROW SELECTION & SORTING
  // --------------------------------------------------------------------------
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map((c) => c.id)));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveSelectedFromResults = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Remove ${selectedIds.size} candidate(s) from results?`)) {
      setCandidates((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort candidates
  const filteredCandidates = candidates
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const role = (c.current_role || '').toLowerCase();
      const company = (c.current_company || '').toLowerCase();
      const loc = (c.location || '').toLowerCase();
      const skillsStr = Array.isArray(c.skills) ? c.skills.join(' ').toLowerCase() : (c.skills || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        company.includes(q) ||
        loc.includes(q) ||
        skillsStr.includes(q)
      );
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // --------------------------------------------------------------------------
  // DRAWER HELPERS
  // --------------------------------------------------------------------------
  const openCandidateDrawer = (candidate) => {
    setDrawerCandidate(candidate);
    setIsEditingInDrawer(false);
    setDrawerEditForm({
      name: candidate.name || '',
      phone: candidate.phone || '',
      email: candidate.email || '',
      location: candidate.location || '',
      current_role: candidate.current_role || '',
      current_company: candidate.current_company || '',
      experience_years: candidate.experience_years !== null && candidate.experience_years !== undefined ? candidate.experience_years : '',
      notice_period: candidate.notice_period || '',
      education: candidate.education || '',
      current_ctc: candidate.current_ctc || '',
      expected_ctc: candidate.expected_ctc || '',
    });
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const saveDrawerCorrection = () => {
    if (!drawerCandidate) return;

    const updated = {
      ...drawerCandidate,
      name: drawerEditForm.name.trim(),
      phone: drawerEditForm.phone.trim(),
      email: drawerEditForm.email.trim(),
      location: drawerEditForm.location.trim(),
      current_role: drawerEditForm.current_role.trim(),
      current_company: drawerEditForm.current_company.trim(),
      experience_years: drawerEditForm.experience_years !== '' ? parseFloat(drawerEditForm.experience_years) || null : null,
      notice_period: drawerEditForm.notice_period.trim(),
      education: drawerEditForm.education.trim(),
      current_ctc: drawerEditForm.current_ctc.trim(),
      expected_ctc: drawerEditForm.expected_ctc.trim(),
    };

    setCandidates((prev) => prev.map((c) => (c.id === drawerCandidate.id ? updated : c)));
    setDrawerCandidate(updated);
    setIsEditingInDrawer(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* A. MINIMAL PAGE HEADER                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Resume Data Extraction
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload multiple resumes and automatically extract candidate details into an Excel spreadsheet.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* B. SIMPLE RESUME UPLOAD AREA                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[0.99]'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/30'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleBrowseFiles}
            multiple
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Drag and drop resumes here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                or <span className="text-emerald-600 dark:text-emerald-400 underline font-medium">Browse Files</span>
              </p>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Supported formats: <strong className="text-slate-600 dark:text-slate-300">PDF, DOCX, TXT</strong> • Maximum 25 resumes per batch
            </p>
          </div>
        </div>

        {/* Selected File List */}
        {fileQueue.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Selected Resumes ({fileQueue.length} / 25)
              </span>
              <button
                onClick={clearAllFiles}
                disabled={isProcessing}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/40 dark:bg-slate-900/40">
              {fileQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 px-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-sm">
                      {item.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">({item.size})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md flex items-center gap-1 ${
                        item.status === 'Extracted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.status === 'Processing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : item.status === 'Failed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {item.status === 'Processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {item.status === 'Extracted' && <CheckCircle2 className="w-3 h-3" />}
                      {item.status === 'Failed' && <AlertCircle className="w-3 h-3" />}
                      {item.status}
                    </span>

                    {/* Remove File Button */}
                    <button
                      onClick={() => removeFileFromQueue(item.id)}
                      disabled={isProcessing}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* C. SINGLE PRIMARY ACTION                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleExtractDetails}
            disabled={isProcessing || fileQueue.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting ({processingProgress.current} / {processingProgress.total})...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract Candidate Details</span>
              </>
            )}
          </button>

          {isProcessing && (
            <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
              Parsing resumes with strict zero-fabrication rules...
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* D. EXTRACTION RESULTS TABLE & E. EXPORT ACTIONS                    */}
      {/* ------------------------------------------------------------------ */}
      {candidates.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Table Header Bar: Search, Selection Info, and Export Buttons */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
            {/* Left: Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates, skills, company, location..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Right: Export Section & Selection Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
                <strong>{filteredCandidates.length}</strong> candidate(s)
                {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
              </span>

              {selectedIds.size > 0 && (
                <button
                  onClick={handleRemoveSelectedFromResults}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1 border border-red-200 dark:border-red-900/50 mr-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Selected</span>
                </button>
              )}

              {/* Download Excel (.xlsx) */}
              <button
                onClick={handleDownloadExcel}
                disabled={exportingExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Download genuine .xlsx spreadsheet with zero fabricated data"
              >
                {exportingExcel ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Download Excel (.xlsx)</span>
              </button>

              {/* Download CSV */}
              <button
                onClick={handleDownloadCsv}
                disabled={exportingCsv}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Download flat RFC-4180 CSV"
              >
                {exportingCsv ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/60 select-none">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-8">#</th>

                  {/* 1. Candidate Name */}
                  <th
                    onClick={() => handleSort('name')}
                    className="p-3 min-w-[140px] cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Candidate Name</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* 2. Phone Number */}
                  <th className="p-3 min-w-[120px]">Phone Number</th>

                  {/* 3. Email Address */}
                  <th className="p-3 min-w-[150px]">Email Address</th>

                  {/* 4. Current Location */}
                  <th className="p-3 min-w-[120px]">Current Location</th>

                  {/* 5. Current Designation */}
                  <th className="p-3 min-w-[130px]">Current Designation</th>

                  {/* 6. Current Company */}
                  <th className="p-3 min-w-[130px]">Current Company</th>

                  {/* 7. Total Experience */}
                  <th
                    onClick={() => handleSort('experience_years')}
                    className="p-3 min-w-[90px] cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Experience</span>
                      {sortField === 'experience_years' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* 8. Technical Skills */}
                  <th className="p-3 min-w-[160px]">Technical Skills</th>

                  {/* 9. Notice Period */}
                  <th className="p-3 min-w-[90px] text-center">Notice Period</th>

                  {/* 10. Education */}
                  <th className="p-3 min-w-[110px]">Education</th>

                  {/* 11. Extraction Status */}
                  <th className="p-3 min-w-[100px] text-center">Status</th>

                  {/* Inspect Action */}
                  <th className="p-3 w-16 text-center">Inspect</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-400">
                      No candidate records found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c, idx) => {
                    const isSelected = selectedIds.has(c.id);
                    const skillsArray = Array.isArray(c.skills) ? c.skills : c.skills ? [c.skills] : [];

                    return (
                      <tr
                        key={c.id || idx}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(c.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* # */}
                        <td className="p-3 text-slate-400 text-[11px]">{idx + 1}</td>

                        {/* 1. Candidate Name */}
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          <button
                            onClick={() => openCandidateDrawer(c)}
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 text-left font-semibold transition-colors"
                          >
                            {c.name || '—'}
                          </button>
                        </td>

                        {/* 2. Phone Number */}
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {c.phone ? (
                            <span className="flex items-center gap-1 group">
                              <span>{c.phone}</span>
                              <button
                                onClick={() => copyToClipboard(c.phone, `phone-${c.id}`)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 transition-opacity"
                                title="Copy phone"
                              >
                                {copiedField === `phone-${c.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* 3. Email Address */}
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {c.email ? (
                            <span className="flex items-center gap-1 group">
                              <span className="truncate max-w-[150px]">{c.email}</span>
                              <button
                                onClick={() => copyToClipboard(c.email, `email-${c.id}`)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 transition-opacity"
                                title="Copy email"
                              >
                                {copiedField === `email-${c.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* 4. Current Location */}
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {c.location || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* 5. Current Designation */}
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                          {c.current_role || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* 6. Current Company */}
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {c.current_company || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* 7. Total Experience */}
                        <td className="p-3 text-center font-medium text-slate-800 dark:text-slate-200">
                          {c.experience_years !== null && c.experience_years !== undefined ? (
                            `${c.experience_years} y`
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* 8. Technical Skills */}
                        <td className="p-3">
                          {skillsArray.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {skillsArray.slice(0, 3).map((sk, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px]"
                                >
                                  {sk}
                                </span>
                              ))}
                              {skillsArray.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  +{skillsArray.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* 9. Notice Period */}
                        <td className="p-3 text-center text-slate-700 dark:text-slate-300">
                          {c.notice_period || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* 10. Education */}
                        <td className="p-3 text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {c.education || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* 11. Extraction Status */}
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                              c.extraction_status === 'Validated'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : c.extraction_status === 'Needs Review'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {c.extraction_status || 'Validated'}
                          </span>
                        </td>

                        {/* Inspect Eye Button */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => openCandidateDrawer(c)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Inspect Candidate Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. CANDIDATE DETAIL VIEW (PORTAL SIDE DRAWER)                       */}
      {/* ------------------------------------------------------------------ */}
      {drawerCandidate &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setDrawerCandidate(null);
                setIsEditingInDrawer(false);
              }}
            />

            {/* Side Drawer Surface */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-slide-left">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {(drawerCandidate.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                      {drawerCandidate.name || 'Extracted Candidate'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {drawerCandidate.current_role || 'Candidate'}
                      {drawerCandidate.current_company ? ` at ${drawerCandidate.current_company}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsEditingInDrawer(!isEditingInDrawer)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={isEditingInDrawer ? 'Cancel Editing' : 'Edit Candidate Details'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDrawerCandidate(null);
                      setIsEditingInDrawer(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 dark:text-slate-300">
                {isEditingInDrawer ? (
                  /* Edit Form */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-slate-900 dark:text-white">Edit Candidate Information</span>
                      <button
                        onClick={saveDrawerCorrection}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Candidate Name</label>
                        <input
                          type="text"
                          value={drawerEditForm.name}
                          onChange={(e) => setDrawerEditForm({ ...drawerEditForm, name: e.target.value })}
                          className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Phone</label>
                          <input
                            type="text"
                            value={drawerEditForm.phone}
                            onChange={(e) => setDrawerEditForm({ ...drawerEditForm, phone: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Email</label>
                          <input
                            type="text"
                            value={drawerEditForm.email}
                            onChange={(e) => setDrawerEditForm({ ...drawerEditForm, email: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Location</label>
                          <input
                            type="text"
                            value={drawerEditForm.location}
                            onChange={(e) => setDrawerEditForm({ ...drawerEditForm, location: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Notice Period</label>
                          <input
                            type="text"
                            value={drawerEditForm.notice_period}
                            onChange={(e) => setDrawerEditForm({ ...drawerEditForm, notice_period: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Current Role</label>
                          <input
                            type="text"
                            value={drawerEditForm.current_role}
                            onChange={(e) => setDrawerEditForm({ ...drawerEditForm, current_role: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Current Company</label>
                          <input
                            type="text"
                            value={drawerEditForm.current_company}
                            onChange={(e) => setDrawerEditForm({ ...drawerEditForm, current_company: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Experience (Years)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={drawerEditForm.experience_years}
                            onChange={(e) => setDrawerEditForm({ ...drawerEditForm, experience_years: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Education</label>
                          <input
                            type="text"
                            value={drawerEditForm.education}
                            onChange={(e) => setDrawerEditForm({ ...drawerEditForm, education: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 5 Grouped Sections */
                  <>
                    {/* 1. Personal Details */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        1. Personal Details
                      </h4>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Candidate Name:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {drawerCandidate.name || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Current Location:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {drawerCandidate.location || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Source Document:</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                            {drawerCandidate.filename || 'Direct Upload'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Contact Details */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        2. Contact Details
                      </h4>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Phone Number:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            {drawerCandidate.phone || '—'}
                            {drawerCandidate.phone && (
                              <button
                                onClick={() => copyToClipboard(drawerCandidate.phone, 'drawer-phone')}
                                className="text-slate-400 hover:text-emerald-600 ml-1"
                              >
                                {copiedField === 'drawer-phone' ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </span>
                        </div>

                        {drawerCandidate.alt_phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Alt Phone:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">
                              {drawerCandidate.alt_phone}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Email Address:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            {drawerCandidate.email || '—'}
                            {drawerCandidate.email && (
                              <button
                                onClick={() => copyToClipboard(drawerCandidate.email, 'drawer-email')}
                                className="text-slate-400 hover:text-emerald-600 ml-1"
                              >
                                {copiedField === 'drawer-email' ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </span>
                        </div>

                        {drawerCandidate.linkedin_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">LinkedIn:</span>
                            <a
                              href={drawerCandidate.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline flex items-center gap-1 font-mono"
                            >
                              <span>View Profile</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {drawerCandidate.portfolio_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Portfolio:</span>
                            <a
                              href={drawerCandidate.portfolio_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline flex items-center gap-1 font-mono"
                            >
                              <span>View Website</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Professional Details */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        3. Professional Details
                      </h4>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Current Designation:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {drawerCandidate.current_role || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Current Company:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {drawerCandidate.current_company || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Total Experience:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {drawerCandidate.experience_years !== null && drawerCandidate.experience_years !== undefined
                              ? `${drawerCandidate.experience_years} Years`
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Notice Period:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {drawerCandidate.notice_period || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Current CTC:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            {drawerCandidate.current_ctc || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Expected CTC:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            {drawerCandidate.expected_ctc || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Skills */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        4. Technical Skills
                      </h4>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        {Array.isArray(drawerCandidate.skills) && drawerCandidate.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {drawerCandidate.skills.map((sk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">No technical skills documented in resume.</span>
                        )}
                      </div>
                    </div>

                    {/* 5. Education */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        5. Educational Qualifications
                      </h4>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 font-medium text-slate-800 dark:text-slate-200">
                        {drawerCandidate.education || 'No educational records found.'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ProfileScraperPage;
