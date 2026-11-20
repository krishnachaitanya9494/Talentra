import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageTransition } from '../common/PageTransition';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useTheme } from '../../context/ThemeContext';

/**
 * Main Application Shell Layout for TALENTRA.
 *
 * Faithfully reproduces the CompanyAI application shell:
 * - Full-height viewport shell with overflow isolation (h-screen flex overflow-hidden)
 * - Cohesive dark/light theme switching with smooth background transitions
 * - Collapsible navigation sidebar (w-64 expanded, w-16 collapsed icon rail)
 * - Glass-surface Topbar with global search, AI actions, and user menus
 * - PageTransition-wrapped main content area
 */
export default function AppLayout({ children }) {
  const { theme } = useTheme();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('collapsed') === 'true') return true;
      return window.innerWidth < 768;
    }
    return false;
  });

  return (
    <div
      className={`h-screen flex overflow-hidden ${
        theme === 'dark' ? 'dark bg-surface-darkCanvas text-slate-100' : 'bg-surface-50 text-navy-900'
      } font-sans selection:bg-brand-100 selection:text-brand-700 transition-colors duration-200`}
    >
      {/* Sticky Left Navigation Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        activeRoute={location.pathname}
      />

      {/* Main Execution Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky Top Header Bar */}
        <Topbar
          title="Environment Overview"
          subtitle="Talent Intelligence Platform • Development Baseline"
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Scrollable Page Body with Subtle Entrance Animation */}
        <main
          className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 ${
            theme === 'dark' ? 'bg-surface-darkCanvas' : 'bg-surface-50'
          } transition-colors`}
        >
          <PageTransition transitionKey={location.pathname}>
            <ErrorBoundary title="Section Rendering Error">
              {children || <Outlet />}
            </ErrorBoundary>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
