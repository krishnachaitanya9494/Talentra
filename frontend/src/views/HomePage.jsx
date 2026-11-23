import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/layout/MetricCard';
import { DataExplorer } from '../components/documents/DataExplorer';
import { JobWorkspace } from '../components/documents/JobWorkspace';
import { CandidateDirectory } from '../components/documents/CandidateDirectory';
import { CandidateIntelligenceModal } from '../components/documents/CandidateIntelligenceModal';
import { AssignCandidatesModal } from '../components/assignments/AssignCandidatesModal';
import { getRepositoryStats } from '../services/api';

/**
 * TALENTRA Talent Operations Hub.
 *
 * Dedicated workspace for managing Job Descriptions and Candidate Resumes.
 * Minimalist, high-performance executive dashboard cards.
 */
export default function HomePage({ defaultTab = 'jds' }) {
  const [selectedTab, setSelectedTab] = useState(defaultTab);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState('workspace'); // 'workspace' vs 'files'
  const [inspectCandidateId, setInspectCandidateId] = useState(null);
  const [assigningCandidateIds, setAssigningCandidateIds] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getRepositoryStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch repository statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setSelectedTab(defaultTab);
  }, [defaultTab]);

  const handleCardClick = (tab) => {
    setSelectedTab(tab);
    const explorerEl = document.getElementById('data-explorer');
    if (explorerEl) {
      explorerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatMb = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  if (defaultTab === 'jds' && workspaceMode === 'workspace') {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <JobWorkspace
          onInspectCandidate={(id) => setInspectCandidateId(id)}
          onUploadJD={fetchStats}
        />
        {inspectCandidateId && (
          <CandidateIntelligenceModal
            isOpen={!!inspectCandidateId}
            onClose={() => setInspectCandidateId(null)}
            candidateId={inspectCandidateId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title={selectedTab === 'jds' ? 'Job requisitions' : 'Candidate resumes'}
        subtitle="Manage job descriptions and candidate records"
        actions={
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        }
      />

      {/* Primary KPI Metric Cards (Clean, Minimal, & Interactive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Job Descriptions KPI Card */}
        <MetricCard
          title="Job requisitions"
          value={stats ? stats.total_jds : null}
          unit="roles"
          isSelected={selectedTab === 'jds'}
          onClick={() => handleCardClick('jds')}
        />

        {/* Candidate Resumes KPI Card */}
        <MetricCard
          title="Candidate resumes"
          value={stats ? stats.total_resumes : null}
          unit="resumes"
          isSelected={selectedTab === 'resumes'}
          onClick={() => handleCardClick('resumes')}
        />
      </div>

      {/* Mode Switcher for JDs and Resumes */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder text-xs shadow-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWorkspaceMode('workspace')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              workspaceMode === 'workspace'
                ? 'bg-brand-600 text-white shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {selectedTab === 'jds'
              ? 'Job workspace'
                : 'Candidate directory'}
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('files')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              workspaceMode === 'files'
                ? 'bg-brand-600 text-white shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {selectedTab === 'jds'
              ? 'Stored job files'
                : 'Stored resume files'}
          </button>
        </div>

        <span className="text-[11px] text-slate-400 pr-2 hidden sm:inline">
          {workspaceMode === 'workspace' ? 'Review and manage records' : 'Review uploaded files'}
        </span>
      </div>

      {/* Main Content Area */}
      {selectedTab === 'jds' && workspaceMode === 'workspace' ? (
        <JobWorkspace
          onInspectCandidate={(id) => setInspectCandidateId(id)}
          onUploadJD={fetchStats}
        />
      ) : selectedTab === 'resumes' && workspaceMode === 'workspace' ? (
        <CandidateDirectory
          onInspectCandidate={(id) => setInspectCandidateId(id)}
          onAssignCandidates={(ids) => setAssigningCandidateIds(ids)}
          onUploadComplete={fetchStats}
        />
      ) : (
        <DataExplorer
          activeTab={selectedTab}
          onTabChange={(tab) => setSelectedTab(tab)}
          onDataChange={fetchStats}
        />
      )}

      {/* Candidate Profile Inspector Modal */}
      {inspectCandidateId && (
        <CandidateIntelligenceModal
          isOpen={!!inspectCandidateId}
          onClose={() => setInspectCandidateId(null)}
          candidateId={inspectCandidateId}
        />
      )}

      {/* Assign Candidates Modal */}
      {assigningCandidateIds && (
        <AssignCandidatesModal
          isOpen={!!assigningCandidateIds}
          onClose={() => setAssigningCandidateIds(null)}
          candidateIds={assigningCandidateIds}
          onAssigned={() => {
            setAssigningCandidateIds(null);
            fetchStats();
          }}
        />
      )}

      {/* Footer System Note */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-6">
        TALENTRA &copy; 2026 &bull; Enterprise Talent Operations &bull; AI Powered Recruitment Hub
      </div>
    </div>
  );
}
