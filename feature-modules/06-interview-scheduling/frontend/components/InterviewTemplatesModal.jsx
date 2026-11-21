import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Copy, Check, Clock, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import { interviewApi } from '../api';

export const InterviewTemplatesModal = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [copyingId, setCopyingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.getTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setActiveTemplate(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (templateId) => {
    setCopyingId(templateId);
    try {
      const duplicated = await interviewApi.duplicateTemplate(templateId);
      setTemplates((prev) => [duplicated, ...prev]);
      setActiveTemplate(duplicated);
    } catch (err) {
      setError(err.message || 'Failed to duplicate template.');
    } finally {
      setCopyingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#D9DEE8] dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9DEE8] dark:border-slate-800 flex items-center justify-between bg-[#F5F6FA] dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4F46B8]/10 text-[#4F46B8] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">
                Multi-Stage Interview Templates
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                F05 • Ashby-style repeatable hiring pipelines, stage durations, and panel buffers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Template Catalog */}
          <div className="w-72 border-r border-[#D9DEE8] dark:border-slate-800 p-4 overflow-y-auto space-y-2 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
            <div className="text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-2">
              Hiring Workflows ({templates.length})
            </div>
            {templates.map((tmpl) => {
              const isSelected = activeTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setActiveTemplate(tmpl)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col gap-1 ${
                    isSelected
                      ? 'border-[#4F46B8] bg-white dark:bg-slate-800 shadow-xs'
                      : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172033] dark:text-white truncate">
                      {tmpl.name}
                    </span>
                    {tmpl.is_global && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-100 text-[#4F46B8] font-bold">
                        Global
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 line-clamp-1">
                    {tmpl.description}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {tmpl.stages?.length || 0} Stages Configured
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Active Template Stage Pipeline */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {activeTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE8] dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-[#172033] dark:text-white">
                      {activeTemplate.name}
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">
                      {activeTemplate.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(activeTemplate.id)}
                    disabled={copyingId === activeTemplate.id}
                    className="px-3 py-1.5 rounded-xl border border-[#D9DEE8] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-[#172033] dark:text-white transition flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyingId === activeTemplate.id ? 'Copying...' : 'Duplicate Pipeline'}</span>
                  </button>
                </div>

                {/* Stage Steps List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#172033] dark:text-slate-200">
                    Interview Stage Sequence
                  </div>
                  {activeTemplate.stages && activeTemplate.stages.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      className="p-4 rounded-xl border border-[#D9DEE8] dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#4F46B8]/10 text-[#4F46B8] font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#172033] dark:text-white flex items-center gap-2">
                            <span>{st.stage_name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                              {st.interview_type}
                            </span>
                            {st.is_mandatory && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                Mandatory
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 flex items-center gap-3 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {st.duration_minutes} min duration
                            </span>
                            <span>•</span>
                            <span>{st.interviewer_role}</span>
                            <span>•</span>
                            <span className="text-slate-400">+{st.buffer_minutes}m buffer</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-purple-600 dark:text-purple-400">
                        {st.min_panel_size} Interviewer(s)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-500">
                Select a workflow template on the left to view stage details.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#D9DEE8] dark:border-slate-800 flex items-center justify-between bg-[#F5F6FA] dark:bg-slate-800/50">
          <div className="text-xs text-[#64748B] dark:text-slate-400">
            Templates can be bound to specific Job Requisitions or used globally across TALENTRA.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#4F46B8] hover:bg-[#3730A3] text-white text-xs font-semibold transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
