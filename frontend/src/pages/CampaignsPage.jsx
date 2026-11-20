import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Send,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  XCircle,
  MessageSquare,
  FileText,
  Briefcase,
  ShieldAlert,
  ChevronRight,
  Eye,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import axios from 'axios';
import CreateCampaignModal from '../components/outreach/CreateCampaignModal';

/**
 * CampaignsPage Component (TALENTRA Phase 5).
 *
 * Full campaign management hub supporting:
 * - Mode B Approved Automated Campaigns
 * - Explicit Manager Approval / Rejection controls
 * - Live Campaign Execution and progress tracking
 * - Recruitment Email Template directory and variable explorer
 */
export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'templates'
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState({});

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [campRes, tempRes] = await Promise.all([
        axios.get('/api/v1/outreach/campaigns'),
        axios.get('/api/v1/outreach/templates'),
      ]);
      setCampaigns(campRes.data.items || []);
      setTemplates(tempRes.data.items || []);
      if (tempRes.data.items?.length > 0 && !selectedTemplateForPreview) {
        setSelectedTemplateForPreview(tempRes.data.items[0]);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Unable to retrieve outreach campaign data.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (campaignId) => {
    try {
      setActionInProgress((prev) => ({ ...prev, [campaignId]: 'approving' }));
      await axios.post(`/api/v1/outreach/campaigns/${campaignId}/approve`, {
        notes: 'Approved for automated delivery by Recruitment Operations.',
      });
      await fetchData();
    } catch (err) {
      alert('Approval failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionInProgress((prev) => ({ ...prev, [campaignId]: null }));
    }
  };

  const handleReject = async (campaignId) => {
    const reason = window.prompt('Please enter a rejection reason:');
    if (!reason) return;
    try {
      setActionInProgress((prev) => ({ ...prev, [campaignId]: 'rejecting' }));
      await axios.post(`/api/v1/outreach/campaigns/${campaignId}/reject`, { reason });
      await fetchData();
    } catch (err) {
      alert('Rejection failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionInProgress((prev) => ({ ...prev, [campaignId]: null }));
    }
  };

  const handleExecute = async (campaignId) => {
    if (!window.confirm('Execute this approved automated outreach campaign now? Eligible candidates will receive outreach.')) {
      return;
    }
    try {
      setActionInProgress((prev) => ({ ...prev, [campaignId]: 'executing' }));
      const res = await axios.post(`/api/v1/outreach/campaigns/${campaignId}/execute`);
      alert(res.data.message || 'Campaign executed successfully!');
      await fetchData();
    } catch (err) {
      alert('Execution failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionInProgress((prev) => ({ ...prev, [campaignId]: null }));
    }
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.jd_title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, statusFilter, searchQuery]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const total = campaigns.length;
    const pendingApproval = campaigns.filter((c) => c.status === 'pending_approval').length;
    const approved = campaigns.filter((c) => c.status === 'approved').length;
    const completed = campaigns.filter((c) => c.status === 'completed').length;
    const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivered_count || 0), 0);
    const totalReplies = campaigns.reduce((acc, c) => acc + (c.reply_count || 0), 0);
    return { total, pendingApproval, approved, completed, totalDelivered, totalReplies };
  }, [campaigns]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-3 h-3" /> Pending Approval
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Check className="w-3 h-3" /> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Play className="w-3 h-3 animate-spin" /> Sending...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white font-display">
              Recruitment Email Outreach
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Phase 5 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated campaign management with explicit manager approval guardrails & Mode A manual review
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Campaigns</span>
            <Mail className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-navy-900 dark:text-white font-mono">
            {metrics.total}
          </div>
          <span className="text-[11px] text-slate-400">Mode B automated cohorts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {metrics.pendingApproval}
          </div>
          <span className="text-[11px] text-slate-400">Requires manager sign-off</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Delivered Emails</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.totalDelivered}
          </div>
          <span className="text-[11px] text-slate-400">Verified receipt rate</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Candidate Replies</span>
            <MessageSquare className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
            {metrics.totalReplies}
          </div>
          <span className="text-[11px] text-slate-400">Inbound candidate responses</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-surface-darkBorder">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 px-4 text-xs font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'campaigns'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          Campaigns Directory ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 px-4 text-xs font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Recruitment Templates ({templates.length})
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS DIRECTORY */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns or JDs..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="in_progress">Sending</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder rounded-2xl shadow-subtle overflow-hidden">
            {filteredCampaigns.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-navy-900 dark:text-white">
                  No Outreach Campaigns Found
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create a new campaign targeting a specific Job Requisition and candidate match segment.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition"
                >
                  <Plus className="w-4 h-4" /> Create First Campaign
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Campaign Name</th>
                      <th className="py-3 px-4">Job Requisition</th>
                      <th className="py-3 px-4">Target Tier</th>
                      <th className="py-3 px-4">Template</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Sent / Delivered</th>
                      <th className="py-3 px-4">Replies</th>
                      <th className="py-3 px-4 text-right">Manager Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder text-xs text-slate-700 dark:text-slate-200">
                    {filteredCampaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-navy-900 dark:text-white">
                          <div className="flex flex-col">
                            <span>{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Created {new Date(c.created_at).toLocaleDateString()} by {c.created_by}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] truncate block max-w-xs" title={c.jd_title}>
                            {c.jd_title}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {c.target_segment}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {c.template_name}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <span className="text-slate-800 dark:text-slate-100 font-semibold">{c.sent_count}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{c.delivered_count}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-purple-600 dark:text-purple-400">
                          {c.reply_count || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status === 'pending_approval' && (
                              <>
                                <button
                                  onClick={() => handleApprove(c.id)}
                                  disabled={actionInProgress[c.id] === 'approving'}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1 shadow-sm"
                                  title="Explicit Manager Approval"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleReject(c.id)}
                                  disabled={actionInProgress[c.id] === 'rejecting'}
                                  className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                  title="Reject Campaign"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {c.status === 'approved' && (
                              <button
                                onClick={() => handleExecute(c.id)}
                                disabled={actionInProgress[c.id] === 'executing'}
                                className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                              >
                                {actionInProgress[c.id] === 'executing' ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Executing...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5" /> Execute Campaign
                                  </>
                                )}
                              </button>
                            )}

                            {(c.status === 'completed' || c.status === 'in_progress') && (
                              <span className="text-[11px] font-mono text-slate-400">
                                {c.completed_at ? 'Archived' : 'Active'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL TEMPLATES DIRECTORY */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates list */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Standard Recruitment Templates
            </h3>
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateForPreview(tpl)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    selectedTemplateForPreview?.id === tpl.id
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-500'
                      : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-surface-darkBorder hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-navy-900 dark:text-white block">
                      {tpl.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 capitalize">
                      {tpl.template_type}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>

            {/* Merge variable guide */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder space-y-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Available Dynamic Tags:
              </span>
              <ul className="text-[11px] text-slate-500 space-y-1 font-mono">
                <li><code>&#123;&#123;candidate_name&#125;&#125;</code> &mdash; Full Name</li>
                <li><code>&#123;&#123;job_title&#125;&#125;</code> &mdash; Position Title</li>
                <li><code>&#123;&#123;company_name&#125;&#125;</code> &mdash; Organization</li>
                <li><code>&#123;&#123;recruiter_name&#125;&#125;</code> &mdash; Sender TA</li>
                <li><code>&#123;&#123;candidate_skills&#125;&#125;</code> &mdash; Matched Skills</li>
                <li><code>&#123;&#123;job_location&#125;&#125;</code> &mdash; Work Location</li>
              </ul>
            </div>
          </div>

          {/* Template Details & Live Preview */}
          <div className="lg:col-span-2">
            {selectedTemplateForPreview ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
                  <div>
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                      {selectedTemplateForPreview.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Type: <span className="capitalize">{selectedTemplateForPreview.template_type}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-lg font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Template ID: #{selectedTemplateForPreview.id}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Subject Line Template:
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                    {selectedTemplateForPreview.subject_template}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Body Template:
                  </label>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-sans text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedTemplateForPreview.body_template}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400">
                Select a template to inspect details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal to Create Campaign */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
