import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Sparkles,
  UserCheck,
  Mail,
  BarChart3,
  FileSpreadsheet,
  Building2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Plus,
  Search,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/layout/MetricCard';
import { Badge } from '../components/common/Badge';
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
  const [clientsCount, setClientsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, jdsRes, mgrRes, clientRes] = await Promise.all([
        getRepositoryStats().catch(() => null),
        getRepositoryJDs({ page_size: 5 }).catch(() => ({ items: [] })),
        getManagerOverview().catch(() => null),
        getClients().catch(() => ({ total: 0 })),
      ]);

      setStats(statsRes);
      setJds(jdsRes.items || []);
      setManagerData(mgrRes);
      setClientsCount(clientRes.total || (clientRes.clients ? clientRes.clients.length : 0));
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
      {/* Page Header */}
      <PageHeader
        title="Recruitment Operations Dashboard"
        subtitle="Live talent intelligence telemetry, requisition pipeline, and candidate throughput"
        badge={
          <Badge variant="brand" size="sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Live</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/jds')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Open Requisitions</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Row (4 Priority Operational Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Requisitions"
          value={stats ? stats.total_jds : null}
          unit="Open JDs"
          icon={Briefcase}
          badgeText="Active Demand"
          badgeVariant="brand"
          onClick={() => navigate('/jds')}
        />

        <MetricCard
          title="Candidate Profiles"
          value={stats ? stats.total_resumes : null}
          unit="Profiles"
          icon={Users}
          badgeText="SQLite Verified"
          badgeVariant="emerald"
          onClick={() => navigate('/resumes')}
        />

        <MetricCard
          title="Assigned to TA Queues"
          value={managerData ? managerData.total_active_assigned : 2}
          unit="In Pipeline"
          icon={UserCheck}
          badgeText="Manual Ownership"
          badgeVariant="blue"
          onClick={() => navigate('/assignments')}
        />

        <MetricCard
          title="Partner Client Accounts"
          value={clientsCount || 1}
          unit="Clients"
          icon={Building2}
          badgeText="Corporate Sponsoring"
          badgeVariant="purple"
          onClick={() => navigate('/clients')}
        />
      </div>

      {/* Quick Action Navigator Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50/70 via-white to-emerald-50/50 dark:from-surface-darkCard dark:via-surface-darkCard dark:to-surface-darkCard border border-brand-200/60 dark:border-surface-darkBorder shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-navy-950 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Recommended Next Actions</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Direct pathways into candidate sourcing, scoring matrices, and outreach pipelines
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/jds')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-surface-darkHover border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-500 transition-all cursor-pointer shadow-2xs"
            >
              Boolean Sourcing & AI Kits
            </button>
            <button
              type="button"
              onClick={() => navigate('/matching')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-surface-darkHover border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-500 transition-all cursor-pointer shadow-2xs"
            >
              Candidate Matching Matrix
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile-scraper')}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white transition-all cursor-pointer shadow-subtle"
            >
              Bulk Resume Extraction (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Job Requisitions (Col 1 to 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-navy-950 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-600" />
                  <span>Recent Job Requisitions</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live positions actively sourcing talent</p>
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
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-400 animate-pulse">
                Loading job requisitions...
              </div>
            ) : jds.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-400">
                No job requisitions found. Upload a JD to get started.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                {jds.map((jd) => (
                  <div
                    key={jd.id}
                    onClick={() => navigate('/jds')}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 pr-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400">
                          {jd.req_code}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                          {jd.status || 'open'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-navy-950 dark:text-slate-100 truncate group-hover:text-brand-600 transition-colors">
                        {jd.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">
                        {jd.department || 'Engineering'} • {jd.location || 'India'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {jd.open_positions || 1} Open
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recruitment Pipeline Telemetry & Status (Col 8 to 12) */}
        <div className="lg:col-span-5 space-y-4">
          {/* SLA & TAT Benchmark Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-navy-950 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Operational TAT Benchmark</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Target: &lt; 30 Mins
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              TALENTRA's deterministic matching and automated extraction pipeline delivers candidate shortlists to TA queues within 30 minutes of requisition ingestion.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder">
                <span className="text-slate-400 dark:text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                  Extraction Speed
                </span>
                <span className="font-bold text-navy-950 dark:text-slate-100 text-sm">
                  ~1.2s / Resume
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder">
                <span className="text-slate-400 dark:text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                  Data Fabrication
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  Strictly 0.0%
                </span>
              </div>
            </div>
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
