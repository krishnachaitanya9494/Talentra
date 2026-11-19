import React, { useState, useEffect } from 'react';
import {
  Layers,
  Cpu,
  Database,
  RefreshCw,
  Server,
  Activity,
  Code2,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { MetricCard } from '../components/layout/MetricCard';
import { Badge } from '../components/common/Badge';
import { ExpandableSection } from '../components/common/ExpandableSection';
import { getHealthStatus } from '../services/api';

/**
 * TALENTRA Environment Overview Page.
 *
 * Implements CompanyAI's visual design language:
 * - PageHeader with BlurText typography entrance
 * - MetricCard KPIs with SpotlightCard reflective hover & numeric reveal
 * - Semantic Badges (brand, success, navy, warning, accent)
 * - ExpandableSection for progressive disclosure of technical specifications
 * - Light and Dark theme contrast across all surfaces
 */
export default function HomePage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHealthStatus();
      setHealthData(data);
    } catch (err) {
      setError(err.message || 'Failed to reach FastAPI backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Environment Overview"
        subtitle="Talent Intelligence Platform • Verified Development Baseline & Infrastructure Diagnostics"
        badge={
          <Badge variant="brand" size="sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <span>Infrastructure Active</span>
          </Badge>
        }
        actions={
          <button
            type="button"
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-900 dark:bg-brand-600 hover:bg-navy-950 dark:hover:bg-brand-700 text-white text-btn-text shadow-subtle transition-all duration-150 btn-interactive disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Probing...' : 'Re-probe System'}</span>
          </button>
        }
      />

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* React Frontend KPI */}
        <MetricCard
          title="Frontend Engine"
          value="React 18"
          subvalue="Vite 6 + JSX Fast Refresh"
          icon={Layers}
          badgeText="Operational"
          badgeVariant="brand"
          trend="Sub-second build time"
          spotlight
        />

        {/* Styling System KPI */}
        <MetricCard
          title="Design System"
          value="CompanyAI"
          subvalue="Tailwind CSS + Dark/Light Theme"
          icon={Code2}
          badgeText="Synchronized"
          badgeVariant="emerald"
          trend="Lucide React • Design Tokens"
          spotlight
        />

        {/* Backend API KPI */}
        <MetricCard
          title="API Gateway"
          value="FastAPI"
          subvalue="Uvicorn ASGI • Port 8000"
          icon={Cpu}
          badgeText={healthData ? 'Live (200 OK)' : 'Probing...'}
          badgeVariant={healthData ? 'brand' : 'amber'}
          trend="Asynchronous Architecture"
          spotlight
        />

        {/* Database Engine KPI */}
        <MetricCard
          title="Data Storage"
          value="SQLite"
          subvalue={healthData?.database?.database_url || 'data/talentra_dev.db'}
          icon={Database}
          badgeText={healthData?.database?.verified ? 'Connected' : 'Pending'}
          badgeVariant={healthData?.database?.verified ? 'brand' : 'amber'}
          trend="SQLAlchemy 2.0 ORM"
          spotlight
        />
      </div>

      {/* Backend & Database Live Diagnostics Panel */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder card-reflective space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-surface-darkBorder pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border border-brand-200/80 dark:border-brand-700/60">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-card-title text-navy-900 dark:text-white font-display">
                Real-Time Health & Database Diagnostics
              </h3>
              <p className="text-helper-text text-slate-500 dark:text-slate-400">
                Active end-to-end communication probe: React (Axios) &rarr; FastAPI &rarr; SQLite (<code className="font-mono text-xs">SELECT 1</code>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {healthData?.status === 'operational' ? (
              <Badge variant="success" size="md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Backend Healthy</span>
              </Badge>
            ) : loading ? (
              <Badge variant="warning" size="md">
                <span>Connecting...</span>
              </Badge>
            ) : (
              <Badge variant="danger" size="md">
                <span>Degraded</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
            <Server className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Backend Communication Notice</span>
              <p>{error}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-mono">
                Launch server: <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">.\run_backend.ps1</code>
              </p>
            </div>
          </div>
        )}

        {/* Diagnostics Metrics Row */}
        {healthData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-darkHover border border-slate-200/60 dark:border-surface-darkBorder">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                Platform Service
              </span>
              <span className="text-navy-900 dark:text-white font-bold text-sm mt-1 block truncate">
                {healthData.app_name}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-darkHover border border-slate-200/60 dark:border-surface-darkBorder">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                Runtime Environment
              </span>
              <span className="text-brand-600 dark:text-brand-400 font-bold text-sm mt-1 capitalize block font-mono">
                {healthData.environment} (v{healthData.version})
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-darkHover border border-slate-200/60 dark:border-surface-darkBorder">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                SQL Engine & Dialect
              </span>
              <span className="text-navy-900 dark:text-white font-bold text-sm mt-1 uppercase block font-mono">
                {healthData.database?.engine} &bull; {healthData.database?.status}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-darkHover border border-slate-200/60 dark:border-surface-darkBorder">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                UTC Probe Timestamp
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-mono text-xs mt-1 block truncate">
                {new Date(healthData.timestamp).toLocaleTimeString()} ({new Date(healthData.timestamp).toLocaleDateString()})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Technical Documentation & Verification Sections */}
      <div className="space-y-3">
        <ExpandableSection
          title="Design System & Architecture Alignment"
          badge="CompanyAI 2.0 Spec"
          icon={Code2}
          defaultExpanded={true}
        >
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
            <p>
              TALENTRA shares the exact design tokens, typography hierarchy, and visual components established by <strong>CompanyAI</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-darkHover border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="font-semibold text-navy-900 dark:text-white text-xs block mb-1">
                  Typography Tokens
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block">
                  Plus Jakarta Sans (headings), Inter (body 15-16px), JetBrains Mono (data & tables).
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-darkHover border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="font-semibold text-navy-900 dark:text-white text-xs block mb-1">
                  Color Canvas
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block">
                  Light: #F8FAFC canvas, #FFFFFF card. Dark: #000000 true black canvas, #0A0A0A card.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-darkHover border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="font-semibold text-navy-900 dark:text-white text-xs block mb-1">
                  Icon & Motion Primitives
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block">
                  Lucide React, SpotlightCard reflective glows, Magnet buttons, smooth card elevation.
                </span>
              </div>
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection
          title="Interactive API Documentation & Endpoint Reference"
          badge="FastAPI OpenAPI"
          icon={Terminal}
          defaultExpanded={false}
        >
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 pt-2">
            <p>
              The FastAPI backend exposes native OpenAPI schemas and interactive documentation:
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-darkHover border border-slate-200 dark:border-surface-darkBorder text-navy-900 dark:text-white font-medium text-xs hover:border-brand-500 transition-colors"
              >
                <span>Interactive Swagger UI (/docs)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href="http://127.0.0.1:8000/redoc"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-darkHover border border-slate-200 dark:border-surface-darkBorder text-navy-900 dark:text-white font-medium text-xs hover:border-brand-500 transition-colors"
              >
                <span>ReDoc Schema (/redoc)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </ExpandableSection>
      </div>

      {/* Footer System Note */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4 pb-2">
        TALENTRA &copy; 2026 &bull; Talent Intelligence Platform &bull; CompanyAI Design Ecosystem Baseline
      </div>
    </div>
  );
}
