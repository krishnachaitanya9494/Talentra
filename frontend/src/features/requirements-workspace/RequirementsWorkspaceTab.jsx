import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  Shield,
  Star,
  Users,
} from 'lucide-react';

const REQUIREMENT_CATEGORIES = [
  { id: 'technical', label: '1. Technical Requirements', icon: Layers },
  { id: 'experience', label: '2. Experience Requirements', icon: Briefcase },
  { id: 'education', label: '3. Education Requirements', icon: BookOpen },
  { id: 'certifications', label: '4. Certifications & Credentials', icon: Award },
  { id: 'domain', label: '5. Domain Requirements', icon: Shield },
  { id: 'responsibilities', label: '6. Responsibilities & Deliverables', icon: CheckCircle2 },
  { id: 'soft_skills', label: '7. Soft Skills & Leadership', icon: Users },
  { id: 'preferred', label: '8. Preferred Qualifications', icon: Star },
];

export const RequirementsWorkspaceTab = ({ jd, structuredJd, onUpdateWeights }) => {
  // Requirement weights state (ensuring 100% total)
  const [weights, setWeights] = useState([
    { key: 'technical', label: 'Technical Skills', weight: 35 },
    { key: 'experience', label: 'Relevant Experience', weight: 25 },
    { key: 'domain', label: 'Domain & Ecosystem', weight: 15 },
    { key: 'education', label: 'Education Qualifications', weight: 10 },
    { key: 'certifications', label: 'Certifications', weight: 10 },
    { key: 'soft_skills', label: 'Leadership & Soft Skills', weight: 5 },
  ]);

  const [activeCategory, setActiveCategory] = useState('technical');
  const [verifiedItems, setVerifiedItems] = useState({
    'req-tech-1': true,
    'req-tech-2': true,
    'req-exp-1': true,
    'req-domain-1': true,
  });

  // Sample structured requirements initialized from structuredJd or fallback
  const [requirementsList, setRequirementsList] = useState([
    {
      id: 'req-tech-1',
      category: 'technical',
      title: 'Multidimensional Architecture & PBCS Modeling',
      description: 'Hands-on calculation script authorship, outline design, and dimension hierarchy configuration.',
      is_mandatory: true,
      priority: 'CRITICAL',
    },
    {
      id: 'req-tech-2',
      category: 'technical',
      title: 'Essbase 21c / Calculation Manager Optimization',
      description: 'Deep understanding of Dense vs. Sparse dimensions, block size tuning, and cache hierarchy sizing.',
      is_mandatory: true,
      priority: 'HIGH',
    },
    {
      id: 'req-tech-3',
      category: 'technical',
      title: 'Data Management & FDMEE Automation',
      description: 'Batch data ingestion via EPM Automate CLI and REST APIs with automated reconciliation audit.',
      is_mandatory: false,
      priority: 'MEDIUM',
    },
    {
      id: 'req-exp-1',
      category: 'experience',
      title: '5 to 8 Years of Enterprise Hands-on Experience',
      description: 'Minimum 5 years active delivery experience in corporate financial planning software.',
      is_mandatory: true,
      priority: 'CRITICAL',
    },
    {
      id: 'req-edu-1',
      category: 'education',
      title: 'Bachelor of Engineering / B.Tech / MCA or Equivalent',
      description: 'Formal computer science, information systems, or mathematical background.',
      is_mandatory: true,
      priority: 'HIGH',
    },
    {
      id: 'req-cert-1',
      category: 'certifications',
      title: 'Oracle Cloud EPM Implementation Specialist',
      description: 'Official vendor credential or equivalent enterprise delivery track record.',
      is_mandatory: false,
      priority: 'MEDIUM',
    },
    {
      id: 'req-domain-1',
      category: 'domain',
      title: 'SOX Compliance & Financial Close Governance',
      description: 'Strict adherence to change management, period locking, and auditable accounting standards.',
      is_mandatory: true,
      priority: 'HIGH',
    },
    {
      id: 'req-resp-1',
      category: 'responsibilities',
      title: 'Solution Architecture & Technical Design',
      description: 'Lead design documents, architecture review sign-offs, and technical work stream alignment.',
      is_mandatory: true,
      priority: 'HIGH',
    },
    {
      id: 'req-soft-1',
      category: 'soft_skills',
      title: 'Executive Stakeholder Communication',
      description: 'Ability to present trade-offs to VP of Financial Systems and CFO office representatives.',
      is_mandatory: false,
      priority: 'MEDIUM',
    },
    {
      id: 'req-pref-1',
      category: 'preferred',
      title: 'Global Capability Center (GCC) Experience',
      description: 'Prior engagement with high-scale enterprise global in-house delivery centers.',
      is_mandatory: false,
      priority: 'LOW',
    },
  ]);

  // New Requirement Form
  const [showAddReq, setShowAddReq] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newIsMandatory, setNewIsMandatory] = useState(true);

  const totalWeight = weights.reduce((acc, curr) => acc + Number(curr.weight || 0), 0);
  const isWeightValid = totalWeight === 100;

  const handleWeightChange = (index, val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setWeights((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], weight: num };
      return next;
    });
  };

  const toggleVerified = (id) => {
    setVerifiedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddRequirement = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newReq = {
      id: `req-${Date.now()}`,
      category: activeCategory,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Recruiter verified specification item.',
      is_mandatory: newIsMandatory,
      priority: newPriority,
    };
    setRequirementsList((prev) => [newReq, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setShowAddReq(false);
  };

  const handleDeleteReq = (id) => {
    setRequirementsList((prev) => prev.filter((r) => r.id !== id));
  };

  const filteredRequirements = requirementsList.filter((r) => r.category === activeCategory);

  return (
    <div className="space-y-4 text-xs">
      {/* ========================================================================= */}
      {/* 1. Recruiter Requirement Weighting Matrix (100% Sum Enforcement) */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-navy-900 dark:text-slate-100">
                Recruiter Requirement Weighting & Scoring Rules
              </h3>
              <p className="text-[11px] text-slate-500">
                Deterministic matching weights. Total must equal exactly 100% for candidate scoring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl font-mono font-bold text-xs flex items-center gap-1 ${
                isWeightValid
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
              }`}
            >
              <span>Total: {totalWeight}%</span>
              {isWeightValid ? '✓ Valid' : '⚠ Must equal 100%'}
            </span>
          </div>
        </div>

        {/* Weights Grid Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {weights.map((w, idx) => (
            <div
              key={w.key}
              className="p-3 rounded-xl border border-slate-200/70 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">{w.label}</span>
                <span className="font-mono font-bold text-emerald-600">{w.weight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={w.weight}
                onChange={(e) => handleWeightChange(idx, e.target.value)}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Eight Categorized Requirement Workspaces */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-navy-900 dark:text-slate-100">
              Requirements Classification & Recruiter Verification
            </h3>
            <p className="text-[11px] text-slate-500">
              Review and verify individual requirement items across 8 enterprise categories.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddReq(!showAddReq)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Requirement</span>
          </button>
        </div>

        {/* 8 Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          {REQUIREMENT_CATEGORIES.map((cat) => {
            const count = requirementsList.filter((r) => r.category === cat.id).length;
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/20">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Requirement Form */}
        {showAddReq && (
          <form
            onSubmit={handleAddRequirement}
            className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-3 animate-in fade-in duration-150"
          >
            <span className="font-bold uppercase text-[10px] text-emerald-800 dark:text-emerald-300 block">
              ADD NEW REQUIREMENT IN {activeCategory.toUpperCase()}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Requirement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mastered Calculation Scripts & Essbase Tuning"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Priority Tier</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Classification</label>
                  <select
                    value={newIsMandatory ? 'mandatory' : 'preferred'}
                    onChange={(e) => setNewIsMandatory(e.target.value === 'mandatory')}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900"
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="preferred">Preferred</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Description & Context</label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Details of what the candidate must demonstrate..."
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddReq(false)}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer shadow-xs"
              >
                Save Requirement
              </button>
            </div>
          </form>
        )}

        {/* Requirements List */}
        <div className="space-y-2.5 pt-1">
          {filteredRequirements.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No requirements recorded in this category. Click 'Add Requirement' to author one.
            </div>
          ) : (
            filteredRequirements.map((req) => {
              const isVerified = !!verifiedItems[req.id];
              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleVerified(req.id)}
                      className="mt-0.5 cursor-pointer text-slate-400 hover:text-emerald-600"
                      title={isVerified ? 'Verified by Recruiter' : 'Mark as Verified'}
                    >
                      {isVerified ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-navy-900 dark:text-slate-100 text-xs">
                          {req.title}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                            req.is_mandatory
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {req.is_mandatory ? 'MANDATORY' : 'PREFERRED'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            req.priority === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : req.priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {req.priority}
                        </span>
                        {isVerified && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                            <span>✓</span>
                            <span>Recruiter Verified</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {req.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center self-end shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteReq(req.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete requirement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
