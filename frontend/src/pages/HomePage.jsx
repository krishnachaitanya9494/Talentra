import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getHealthStatus } from '../services/api';

/**
 * TALENTRA Development Environment Starter Page.
 *
 * Verifies and demonstrates:
 * 1. React rendering & lifecycle state hooks.
 * 2. React Router location awareness.
 * 3. Tailwind CSS styling & responsive grid layouts.
 * 4. Axios API communication with FastAPI & SQLite database health probe.
 */
export default function HomePage() {
  const location = useLocation();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-12 font-sans">
      {/* Header Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xl tracking-wider text-white shadow-lg shadow-indigo-500/20">
            T
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">TALENTRA</h1>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
              Talent Intelligence Platform
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Development Environment Ready
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto my-auto py-10 space-y-10">
        {/* Hero Section */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/50 mb-2">
            Infrastructure Baseline v0.1.0
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            TALENTRA
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-2xl">
            Talent Intelligence Platform
          </p>
          <p className="text-sm text-slate-500 max-w-xl">
            A clean, isolated, and verified foundation for recruitment analytics, candidate intelligence, and talent operations.
          </p>
        </div>

        {/* Environment Verification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* React Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Frontend Framework</div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">React 18</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Vite dev server + JSX rendering operational</p>
          </div>

          {/* Tailwind Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Styling Engine</div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">Tailwind CSS</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">Styled</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Utility classes & modern responsive layout</p>
          </div>

          {/* React Router Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client Router</div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">React Router</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">Routed</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">Path: {location.pathname}</p>
          </div>

          {/* SQLite Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dev Database</div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">SQLite + SQLAlchemy</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                {healthData?.database?.verified ? 'Connected' : 'Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono truncate" title={healthData?.database?.database_url}>
              {healthData?.database?.database_url || 'data/talentra_dev.db'}
            </p>
          </div>
        </div>

        {/* Backend & Database Live Health Panel */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Backend & Database Integration Probe</h3>
              <p className="text-xs text-slate-400">
                Live communication between React (Axios) &rarr; FastAPI &rarr; SQLite connection verification
              </p>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 transition disabled:opacity-50 border border-slate-700"
            >
              {loading ? 'Probing...' : 'Re-probe'}
            </button>
          </div>

          {loading && !healthData && (
            <div className="text-sm text-slate-400 animate-pulse py-4 text-center">
              Connecting to FastAPI backend (http://127.0.0.1:8000/health)...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs space-y-1">
              <div className="font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                Backend Connection Notice
              </div>
              <p>{error}</p>
              <p className="text-slate-400">Ensure FastAPI is running: <code className="bg-slate-900 px-1 py-0.5 rounded">uvicorn backend.app.main:app --reload</code></p>
            </div>
          )}

          {healthData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">API Status</span>
                <div className="text-emerald-400 font-bold text-sm mt-0.5 capitalize flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span>
                  {healthData.status}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Runtime Environment</span>
                <div className="text-slate-200 font-semibold text-sm mt-0.5 capitalize font-mono">
                  {healthData.environment}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Database Engine</span>
                <div className="text-slate-200 font-semibold text-sm mt-0.5 uppercase font-mono">
                  {healthData.database?.engine} ({healthData.database?.status})
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Probe Timestamp</span>
                <div className="text-slate-400 font-mono text-xs mt-0.5 truncate">
                  {new Date(healthData.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500">
        TALENTRA &copy; 2026 &bull; Talent Intelligence Platform &bull; Development Environment Baseline
      </footer>
    </div>
  );
}
