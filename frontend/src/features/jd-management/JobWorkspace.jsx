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
  AlertTriangle,
  Copy,
  Download,
  Calendar,
  ExternalLink,
  ChevronLeft,
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
  Edit3,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
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
  Printer,
  Send,
  Loader2,
  Plus,
  Trash2,
  BookmarkCheck,
  FileCode,
  ArrowRight,
  Sliders,
  UserCheck,
  Tag,
  Layers,
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Code,
  CheckCheck,
  Star,
  MoreVertical,
  Grid,
  LayoutList,
  ArrowLeft,
  CornerDownLeft,
  Mail,
  MessageSquare,
  Bookmark,
  Scale,
  Columns,
  ThumbsUp,
  SlidersHorizontal,
  FileCheck2,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { StructuredJDSpecs } from './StructuredJDSpecs';
import { JDVersionHistoryModal } from './JDVersionHistoryModal';
import { EditJDModal } from './EditJDModal';
import { UploadJDModal } from './UploadJDModal';
import {
  getJobDescriptions,
  getSavedScreeningQuestions,
  getStructuredJD,
  updateStructuredJD,
  askJDAssistant,
  generateScreeningQuestions,
  saveScreeningQuestions,
  getJDCandidates,
  getJDValidation,
  getJDTemplates,
  saveJDTemplate,
  bulkAssociateCandidates,
} from '../../services/api';

/**
 * Standard Candidate Avatars for Directory Cards
 */
const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-sky-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-amber-500',
];

