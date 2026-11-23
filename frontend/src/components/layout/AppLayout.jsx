import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageTransition } from '../common/PageTransition';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useTheme } from '../../context/ThemeContext';

/**
 * Main application shell for TALENTRA.
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

  useEffect(() => {
    if (window.innerWidth < 768) setIsSidebarCollapsed(true);
  }, [location.pathname]);

  return (
    <div
      className={`h-screen flex overflow-hidden ${
        theme === 'dark' ? 'dark bg-surface-darkCanvas text-slate-100' : 'bg-surface-50 text-navy-900'
      } font-sans selection:bg-brand-100 selection:text-brand-700`}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        activeRoute={location.pathname}
      />
      {!isSidebarCollapsed && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarCollapsed(true)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main
          className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 ${
            theme === 'dark' ? 'bg-surface-darkCanvas' : 'bg-surface-50'
          }`}
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
