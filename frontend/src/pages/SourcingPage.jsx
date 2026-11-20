import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  FileSpreadsheet,
  Upload,
  FileText,
  Briefcase,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Layers,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Eye,
  Trash2,
  FolderOpen,
  ArrowUpDown,
  UserCheck,
  Sliders,
  Send,
  Zap,
} from 'lucide-react';
import axios from 'axios';
import { CandidateIntelligenceModal } from '../components/documents/CandidateIntelligenceModal';
import { AssignCandidatesModal } from '../components/assignments/AssignCandidatesModal';

/**
 * TALENTRA Sourcing & Excel Automation Workspace.
 *
 * Enhanced Workflow:
 * 1. Requisition Input (Upload PDF/DOCX, Paste with Presets, or 1-Click Existing JD)
 * 2. Fine-tune Requirements Drawer
 * 3. Deterministic 7-Dimension Search across 300+ internal talent records
 * 4. Deduplication & Verified Contact Highlighting
 * 5. Direct 4-Sheet openpyxl Excel Workbook Generation with Blob Download
 * 6. Quick Phase 4 TA Assignment Integration
 */
export default function SourcingPage() {
  // Input State
  const [inputMode, setInputMode] = useState('existing'); // 'existing' | 'upload' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [existingJds, setExistingJds] = useState([]);
  const [selectedExistingJdId, setSelectedExistingJdId] = useState('');
  const [parsingJd, setParsingJd] = useState(false);

  // Parsed Requirements (Editable)
  const [requirements, setRequirements] = useState(null);
  const [requirementsOpen, setRequirementsOpen] = useState(false);

  // Search Controls & Filters
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [minScore, setMinScore] = useState(40);
  const [selectedSegments, setSelectedSegments] = useState([
    'Strong Match',
    'Potential Match',
    'Partial Match',
  ]);
  const [locationFilter, setLocationFilter] = useState('');
  const [minExpFilter, setMinExpFilter] = useState('');
  const [maxExpFilter, setMaxExpFilter] = useState('');
  const [searchTableQuery, setSearchTableQuery] = useState('');

  // Table Selection & Pagination
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [sortField, setSortField] = useState('rank'); // 'rank' | 'score' | 'exp'
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals & Drawers
  const [inspectingCandidateId, setInspectingCandidateId] = useState(null);
  const [inspectingEvidence, setInspectingEvidence] = useState(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const [exportSuccessBanner, setExportSuccessBanner] = useState(null);
  const [exportHistoryOpen, setExportHistoryOpen] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  // Phase 4 Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Quick Preset Samples for 1-Click Paste
  const PRESET_JDS = [
    {
      title: 'Embedded Test Engineer',
      text: `Embedded Test Engineer
Location: Bangalore, India
Experience: 4 - 9 Years
Skills: C, C++, Embedded Systems, Linux, Python, RTOS, Hardware Debugging, Oscilloscope
Requirements:
- 4+ years in embedded firmware verification and automated test scripting in Python.
- Strong hands-on proficiency with microcontrollers (ARM Cortex, STM32) and communication protocols (I2C, SPI, UART, CAN).
- Bachelor's in Electronics & Communication or Computer Science.`,
    },
    {
      title: 'Senior Python Backend Developer',
      text: `Senior Python Backend Engineer
Location: Bangalore / Hyderabad (Hybrid)
Experience: 5 - 10 Years
Skills: Python, FastAPI, Django, PostgreSQL, Docker, Microservices, Redis, AWS
Requirements:
- 5+ years building scalable REST APIs and event-driven backend microservices in Python.
- Deep expertise in relational data modeling, query optimization, and asynchronous programming.
- Bachelor's degree in Computer Science or equivalent.`,
    },
    {
      title: 'Oracle EPM / Hyperion Consultant',
      text: `Oracle EPM Hyperion Planning Consultant
Location: Bangalore / Hyderabad
Experience: 5 - 12 Years
Skills: Oracle Hyperion, Essbase, Planning, PBCS, EPBCS, SQL, Financial Reporting
Requirements:
- 5+ years implementation and administration of Hyperion Essbase and Planning Cloud (PBCS).
- Strong command of business rules, calculation scripts, metadata management, and smart view integration.
- B.Tech or Master's degree in Engineering / Finance.`,
    },
    {
      title: 'DevOps & Cloud Infrastructure Lead',
      text: `Lead DevOps & Cloud Infrastructure Engineer
Location: Bangalore / Remote
Experience: 6 - 12 Years
Skills: Kubernetes, Docker, Terraform, AWS, CI/CD, Linux, Python, Monitoring
Requirements:
- 6+ years production container orchestration and automated infrastructure-as-code deployment.
- Hands-on expertise with AWS architecture, Prometheus/Grafana monitoring, and security compliance.
- Bachelor's degree in Computer Science or related technical field.`,
    },
  ];

  useEffect(() => {
    loadExistingJds();
    loadExportHistory();
  }, []);

  const loadExistingJds = async () => {
    try {
      const res = await axios.get('/api/v1/repository/jds?page_size=100');
      const items = res.data.items || res.data || [];
      setExistingJds(items);
      if (items.length > 0 && !selectedExistingJdId) {
        const firstId = items[0].id || items[0].doc_id;
        setSelectedExistingJdId(firstId);
        // Auto-load and parse the first JD on initial mount
        triggerParseExistingJd(firstId, items);
      }
    } catch (err) {
      console.error('Failed to load existing JDs:', err);
    }
  };

  const loadExportHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await axios.get('/api/v1/sourcing/exports');
      setExportHistory(res.data.items || []);
    } catch (err) {
      console.error('Failed to load export history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const triggerParseExistingJd = async (jdId, list = existingJds) => {
    try {
      setParsingJd(true);
      const chosenJd = list.find((j) => j.id === Number(jdId) || j.doc_id === jdId);
      const res = await axios.post('/api/v1/sourcing/parse-jd', {
        existing_jd_id: chosenJd ? chosenJd.id : jdId,
      });
      setRequirements(res.data.requirements);
      // Automatically execute candidate search
      runSearchWithRequirements(res.data.requirements);
    } catch (err) {
      console.error('Error loading JD specs:', err);
    } finally {
      setParsingJd(false);
    }
  };

  // Step 1: Parse JD
  const handleParseJd = async () => {
    try {
      setParsingJd(true);
      let reqData = null;

      if (inputMode === 'upload') {
        if (!uploadedFile) {
          alert('Please select a PDF, DOCX, or TXT file to upload.');
          return;
        }
        const formData = new FormData();
        formData.append('file', uploadedFile);
        const res = await axios.post('/api/v1/sourcing/upload-jd', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        reqData = res.data.requirements;
      } else if (inputMode === 'existing') {
        if (!selectedExistingJdId) {
          alert('Please select an existing Job Description.');
          return;
        }
        const chosenJd = existingJds.find(
          (j) => j.id === Number(selectedExistingJdId) || j.doc_id === selectedExistingJdId
        );
        const res = await axios.post('/api/v1/sourcing/parse-jd', {
          existing_jd_id: chosenJd ? chosenJd.id : selectedExistingJdId,
        });
        reqData = res.data.requirements;
      } else {
        if (!pastedText.trim()) {
          alert('Please paste Job Description text or select a preset template.');
          return;
        }
        const res = await axios.post('/api/v1/sourcing/parse-jd', {
          text: pastedText,
        });
        reqData = res.data.requirements;
      }

      setRequirements(reqData);
      setRequirementsOpen(false);
      // Run search automatically
      if (reqData) {
        await runSearchWithRequirements(reqData);
      }
    } catch (err) {
      console.error('JD Parsing Error:', err);
      alert('Failed to parse JD: ' + (err.response?.data?.detail || err.message));
    } finally {
      setParsingJd(false);
    }
  };

  // Step 2 & 3: Run Internal Candidate Search
  const runSearchWithRequirements = async (reqToUse = requirements) => {
    if (!reqToUse) return;
    try {
      setSearching(true);
      const payload = {
        requirements: reqToUse,
        filters: {
          min_score: minScore,
          segments: selectedSegments,
          location: locationFilter,
          min_experience: minExpFilter ? parseFloat(minExpFilter) : null,
          max_experience: maxExpFilter ? parseFloat(maxExpFilter) : null,
        },
        input_source: inputMode,
      };

      const res = await axios.post('/api/v1/sourcing/search', payload);
      setSearchResults(res.data.data);
      setSelectedCandidateIds([]);
      setCurrentPage(1);
    } catch (err) {
      console.error('Sourcing Search Error:', err);
      alert('Internal Sourcing Search failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSearching(false);
    }
  };

  const handleRunSearch = () => {
    if (!requirements) {
      alert('Please parse or specify Job Requirements first.');
      return;
    }
    runSearchWithRequirements(requirements);
  };

  // Step 4: Robust Blob Excel Download (Unblockable by popup blockers)
  const triggerBlobDownload = async (exportId, filename) => {
    try {
      const response = await axios.get(`/api/v1/sourcing/exports/${exportId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'matched_candidates.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file. Please check export history.');
    }
  };

  const handleExportExcel = async (candidateIds = null) => {
    if (!searchResults) return;
    try {
      setExportingExcel(true);
      const exportIds = candidateIds || (selectedCandidateIds.length > 0 ? selectedCandidateIds : null);

      const res = await axios.post('/api/v1/sourcing/export', {
        search_id: searchResults.search_id,
        candidate_ids: exportIds,
      });

      const exp = res.data.export;
      setLastExport(exp);
      setExportSuccessBanner(exp);
      loadExportHistory();

      // Trigger automatic safe blob download
      await triggerBlobDownload(exp.export_id, exp.filename);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('Excel export failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDeleteExport = async (exportId) => {
    if (!window.confirm('Delete this generated export file? Source candidate data will remain intact.')) {
      return;
    }
    try {
      await axios.delete(`/api/v1/sourcing/exports/${exportId}`);
      loadExportHistory();
      if (exportSuccessBanner?.export_id === exportId) {
        setExportSuccessBanner(null);
      }
    } catch (err) {
      alert('Failed to delete export: ' + (err.response?.data?.detail || err.message));
    }
  };

  const toggleSegment = (seg) => {
    setSelectedSegments((prev) =>
      prev.includes(seg) ? prev.filter((s) => s !== seg) : [...prev, seg]
    );
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtered & Sorted Candidates in UI
  const filteredCandidates = useMemo(() => {
    if (!searchResults?.candidates) return [];
    let list = [...searchResults.candidates];

    if (searchTableQuery.trim()) {
      const q = searchTableQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.candidate_name?.toLowerCase().includes(q) ||
          c.current_designation?.toLowerCase().includes(q) ||
          c.technical_skills?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.current_company?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA = a[sortField === 'score' ? 'match_score' : sortField === 'exp' ? 'total_experience' : 'rank'];
      let valB = b[sortField === 'score' ? 'match_score' : sortField === 'exp' ? 'total_experience' : 'rank'];
      if (sortField === 'rank') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [searchResults, searchTableQuery, sortField, sortAsc]);

  // Pagination
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage]);

  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1;

  // Selection handlers
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedCandidates.map((c) => c.candidate_id);
    const allSelected = pageIds.every((id) => selectedCandidateIds.includes(id));
    if (allSelected) {
      setSelectedCandidateIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectCandidate = (id) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getSegmentBadge = (segment) => {
    switch (segment) {
      case 'Strong Match':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Strong Match
          </span>
        );
      case 'Potential Match':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3 h-3" /> Potential Match
          </span>
        );
      case 'Partial Match':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Layers className="w-3 h-3" /> Partial Match
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {segment}
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white font-display">
              JD-Based Candidate Sourcing & Excel Engine
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Enterprise Automation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deterministic search across 300+ verified talent profiles &bull; Multi-tier ranking &bull; 4-sheet formatted openpyxl Excel workbooks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExportHistoryOpen(!exportHistoryOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            Export History ({exportHistory.length})
          </button>
        </div>
      </div>

      {/* EXPORT SUCCESS NOTIFICATION BANNER */}
      {exportSuccessBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-emerald-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-navy-900 dark:text-white">
                  Excel Workbook Generated & Downloaded:
                </span>
                <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  {exportSuccessBanner.filename}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Saved at:{' '}
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {exportSuccessBanner.file_path}
                </span>{' '}
                &bull; {(exportSuccessBanner.file_size_bytes / 1024).toFixed(1)} KB &bull; {exportSuccessBanner.total_candidates} talent rows across 4 formatted sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => triggerBlobDownload(exportSuccessBanner.export_id, exportSuccessBanner.filename)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Re-Download .xlsx
            </button>
            <button
              type="button"
              onClick={() => setExportSuccessBanner(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: REQUISITION SPECIFICATION */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkBorder pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy-900 dark:text-white font-display">
                Job Description Requisition
              </h2>
              <p className="text-[11px] text-slate-400">
                Select an active repository JD, upload a document, or paste text with quick presets
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => setInputMode('existing')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                inputMode === 'existing'
                  ? 'bg-white dark:bg-surface-dark text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Select Existing JD
            </button>
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-white dark:bg-surface-dark text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Upload PDF/DOCX
            </button>
            <button
              type="button"
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                inputMode === 'paste'
                  ? 'bg-white dark:bg-surface-dark text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Paste / Presets
            </button>
          </div>
        </div>

        {/* Mode 1: Existing Repository JD (Default & Instant) */}
        {inputMode === 'existing' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Active Job Requisition from TALENTRA Repository:
              </label>
              <select
                value={selectedExistingJdId}
                onChange={(e) => {
                  setSelectedExistingJdId(e.target.value);
                  triggerParseExistingJd(e.target.value);
                }}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono cursor-pointer"
              >
                {existingJds.map((jd) => (
                  <option key={jd.id || jd.doc_id} value={jd.id || jd.doc_id}>
                    [{jd.doc_id}] {jd.original_filename}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {parsingJd ? 'Loading specifications & evaluating talent pool...' : 'Requisition loaded and candidates searched automatically.'}
              </span>
              <button
                type="button"
                onClick={handleParseJd}
                disabled={parsingJd || !selectedExistingJdId}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {parsingJd ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Extracting Requirements...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Re-Analyze Requirements
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Upload File */}
        {inputMode === 'upload' && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-surface-darkBorder rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition bg-slate-50/30 dark:bg-slate-900/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
                }}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {uploadedFile ? (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-600 block">
                    {uploadedFile.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(uploadedFile.size / 1024).toFixed(1)} KB &bull; Click to change file
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Click to browse or drop Job Description file
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Supports PDF, DOCX, and TXT files
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParseJd}
                disabled={parsingJd || !uploadedFile}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {parsingJd ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Extracting & Sourcing Talent...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Extract & Find Matches
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mode 3: Paste Text & Presets */}
        {inputMode === 'paste' && (
          <div className="space-y-3">
            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pb-1">
              <span className="text-[11px] font-semibold text-slate-400">Quick Presets:</span>
              {PRESET_JDS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => setPastedText(p.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
            </div>

            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste Job Description text here..."
              className="w-full p-4 rounded-xl text-xs font-sans border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 leading-relaxed font-mono"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParseJd}
                disabled={parsingJd || !pastedText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {parsingJd ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Parsing & Matching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Parse & Find Matches
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Editable Extracted Requirements Drawer */}
        {requirements && (
          <div className="pt-4 border-t border-slate-100 dark:border-surface-darkBorder space-y-4">
            <div
              onClick={() => setRequirementsOpen(!requirementsOpen)}
              className="flex items-center justify-between cursor-pointer select-none p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-navy-900 dark:text-white">
                  Active Requirements Target:{' '}
                  <span className="text-emerald-600">{requirements.job_title}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  {requirements.min_experience}-{requirements.max_experience} yrs &bull; {requirements.location || 'Open'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>{requirementsOpen ? 'Hide tuning drawer' : 'Edit requirements'}</span>
                {requirementsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {requirementsOpen && (
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={requirements.job_title || ''}
                      onChange={(e) => setRequirements({ ...requirements, job_title: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-dark"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Min Experience (Years)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={requirements.min_experience ?? 0}
                      onChange={(e) => setRequirements({ ...requirements, min_experience: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-dark font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Max Experience (Years)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={requirements.max_experience ?? 15}
                      onChange={(e) => setRequirements({ ...requirements, max_experience: parseFloat(e.target.value) || 15 })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-dark font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Required Technical Skills (Comma separated)
                    </label>
                    <textarea
                      rows={2}
                      value={requirements.required_skills || ''}
                      onChange={(e) => setRequirements({ ...requirements, required_skills: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-dark font-mono leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Preferred Bonus Skills (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={requirements.preferred_skills || ''}
                      onChange={(e) => setRequirements({ ...requirements, preferred_skills: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-dark font-mono leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleRunSearch}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Apply Tuned Requirements
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STEP 2: SUMMARY CARDS */}
      {searchResults && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-slate-400 block">Talent Pool</span>
            <div className="text-2xl font-bold font-mono text-navy-900 dark:text-white mt-1">
              {searchResults.summary.total_candidates_searched}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Internal candidates</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-blue-600 block">Total Matched</span>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
              {searchResults.summary.total_candidates_found}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Score &ge; {minScore}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-emerald-600 block">Strong Matches</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {searchResults.summary.strong_matches}
            </div>
            <span className="text-[10px] text-emerald-600 font-mono">&ge; 80% High Priority</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-blue-600 block">Potential Matches</span>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
              {searchResults.summary.potential_matches}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">65% - 79% Qualified</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-purple-600 block">Verified Contacts</span>
            <div className="text-2xl font-bold font-mono text-purple-600 mt-1">
              {searchResults.summary.verified_contact_count}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Ready for outreach</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
            <span className="text-[11px] font-semibold text-amber-600 block">Duplicates Handled</span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {searchResults.summary.duplicates_identified}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Email / phone normalized</span>
          </div>
        </div>
      )}

      {/* STEP 3: CANDIDATE RESULTS TABLE & ACTIONS */}
      {searchResults && (
        <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white font-display">
                Ranked Candidates ({filteredCandidates.length})
              </h3>
              {selectedCandidateIds.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {selectedCandidateIds.length} Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name, role, city..."
                  value={searchTableQuery}
                  onChange={(e) => setSearchTableQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Phase 4 TA Assignment Button */}
              {selectedCandidateIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Assign ({selectedCandidateIds.length}) to TA
                </button>
              )}

              {/* Generate Excel Button */}
              <button
                type="button"
                onClick={() => handleExportExcel(selectedCandidateIds.length > 0 ? selectedCandidateIds : null)}
                disabled={exportingExcel || filteredCandidates.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 dark:bg-brand-600 dark:hover:bg-brand-500 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                {exportingExcel
                  ? 'Generating Workbook...'
                  : selectedCandidateIds.length > 0
                  ? `Export (${selectedCandidateIds.length}) to Excel`
                  : 'Export All to Excel (.xlsx)'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-surface-darkBorder rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        paginatedCandidates.length > 0 &&
                        paginatedCandidates.every((c) => selectedCandidateIds.includes(c.candidate_id))
                      }
                      onChange={handleSelectAllOnPage}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 cursor-pointer" onClick={() => { setSortField('rank'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center gap-1">
                      Rank <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Current Role & Company</th>
                  <th className="py-3 px-3 cursor-pointer" onClick={() => { setSortField('exp'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center gap-1">
                      Exp <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 cursor-pointer" onClick={() => { setSortField('score'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center gap-1">
                      Score <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Match Tier</th>
                  <th className="py-3 px-3">Matched Skills</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder text-slate-700 dark:text-slate-200">
                {paginatedCandidates.map((c) => (
                  <tr
                    key={c.candidate_id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                      selectedCandidateIds.includes(c.candidate_id) ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={selectedCandidateIds.includes(c.candidate_id)}
                        onChange={() => handleSelectCandidate(c.candidate_id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-500">
                      #{c.rank}
                    </td>
                    <td className="py-3 px-3 font-semibold text-navy-900 dark:text-white max-w-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300 shrink-0">
                          {c.candidate_name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="truncate flex items-center gap-1.5 font-bold">
                            {c.candidate_name}
                            {c.is_duplicate && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800" title={c.duplicate_reason}>
                                DUP
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate">
                      <div className="truncate font-medium">{c.current_designation}</div>
                      <div className="text-[10px] text-slate-400 truncate">{c.current_company || 'Candidate Records'}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold whitespace-nowrap">
                      {c.total_experience} yrs
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {c.location}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {c.match_score} pts
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getSegmentBadge(c.match_segment)}
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-[11px] font-mono text-slate-500">
                      {c.matched_skills || 'General Match'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectingCandidateId(c.candidate_id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="View Extracted Candidate Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectingEvidence(c)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
                          title="View Match Explanation"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportExcel([c.candidate_id])}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                          title="Export Single Candidate to Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredCandidates.length)} of {filteredCandidates.length} candidates
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-mono px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXPORT HISTORY DRAWER */}
      {exportHistoryOpen && (
        <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-navy-900 dark:text-white font-display">
                Generated Excel Workbooks History
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setExportHistoryOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading export audit logs...</div>
          ) : exportHistory.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No Excel workbooks generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-surface-darkBorder text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Export Code</th>
                    <th className="py-2.5 px-3">Requisition Title</th>
                    <th className="py-2.5 px-3">Folder Storage Path</th>
                    <th className="py-2.5 px-3">Candidates</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Generated At</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                  {exportHistory.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                        {exp.export_code}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-navy-900 dark:text-white max-w-xs truncate">
                        {exp.jd_title}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                        {exp.folder}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-600">
                        {exp.total_candidates} talent
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {(exp.file_size_bytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {new Date(exp.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => triggerBlobDownload(exp.id, exp.filename)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExport(exp.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Delete Export File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MATCH EVIDENCE MODAL */}
      {inspectingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkBorder pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                  Match Evidence &bull; {inspectingEvidence.candidate_name}
                </h3>
                <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                  Score: {inspectingEvidence.match_score} pts &bull; {inspectingEvidence.match_segment}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingEvidence(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder space-y-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300 block">Matched Skills</span>
                <p className="font-mono text-emerald-600 font-bold">{inspectingEvidence.matched_skills || 'None'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder space-y-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300 block">Missing Skills</span>
                <p className="font-mono text-rose-500 font-bold">{inspectingEvidence.missing_skills || 'None'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder space-y-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300 block">Extraction & Matching Evidence</span>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {inspectingEvidence.evidence_summary || 'Deterministic matching verified across technical skills, experience bounds, and domain role alignment.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingEvidence(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAIL MODAL */}
      {inspectingCandidateId && (
        <CandidateIntelligenceModal
          candidateId={inspectingCandidateId}
          onClose={() => setInspectingCandidateId(null)}
        />
      )}

      {/* PHASE 4 TA ASSIGNMENT MODAL */}
      {isAssignModalOpen && (
        <AssignCandidatesModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          candidateIds={selectedCandidateIds}
          jdId={requirements?.jd_id || 1}
          jdTitle={requirements?.job_title || 'Requisition'}
          onSuccess={() => {
            alert(`Assigned ${selectedCandidateIds.length} candidates to TA specialist successfully.`);
            setSelectedCandidateIds([]);
            setIsAssignModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
