import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Briefcase,
  Users,
  Sparkles,
  UserCheck,
  Mail,
  BarChart3,
  FileSpreadsheet,
  Building2,
  Globe,
  Settings,
  ArrowRight,
  Sun,
  Moon,
  Command,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const navigationCommands = [
    { id: 'dash', title: 'Executive Recruitment Dashboard', category: 'Navigation', icon: BarChart3, path: '/' },
    { id: 'jds', title: 'Job Requisitions Workspace', category: 'Navigation', icon: Briefcase, path: '/jds' },
    { id: 'resumes', title: 'Candidate Resumes & Profiles Directory', category: 'Navigation', icon: Users, path: '/resumes' },
    { id: 'matching', title: 'Candidate Matching & Scoring Matrix', category: 'Navigation', icon: Sparkles, path: '/matching' },
    { id: 'assignments', title: 'TA Assignments & Recruiter Queues', category: 'Navigation', icon: UserCheck, path: '/assignments' },
    { id: 'campaigns', title: 'Outreach & Email Campaigns', category: 'Navigation', icon: Mail, path: '/campaigns' },
    { id: 'analytics', title: 'Recruitment Analytics & TAT Intelligence', category: 'Navigation', icon: BarChart3, path: '/analytics' },
    { id: 'sourcing', title: 'JD Sourcing & Multi-Sheet Excel Export', category: 'Navigation', icon: FileSpreadsheet, path: '/sourcing' },
    { id: 'clients', title: 'Corporate Clients & Accounts Management', category: 'Navigation', icon: Building2, path: '/clients' },
    { id: 'scraper', title: 'Bulk Resume Data Extraction (Minimal)', category: 'Navigation', icon: Globe, path: '/profile-scraper' },
  ];

  const actionCommands = [
    {
      id: 'theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Actions',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => toggleTheme(),
    },
    {
      id: 'upload-jd',
      title: 'Upload New Job Description (PDF/DOCX/TXT)',
      category: 'Actions',
      icon: Briefcase,
      path: '/jds',
    },
    {
      id: 'upload-resume',
      title: 'Bulk Ingest Candidate Resumes',
      category: 'Actions',
      icon: Users,
      path: '/resumes',
    },
    {
      id: 'new-client',
      title: 'Register New Corporate Client Account',
      category: 'Actions',
      icon: Building2,
      path: '/clients',
    },
  ];

  const allItems = [...navigationCommands, ...actionCommands];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          executeItem(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems]);

  const executeItem = (item) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fadeIn">
      <div
        className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200 dark:border-surface-darkBorder max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-surface-darkBorder gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page, or action to jump..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-navy-950 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              ESC to close
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-brand-500" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Helper */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-surface-darkBorder flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><strong>↑↓</strong> to navigate</span>
            <span><strong>↵</strong> to select</span>
            <span><strong>ESC</strong> to dismiss</span>
          </div>
          <span className="font-mono text-[10px]">TALENTRA Command Palette</span>
        </div>
      </div>
    </div>
  );
};
