import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Users,
  Upload,
  RefreshCw,
  Search,
  Briefcase,
  Eye,
  Trash2,
  AlertCircle,
  Sparkles,
  HardDrive,
  Hash,
  Clock,
  Layers,
  FileSpreadsheet,
  GitMerge,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { SearchInput } from '../common/SearchInput';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { UploadJDModal } from './UploadJDModal';
import { UploadResumeModal } from './UploadResumeModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CandidateIntelligenceModal } from './CandidateIntelligenceModal';
import { CrmImportModal } from './CrmImportModal';
import { DuplicateReviewModal } from './DuplicateReviewModal';
import { ParsedJDModal } from './ParsedJDModal';
import {
  getRepositoryStats,
  getRepositoryJDs,
  getRepositoryJD,
  getRepositoryResumes,
  getRepositoryResume,
  deleteRepositoryDocument,
  syncRepositoryDocuments,
  getDuplicateCandidates,
} from '../../services/api';

export const DataExplorer = ({ activeTab = 'jds', onTabChange, onDataChange }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [stats, setStats] = useState(null);
  const [jdsData, setJdsData] = useState({ total: 0, items: [] });
  const [resumesData, setResumesData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [syncResult, setSyncResult] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Modals
  const [viewingDocument, setViewingDocument] = useState(null);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isJDModalOpen, setIsJDModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  // Phase 2 Intelligence Modals
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isCrmImportOpen, setIsCrmImportOpen] = useState(false);
  const [isDuplicateReviewOpen, setIsDuplicateReviewOpen] = useState(false);
  const [inspectingParsedJD, setInspectingParsedJD] = useState(null);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const switchTab = (tab) => {
    setCurrentTab(tab);
    setPage(1);
    if (onTabChange) onTabChange(tab);
  };

  const fetchStats = async () => {
    try {
      const data = await getRepositoryStats();
      setStats(data);
      setFetchError(null);
    } catch (err) {
      console.error('Failed to load repository stats:', err);
      setFetchError('Could not reach backend at http://127.0.0.1:8001. Please verify backend is running.');
    }
  };

  const checkDuplicatesCount = async () => {
    try {
      const dups = await getDuplicateCandidates();
      setDuplicateCount(dups ? dups.length : 0);
    } catch {
      setDuplicateCount(0);
    }
  };

  const fetchJDs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRepositoryJDs({ search, page, page_size: pageSize });
      setJdsData(data);
      setFetchError(null);
    } catch (err) {
      console.error('Failed to load JDs:', err);
      setFetchError('Failed to load Job Descriptions from repository API.');
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  const fetchResumes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRepositoryResumes({ search, page, page_size: pageSize });
      setResumesData(data);
      setFetchError(null);
    } catch (err) {
      console.error('Failed to load Resumes:', err);
      setFetchError('Failed to load Resumes from repository API.');
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchStats();
    checkDuplicatesCount();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, currentTab]);

  useEffect(() => {
    if (currentTab === 'jds') {
      fetchJDs();
    } else {
      fetchResumes();
    }
  }, [currentTab, fetchJDs, fetchResumes]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setFetchError(null);
      const res = await syncRepositoryDocuments();
      setSyncResult(res);
      await fetchStats();
      await checkDuplicatesCount();
      if (onDataChange) onDataChange();
      if (currentTab === 'jds') fetchJDs();
      else fetchResumes();
    } catch (err) {
      console.error('Sync failed:', err);
      setFetchError('Failed to sync repository documents with disk: ' + (err.message || 'Server error'));
    } finally {
      setSyncing(false);
    }
  };

  const openDocumentViewer = async (doc, type) => {
    try {
      const fullDoc = type === 'jd' ? await getRepositoryJD(doc.doc_id) : await getRepositoryResume(doc.doc_id);
      setViewingDocument(fullDoc);
    } catch {
      setViewingDocument(doc);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDocument) return;
    try {
      setDeleteLoading(true);
      await deleteRepositoryDocument(deletingDocument.doc_id, currentTab === 'jds' ? 'jd' : 'resume');
      setDeletingDocument(null);
      await fetchStats();
      if (onDataChange) onDataChange();
      if (currentTab === 'jds') fetchJDs();
      else fetchResumes();
    } catch (err) {
      setFetchError('Failed to delete document: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div id="data-explorer" className="space-y-6">
      {/* Disk Sync Status Banner */}
      {syncResult && (
        <div className="p-4 rounded-2xl bg-brand-50/90 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-brand-900 dark:text-brand-100">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <span>
              <strong>Disk Ingestion Synced:</strong> Ingested {syncResult.jds_synced} new JDs and {syncResult.resumes_synced} new Resumes. Total indexed: {syncResult.total_jds} JDs, {syncResult.total_resumes} Resumes.
            </span>
          </div>
          <button
            onClick={() => setSyncResult(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-4 text-base cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Connection / Fetch Error Banner */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong>Connection Issue:</strong> {fetchError}</span>
          </div>
          <button
            onClick={() => {
              fetchStats();
              if (currentTab === 'jds') fetchJDs();
              else fetchResumes();
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors cursor-pointer text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Control Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle">
        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => switchTab('jds')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'jds'
                ? 'bg-white dark:bg-surface-darkCard text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Descriptions</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-200 dark:bg-slate-800 font-mono font-bold">
              {stats ? stats.total_jds : jdsData.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('resumes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'resumes'
                ? 'bg-white dark:bg-surface-darkCard text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Resumes</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-200 dark:bg-slate-800 font-mono font-bold">
              {stats ? stats.total_resumes : resumesData.total}
            </span>
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              currentTab === 'jds'
                ? 'Search JDs by filename, code, or skills...'
                : 'Search resumes by candidate filename, code, or content...'
            }
            className="w-full sm:w-64"
          />

          {/* CRM Import Button */}
          <button
            type="button"
            onClick={() => setIsCrmImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Import candidates from CSV or Excel file with schema mapping"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-brand-500" />
            <span>Import CRM</span>
          </button>

          {/* Duplicate Review Button */}
          <button
            type="button"
            onClick={() => setIsDuplicateReviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Review and resolve candidate duplicate clusters"
          >
            <GitMerge className="w-3.5 h-3.5 text-amber-600" />
            <span>Duplicates</span>
            {duplicateCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 dark:bg-amber-800 font-mono font-bold">
                {duplicateCount}
              </span>
            )}
          </button>

          {/* Sync Disk Button */}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Scan data/ folder and sync new files into SQLite repository"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Disk'}</span>
          </button>

          {/* Upload Button */}
          {currentTab === 'jds' ? (
            <button
              type="button"
              onClick={() => setIsJDModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-900 dark:bg-brand-600 hover:bg-navy-950 dark:hover:bg-brand-700 text-white text-xs font-medium shadow-subtle transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload JD</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsResumeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium shadow-subtle transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Table Section */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle overflow-hidden">
        {currentTab === 'jds' ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-surface-darkBorder text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Doc Code</th>
                    <th className="py-3 px-4">Job Description File</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                        <span>Loading Job Descriptions from Repository...</span>
                      </td>
                    </tr>
                  ) : jdsData.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8">
                        <EmptyState
                          title="No Job Descriptions found"
                          description={
                            search
                              ? 'No documents matched your query.'
                              : 'Upload a Job Description or click "Sync Disk" to ingest existing files from data/jds.'
                          }
                          actionLabel="Upload Job Description"
                          onAction={() => setIsJDModalOpen(true)}
                        />
                      </td>
                    </tr>
                  ) : (
                    jdsData.items.map((doc) => (
                      <tr
                        key={doc.id}
                        onClick={() => openDocumentViewer(doc, 'jd')}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                          {doc.doc_id}
                        </td>
                        <td className="py-3 px-4 font-medium text-navy-900 dark:text-slate-100 max-w-md truncate group-hover:text-brand-600 transition-colors">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.original_filename}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                          {formatDate(doc.uploaded_at)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Phase 2: Parsed Requirements View */}
                            <button
                              type="button"
                              onClick={() => setInspectingParsedJD({ doc_id: doc.doc_id, title: doc.original_filename })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50/80 dark:bg-brand-950/50 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
                              title="Inspect structured parsed requirements & skills"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                              <span>Extracted Spec</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDocumentViewer(doc, 'jd')}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="View Document Raw Content"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingDocument(doc)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {jdsData.total > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-surface-darkBorder text-xs text-slate-500">
                <span>
                  Showing {Math.min(jdsData.total, (page - 1) * pageSize + 1)} to{' '}
                  {Math.min(jdsData.total, page * pageSize)} of {jdsData.total} Job Descriptions
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= jdsData.total}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-surface-darkBorder text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Doc Code</th>
                    <th className="py-3 px-4">Candidate File</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                        <span>Loading Candidate Resumes from Repository...</span>
                      </td>
                    </tr>
                  ) : resumesData.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8">
                        <EmptyState
                          title="No Resumes found"
                          description={
                            search
                              ? 'No resume documents matched your query.'
                              : 'Upload candidate resumes or click "Sync Disk" to ingest existing files from data/resumes.'
                          }
                          actionLabel="Upload Resume"
                          onAction={() => setIsResumeModalOpen(true)}
                        />
                      </td>
                    </tr>
                  ) : (
                    resumesData.items.map((doc) => (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedCandidateId(doc.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                          {doc.doc_id}
                        </td>
                        <td className="py-3 px-4 font-medium text-navy-900 dark:text-slate-100 max-w-xs truncate group-hover:text-brand-600 transition-colors">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.original_filename}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                          {formatDate(doc.uploaded_at)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Phase 2: Candidate Intelligence Profile Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedCandidateId(doc.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50/80 dark:bg-brand-950/50 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
                              title="Open structured Candidate Intelligence Profile"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-brand-500" />
                              <span>Intelligence</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDocumentViewer(doc, 'resume')}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="View Document Raw Content"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingDocument(doc)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {resumesData.total > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-surface-darkBorder text-xs text-slate-500">
                <span>
                  Showing {Math.min(resumesData.total, (page - 1) * pageSize + 1)} to{' '}
                  {Math.min(resumesData.total, page * pageSize)} of {resumesData.total} Candidate Resumes
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= resumesData.total}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewingDocument)}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
        docType={currentTab === 'jds' ? 'jd' : 'resume'}
      />

      {/* Deletion Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingDocument)}
        onClose={() => setDeletingDocument(null)}
        onConfirm={confirmDelete}
        document={deletingDocument}
        loading={deleteLoading}
        docType={currentTab === 'jds' ? 'jd' : 'resume'}
      />

      {/* Phase 2: Candidate Intelligence Modal */}
      <CandidateIntelligenceModal
        isOpen={Boolean(selectedCandidateId)}
        onClose={() => setSelectedCandidateId(null)}
        candidateId={selectedCandidateId}
        onCandidateUpdated={() => {
          fetchResumes();
          fetchStats();
        }}
      />

      {/* Phase 2: Parsed JD Modal */}
      <ParsedJDModal
        isOpen={Boolean(inspectingParsedJD)}
        onClose={() => setInspectingParsedJD(null)}
        jdDocId={inspectingParsedJD?.doc_id}
        jdTitle={inspectingParsedJD?.title}
      />

      {/* Phase 2: CRM Import Modal */}
      <CrmImportModal
        isOpen={isCrmImportOpen}
        onClose={() => setIsCrmImportOpen(false)}
        onSuccess={() => {
          fetchStats();
          checkDuplicatesCount();
          fetchResumes();
          if (onDataChange) onDataChange();
        }}
      />

      {/* Phase 2: Duplicate Review Modal */}
      <DuplicateReviewModal
        isOpen={isDuplicateReviewOpen}
        onClose={() => setIsDuplicateReviewOpen(false)}
        onMerged={() => {
          fetchStats();
          checkDuplicatesCount();
          fetchResumes();
          if (onDataChange) onDataChange();
        }}
      />

      {/* Ingestion Upload Modals */}
      <UploadJDModal
        isOpen={isJDModalOpen}
        onClose={() => setIsJDModalOpen(false)}
        onSuccess={() => {
          fetchStats();
          if (onDataChange) onDataChange();
          fetchJDs();
        }}
      />
      <UploadResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onSuccess={() => {
          fetchStats();
          if (onDataChange) onDataChange();
          fetchResumes();
        }}
      />
    </div>
  );
};
