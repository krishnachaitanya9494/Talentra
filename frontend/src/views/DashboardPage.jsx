import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Mail,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/layout/MetricCard';
import {
  getRepositoryStats,
  getRepositoryJDs,
  getManagerOverview,
  getClients,
} from '../services/api';
import apiClient from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [jds, setJds] = useState([]);
  const [managerData, setManagerData] = useState(null);
  const [clientsCount, setClientsCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, jdsRes, mgrRes, clientRes] = await Promise.all([
        getRepositoryStats().catch(() => null),
        getRepositoryJDs({ page_size: 5 }).catch(() => ({ items: [] })),
        getManagerOverview().catch(() => null),
        getClients().catch(() => null),
      ]);

      setStats(statsRes);
      setJds(jdsRes.items || []);
      setManagerData(mgrRes);
      setClientsCount(clientRes ? (clientRes.total ?? clientRes.clients?.length ?? 0) : null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Recruitment overview"
        subtitle="Current requisitions, candidate profiles, and recruiter assignments"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder hover:bg-slate-50 dark:hover:bg-surface-darkHover text-slate-700 dark:text-slate-300 text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/jds')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Open Requisitions</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Job descriptions"
          value={stats ? stats.total_jds : null}
          unit="documents"
          onClick={() => navigate('/jds')}
        />

        <MetricCard
          title="Candidate profiles"
          value={stats ? stats.total_resumes : null}
          unit="resumes"
          onClick={() => navigate('/resumes')}
        />

        <MetricCard
          title="Assigned candidates"
          value={managerData?.total_active_assigned ?? null}
          unit="active"
          onClick={() => navigate('/assignments')}
        />

        <MetricCard
          title="Client accounts"
          value={clientsCount}
          unit="clients"
          onClick={() => navigate('/clients')}
        />
      </div>

      <div className="p-4 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-base text-navy-950 dark:text-white">Quick actions</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Continue a recruitment workflow</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/sourcing')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-darkHover transition-colors cursor-pointer"
            >
              Source candidates
            </button>
            <button
              type="button"
              onClick={() => navigate('/matching')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-darkHover transition-colors cursor-pointer"
            >
              Match candidates
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile-scraper')}
              className="px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 text-sm font-medium text-white transition-colors cursor-pointer"
            >
              Extract resumes
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent job description uploads */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-navy-950 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-600" />
                  <span>Recently uploaded job descriptions</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Latest files from the job description repository</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/jds')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                <span>View All JDs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading job descriptions...
              </div>
            ) : jds.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-400">
                No job descriptions uploaded yet. Add one from Job Requisitions.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                {jds.map((jd) => (
                  <button
                    type="button"
                    key={jd.id}
                    onClick={() => navigate('/jds')}
                    className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-surface-darkHover rounded-lg px-2 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 pr-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400">
                          {jd.doc_id}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {jd.processing_status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-navy-950 dark:text-slate-100 truncate group-hover:text-brand-600 transition-colors">
                        {jd.original_filename}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Uploaded {jd.uploaded_at ? new Date(jd.uploaded_at).toLocaleDateString() : '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recruiter guidance and workspace shortcuts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder space-y-2">
            <h3 className="font-semibold text-base text-navy-950 dark:text-white">Review with evidence</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Compare candidates against documented role requirements and review the source resume before making a decision.
            </p>
          </div>

          {/* Quick Workspaces Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3 text-xs">
            <h3 className="font-bold text-sm text-navy-950 dark:text-white">
              Recruitment Workspaces
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/resumes')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-surface-darkBorder transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-brand-600" />
                  <div>
                    <span className="font-bold text-navy-950 dark:text-slate-100 block">
                      Candidate Directory & Inspector
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      Explore skills inventories, career histories & evidence
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/campaigns')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-surface-darkBorder transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-brand-600" />
                  <div>
                    <span className="font-bold text-navy-950 dark:text-slate-100 block">
                      Outreach & Email Campaigns
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      Manager-approved candidate outreach & communications
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/analytics')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-surface-darkBorder transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-brand-600" />
                  <div>
                    <span className="font-bold text-navy-950 dark:text-slate-100 block">
                      Recruitment Conversion Funnel
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      9-stage drop-off analytics & recruiter workload
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
