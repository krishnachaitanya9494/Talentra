import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Wrench,
  Activity,
  UserCheck,
  Search,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import {
  sendAgentMessage,
  getAgentTools,
  getAgentApprovals,
  actionAgentApproval,
  getAgentTraces,
  syncAgentEmbeddings,
} from '../services/api';

export default function RecruiterAgentPage() {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Hello! I am your **CompanyAI Enterprise Recruitment Agent**.\n\nI can execute deterministic 5-component candidate match rankings, compare candidates side-by-side, generate multi-platform Boolean sourcing strings, produce tailored interview screening kits, and inspect recruitment pipeline statistics.\n\n*Note: Mutative hiring actions (offers, stage advances, rejections) are automatically intercepted by my Human-in-the-Loop Safety Gate for recruiter sign-off.*',
      tools_called: [],
      latency_ms: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'approvals', 'traces', 'tools'
  const [approvals, setApprovals] = useState([]);
  const [traces, setTraces] = useState([]);
  const [tools, setTools] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const messagesEndRef = useRef(null);

  const sessionId = 'recruiter-session-main';

  useEffect(() => {
    fetchApprovals();
    fetchTraces();
    fetchTools();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchApprovals = async () => {
    try {
      const data = await getAgentApprovals();
      setApprovals(data || []);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    }
  };

  const fetchTraces = async () => {
    try {
      const data = await getAgentTraces(15);
      setTraces(data || []);
    } catch (err) {
      console.error('Failed to load traces:', err);
    }
  };

  const fetchTools = async () => {
    try {
      const data = await getAgentTools();
      setTools(data?.tools || []);
    } catch (err) {
      console.error('Failed to load tools:', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const data = await sendAgentMessage(sessionId, text);
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        tools_called: data.tools_called || [],
        latency_ms: data.latency_ms,
        trace_id: data.trace_id,
        approval_request: data.approval_request,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (data.approval_request) {
        fetchApprovals();
      }
      fetchTraces();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '❌ Communication error with the recruitment agent. Please check server status.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalAction = async (approvalId, action) => {
    setActionLoading((prev) => ({ ...prev, [approvalId]: true }));
    try {
      await actionAgentApproval(approvalId, action, 'Krishna Chaitanya (Recruiter Lead)');
      await fetchApprovals();
      // Add confirmation note in chat
      setMessages((prev) => [
        ...prev,
        {
          id: `appr-${Date.now()}`,
          role: 'system',
          content: `✅ Action **${action.toUpperCase()}** recorded for Approval Request \`${approvalId}\` by Recruiter Lead.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      alert(`Approval error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [approvalId]: false }));
    }
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Bot className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Enterprise Recruitment Agent
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-surface-darkHover text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              CompanyAI 2.0 • Nemotron Super-VL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Autonomous recruitment operations with 5-component deterministic scoring, 2,048-dim vector embeddings, and a Human-in-the-Loop Safety Gate.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900/40 text-xs">
            <span className="text-slate-500 block text-[11px]">8 Tools Registered</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">Autonomous Dispatch</span>
          </div>
          <div className={`px-3.5 py-1.5 rounded-lg border text-xs ${
            pendingApprovalsCount > 0
              ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
              : 'border-slate-200/80 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
          }`}>
            <span className="block text-[11px] opacity-80">Pending Approvals</span>
            <span className="font-semibold font-mono">{pendingApprovalsCount} Waiting</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-surface-darkBorder pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Agent Workspace</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors relative ${
            activeTab === 'approvals'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Governance & Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-mono">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('traces')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'traces'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Traces & Telemetry</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'tools'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Tool Calling Registry ({tools.length})</span>
        </button>
      </div>

      {/* TAB 1: AGENT CHAT WORKSPACE */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Chat Stream */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-2xs flex flex-col h-[650px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 font-mono">
                    <span>{msg.role === 'user' ? 'Recruiter' : msg.role === 'system' ? 'Safety System' : 'Nemotron AI'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.latency_ms > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ({msg.latency_ms}ms)
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : msg.role === 'system'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Tools Called Telemetry Badge */}
                    {msg.tools_called && msg.tools_called.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap gap-2">
                        {msg.tools_called.map((tc, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            <Wrench className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            <span>{tc.tool}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {tc.latency_ms}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Approval Card if proposed */}
                    {msg.approval_request && (
                      <div className="mt-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            Pending Recruiter Approval: {msg.approval_request.approval_id}
                          </span>
                          <span className="px-1.5 py-0.5 rounded font-mono bg-amber-100 text-amber-800 uppercase text-[10px]">
                            {msg.approval_request.status}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-3">
                          {msg.approval_request.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprovalAction(msg.approval_request.approval_id, 'approve')}
                            disabled={actionLoading[msg.approval_request.approval_id]}
                            className="px-3 py-1 rounded-md text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve Action
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprovalAction(msg.approval_request.approval_id, 'reject')}
                            disabled={actionLoading[msg.approval_request.approval_id]}
                            className="px-3 py-1 rounded-md text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono py-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span>Nemotron AI executing tool dispatch & RAG synthesis...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestions */}
            <div className="px-4 py-2 border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] text-slate-400 shrink-0 font-medium">Quick Prompts:</span>
              <button
                type="button"
                onClick={() => handleSendMessage('Match candidates for job #1')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 shrink-0 transition-colors"
              >
                Match candidates to Job #1
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Compare candidates 1 and 2 for job #1')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 shrink-0 transition-colors"
              >
                Compare Candidates #1 & #2
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Generate boolean search strings for Cloud Architect')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 shrink-0 transition-colors"
              >
                Boolean Query
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Give me a recruitment pipeline summary')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 shrink-0 transition-colors"
              >
                Pipeline Metrics
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Extend employment offer to candidate #1')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-surface-darkCard border border-amber-300 dark:border-amber-700 hover:border-amber-500 text-amber-800 dark:text-amber-300 shrink-0 transition-colors"
              >
                Test Safety Gate (Offer)
              </button>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-slate-200/80 dark:border-surface-darkBorder flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Nemotron AI to evaluate candidates, generate sourcing queries, or draft interview kits..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-darkHover text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* Right Context Panel */}
          <div className="space-y-4">
            {/* Quick Actions Panel */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-2xs space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Architectural Pillars
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                    1. 5-Component Scorer
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block">
                    Mandatory (35%) + Preferred (20%) + Exp (15%) + Domain (10%) + 2048-dim Vector (20%).
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                    2. Mandatory Gap Policy
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block">
                    Missing 1 mandatory skill caps tier at Potential Match; missing ≥2 caps at Partial Match.
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                    3. Safety Gate Interceptor
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block">
                    Mutations (offers, rejects, advances) write pending approvals; zero rogue actions.
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                    4. Vector Fallback Policy
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block">
                    Zero false semantic contribution when offline; structured criteria re-normalize proportionally to 100%.
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 dark:border-surface-darkBorder">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await syncAgentEmbeddings();
                      alert('Vector embeddings successfully generated and synchronized!');
                    } catch (e) {
                      alert('Sync failed: ' + e.message);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync 2048-dim Vectors</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOVERNANCE & APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Human-in-the-Loop Governance & Approvals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sensitive hiring actions intercepted by the agent requiring explicit recruiter sign-off before state mutation.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchApprovals}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {approvals.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">
              No approval requests registered yet. Try asking the agent to "Offer candidate #1" in the chat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Approval ID</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Requested By</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {approvals.map((appr) => (
                    <tr key={appr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {appr.approval_id}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {appr.action_type}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs">
                        {appr.description}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            appr.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : appr.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {appr.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{appr.requested_by}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {appr.created_at?.slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {appr.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprovalAction(appr.approval_id, 'approve')}
                              disabled={actionLoading[appr.approval_id]}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprovalAction(appr.approval_id, 'reject')}
                              disabled={actionLoading[appr.approval_id]}
                              className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            Resolved by {appr.resolved_by || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRACES & TELEMETRY */}
      {activeTab === 'traces' && (
        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Agent Execution Audit Traces
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable trace records logging every agent turn, dispatched tools, execution latencies, and token metrics.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchTraces}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Trace ID</th>
                  <th className="py-2.5 px-3">Prompt</th>
                  <th className="py-2.5 px-3">Dispatched Tools</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Tokens (Est.)</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {traces.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {tr.trace_id}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {tr.prompt}
                    </td>
                    <td className="py-3 px-3">
                      {tr.tools_called?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {tr.tools_called.map((tc, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-surface-darkHover text-[10px]"
                            >
                              {tc.tool}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                      {tr.latency_ms}ms
                    </td>
                    <td className="py-3 px-3 text-slate-500">{tr.tokens_used}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {tr.created_at?.slice(0, 19).replace('T', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TOOL REGISTRY */}
      {activeTab === 'tools' && (
        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Tool Calling Registry (OpenAI Function Calling Format)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic and vector tools available for autonomous execution by the Nemotron orchestrator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((t, idx) => {
              const fn = t.function;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {fn.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {fn.description}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      Parameters Schema:
                    </span>
                    <pre className="p-2 rounded bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-slate-700 text-[11px] font-mono overflow-x-auto text-slate-700 dark:text-slate-300">
                      {JSON.stringify(fn.parameters?.properties || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
