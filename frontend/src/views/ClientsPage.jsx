import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Briefcase,
  Users,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { getClients, getClientDetail, createClient } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology & Cloud',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'active',
    billing_address: '',
  });

  const fetchClientsList = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (search) params.search = search;
      const data = await getClients(params);
      setClients(data.clients || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsList();
  }, [statusFilter]);

  const handleSelectClient = async (clientId) => {
    try {
      setDetailLoading(true);
      const data = await getClientDetail(clientId);
      setSelectedClient(data.client);
    } catch (err) {
      console.error('Failed to load client details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      setCreateLoading(true);
      await createClient(formData);
      setIsCreateOpen(false);
      setFormData({
        name: '',
        industry: 'Technology & Cloud',
        website: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        status: 'active',
        billing_address: '',
      });
      fetchClientsList();
    } catch (err) {
      alert(`Failed to create client account: ${err.response?.data?.detail || err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Clients"
        subtitle="Hiring organizations and their linked requisitions"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Client Account</span>
          </button>
        }
      />

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name, code, or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchClientsList()}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="onboarding">Onboarding</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={fetchClientsList}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            title="Refresh clients"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Client Cards & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Client Cards Grid (Col 1 to 7) */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading client directory...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder">
              <EmptyState
                title="No Client Accounts Found"
                description="Register a corporate client account to associate job requirements and track candidate submissions."
                actionLabel="Create Client Account"
                onAction={() => setIsCreateOpen(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {clients.map((c) => {
                const isSelected = selectedClient?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClient(c.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-3 ${
                      isSelected
                        ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-white dark:bg-surface-darkCard border-slate-200/80 dark:border-surface-darkBorder hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-600" />
                        <span className="font-bold text-sm text-navy-900 dark:text-slate-100">
                          {c.name}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                        {c.status || 'Active'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-slate-400">{c.client_code}</span>
                      {c.industry && <span>• {c.industry}</span>}
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Website</span>
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-surface-darkBorder">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Total JDs
                        </span>
                        <span className="font-bold text-navy-900 dark:text-slate-100 text-xs">
                          {c.total_jds}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Active JDs
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          {c.active_jds}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Candidates Pipeline
                        </span>
                        <span className="font-bold text-brand-600 dark:text-brand-400 text-xs">
                          {c.total_submissions}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Client Workspace (Col 8 to 12) */}
        <div className="lg:col-span-5 space-y-4">
          {detailLoading ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder text-xs text-slate-400 animate-pulse">
              Loading account requisitions and pipeline...
            </div>
          ) : selectedClient ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-200 dark:border-surface-darkBorder space-y-1">
                <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400">
                  {selectedClient.client_code}
                </span>
                <h3 className="text-base font-bold text-navy-900 dark:text-slate-100">
                  {selectedClient.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">{selectedClient.industry || 'Corporate Partner'}</p>
              </div>

              {/* Point of Contact Info */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Primary Hiring Contact
                </span>
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <p className="font-semibold">{selectedClient.contact_name || 'Hiring Manager'}</p>
                  {selectedClient.contact_email && (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                      <span>{selectedClient.contact_email}</span>
                    </div>
                  )}
                  {selectedClient.contact_phone && (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                      <span>{selectedClient.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Associated Requisitions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Associated Requisitions ({selectedClient.job_requirements?.length || 0})
                  </h4>
                </div>

                {selectedClient.job_requirements && selectedClient.job_requirements.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {selectedClient.job_requirements.map((jd) => (
                      <div
                        key={jd.id}
                        onClick={() => navigate('/jds')}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder hover:border-brand-500 transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy-900 dark:text-slate-100">{jd.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                            {jd.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{jd.req_code}</span>
                          <span>{jd.submissions_count || 0} Submissions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">
                    No active job requirements associated with this client.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder text-xs text-slate-500 dark:text-slate-400">
              Select a client account to inspect their requisitions and candidate pipeline.
            </div>
          )}
        </div>
      </div>

      {/* New Client Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Client Corporate Account"
        subtitle="Establish hiring account relationship and enable requisition management"
      >
        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Company / Client Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Cloud Technologies"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                placeholder="e.g. Technology, FinTech, Healthcare"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Corporate Website
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Hiring Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Contact Email
              </label>
              <input
                type="email"
                placeholder="jane@company.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+1 555-0192"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-surface-darkBorder">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle disabled:opacity-50"
            >
              {createLoading ? 'Registering...' : 'Register Client Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