export const JobWorkspace = ({ onInspectCandidate, onUploadJD }) => {
  const navigate = useNavigate();

  // Mode: 'grid' (Image 2 - Open Jobs Directory) vs 'workspace' (Images 1, 3, 4 - Editor & AI Copilot)
  const [viewMode, setViewMode] = useState('grid');

  // Core Directory State
  const [jds, setJds] = useState([]);
  const [selectedJd, setSelectedJd] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Closed'
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  // Pagination State (7 per page limit)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Reset pagination to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, departmentFilter, locationFilter]);

  // Workspace Setup Tabs: 'description', 'basic_info', 'screening', 'candidates', 'compensation'
  const [workspaceTab, setWorkspaceTab] = useState('description');

  // Sidebars in Workspace View (Simple, Recruiter-Friendly Layout)
  const [showAssistantPanel, setShowAssistantPanel] = useState(false);
  const [assistantTab, setAssistantTab] = useState('write'); // 'write', 'quality', 'templates'
  const [showOriginalSource, setShowOriginalSource] = useState(false);

  // Editable Requisition Fields in Workspace
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [structuredData, setStructuredData] = useState(null);
  const [editorFontSize, setEditorFontSize] = useState('text-sm sm:text-base'); // readable font sizes
  const [isSavingJD, setIsSavingJD] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Zoho Recruit AI Engagement & Assistant State (#JobDescriptions)
  const [assistantCategory, setAssistantCategory] = useState('jd'); // 'jd', 'email', 'sms', 'notes', 'templates'
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [saveTemplateTitle, setSaveTemplateTitle] = useState('');
  const [isSavingTemplateModal, setIsSavingTemplateModal] = useState(false);
  const [copiedAssistantText, setCopiedAssistantText] = useState(false);

  // Zoho Zia Matches & Bulk Association (#ziaMatches)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [candidateFilterTier, setCandidateFilterTier] = useState('all'); // 'all', 'strong', 'potential'
  const [candidateSummaries, setCandidateSummaries] = useState({});
  const [candidateSummaryLoading, setCandidateSummaryLoading] = useState({});

  // Zoho Zia Insights: Side-by-Side Application Compare Modal (#ziaInsights)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Zoho AI Assessments Generation (#assessmentGeneration)
  const [generatingScreening, setGeneratingScreening] = useState(false);
  const [screeningFilterCategory, setScreeningFilterCategory] = useState('All');

  // AI Content Assistant State (Image 1)
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

  // JD Copilot Compliance & Validation State (Images 3 & 4)
  const [validationReport, setValidationReport] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);

  // Candidates & Screening Data
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [screeningQuestions, setScreeningQuestions] = useState([]);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [shortlistedCandidates, setShortlistedCandidates] = useState({});

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Feedback toast notifications
  const [actionNotice, setActionNotice] = useState(null);

  const triggerToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Load All Requisitions
  const fetchJDs = async () => {
    try {
      setLoading(true);
      const res = await getJobDescriptions({ page: 1, page_size: 50 });
      const items = res.items || [];
      setJds(items);
      if (items.length > 0 && !selectedJd) {
        setSelectedJd(items[0]);
        setEditTitle(items[0].title || '');
        setEditDescription(items[0].description || '');
      }
    } catch (err) {
      console.error('Failed to load requisitions directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJDs();
  }, []);

  // When selected JD changes, load details, validation score, and candidates
  useEffect(() => {
    if (!selectedJd?.id) return;

    setEditTitle(selectedJd.title || '');
    setEditDescription(selectedJd.description || '');
    setHasUnsavedChanges(false);

    // Load structured canonical JD representation
    getStructuredJD(selectedJd.id)
      .then((sData) => {
        setStructuredData(sData);
        if (sData?.raw_text && sData.raw_text.length > (selectedJd.description?.length || 0)) {
          setEditDescription(sData.raw_text);
        }
      })
      .catch((err) => console.error('Error loading structured JD:', err));

    // Load live compliance and validation report for JD Copilot (Images 3 & 4)
    setValidationLoading(true);
    getJDValidation(selectedJd.id)
      .then((val) => setValidationReport(val))
      .catch((err) => console.error('Error loading validation report:', err))
      .finally(() => setValidationLoading(false));

    // Load candidates evaluated for this requisition
    setCandidatesLoading(true);
    getJDCandidates(selectedJd.id)
      .then((data) => setCandidates(data.candidates || []))
      .catch((err) => console.error('Error loading candidates:', err))
      .finally(() => setCandidatesLoading(false));

    // Load screening questions
    setScreeningLoading(true);
    getSavedScreeningQuestions(selectedJd.id)
      .then((qs) => setScreeningQuestions(qs || []))
      .catch((err) => console.error('Error loading screening questions:', err))
      .finally(() => setScreeningLoading(false));

    // Load templates for Zoho AI Assist (#JobDescriptions)
    setTemplatesLoading(true);
    getJDTemplates(selectedJd.id)
      .then((tpls) => setSavedTemplates(tpls || []))
      .catch((err) => console.error('Error loading templates:', err))
      .finally(() => setTemplatesLoading(false));

    setSelectedCandidateIds([]);
  }, [selectedJd?.id]);

  // Handle Save Current Assistant Output as Template (Zoho AI Assist Feature #JobDescriptions)
  const handleSaveCurrentAsTemplate = async () => {
    if (!selectedJd?.id || !generatedContent?.text) return;
    try {
      const defaultTitle = `${selectedJd.title} – ${(generatedContent.action || 'Assistant').toUpperCase().replace(/_/g, ' ')}`;
      const titleToSave = saveTemplateTitle.trim() || defaultTitle;
      const res = await saveJDTemplate(selectedJd.id, {
        title: titleToSave,
        category:
          assistantCategory === 'email'
            ? 'Candidate Email'
            : assistantCategory === 'sms'
            ? 'Candidate SMS'
            : assistantCategory === 'notes'
            ? 'Recruiter Notes'
            : 'JD Content',
        channel: assistantCategory,
        content: generatedContent.text,
      });
      setSavedTemplates((prev) => [res.template, ...prev]);
      setIsSavingTemplateModal(false);
      setSaveTemplateTitle('');
      triggerToast('Template saved to team library!');
    } catch (err) {
      alert(`Failed to save template: ${err.message}`);
    }
  };

  // Handle Generate Assessment Kit (Zoho AI Assessments #assessmentGeneration)
  const handleGenerateAssessmentKit = async () => {
    if (!selectedJd?.id || generatingScreening) return;
    try {
      setGeneratingScreening(true);
      const res = await generateScreeningQuestions(selectedJd.id);
      const newQuestions = res.questions || [];
      setScreeningQuestions(newQuestions);
      await saveScreeningQuestions(selectedJd.id, { questions: newQuestions });
      triggerToast(`Generated ${newQuestions.length} role-specific assessment questions.`);
    } catch (err) {
      alert(`Assessment Generation Error: ${err.message}`);
    } finally {
      setGeneratingScreening(false);
    }
  };

  // Handle Bulk Associate Candidates (Zoho Zia Matches #ziaMatches)
  const handleBulkAssociate = async (actionType = 'shortlist') => {
    if (!selectedJd?.id || selectedCandidateIds.length === 0) return;
    try {
      await bulkAssociateCandidates(selectedJd.id, {
        candidate_ids: selectedCandidateIds,
        action: actionType,
      });
      triggerToast(`Successfully associated ${selectedCandidateIds.length} candidates with ${selectedJd.title}.`);
      setSelectedCandidateIds([]);
      const candData = await getJDCandidates(selectedJd.id);
      setCandidates(candData.candidates || []);
    } catch (err) {
      alert(`Bulk Association Error: ${err.message}`);
    }
  };

  // Handle Fetch Candidate Summary (Zoho Zia Summaries #candidateProfile)
  const handleToggleCandidateSummary = async (cand) => {
    if (candidateSummaries[cand.id]) {
      setCandidateSummaries((prev) => {
        const copy = { ...prev };
        delete copy[cand.id];
        return copy;
      });
      return;
    }
    try {
      setCandidateSummaryLoading((prev) => ({ ...prev, [cand.id]: true }));
      const res = await askJDAssistant(selectedJd.id, {
        action: 'candidate_summary',
        candidate_name: cand.full_name,
        candidate_skills: cand.skills,
        candidate_experience: `${cand.total_experience_years} years`,
      });
      setCandidateSummaries((prev) => ({ ...prev, [cand.id]: res.response }));
    } catch (err) {
      alert(`Zia Summary Error: ${err.message}`);
    } finally {
      setCandidateSummaryLoading((prev) => ({ ...prev, [cand.id]: false }));
    }
  };

  // Handle Save Requisition Changes
  const handleSaveRequisition = async () => {
    if (!selectedJd?.id || isSavingJD) return;
    try {
      setIsSavingJD(true);
      const payload = {
        title: editTitle,
        description: editDescription,
        status: selectedJd.status || 'open',
        change_summary: 'Recruiter updated title and description in Rich Text Editor.',
        author: 'Lead Recruiter',
      };
      await updateStructuredJD(selectedJd.id, payload);
      setSelectedJd((prev) => ({ ...prev, title: editTitle, description: editDescription }));
      setJds((prev) =>
        prev.map((j) =>
          j.id === selectedJd.id ? { ...j, title: editTitle, description: editDescription } : j
        )
      );
      setHasUnsavedChanges(false);
      setWorkspaceTab('description');
      triggerToast('Requisition changes saved to database.');
    } catch (err) {
      alert(`Failed to save requisition: ${err.message}`);
    } finally {
      setIsSavingJD(false);
    }
  };

  // AI Content Assistant Query Handler (Image 1)
  const handleAskAssistant = async (action, query) => {
    if (!selectedJd?.id || assistantLoading) return;
    try {
      setAssistantLoading(true);
      const res = await askJDAssistant(selectedJd.id, {
        action: action,
        query: query || undefined,
      });
      setGeneratedContent({
        action: res.action,
        text: res.response,
        model: res.model || 'nvidia/nemotron-3.5-super-vl:free',
      });
      setAssistantPrompt('');
    } catch (err) {
      alert(`AI Assistant Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Image 1: "Looks good. Insert into text box."
  const handleInsertGeneratedContent = () => {
    if (!generatedContent?.text) return;
    const addition = `\n\n${generatedContent.text}`;
    setEditDescription((prev) => (prev ? `${prev}${addition}` : generatedContent.text));
    setHasUnsavedChanges(true);
    setGeneratedContent(null);
    triggerToast('Generated content inserted into description editor.');
  };

  // Text formatting insertion helper for toolbar
  const handleFormatText = (prefix, suffix = '') => {
    const textarea = document.getElementById('jd-rich-editor');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editDescription;
    const selected = text.substring(start, end) || 'text';
    const updated = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    setEditDescription(updated);
    setHasUnsavedChanges(true);
  };

  // Extract distinct departments for filtering
  const distinctDepartments = Array.from(
    new Set(jds.map((j) => j.department).filter(Boolean))
  );

  // Filtered JDs for Grid View
  const filteredJds = jds.filter((jd) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (jd.title || '').toLowerCase().includes(q) ||
      (jd.req_code || '').toLowerCase().includes(q) ||
      (jd.department || '').toLowerCase().includes(q) ||
      (jd.required_skills || '').toLowerCase().includes(q);

    const statusLower = (jd.status || 'open').toLowerCase();
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? statusLower === 'open' || statusLower === 'active' || statusLower === 'interviewing'
        : statusLower === 'closed' || statusLower === 'filled' || statusLower === 'on_hold';

    const matchesDept =
      departmentFilter === 'All'
        ? true
        : (jd.department || '').toLowerCase() === departmentFilter.toLowerCase();

    const matchesLoc =
      !locationFilter
        ? true
        : (jd.location || '').toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesDept && matchesLoc;
  });

  // Pagination calculation (7 jobs per page)
  const totalPages = Math.ceil(filteredJds.length / itemsPerPage) || 1;
  const paginatedJds = filteredJds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 pb-16">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Bar Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Job Requisitions</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage open positions, specifications, and candidate pipelines.
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Grid vs Workspace */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Requisitions <span className="font-mono tabular-nums">({jds.length})</span></span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!selectedJd && jds.length > 0) setSelectedJd(jds[0]);
                setWorkspaceTab('description');
                setViewMode('workspace');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
                viewMode === 'workspace'
                  ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-medium shadow-2xs cursor-pointer transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Requisition</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: OPEN JOBS DIRECTORY GRID (IMAGE 2 REFERENCE)                      */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Low-Space-Consuming Compact Filter Toolbar */}
          <div className="p-3 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Left Filter Controls: Status segmented buttons, Department, Location */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Job Status Segmented Buttons */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder text-xs font-medium">
                {['All', 'Active', 'Closed'].map((statusOption) => (
                  <button
                    key={statusOption}
                    type="button"
                    onClick={() => setStatusFilter(statusOption)}
                    className={`px-2.5 py-1 rounded-md transition-colors duration-150 cursor-pointer ${
                      statusFilter === statusOption
                        ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {statusOption} {statusOption === 'All' ? 'Jobs' : ''}
                  </button>
                ))}
              </div>

              {/* Department Dropdown */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="All">All Departments</option>
                {distinctDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Location Tag Filter */}
              <div className="relative min-w-[160px]">
                <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Clear Filters Button */}
              {(statusFilter !== 'All' || departmentFilter !== 'All' || locationFilter || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setDepartmentFilter('All');
                    setLocationFilter('');
                    setSearch('');
                  }}
                  className="px-2 py-1 text-xs text-rose-600 hover:text-rose-700 font-medium hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors duration-150 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Right Controls: Search jobs */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title or skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Section Header with Job Count & Page Indicator */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Open jobs <span className="font-mono tabular-nums">({filteredJds.length})</span></span>
              <span className="text-xs font-normal text-slate-500">
                — {itemsPerPage} per page
              </span>
            </h2>

            {totalPages > 1 && (
              <span className="text-xs font-medium text-slate-500 font-mono tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-500" />
              <p>Loading open job requisitions from database...</p>
            </div>
          ) : filteredJds.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No Jobs Found"
              description="Adjust status or search filters to find matching positions."
              actionLabel="Add New Job"
              onAction={() => setIsUploadModalOpen(true)}
            />
          ) : (
            <>
              {/* Full-width Grid: 7 items per page max */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {paginatedJds.map((jd, idx) => (
                  <div
                    key={jd.id}
                    className="p-4 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-150 space-y-3.5 group flex flex-col justify-between"
                  >
                    {/* Card Top: Title, Active dot, Status badge */}
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Position" />
                            <h3
                              onClick={() => {
                                setSelectedJd(jd);
                                setWorkspaceTab('description');
                                setViewMode('workspace');
                              }}
                              className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors duration-150 truncate"
                              title={jd.title}
                            >
                              {jd.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 pl-3.5">
                            {jd.location || 'Remote'} • {jd.employment_type || 'Full Time'} • <span className="font-mono tabular-nums">{jd.created_at ? jd.created_at.substring(0, 10) : '2026-11-20'}</span>
                          </p>
                        </div>

                        <div className="shrink-0">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                            {jd.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Metrics Row: Candidates, Screening, Requisition ID */}
                      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                            Candidates
                          </span>
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                            50
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                            Screening
                          </span>
                          <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                            32
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                            Requisition ID
                          </span>
                          <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                            {jd.req_code}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Candidate Avatars & Open Requisition Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center -space-x-1.5">
                        {['A', 'B', 'C', 'D'].map((letter, aIdx) => (
                          <div
                            key={aIdx}
                            className={`w-5 h-5 rounded-full ${AVATAR_COLORS[aIdx % AVATAR_COLORS.length]} text-white text-[9px] font-medium flex items-center justify-center ring-1 ring-white dark:ring-slate-900`}
                          >
                            {letter}
                          </div>
                        ))}
                        <span className="pl-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono tabular-nums">+46 pipeline</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJd(jd);
                          setWorkspaceTab('description');
                          setViewMode('workspace');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer transition-colors duration-150"
                      >
                        <span>Open Requisition</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 7-per-page Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                      {Math.min(currentPage * itemsPerPage, filteredJds.length)}
                    </span>{' '}
                    of <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">{filteredJds.length}</span> open jobs
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-surface-darkBorder text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-md text-xs font-mono tabular-nums transition-colors duration-150 cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-2xs'
                            : 'border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-surface-darkBorder text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: REQUISITION WORKSPACE (IMAGES 1, 3, 4 REFERENCE)                  */}
      {/* ========================================================================= */}
      {viewMode === 'workspace' && selectedJd && (
        <div className="space-y-4">
          {/* Workspace Subheader: Title, Status, Publish, Tabs */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors duration-150"
                  title="Back to Requisitions Directory"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 tabular-nums">
                      {selectedJd.req_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                      {selectedJd.status || 'Active'}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                        Unsaved edits
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {selectedJd.title}
                  </h2>
                </div>
              </div>

              {/* Recruiter Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* AI Assistant Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAssistantPanel(!showAssistantPanel);
                    setAssistantTab('write');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    showAssistantPanel && assistantTab === 'write'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs font-semibold'
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showAssistantPanel && assistantTab === 'write' ? 'Close Copilot' : 'AI Copilot'}</span>
                </button>

                {/* Job Quality Check Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAssistantPanel(true);
                    setAssistantTab('quality');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    showAssistantPanel && assistantTab === 'quality'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Quality: <strong className="font-mono tabular-nums">{validationReport?.completeness_percentage || 92}%</strong></span>
                </button>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveRequisition}
                  disabled={isSavingJD}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors duration-150 cursor-pointer"
                >
                  {isSavingJD ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save</span>
                </button>

                {/* Publish Button */}
                <button
                  type="button"
                  onClick={() => triggerToast(`Requisition ${selectedJd.req_code} published to portal.`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium text-xs shadow-2xs cursor-pointer transition-colors duration-150"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
              </div>
            </div>

            {/* Clean Recruiter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder text-xs font-medium overflow-x-auto">
              {[
                { id: 'description', label: 'View Uploaded Document Text', icon: FileText },
                { id: 'edit', label: 'Edit Requisition', icon: Edit3 },
                { id: 'basic_info', label: 'Skills & Requirements', icon: Briefcase },
                { id: 'screening', label: 'Interview Guide', icon: HelpCircle },
                { id: 'candidates', label: `Candidates (${candidates.length})`, icon: Users },
                { id: 'compensation', label: 'Compensation', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = workspaceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setWorkspaceTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors duration-150 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workspace Main Multi-Panel Row */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* ========================================================================= */}
            {/* PANEL A: ZOHO RECRUIT AI ASSIST & ENGAGEMENT SUITE (#JobDescriptions)     */}
            {/* PANEL B: CENTER WORKSPACE CONTENT (DESCRIPTION, BASIC INFO, CANDIDATES)   */}
            {/* ========================================================================= */}
            <div className="flex-1 w-full space-y-4">
              {/* TAB 1: VIEW UPLOADED DOCUMENT TEXT ONLY (CLEAN, USER-FRIENDLY & NON-TECHNICAL) */}
              {workspaceTab === 'description' && (
                <div className="p-5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs space-y-4">
                  {/* Document Header & Metadata Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Uploaded Requisition Document
                        </span>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          {(structuredData?.raw_text || editDescription || selectedJd?.description || '').length.toLocaleString()} characters •{' '}
                          {(structuredData?.raw_text || editDescription || selectedJd?.description || '').trim()
                            ? (structuredData?.raw_text || editDescription || selectedJd?.description || '')
                                .trim()
                                .split(/\s+/).length.toLocaleString()
                            : 0}{' '}
                          words
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {selectedJd.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const doc = structuredData?.raw_text || editDescription || selectedJd?.description || '';
                          navigator.clipboard.writeText(doc);
                          triggerToast('Copied document text to clipboard.');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-colors duration-150"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy text</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('edit')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-medium cursor-pointer shadow-2xs transition-colors duration-150"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit requisition</span>
                      </button>
                    </div>
                  </div>

                  {/* Role Meta Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedJd.department || 'Finance & Systems'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Location</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedJd.location || 'Remote / Hybrid'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Employment type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{(selectedJd.employment_type || 'full_time').replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Clean Document Presentation Pane (Display ONLY Uploaded Document Text) */}
                  <div className="p-5 rounded-lg bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-sans text-sm leading-relaxed whitespace-pre-wrap select-text min-h-[460px]">
                    {structuredData?.raw_text || editDescription || selectedJd?.description || 'No document text available.'}
                  </div>
                </div>
              )}

              {/* TAB 1B: SEPARATE REQUISITION EDITOR (EDITING OPTION KEPT SEPARATELY) */}
              {workspaceTab === 'edit' && (
                <div className="p-5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        <span>Edit Requisition Specifications</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Modify job title, specifications, and full requisition description.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('description')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors duration-150"
                      >
                        Back to document
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveRequisition}
                        disabled={isSavingJD}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium text-xs shadow-2xs cursor-pointer transition-colors duration-150"
                      >
                        {isSavingJD ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Save changes</span>
                      </button>
                    </div>
                  </div>

                  {/* Job Title Form Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Job title *
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => {
                        setEditTitle(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="e.g. Oracle EPM / Hyperion Planning Consultant"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  {/* Description Editor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Requisition description & content
                    </label>

                    <div className="rounded-lg border border-slate-200 dark:border-surface-darkBorder overflow-hidden">
                      {/* Friendly Formatting Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleFormatText('**', '**')}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                            title="Bold"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('*', '*')}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                            title="Italic"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('\n- ')}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                            title="Bullet List"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('\n1. ')}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                            title="Numbered List"
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setShowAssistantPanel(true);
                              setAssistantTab('write');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-xs transition-colors duration-150"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Assist</span>
                          </button>
                        </div>

                        {/* Word and Character Count */}
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 tabular-nums">
                          <span>{(editDescription || '').length.toLocaleString()} characters</span>
                          <span>•</span>
                          <span>
                            {editDescription?.trim()
                              ? editDescription.trim().split(/\s+/).length.toLocaleString()
                              : 0}{' '}
                            words
                          </span>
                        </div>
                      </div>

                      {/* Spacious Editor Textarea */}
                      <textarea
                        id="jd-rich-editor"
                        rows={18}
                        value={editDescription}
                        onChange={(e) => {
                          setEditDescription(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full p-4 bg-white dark:bg-slate-950 font-sans text-sm text-slate-800 dark:text-slate-100 leading-relaxed focus:outline-none resize-y min-h-[460px]"
                        placeholder="Type or paste the job description, role overview, key responsibilities, requirements, and company perks..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BASIC INFO (STRUCTURED JD SPECS) */}
              {workspaceTab === 'basic_info' && (
                <StructuredJDSpecs
                  jd={selectedJd}
                  structuredData={structuredData}
                  onOpenEdit={() => setIsEditModalOpen(true)}
                  onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
                  onSaved={() => {
                    fetchJDs();
                    triggerToast('Requisition specifications updated.');
                  }}
                />
              )}

              {/* TAB 3: AI ASSESSMENTS & PRE-SCREENING KITS (ZOHO RECRUIT #assessmentGeneration) */}
              {workspaceTab === 'screening' && (
                <div className="p-5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs space-y-4">
                  {/* Zoho AI Assessments Header Banner */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Assessment Guide
                        </span>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          Role-specific evaluation questions and rubrics
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                        Standardized evaluation rubrics for technical screening, behavioral competencies (STAR), and enterprise compliance.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAssessmentKit}
                      disabled={generatingScreening}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium text-xs shadow-2xs cursor-pointer shrink-0 transition-colors duration-150"
                    >
                      {generatingScreening ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating kit...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Generate Assessment Kit</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    {['All', 'Technical Assessment', 'System Problem-Solving', 'Behavioral & Delivery (STAR)', 'Enterprise Standards'].map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setScreeningFilterCategory(cat)}
                          className={`px-2.5 py-1 rounded-md font-medium transition-colors duration-150 cursor-pointer ${
                            screeningFilterCategory === cat
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs font-semibold'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {cat === 'All' ? `All Questions (${screeningQuestions.length})` : cat}
                        </button>
                      )
                    )}
                  </div>

                  {/* Screening Questions Cards */}
                  {screeningQuestions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                      <FileCheck2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No Assessment Questions Generated Yet</p>
                      <p>Click "Generate Assessment Kit" to create role-specific questions with benchmark rubrics.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {screeningQuestions
                        .filter((q) =>
                          screeningFilterCategory === 'All'
                            ? true
                            : (q.category || '').toLowerCase().includes(screeningFilterCategory.toLowerCase().slice(0, 8))
                        )
                        .map((q, idx) => (
                          <div
                            key={q.id || idx}
                            className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-3 transition-colors duration-150 hover:border-slate-300 dark:hover:border-slate-700"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md font-medium text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {q.category || 'Technical Assessment'}
                                </span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  {q.recommended_stage || 'Technical Screening'}
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {q.difficulty || 'Senior'}
                                </span>
                              </div>
                              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                ✓ Verified rubric
                              </span>
                            </div>

                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                              {q.question}
                            </p>

                            {/* Ideal Model Answer */}
                            {q.model_answer && (
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1">
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
                                  Model answer & evaluation signal
                                </span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {q.model_answer}
                                </p>
                              </div>
                            )}

                            {/* Two-column Rubric: Positive Signals vs Red Flags */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                              {/* Expected Positive Signals */}
                              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                                <span className="font-medium text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Positive signals to listen for</span>
                                </span>
                                <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                                  {(q.expected_signals || [
                                    'Concrete hands-on architectural examples',
                                    'Clear understanding of failure isolation and test automation',
                                  ]).map((sig, sIdx) => (
                                    <li key={sIdx} className="flex items-start gap-1.5">
                                      <span className="text-emerald-600 font-bold">•</span>
                                      <span>{sig}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Warning Signs / Red Flags */}
                              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                                <span className="font-medium text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Potential red flags</span>
                                </span>
                                <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                                  {(q.red_flags || [
                                    'Vague answers without production details',
                                    'Ignoring automated verification or test coverage',
                                  ]).map((rf, rIdx) => (
                                    <li key={rIdx} className="flex items-start gap-1.5">
                                      <span className="text-rose-600 font-bold">•</span>
                                      <span>{rf}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ZIA MATCHES & BULK PIPELINE (ZOHO RECRUIT #ziaMatches & #ziaInsights) */}
              {workspaceTab === 'candidates' && (
                <div className="p-5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs space-y-4">
                  {/* Zia Matches Header Banner */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Candidate Matching
                        </span>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          Evaluated candidate matches for this requisition
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                        Deterministic matching based on role requirements and skill sets. Review match justifications and associate profiles directly.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const candData = getJDCandidates(selectedJd.id);
                          candData.then((d) => setCandidates(d.candidates || []));
                          triggerToast('Refreshed smart talent matches.');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh matches</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter & Bulk Action Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={candidates.length > 0 && selectedCandidateIds.length === candidates.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCandidateIds(candidates.map((c) => c.id));
                            } else {
                              setSelectedCandidateIds([]);
                            }
                          }}
                          className="rounded text-slate-900 focus:ring-slate-500"
                        />
                        <span>Select all</span>
                      </label>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                      <span className="text-slate-500 font-mono tabular-nums">
                        <strong>{selectedCandidateIds.length}</strong> of {candidates.length} selected
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Bulk Associate to Job */}
                      <button
                        type="button"
                        onClick={() => handleBulkAssociate('shortlist')}
                        disabled={selectedCandidateIds.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 disabled:opacity-40 text-white font-medium text-xs shadow-2xs cursor-pointer transition-colors duration-150"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Associate to job</span>
                      </button>

                      {/* Compare Side-by-Side (Zia Insights #ziaInsights) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCandidateIds.length < 2 || selectedCandidateIds.length > 3) {
                            alert('Please select 2 or 3 candidates for Side-by-Side comparison.');
                            return;
                          }
                          setIsCompareModalOpen(true);
                        }}
                        disabled={selectedCandidateIds.length < 2 || selectedCandidateIds.length > 3}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs disabled:opacity-40 cursor-pointer shadow-xs transition-all"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Compare Side-by-Side ({selectedCandidateIds.length})</span>
                      </button>

                      {/* Draft Outreach Email */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAIAssistant(true);
                          setAssistantCategory('email');
                          handleAskAssistant('email_outreach');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Outreach Email</span>
                      </button>
                    </div>
                  </div>

                  {/* Candidate List Cards */}
                  <div className="space-y-3">
                    {candidates.map((cand) => {
                      const isSelected = selectedCandidateIds.includes(cand.id);
                      const isStrong = cand.match_score >= 75;
                      const hasSummary = Boolean(candidateSummaries[cand.id]);
                      const isLoadingSummary = Boolean(candidateSummaryLoading[cand.id]);

                      return (
                        <div
                          key={cand.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-50/20 dark:border-indigo-700 dark:bg-indigo-950/20 shadow-subtle'
                              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                          }`}
                        >
                          {/* Row 1: Checkbox, Name, Title, Match Score */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCandidateIds((prev) => [...prev, cand.id]);
                                  } else {
                                    setSelectedCandidateIds((prev) => prev.filter((id) => id !== cand.id));
                                  }
                                }}
                                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm sm:text-base text-navy-900 dark:text-slate-100">
                                    {cand.full_name}
                                  </h4>
                                  <span className="font-mono text-xs text-slate-400">
                                    {cand.candidate_code}
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                      isStrong
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    }`}
                                  >
                                    {cand.match_score}% Match • {cand.segment}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  {cand.current_title} at <strong>{cand.current_company}</strong> • {cand.total_experience_years} Years Exp • {cand.location}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Summary Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleCandidateSummary(cand)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors duration-150 ${
                                  hasSummary
                                    ? 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
                                    : 'border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {isLoadingSummary ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                <span>{hasSummary ? 'Hide summary' : 'Candidate summary'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => navigate(`/comparison?jd=${selectedJd.id}&candidate=${cand.id}`)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer transition-colors duration-150"
                              >
                                Full compare
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Skills Match Breakdown */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                            <span className="text-[10px] font-medium text-slate-500 mr-1">Skills alignment:</span>
                            {(cand.matched_skills || []).map((sk, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium"
                              >
                                ✓ {sk}
                              </span>
                            ))}
                            {(cand.missing_skills || []).slice(0, 4).map((sk, mIdx) => (
                              <span
                                key={mIdx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-medium"
                              >
                                Gap: {sk}
                              </span>
                            ))}
                          </div>

                          {/* Row 3: Transparent Match Justification */}
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            <strong className="text-slate-800 dark:text-slate-200 font-medium">Match justification: </strong>
                            {cand.explanation}
                          </div>

                          {/* Row 4: Expandable Summary Box */}
                          {hasSummary && (
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 space-y-1.5 animate-in fade-in">
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Candidate profile summary ({cand.full_name})</span>
                              </span>
                              <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs">
                                {candidateSummaries[cand.id]}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: COMPENSATION */}
              {workspaceTab === 'compensation' && (
                <div className="p-5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs space-y-3.5">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Compensation & Benefits Framework
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Salary band</span>
                      <span className="font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200">$140,000 - $185,000 USD</span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Equity incentive</span>
                      <span className="font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200">0.05% - 0.15% Stock Options</span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Benefits tier</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Tier 1 Comprehensive</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* UNIFIED RECRUITER AI ASSISTANT DRAWER (WRITING, OUTREACH & COMPLIANCE)     */}
            {/* ========================================================================= */}
            {showAssistantPanel && (
              <div className="w-full lg:w-88 shrink-0 p-4 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-sm space-y-3.5 animate-in fade-in slide-in-from-right-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        <span>Requisition Copilot</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Writing assistance and quality analysis</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssistantPanel(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Close Assistant"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Mode Tabs: Write | Quality | Templates */}
                <div className="grid grid-cols-3 gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder text-xs font-medium text-center">
                  <button
                    type="button"
                    onClick={() => setAssistantTab('write')}
                    className={`py-1 rounded-md transition-colors duration-150 cursor-pointer ${
                      assistantTab === 'write'
                        ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssistantTab('quality')}
                    className={`py-1 rounded-md transition-colors duration-150 cursor-pointer ${
                      assistantTab === 'quality'
                        ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Quality
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssistantTab('templates')}
                    className={`py-1 rounded-md transition-colors duration-150 cursor-pointer ${
                      assistantTab === 'templates'
                        ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Templates ({savedTemplates.length})
                  </button>
                </div>

                {/* TAB 1: WRITE & ENHANCE */}
                {assistantTab === 'write' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
                        Quick recruiter actions
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleAskAssistant('summarize_role')}
                          disabled={assistantLoading}
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Summarize role</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskAssistant('email_outreach')}
                          disabled={assistantLoading}
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 inline-flex items-center gap-1.5"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Outreach email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskAssistant('email_invite')}
                          disabled={assistantLoading}
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 inline-flex items-center gap-1.5"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Interview invite</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskAssistant('culture_perks')}
                          disabled={assistantLoading}
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 inline-flex items-center gap-1.5"
                        >
                          <Building2 className="w-3 h-3" />
                          <span>Culture & perks</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskAssistant('sms_reminder')}
                          disabled={assistantLoading}
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 inline-flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>SMS reminder</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskAssistant('recruiter_notes')}
                          disabled={assistantLoading}
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 inline-flex items-center gap-1.5"
                        >
                          <FileCheck2 className="w-3 h-3" />
                          <span>Hiring notes</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Loading Indicator */}
                    {assistantLoading && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating recruitment content...</span>
                      </div>
                    )}

                    {/* Generated Result Output */}
                    {generatedContent && !assistantLoading && (
                      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            Generated content
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">AI grounded</span>
                        </div>

                        <div className="text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap select-all bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          {generatedContent.text}
                        </div>

                        <div className="space-y-1.5">
                          {/* Insert button */}
                          <button
                            type="button"
                            onClick={handleInsertGeneratedContent}
                            className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150"
                          >
                            <CornerDownLeft className="w-3.5 h-3.5" />
                            <span>Insert into editor</span>
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedContent.text);
                                triggerToast('Copied output to clipboard.');
                              }}
                              className="py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors duration-150"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy text</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsSavingTemplateModal(true)}
                              className="py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors duration-150"
                            >
                              <Bookmark className="w-3 h-3" />
                              <span>Save template</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Template Save */}
                        {isSavingTemplateModal && (
                          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2 mt-2">
                            <input
                              type="text"
                              placeholder="Template Title (e.g. Outreach Email)..."
                              value={saveTemplateTitle}
                              onChange={(e) => setSaveTemplateTitle(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setIsSavingTemplateModal(false)}
                                className="px-2.5 py-1 rounded-md text-xs text-slate-500 hover:text-slate-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveCurrentAsTemplate}
                                className="px-3 py-1 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-medium shadow-2xs"
                              >
                                Save to library
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Free-form Recruiter Prompt Input */}
                    <form onSubmit={handleCustomAssistantQuery} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={assistantPrompt}
                          onChange={(e) => setAssistantPrompt(e.target.value)}
                          placeholder="Ask AI for drafting help..."
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={assistantLoading || !assistantPrompt.trim()}
                        className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150 shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Ask AI Assistant</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 2: QUALITY & INCLUSIVITY CHECK */}
                {assistantTab === 'quality' && (
                  <div className="space-y-3 animate-in fade-in">
                    <p className="text-xs text-slate-500 font-medium">
                      Compliance, tone, and market readiness report for this position.
                    </p>

                    {/* Overall Score Badge Card */}
                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                          Job Quality Score
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          Good
                        </span>
                      </div>
                      <span className="text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {validationReport?.completeness_percentage || 92}/100
                      </span>
                    </div>

                    {/* Detailed Analysis Breakdown */}
                    <div className="space-y-1.5">
                      <span className="font-medium text-xs text-slate-500 block">
                        Quality checks
                      </span>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">Legal compliance</span>
                          <span className="text-[10px] text-emerald-600 font-medium">High</span>
                        </div>
                        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">9/10</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">Bias & tone</span>
                          <span className="text-[10px] text-emerald-600 font-medium">Inclusive</span>
                        </div>
                        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">8/10</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">Role clarity</span>
                          <span className="text-[10px] text-emerald-600 font-medium">High</span>
                        </div>
                        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">8/10</span>
                      </div>
                    </div>

                    {/* Quality Observations Found */}
                    <div className="space-y-1.5">
                      <span className="font-medium text-xs text-slate-500 block">
                        Observations
                      </span>

                      {validationReport?.issues && validationReport.issues.length > 0 ? (
                        validationReport.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {issue.field || 'Specifications'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {issue.level || 'Moderate'}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                              {issue.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                          No critical compliance issues detected.
                        </div>
                      )}
                    </div>

                    {/* Action Button: Suggest Improvements */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setAssistantTab('write');
                          handleAskAssistant('missing_requirements');
                        }}
                        className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Suggest improvements</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: SAVED TEMPLATES */}
                {assistantTab === 'templates' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
                        Reusable team templates
                      </span>
                    </div>

                    {savedTemplates.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        No saved templates yet. Generate any content and click 'Save template'.
                      </p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {savedTemplates.map((tpl) => (
                          <div
                            key={tpl.id}
                            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                                {tpl.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {tpl.channel || 'Template'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{tpl.content}</p>
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(tpl.content);
                                  triggerToast(`Copied template "${tpl.title}"`);
                                }}
                                className="px-2 py-0.5 rounded text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-300 font-medium cursor-pointer"
                              >
                                Copy
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const addition = `\n\n${tpl.content}`;
                                  setEditDescription((prev) => (prev ? `${prev}${addition}` : tpl.content));
                                  setHasUnsavedChanges(true);
                                  triggerToast(`Inserted template into description editor.`);
                                }}
                                className="px-2.5 py-0.5 rounded text-[11px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium cursor-pointer shadow-2xs"
                              >
                                Insert into editor
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recruiter Manual Edit Modal */}
      <EditJDModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        jd={selectedJd}
        onSaved={() => {
          fetchJDs();
          triggerToast('Requisition specifications updated.');
        }}
      />

      {/* Version History Modal */}
      <JDVersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        jdId={selectedJd?.id}
        reqCode={selectedJd?.req_code}
      />

      {/* Upload & Paste JD Modal */}
      <UploadJDModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          fetchJDs();
          triggerToast('New job requisition ingested.');
        }}
      />

      {/* Side-by-Side Candidate Evaluation Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-surface-darkCard rounded-xl border border-slate-200 dark:border-surface-darkBorder shadow-lg p-5 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Columns className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Side-by-side candidate evaluation</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                      {selectedCandidateIds.length} candidates
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Candidate evaluation matrix comparing applicants against {selectedJd?.title || 'Selected Job'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Columns */}
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(selectedCandidateIds.length, 3)} gap-3.5`}>
              {candidates
                .filter((c) => selectedCandidateIds.includes(c.id))
                .map((cand) => {
                  const fitScore = cand.score || 85;
                  const fitTier = cand.fit_tier || (fitScore >= 80 ? 'strong' : fitScore >= 60 ? 'potential' : 'partial');
                  return (
                    <div
                      key={cand.id}
                      className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Candidate Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {cand.full_name}
                            </h4>
                            <p className="text-xs text-slate-500">{cand.current_title || 'Software Professional'}</p>
                            <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">{cand.total_experience_years || 4}+ years experience</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                              {fitScore}%
                            </span>
                            <span className="block text-[10px] font-medium text-slate-400">
                              Match score
                            </span>
                          </div>
                        </div>

                        {/* Fit Tier Badge */}
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                              fitTier === 'strong'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : fitTier === 'potential'
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                            }`}
                          >
                            <span>{fitTier.charAt(0).toUpperCase() + fitTier.slice(1)} fit verdict</span>
                          </span>
                        </div>

                        {/* Matched Core Skills */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Matched skills ({cand.matched_skills?.length || 0})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {cand.matched_skills && cand.matched_skills.length > 0 ? (
                              cand.matched_skills.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                                >
                                  ✓ {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">No direct keyword overlap</span>
                            )}
                          </div>
                        </div>

                        {/* Missing Competencies */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Skill gaps ({cand.missing_skills?.length || 0})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {cand.missing_skills && cand.missing_skills.length > 0 ? (
                              cand.missing_skills.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  ✕ {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-emerald-600 font-medium">100% skill coverage</span>
                            )}
                          </div>
                        </div>

                        {/* Key Strengths & Evaluation */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Evaluation insights
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                            {candidateSummaries[cand.id] ||
                              `${cand.full_name} exhibits ${fitScore >= 80 ? 'extensive senior-level domain expertise' : 'solid foundation with moderate ramp-up requirements'} against the core ${selectedJd?.title || 'job'} competency rubric.`}
                          </p>
                        </div>
                      </div>

                      {/* Individual Action */}
                      <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            bulkAssociateCandidates(selectedJd.id, { candidate_ids: [cand.id], action: 'shortlist' });
                            triggerToast(`${cand.full_name} shortlisted.`);
                          }}
                          className="w-full py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Shortlist {cand.full_name.split(' ')[0]}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close matrix
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleBulkAssociate('shortlist');
                  setIsCompareModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors duration-150"
              >
                <span>Shortlist all evaluated candidates</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
