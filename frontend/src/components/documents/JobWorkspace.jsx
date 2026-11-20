import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Sparkles,
  Users,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Calendar,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Split,
  Eye,
  Award,
  Clock,
  MapPin,
  TrendingUp,
  Brain,
  ShieldCheck,
  Check,
  RefreshCw,
  GitCompare,
  Upload,
  Maximize2,
  ChevronUp,
  XCircle,
  Shield,
  Building,
  Target,
  HelpCircle,
  Building2,
  CheckSquare,
  Square,
  Share2,
  Zap,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import {
  getJobDescriptions,
  getRepositoryJDs,
  searchBooleanCandidates,
  getJDInterviewKit,
  triggerMatchingRun,
  apiClient,
} from '../../services/api';

export const JobWorkspace = ({ onInspectCandidate, onUploadJD }) => {
  const navigate = useNavigate();
  const [jds, setJds] = useState([]);
  const [selectedJd, setSelectedJd] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Navigation tabs: 'specs', 'questions', 'company', 'sourcing', 'matching', 'ai'
  const [activeTab, setActiveTab] = useState('specs');
  const [showSplitDocument, setShowSplitDocument] = useState(false);
  const [scopeMode, setScopeMode] = useState('structured'); // 'structured' vs 'source'

  // Accordion toggle states
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isSourcingEcosystemOpen, setIsSourcingEcosystemOpen] = useState(true);

  // Sourcing Boolean state
  const [sourcingTab, setSourcingTab] = useState('all'); // 'all', 'product', 'big4', 'gsi', 'gcc'
  const [booleanQuery, setBooleanQuery] = useState('');
  const [expMin, setExpMin] = useState('');
  const [expMax, setExpMax] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sourcingLoading, setSourcingLoading] = useState(false);
  const [sourcingResults, setSourcingResults] = useState(null);

  // Matching state
  const [matchingResults, setMatchingResults] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');

  // AI Interview Kit & Q&A state
  const [interviewKit, setInterviewKit] = useState(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [copiedKit, setCopiedKit] = useState(false);
  const [copiedQAId, setCopiedQAId] = useState(null);
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('All');
  const [activeScorecard, setActiveScorecard] = useState({}); // { [qId]: rating }
  const [checkedSignals, setCheckedSignals] = useState({}); // { [signalKey]: boolean }

  // Feedback notifications
  const [actionNotice, setActionNotice] = useState(null);

  // Load list of JDs from database
  const fetchJDs = async () => {
    try {
      setLoading(true);
      const res = await getJobDescriptions({ page: 1, page_size: 100 });
      const items = res?.items || [];
      setJds(items);
      if (items.length > 0) {
        setSelectedJd((prev) => {
          const match = prev ? items.find((j) => j.id === prev.id) : null;
          const next = match || items[0];
          loadInterviewKit(next.id);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to load JDs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJDs();
  }, []);

  // When selected JD changes, initialize query and interview kit
  useEffect(() => {
    if (selectedJd) {
      const skills = selectedJd.skills ? selectedJd.skills.split(',').map((s) => s.trim()) : [];
      if (skills.length >= 2) {
        setBooleanQuery(`${skills[0]} AND ${skills[1]}`);
      } else if (skills.length === 1) {
        setBooleanQuery(skills[0]);
      } else {
        setBooleanQuery(selectedJd.title || '');
      }
      setSourcingResults(null);
      setMatchingResults(null);
      loadInterviewKit(selectedJd.id);
    }
  }, [selectedJd]);

  // Load Interview Kit & Company Intelligence
  const loadInterviewKit = async (jdId) => {
    const id = jdId || selectedJd?.id;
    if (!id) return;
    try {
      setKitLoading(true);
      const data = await getJDInterviewKit(id);
      setInterviewKit(data);
    } catch (err) {
      console.error('Failed to load interview kit:', err);
    } finally {
      setKitLoading(false);
    }
  };

  // Run Boolean Sourcing Search
  const handleRunBooleanSearch = async (e) => {
    if (e) e.preventDefault();
    if (!booleanQuery.trim()) return;
    try {
      setSourcingLoading(true);
      const res = await searchBooleanCandidates({
        query: booleanQuery.trim(),
        experience_min: expMin ? parseFloat(expMin) : undefined,
        experience_max: expMax ? parseFloat(expMax) : undefined,
        location: locationFilter || undefined,
        limit: 50,
      });
      setSourcingResults(res);
    } catch (err) {
      alert(`Boolean search error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSourcingLoading(false);
    }
  };

  // Trigger matching
  const handleRunMatching = async () => {
    if (!selectedJd) return;
    try {
      setMatchingLoading(true);
      const res = await triggerMatchingRun(selectedJd.id);
      setMatchingResults(res);
    } catch (err) {
      console.error('Matching run error:', err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleCopyKit = () => {
    if (interviewKit?.markdown_kit) {
      navigator.clipboard.writeText(interviewKit.markdown_kit);
      setCopiedKit(true);
      setTimeout(() => setCopiedKit(false), 2000);
    }
  };

  const handleCopyQA = (q) => {
    const text = `Question: ${q.question}\n\nRecommended Stage: ${q.recommended_stage || 'Technical'}\nDifficulty: ${q.difficulty || 'Intermediate'}\n\nIdeal Model Answer:\n${q.model_answer}\n\nExpected Signals:\n${q.expected_signals.map((s) => '- ' + s).join('\n')}\n\nRed Flags:\n${q.red_flags.map((r) => '- ' + r).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedQAId(q.id);
    setTimeout(() => setCopiedQAId(null), 2000);
  };

  const handleDownloadKit = () => {
    if (!interviewKit?.markdown_kit) return;
    const blob = new Blob([interviewKit.markdown_kit], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Interview_Kit_${selectedJd?.req_code || 'JD'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const toggleSignal = (key) => {
    setCheckedSignals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setQuestionScore = (qId, score) => {
    setActiveScorecard((prev) => ({ ...prev, [qId]: score }));
  };

  const filteredJds = jds.filter((jd) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (jd.title || '').toLowerCase().includes(q) ||
      (jd.req_code || '').toLowerCase().includes(q) ||
      (jd.department || '').toLowerCase().includes(q) ||
      (jd.skills || '').toLowerCase().includes(q);

    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && (jd.status || '').toLowerCase() === statusFilter.toLowerCase();
  });

  const getSourceDocName = (jd) => {
    if (!jd) return 'jd_specification.txt';
    const code = (jd.req_code || 'jd_001').toLowerCase().replace('-', '_');
    const slug = (jd.title || 'oracle_epm_hyperion')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 30);
    return `${code}_${slug}.txt`;
  };

  const company = interviewKit?.company_intelligence;
  const questions = interviewKit?.screening_questions || [];

  const filteredQuestions = questions.filter((q) => {
    if (questionCategoryFilter === 'All') return true;
    return q.category?.toLowerCase().includes(questionCategoryFilter.toLowerCase());
  });

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Page Header (Matching Reference Video Frame 00) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-surface-darkBorder">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-navy-900 dark:text-slate-100 flex items-center gap-2">
              <span>Job Descriptions & AI Matching</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {jds.length || 10} Positions
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingested JD specifications with 15-category segmentation, vector readiness, and status controls
          </p>
        </div>

        <button
          type="button"
          onClick={() => (onUploadJD ? onUploadJD() : triggerToast('Opening JD Upload Drawer...'))}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-950 dark:bg-surface-darkCard dark:hover:bg-surface-darkHover text-white dark:text-slate-100 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Job Description</span>
        </button>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT PANEL: OPEN JOB POSITIONS (4 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                OPEN JOB POSITIONS
              </span>
            </div>

            {/* Filter Inputs Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter JDs by title, code, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="All">All Statuses ({jds.length})</option>
                <option value="active">Active</option>
                <option value="open">Open</option>
                <option value="under review">Under Review</option>
              </select>
            </div>

            {/* Requisition Cards List */}
            <div className="space-y-2.5 max-h-[72vh] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                  Loading requisitions...
                </div>
              ) : filteredJds.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <p>No requisitions found.</p>
                  <button
                    type="button"
                    onClick={fetchJDs}
                    className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 cursor-pointer"
                  >
                    Refresh Directory
                  </button>
                </div>
              ) : (
                filteredJds.map((jd) => {
                  const isSelected = selectedJd?.id === jd.id;
                  return (
                    <div
                      key={jd.id}
                      onClick={() => setSelectedJd(jd)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-2 relative ${
                        isSelected
                          ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-white dark:bg-surface-darkCard border-slate-200/80 dark:border-surface-darkBorder hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {jd.req_code}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            v1
                          </span>
                          <span className="text-slate-400 font-normal">
                            {jd.department || 'Engineering & Delivery'}
                          </span>
                        </div>

                        <select
                          value={jd.status || 'Under Review'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            jd.status = e.target.value;
                            setJds([...jds]);
                            triggerToast(`Updated ${jd.req_code} status to ${e.target.value}`);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="Under Review">Under Review</option>
                          <option value="Active">Active</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-navy-900 dark:text-slate-100 text-xs line-clamp-1">
                        {jd.title}
                      </h4>

                      {/* Description Snippet */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {jd.description || 'Enterprise solution delivery, architecture and development scope.'}
                      </p>

                      {/* Footer Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{jd.location || 'Hyderabad / Remote'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>5 - 8 Years</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJd(jd);
                            setActiveTab('specs');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Analyze JD &gt;</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: SPECIFICATION & MATCH DETAILS (8 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {selectedJd ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
              {/* Requisition Header Area */}
              <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-surface-darkBorder">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                    SPECIFICATION & MATCH DETAILS
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerToast('Toggled Full Page View')}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Full Page View</span>
                  </button>
                </div>

                {/* Requisition Top Meta */}
                <div>
                  <div className="flex items-center gap-2 mb-1 text-[11px]">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {selectedJd.req_code}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">
                      v1
                    </span>
                    <span className="text-slate-400">• {selectedJd.department || 'Engineering & Delivery'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Under Review ▾
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">
                    {selectedJd.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{selectedJd.location || 'Hyderabad / Remote'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>5 - 8 Years</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-slate-400">
                      <FileText className="w-3 h-3" />
                      <span>{getSourceDocName(selectedJd)}</span>
                    </span>
                  </div>
                </div>

                {/* 5 Quick Action Buttons Strip */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('matching');
                      if (!matchingResults) handleRunMatching();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Matching Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('specs')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Requirements Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('questions')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Screening Q&A & Answers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('company')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100/60 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Company Intelligence</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/comparison?jd=${selectedJd.id}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 transition-colors cursor-pointer"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Compare with Resume</span>
                  </button>
                </div>
              </div>

              {/* Pill Style Navigation Tabs Bar (With Dedicated Sections) */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-surface-darkBorder pb-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mr-1">
                    SECTION:
                  </span>

                  {/* Tab 1: Specifications */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('specs')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      activeTab === 'specs'
                        ? 'bg-slate-900 text-white dark:bg-brand-600 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>1. JD Specifications</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-white/20">
                      Scope & Arch
                    </span>
                  </button>

                  {/* Tab 2: DEDICATED SECTION BESIDE JD SPECIFICATIONS: Questions & Model Answers */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('questions')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      activeTab === 'questions'
                        ? 'bg-emerald-700 text-white font-bold shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>2. Screening Q&A & Signals</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/20">
                      {questions.length || 5} Q&As
                    </span>
                  </button>

                  {/* Tab 3: DEDICATED SECTION: Company & Hiring Intelligence */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('company')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      activeTab === 'company'
                        ? 'bg-sky-700 text-white font-bold shadow-xs'
                        : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>3. Company & Hiring Info</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/20">
                      Culture & Stack
                    </span>
                  </button>

                  {/* Tab 4: Talent Sourcing */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('sourcing')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      activeTab === 'sourcing'
                        ? 'bg-slate-900 text-white dark:bg-brand-600 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>4. Talent Sourcing</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-white/20">
                      Boolean
                    </span>
                  </button>

                  {/* Tab 5: Candidates & Matching */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('matching');
                      if (!matchingResults) handleRunMatching();
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      activeTab === 'matching'
                        ? 'bg-slate-900 text-white dark:bg-brand-600 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>5. Candidates & Matching</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-white/20">
                      50 Evaluated
                    </span>
                  </button>

                  {/* Tab 6: AI Intelligence */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ai');
                      if (!interviewKit) loadInterviewKit(selectedJd.id);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      activeTab === 'ai'
                        ? 'bg-slate-900 text-white dark:bg-brand-600 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>6. AI Dossier</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-white/20">
                      Export Kit
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                  className="hover:underline flex items-center gap-0.5 text-slate-500 text-[11px] cursor-pointer"
                >
                  <ChevronUp className="w-3 h-3" />
                  <span>Toggle Sections</span>
                </button>
              </div>

              {/* ========================================================================= */}
              {/* TAB 1: SPECIFICATIONS (Scope, Architecture & Deliverables) */}
              {/* ========================================================================= */}
              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard overflow-hidden">
                    <div
                      onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-600" />
                        <span className="font-bold text-xs uppercase tracking-wider text-navy-900 dark:text-slate-100">
                          JOB SUMMARY & SCOPE
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <span className="line-clamp-1 max-w-sm text-[11px]">
                          {selectedJd.description?.slice(0, 45) || 'Looking for an experienced Oracle EPM Cons...'}
                        </span>
                        {isSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {isSummaryOpen && (
                      <div className="p-4 pt-0 space-y-4 text-xs border-t border-slate-100 dark:border-slate-800">
                        {/* 4-Column Metadata Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              DEPARTMENT
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {selectedJd.department || 'Engineering & Delivery'}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              EXPERIENCE LEVEL
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              5 - 8 Years
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              LOCATION / WORK MODE
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {selectedJd.location || 'Hyderabad / Remote'}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              SOURCE DOCUMENT
                            </span>
                            <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate block">
                              {getSourceDocName(selectedJd)}
                            </span>
                          </div>
                        </div>

                        {/* Mode Toggle Bar */}
                        <div className="flex items-center justify-between p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-surface-darkBorder">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setScopeMode('structured')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                scopeMode === 'structured'
                                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              ✨ AI Structured Scope [12 Dimensions]
                            </button>
                            <button
                              type="button"
                              onClick={() => setScopeMode('source')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                scopeMode === 'source'
                                  ? 'bg-white dark:bg-surface-darkCard text-navy-900 dark:text-slate-100 shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              📄 Original Source Document
                            </button>
                          </div>

                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pr-2">
                            ✨ Deep semantic synthesis
                          </span>
                        </div>

                        {scopeMode === 'structured' ? (
                          <div className="space-y-3 pt-1">
                            {/* Role Overview & Business Context */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                                <span className="font-bold text-[10px] uppercase text-slate-400 flex items-center gap-1">
                                  <span>ⓘ</span>
                                  <span>ROLE OVERVIEW</span>
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                                  {selectedJd.description?.slice(0, 240) ||
                                    'The Oracle EPM / Hyperion Planning Consultant is responsible for driving end-to-end technical solution delivery, configuration, and workflow integration within the Corporate Financial Systems & Enterprise Performance Management practice.'}
                                </p>
                              </div>

                              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                                <span className="font-bold text-[10px] uppercase text-slate-400 flex items-center gap-1">
                                  <span>🏛</span>
                                  <span>BUSINESS CONTEXT</span>
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                                  Operating within Enterprise Performance Management, this role ensures business-critical planning, forecast modeling, and close cycles run with high availability, strict compliance clocks, and auditable history.
                                </p>
                              </div>
                            </div>

                            {/* Technical Scope & Architecture */}
                            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                              <span className="font-bold text-[10px] uppercase text-slate-400 flex items-center gap-1">
                                <span>⚡</span>
                                <span>TECHNICAL SCOPE & ARCHITECTURE</span>
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                                Hands-on platform configuration encompassing Oracle EPM Cloud, Smart View for Office, Essbase 21c, custom API integrations, business rules, and automated workflow triggers.
                              </p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(selectedJd.skills ? selectedJd.skills.split(',').map((s) => s.trim()) : [
                                  'Dimension Hierarchies',
                                  'Intercompany Eliminations',
                                  'Currency Translation',
                                  'Close Process Automation',
                                ]).map((chip, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  >
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Core Responsibilities & Functional Deliverables */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                                <span className="font-bold text-[10px] uppercase text-slate-400 flex items-center gap-1">
                                  <span>✓</span>
                                  <span>CORE RESPONSIBILITIES</span>
                                </span>
                                <ul className="text-slate-700 dark:text-slate-300 space-y-1 text-xs list-disc pl-4">
                                  <li>Own end-to-end design, implementation, and deployment of {selectedJd.title} solution architectures.</li>
                                  <li>Collaborate with enterprise stakeholders to translate business requirements into governed technical specifications.</li>
                                  <li>Maintain auditable workflow history and compliance with regulatory governance standards.</li>
                                </ul>
                              </div>

                              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                                <span className="font-bold text-[10px] uppercase text-slate-400 flex items-center gap-1">
                                  <span>✓</span>
                                  <span>FUNCTIONAL & LIFECYCLE DELIVERABLES</span>
                                </span>
                                <ul className="text-slate-700 dark:text-slate-300 space-y-1 text-xs list-disc pl-4">
                                  <li>Develop reusable service components and standardized platform extensions.</li>
                                  <li>Participate in release management, defect resolution, and pre-production operational readiness.</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap select-all border border-slate-800">
                            {selectedJd.description || 'Full source text loaded from repository.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: DEDICATED SECTION — SCREENING QUESTIONS & MODEL ANSWERS */}
              {/* ========================================================================= */}
              {activeTab === 'questions' && (
                <div className="space-y-4 text-xs">
                  {/* Top Bar for Questions: Filters & Actions */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <HelpCircle className="w-4 h-4 text-emerald-600" />
                          <h3 className="font-bold text-sm text-navy-900 dark:text-slate-100">
                            Technical Screening Questions & In-Depth Model Answers
                          </h3>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {questions.length} Questions
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Structured phone screen Q&As with verbatim expected signals, model answers, and interviewer scoring rubrics.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyKit}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                        >
                          {copiedKit ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKit ? 'Copied Full Kit' : 'Copy Full Q&A'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadKit}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .md</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-400 font-semibold mr-1">Filter Domain:</span>
                      {['All', 'Architecture', 'Tuning', 'Integration', 'Domain', 'Cloud'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setQuestionCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                            questionCategoryFilter === cat
                              ? 'bg-emerald-700 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Detailed Question Cards */}
                  <div className="space-y-4">
                    {kitLoading ? (
                      <div className="p-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Generating specialized technical questions and model answers...
                      </div>
                    ) : filteredQuestions.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        No screening questions found for this category.
                      </div>
                    ) : (
                      filteredQuestions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-5 rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-subtle space-y-3.5"
                        >
                          {/* Question Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                QUESTION {idx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {q.category}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                • Stage: <strong>{q.recommended_stage || 'Technical Round 1'}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {q.difficulty || 'Advanced'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyQA(q)}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Copy question and model answer"
                              >
                                {copiedQAId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* The Question in Quotes */}
                          <p className="text-xs font-bold text-navy-900 dark:text-slate-100 leading-relaxed italic bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/60 dark:border-surface-darkBorder">
                            "{q.question}"
                          </p>

                          {/* Full Ideal Model Answer */}
                          <div className="p-3.5 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                            <span className="font-bold text-[10px] uppercase text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              <span>IDEAL MODEL TECHNICAL ANSWER</span>
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                              {q.model_answer}
                            </p>
                          </div>

                          {/* Expected Positive Signals (Interactive Checklist) */}
                          <div className="space-y-1.5 pt-1">
                            <span className="font-bold text-[10px] uppercase text-slate-400 block">
                              EXPECTED SIGNALS & KEY PHRASES (CHECKLIST):
                            </span>
                            <div className="space-y-1">
                              {q.expected_signals.map((signal, sIdx) => {
                                const sigKey = `${q.id}_sig_${sIdx}`;
                                const isChecked = !!checkedSignals[sigKey];
                                return (
                                  <div
                                    key={sIdx}
                                    onClick={() => toggleSignal(sigKey)}
                                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                      isChecked
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {isChecked ? (
                                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    )}
                                    <span>{signal}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Scoring Rubric & Red Flags */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {/* Scoring Rubric */}
                            {q.rubric && (
                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-surface-darkBorder space-y-1.5 text-[11px]">
                                <span className="font-bold uppercase text-[10px] text-slate-500 block">
                                  SCORING RUBRIC (1 - 5 SCALE)
                                </span>
                                <div>
                                  <strong className="text-rose-600">1-2 (Below Bar):</strong> {q.rubric.below_bar}
                                </div>
                                <div>
                                  <strong className="text-slate-700 dark:text-slate-300">3 (Meets Bar):</strong> {q.rubric.meets_bar}
                                </div>
                                <div>
                                  <strong className="text-emerald-600">4-5 (Exceeds):</strong> {q.rubric.exceeds_bar}
                                </div>
                              </div>
                            )}

                            {/* Potential Red Flags */}
                            <div className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1 text-[11px] text-rose-800 dark:text-rose-300">
                              <span className="font-bold uppercase text-[10px] text-rose-700 dark:text-rose-400 block">
                                ⚠ WATCH-OUTS & RED FLAGS:
                              </span>
                              <ul className="space-y-0.5 list-disc pl-3">
                                {q.red_flags.map((r, rIdx) => (
                                  <li key={rIdx}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Recruiter Score Rating Row */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                            <span className="text-slate-400 font-semibold">Rate Candidate Response:</span>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setQuestionScore(q.id, num)}
                                  className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center cursor-pointer transition-all ${
                                    activeScorecard[q.id] === num
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Summary Green & Red Flags Cards (Frame 00) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                      <span className="font-bold text-xs uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <span>🟢</span>
                        <span>GREEN FLAGS (STRONG POSITIVE SIGNALS)</span>
                      </span>
                      <ul className="text-slate-700 dark:text-slate-300 space-y-1.5 text-xs list-disc pl-4">
                        <li>Concrete architectural ownership rather than superficial configuration.</li>
                        <li>Deep fluency in MAXL, EPM Automate, and REST API scheduling.</li>
                        <li>Proven hands-on experience handling multi-currency and intercompany eliminations.</li>
                        <li>Articulates precise trade-offs between dynamic vs stored calculations.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
                      <span className="font-bold text-xs uppercase text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <span>🔴</span>
                        <span>RED FLAGS (WATCH-OUTS & RISKS)</span>
                      </span>
                      <ul className="text-slate-700 dark:text-slate-300 space-y-1.5 text-xs list-disc pl-4">
                        <li>Only worked as a report viewer/Smart View consumer with no backend rule writing.</li>
                        <li>Cannot explain the difference between dense and sparse dimensions.</li>
                        <li>Vague answers on production release management and change control.</li>
                        <li>Relies on manual Excel manipulation rather than automated Data Management mapping.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: DEDICATED SECTION — COMPANY & HIRING INTELLIGENCE */}
              {/* ========================================================================= */}
              {activeTab === 'company' && (
                <div className="space-y-4 text-xs">
                  {/* Hiring Client Profile Overview */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                          <h3 className="text-base font-bold text-navy-900 dark:text-slate-100">
                            {company?.company_name || 'Talentra Enterprise Delivery'}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            Hiring Organization
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {company?.industry || 'Corporate Financial Systems & Global Sourcing'}
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-bold text-emerald-600 block">
                          {company?.compensation_range || '₹18.0 LPA – ₹26.0 LPA Base'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Target CTC Benchmark
                        </span>
                      </div>
                    </div>

                    {/* Quick Metadata Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          GLOBAL HEADCOUNT
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {company?.headcount || '5,000 - 15,000'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          WORK ENVIRONMENT
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {company?.work_mode || 'Hybrid (3 Days Office)'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          OFFICE LOCATION
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {company?.office_location || 'Hyderabad / Remote'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          GLOBAL HUBS
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          Hyderabad, London, NY
                        </span>
                      </div>
                    </div>

                    {/* Department & Team Topology */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5">
                      <span className="font-bold text-[10px] uppercase text-slate-400 block">
                        DEPARTMENT & TEAM TOPOLOGY
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <strong className="text-slate-700 dark:text-slate-300">Practice:</strong>{' '}
                          <span>{company?.team_structure?.team_name || 'Financial Systems & EPM Architecture'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700 dark:text-slate-300">Reporting Line:</strong>{' '}
                          <span>{company?.team_structure?.reporting_to || 'Director of Enterprise Financial Systems'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700 dark:text-slate-300">Team Size:</strong>{' '}
                          <span>{company?.team_structure?.team_size || '24 Enterprise Specialists'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700 dark:text-slate-300">Delivery Cadence:</strong>{' '}
                          <span>{company?.team_structure?.methodology || 'Two-Week Sprints, SOX Auditable Release'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Enterprise Technology Stack & Infrastructure */}
                    <div className="space-y-2 pt-1">
                      <span className="font-bold text-[10px] uppercase text-slate-400 block">
                        ENTERPRISE TECHNOLOGY STACK & TOOLING
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(company?.tech_stack || [
                          { category: 'Core Platform', items: ['Oracle EPM Cloud', 'PBCS', 'Essbase 21c', 'Smart View'] },
                          { category: 'Automation & Scripting', items: ['Calculation Manager', 'Groovy Rules', 'EPM Automate CLI', 'MAXL'] },
                          { category: 'Integration & ETL', items: ['FDMEE / Data Management', 'REST APIs', 'SQL Server', 'Python'] },
                          { category: 'Infrastructure & CI/CD', items: ['OCI', 'Jenkins', 'GitLab CI', 'Splunk'] },
                        ]).map((stack, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl border border-slate-200/60 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard space-y-1.5"
                          >
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {stack.category}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {stack.items.map((item, iIdx) => (
                                <span
                                  key={iIdx}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Career Growth & Progression Pathway */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                      <span className="font-bold text-[10px] uppercase text-slate-400 block">
                        CAREER PROGRESSION PATHWAY
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {[
                          { step: 'Step 1: Current', role: selectedJd.title, desc: 'Lead architecture, calculation scripts, and delivery.' },
                          { step: 'Step 2: 18-24 Mo', role: 'Lead Enterprise EPM Architect', desc: 'Regional architectural ownership and multi-cloud roadmap.' },
                          { step: 'Step 3: 3-5 Years', role: 'Practice Director / VP Solutions', desc: 'Global enterprise practice leadership and CFO advisory.' },
                        ].map((prog, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-3 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/70 dark:border-surface-darkBorder space-y-1"
                          >
                            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 block">
                              {prog.step}
                            </span>
                            <h4 className="font-bold text-navy-900 dark:text-slate-100 text-xs">
                              {prog.role}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {prog.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Culture & Perks */}
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-[10px] uppercase text-slate-400 block">
                        ENGINEERING CULTURE & COMPREHENSIVE PERKS
                      </span>
                      <ul className="text-slate-700 dark:text-slate-300 space-y-1 list-disc pl-4">
                        <li>High-visibility engagement with the CFO office, treasury leadership, and global financial controllers.</li>
                        <li>Fully sponsored annual Oracle certification and Cloud architecture credentials.</li>
                        <li>Comprehensive health coverage including parents and family wellness allowance.</li>
                        <li>Dedicated 10% innovation time for internal automation tooling and platform extensions.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: TALENT SOURCING (Frame 03) */}
              {/* ========================================================================= */}
              {activeTab === 'sourcing' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard overflow-hidden">
                    <div
                      onClick={() => setIsSourcingEcosystemOpen(!isSourcingEcosystemOpen)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-brand-600" />
                        <div>
                          <span className="font-bold text-xs uppercase tracking-wider text-navy-900 dark:text-slate-100 flex items-center gap-2">
                            <span>JOB DESCRIPTION RELATED COMPANIES & SOURCING ECOSYSTEM</span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              13 suggested
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerToast('Targeted all 13 ecosystem companies');
                          }}
                          className="text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer"
                        >
                          Target All (13)
                        </button>
                        {isSourcingEcosystemOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {isSourcingEcosystemOpen && (
                      <div className="p-4 pt-0 space-y-3 text-xs border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 font-semibold">Talent Sourcing Strategy:</span>
                            <select className="px-2 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200">
                              <option>Tier-1 Competitors & Parallel Ecosystems</option>
                              <option>Big 4 Advisory Only</option>
                              <option>Product OEMs & Hubs</option>
                            </select>
                            <span className="text-slate-400 text-[11px]">• Product OEMs, Big 4 Advisory, GSIs & Tech GCCs</span>
                          </div>

                          <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                            <Shield className="w-3 h-3" />
                            <span>Mark companies as Off-Limits to prevent non-poach breaches</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                          {[
                            { id: 'all', label: 'All Companies', count: 13 },
                            { id: 'product', label: 'Product & OEMs', count: 1 },
                            { id: 'big4', label: 'Big 4 & Advisory', count: 4 },
                            { id: 'gsi', label: 'Global System Integrators', count: 5 },
                            { id: 'gcc', label: 'Enterprise GCCs & Hubs', count: 3 },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSourcingTab(t.id)}
                              className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                                sourcingTab === t.id
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              <span>{t.label}</span>
                              <span className="ml-1 opacity-80 text-[10px] font-mono">{t.count}</span>
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                          {[
                            { name: 'Oracle', badge: 'PRODUCT', role: 'Software OEM IDC', loc: 'Bangalore / Hyderabad', desc: 'Core Oracle EPM, FCCS Cloud & Essbase product engineering' },
                            { name: 'Deloitte', badge: 'BIG 4', role: 'Global EPM Leader', loc: 'Hyderabad / Bangalore / Mumbai', desc: 'Leading Oracle EPM & financial consolidation transformation practice' },
                            { name: 'PwC', badge: 'BIG 4', role: 'Global Advisory', loc: 'Bangalore / Hyderabad / Kolkata', desc: 'Finance close, regulatory consolidation & FCCS implementation' },
                            { name: 'EY', badge: 'BIG 4', role: 'Advisory Leader', loc: 'Bangalore / Gurgaon / Mumbai', desc: 'Financial performance management, FCCS & statutory reporting' },
                            { name: 'KPMG', badge: 'BIG 4', role: 'EPM Advisory Partner', loc: 'Bangalore / Mumbai / Gurgaon', desc: 'Enterprise planning, budgeting & financial close practice' },
                            { name: 'Accenture', badge: 'GLOBAL', role: 'Global Platinum Partner', loc: 'Bangalore / Hyderabad / Pune', desc: 'Largest Oracle Cloud EPM delivery practice in India' },
                          ].map((comp, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/40 dark:bg-slate-900/40 space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {comp.badge}
                                </span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </div>

                              <div>
                                <h4 className="font-bold text-navy-900 dark:text-slate-100">
                                  {comp.name}
                                </h4>
                                <span className="text-[10px] text-slate-400 block">{comp.role}</span>
                                <span className="text-[10px] text-slate-500 block">{comp.loc}</span>
                              </div>

                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                                {comp.desc}
                              </p>

                              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => triggerToast(`Targeted candidates from ${comp.name}`)}
                                  className="flex-1 py-1 rounded bg-white dark:bg-surface-darkCard border border-slate-200 text-slate-700 dark:text-slate-300 font-semibold hover:border-emerald-500 cursor-pointer text-center"
                                >
                                  🎯 Target
                                </button>
                                <button
                                  type="button"
                                  onClick={() => triggerToast(`Excluded ${comp.name} from poaching`)}
                                  className="flex-1 py-1 rounded bg-white dark:bg-surface-darkCard border border-slate-200 text-slate-700 dark:text-slate-300 font-semibold hover:border-rose-500 cursor-pointer text-center"
                                >
                                  🚫 Exclude
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={handleRunBooleanSearch}
                    className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder space-y-3 text-xs shadow-subtle"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Internal Boolean Query Engine (Zero External Scraping)</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Supports: <code>AND</code>, <code>OR</code>, <code>NOT</code>, <code>( )</code>
                      </span>
                    </div>

                    <input
                      type="text"
                      value={booleanQuery}
                      onChange={(e) => setBooleanQuery(e.target.value)}
                      placeholder='e.g. (Hyperion OR PBCS) AND "Calculation Scripts" AND NOT Junior'
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:ring-1 focus:ring-brand-500"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={sourcingLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-60"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{sourcingLoading ? 'Searching Pool...' : 'Search Candidate Pool'}</span>
                      </button>
                    </div>

                    {sourcingResults && (
                      <div className="pt-2 text-xs text-slate-600 dark:text-slate-300">
                        Found <strong>{sourcingResults.total_matches}</strong> internal candidates matching boolean expression.
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: CANDIDATES & MATCHING (Frame 04) */}
              {/* ========================================================================= */}
              {activeTab === 'matching' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Users className="w-4 h-4 text-brand-600" />
                          <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900 dark:text-slate-100">
                            RECRUITER SEMANTIC MATCHING RESULTS
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            50 Candidates • Top Match: 53%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Ranked using active approved JD embeddings and candidate resume vectors.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/matching')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <span>Open Matching Matrix &gt;</span>
                      </button>
                    </div>

                    {/* 4 KPI Stat Cards (Frame 04) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          EVALUATED POOL
                        </span>
                        <div className="text-lg font-black text-navy-900 dark:text-slate-100">50</div>
                        <span className="text-[10px] text-slate-400">candidates</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          TOP MATCHES
                        </span>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">0</div>
                        <span className="text-[10px] text-slate-400">score ≥ 75%</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          AVERAGE FIT
                        </span>
                        <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">34%</div>
                        <span className="text-[10px] text-slate-400">across pool</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          TOP SCORE
                        </span>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">53%</div>
                        <span className="text-[10px] text-slate-400">highest rank</span>
                      </div>
                    </div>

                    {/* Candidate Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search candidate name, role, skills across pool & database (e.g. Oracle, Hyperion, PBCS)..."
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Top Ranked Candidate Cards (Frame 04) */}
                    <div className="space-y-3 pt-2">
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard space-y-3 text-xs shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-navy-900 dark:text-slate-100">
                                Abhijeetthombare Dba
                              </h4>
                              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                cand-037
                              </span>
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Partial
                              </span>
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                Domain Expert
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                              Senior Oracle Cloud EPM / FCCS Consultant with 5 Years Experience
                            </p>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span>5 Years Exp</span>
                              <span>•</span>
                              <span>Hyderabad, India</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-medium">Immediate Notice</span>
                              <span>•</span>
                              <span className="text-slate-500">Screened</span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-lg">
                              <Sparkles className="w-4 h-4" />
                              <span>53%</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              OVERALL FIT
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400 font-semibold">JD Alignment:</span>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200">
                            ✓ 7 Satisfied
                          </span>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200">
                            ✕ 9 Gaps
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Mandatory Skills</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">37.5%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '37.5%' }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Experience Fit</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">100%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Domain & Role</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">80%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '80%' }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Semantic Relevance</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">42%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '42%' }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => navigate(`/comparison?jd=${selectedJd.id}&candidate=16`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-semibold cursor-pointer"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                            <span>Compare with JD</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard space-y-3 text-xs shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-navy-900 dark:text-slate-100">
                                Lavanya Gudibanda
                              </h4>
                              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                cand-028
                              </span>
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                Needs Review
                              </span>
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Critical Gaps
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                              Senior Oracle Cloud EPM / FCCS Consultant with 7.2 Years Experience
                            </p>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span>7.2 Years Exp</span>
                              <span>•</span>
                              <span>Bangalore, India</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-medium">Immediate Notice</span>
                              <span>•</span>
                              <span className="text-slate-500">Screened</span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-black text-lg">
                              <Sparkles className="w-4 h-4" />
                              <span>44%</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              OVERALL FIT
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400 font-semibold">JD Alignment:</span>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200">
                            ✓ 5 Satisfied
                          </span>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200">
                            ✕ 11 Gaps
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => navigate(`/comparison?jd=${selectedJd.id}&candidate=1`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-semibold cursor-pointer"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                            <span>Compare with JD</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 6: AI INTELLIGENCE & EXPORT DOSSIER */}
              {/* ========================================================================= */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="font-bold text-sm text-navy-900 dark:text-slate-100 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-brand-600" />
                          <span>AI Intelligence Dossier & Full Markdown Kit</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Synthesized comprehensive interview dossier combining JD specifications, model Q&As, and company intelligence.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyKit}
                          disabled={!interviewKit}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer disabled:opacity-40"
                        >
                          {copiedKit ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKit ? 'Copied' : 'Copy Full Dossier'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadKit}
                          disabled={!interviewKit}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer disabled:opacity-40"
                        >
                          <Download className="w-3 h-3" />
                          <span>Export .md</span>
                        </button>
                      </div>
                    </div>

                    {kitLoading ? (
                      <div className="py-12 text-center text-slate-400">
                        Synthesizing deep semantic interview questions and scorecard...
                      </div>
                    ) : interviewKit ? (
                      <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto select-all border border-slate-800">
                        {interviewKit.markdown_kit}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400">
                        <button
                          type="button"
                          onClick={() => loadInterviewKit(selectedJd.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Interview Dossier</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a requisition from the directory to view specifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
