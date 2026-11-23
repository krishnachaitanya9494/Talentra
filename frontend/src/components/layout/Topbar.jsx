import React, { useEffect, useState } from 'react';
import { ChevronDown, Menu, Moon, Search, Sun, Bot } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { CommandPalette } from '../common/CommandPalette';

export const Topbar = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-14 shrink-0 px-4 sm:px-6 border-b border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard flex items-center justify-between sticky top-0 z-20">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open or close navigation"
          className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-darkHover"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            aria-label="Search and quick actions"
            title="Search (Ctrl+K or Cmd+K)"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkHover text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-darkCard text-slate-500 dark:text-slate-400">
              Ctrl / ⌘ K
            </kbd>
          </button>

          <NavLink
            to="/agent"
            title="Open AI Recruiter Agent"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Recruiter Agent</span>
          </NavLink>

          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-darkHover"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-expanded={isProfileMenuOpen}
              aria-label="Open user menu"
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-darkHover"
            >
              <span className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-surface-darkHover text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-medium">
                KC
              </span>
              <ChevronDown className="hidden sm:block w-4 h-4 text-slate-500" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard p-2 text-sm shadow-dropdown z-50">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-surface-darkBorder mb-1">
                  <span className="font-medium text-navy-900 dark:text-white block">Krishna Chaitanya</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Recruiter admin</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-darkHover"
                >
                  Quick actions
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};

export default Topbar;
