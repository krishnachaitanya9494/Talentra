import React, { useState, useEffect } from 'react';
import {
  FileText,
  Layers,
  Briefcase,
  BookOpen,
  Award,
  Shield,
  Star,
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Edit3,
  History,
  Check,
  CheckCheck,
  Zap,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Type,
  Copy,
  X,
  Eye,
  AlignLeft,
} from 'lucide-react';
import { updateStructuredJD } from '../../services/api';

export const StructuredJDSpecs = ({
  jd,
  structuredData,
  onOpenEdit,
  onOpenVersionHistory,
  onSaved,
}) => {
  const [scopeMode, setScopeMode] = useState('structured'); // 'structured' vs 'source'
  const [jdFontSize, setJdFontSize] = useState('text-sm'); // 'text-sm' (14px), 'text-base' (16px), 'text-lg' (18px)
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('All');
  const [bulletViewMode, setBulletViewMode] = useState('doc'); // 'doc' (clean document view) vs 'edit' (form input list)
  const [editingBulletKey, setEditingBulletKey] = useState(null); // 'resp-0', 'deliv-1', etc.
  const [editingBulletText, setEditingBulletText] = useState('');
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [showAddRespInput, setShowAddRespInput] = useState(false);
  const [showAddDelivInput, setShowAddDelivInput] = useState(false);

  // Dynamic Editable State
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('Hybrid');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [expRange, setExpRange] = useState('5 - 8 Years');

  // Skills lists
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Core Architecture');
  const [newSkillMandatory, setNewSkillMandatory] = useState(true);

  // Responsibilities & Deliverables
  const [responsibilities, setResponsibilities] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [newRespText, setNewRespText] = useState('');
  const [newDelivText, setNewDelivText] = useState('');

  // Save / change state
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize from props
  useEffect(() => {
    if (!jd) return;
    const sec = structuredData?.sections || {};

    setRoleTitle(jd.title || 'Platform Architect');
    setDepartment(jd.department || 'Engineering & Delivery');
    setLocation(jd.location || 'Hyderabad / Remote');
    setWorkMode(sec['10_location_employment']?.work_mode || 'Hybrid (3 Days Office / 2 Days Remote)');
    setEmploymentType(jd.employment_type || 'full_time');

    const expSec = sec['5_experience'] || {};
    setExpRange(expSec.formatted_range || '5 - 8 Years');

    // Parse skills
    const rawSkillsList = sec['4_technical_skills']?.skills_list || [];
    if (rawSkillsList.length > 0) {
      setSkills(rawSkillsList.map((s) => ({ ...s, source: 'Extracted from JD' })));
    } else {
      const parsedFromJd = (jd.required_skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name, i) => ({
          name,
          category: i < 3 ? 'Core Architecture' : 'Technology Stack',
          is_mandatory: i < 4,
          source: 'Extracted from JD',
        }));
      setSkills(parsedFromJd);
    }

    const resp = sec['3_responsibilities'] || {};
    setResponsibilities(
      resp.core_responsibilities || [
        `Architect, develop, and scale ${jd.title || 'platform'} solutions across enterprise environments.`,
        'Drive code quality, continuous deployment pipelines, and operational telemetry.',
        'Collaborate with product and architecture leaders to translate specifications into robust systems.',
      ]
    );
    setDeliverables(
      resp.functional_deliverables || [
        'Deliver modular microservices, resilient APIs, and data access layers.',
        'Participate in design reviews, threat modeling, and performance regression triage.',
      ]
    );

    setIsDirty(false);
  }, [jd, structuredData]);

  // Handle Add Skill
  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Skill "${trimmed}" is already present.`);
      return;
    }
    const newSkill = {
      name: trimmed,
      category: newSkillCategory,
      is_mandatory: newSkillMandatory,
      source: 'Manually Added',
    };
    setSkills((prev) => [...prev, newSkill]);
    setNewSkillName('');
    setIsDirty(true);
  };

  // Toggle Mandatory vs Preferred
  const handleToggleMandatory = (skillName) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.name === skillName
          ? { ...s, is_mandatory: !s.is_mandatory, source: 'Manually Edited' }
          : s
      )
    );
    setIsDirty(true);
  };

  // Remove Skill
  const handleRemoveSkill = (skillName) => {
    setSkills((prev) => prev.filter((s) => s.name !== skillName));
    setIsDirty(true);
  };

  // Add / Remove Responsibility
  const handleAddResponsibility = () => {
    const text = newRespText.trim();
    if (!text) return;
    setResponsibilities((prev) => [...prev, text]);
    setNewRespText('');
    setIsDirty(true);
  };

  const handleRemoveResponsibility = (index) => {
    setResponsibilities((prev) => prev.filter((_, idx) => idx !== index));
    setIsDirty(true);
  };

  // Add / Remove Deliverable
  const handleAddDeliverable = () => {
    const text = newDelivText.trim();
    if (!text) return;
    setDeliverables((prev) => [...prev, text]);
    setNewDelivText('');
    setIsDirty(true);
  };

  const handleRemoveDeliverable = (index) => {
    setDeliverables((prev) => prev.filter((_, idx) => idx !== index));
    setIsDirty(true);
  };

  // Reset to original extracted values
  const handleReset = () => {
    if (window.confirm('Reset all edited requirements back to original extracted JD values?')) {
      const sec = structuredData?.sections || {};
      const rawSkillsList = sec['4_technical_skills']?.skills_list || [];
      setSkills(rawSkillsList.map((s) => ({ ...s, source: 'Extracted from JD' })));
      setRoleTitle(jd.title || '');
      setDepartment(jd.department || '');
      setLocation(jd.location || '');
      setIsDirty(false);
    }
  };

  // Save Changes to Database
  const handleSaveChanges = async () => {
    if (!jd?.id) return;
    try {
      setSaving(true);
      const payload = {
        title: roleTitle,
        department: department,
        location: location,
        required_skills: skills.map((s) => s.name).join(', '),
        change_summary: `Recruiter updated specifications (${skills.length} skills, status: ${jd.status}).`,
        author: 'Lead Recruiter',
      };
      const updated = await updateStructuredJD(jd.id, payload);
      setSaving(false);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onSaved) onSaved(updated);
    } catch (err) {
      setSaving(false);
      alert(`Failed to save requirements: ${err.response?.data?.detail || err.message}`);
    }
  };

  const mandatoryCount = skills.filter((s) => s.is_mandatory).length;
  const preferredCount = skills.length - mandatoryCount;

  const filteredSkills =
    selectedSkillCategory === 'All'
      ? skills
      : skills.filter((s) => s.category === selectedSkillCategory);

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Top Action Bar & Persistence Status */}
      <div className="p-4 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{roleTitle || jd?.title}</span>
                <span className="px-2 py-0.5 rounded-md font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
                  {jd?.req_code}
                </span>
                {isDirty && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                    Unsaved changes
                  </span>
                )}
                {saveSuccess && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                    Saved
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {department} • {location} • {expRange}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Font Size Selector (Accessibility & Readability) */}
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Type className="w-3.5 h-3.5 text-slate-500 mr-1" />
              <button
                type="button"
                onClick={() => setJdFontSize('text-sm')}
                className={`px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-colors duration-150 ${
                  jdFontSize === 'text-sm'
                    ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Normal Font Size (14px)"
              >
                14px
              </button>
              <button
                type="button"
                onClick={() => setJdFontSize('text-base')}
                className={`px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-colors duration-150 ${
                  jdFontSize === 'text-base'
                    ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Medium Font Size (16px)"
              >
                16px
              </button>
              <button
                type="button"
                onClick={() => setJdFontSize('text-lg')}
                className={`px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-colors duration-150 ${
                  jdFontSize === 'text-lg'
                    ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Large Font Size (18px)"
              >
                18px
              </button>
            </div>

            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer text-xs transition-colors duration-150"
                title="Reset to original extracted values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={!isDirty || saving}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium text-xs shadow-2xs transition-colors duration-150 cursor-pointer ${
                isDirty
                  ? 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Requirements'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenVersionHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer text-xs transition-colors duration-150"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Version History</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Interactive Editor vs Raw JD Source */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-surface-darkBorder font-medium">
            <button
              type="button"
              onClick={() => setScopeMode('structured')}
              className={`px-3 py-1.5 rounded-md transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
                scopeMode === 'structured'
                  ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Interactive Requirements Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setScopeMode('source')}
              className={`px-3 py-1.5 rounded-md transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
                scopeMode === 'source'
                  ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Original Raw JD Text</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Grounded extraction
          </span>
        </div>
      </div>

      {scopeMode === 'source' ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 block">
                ORIGINAL REQUISITION SOURCE TEXT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {(structuredData?.raw_text || jd?.description || '').length.toLocaleString()} characters •{' '}
                {((structuredData?.raw_text || jd?.description || '').trim()
                  ? (structuredData?.raw_text || jd?.description || '').trim().split(/\s+/).length.toLocaleString()
                  : 0)}{' '}
                words • {(structuredData?.raw_text || jd?.description || '').split('\n').length} lines
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const textToCopy = structuredData?.raw_text || jd?.description || '';
                  navigator.clipboard.writeText(textToCopy);
                  setCopiedRawText(true);
                  setTimeout(() => setCopiedRawText(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs transition-colors"
              >
                {copiedRawText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Raw Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            className={`p-5 rounded-xl bg-slate-950 text-slate-200 font-mono ${jdFontSize} leading-relaxed whitespace-pre-wrap max-h-[620px] overflow-y-auto select-all border border-slate-800`}
          >
            {structuredData?.raw_text || jd?.description || 'No raw source document text available.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Section 1: Role & Experience Information */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3.5">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">
              1. ROLE & EXPERIENCE SPECIFICATIONS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  JOB TITLE
                </span>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => {
                    setRoleTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 ${jdFontSize} focus:ring-1 focus:ring-emerald-500`}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  DEPARTMENT
                </span>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 ${jdFontSize} focus:ring-1 focus:ring-emerald-500`}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  LOCATION & WORK MODE
                </span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 ${jdFontSize} focus:ring-1 focus:ring-emerald-500`}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-surface-darkBorder">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  REQUIRED EXPERIENCE
                </span>
                <input
                  type="text"
                  value={expRange}
                  onChange={(e) => {
                    setExpRange(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 ${jdFontSize} focus:ring-1 focus:ring-emerald-500`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Technical Skills Matrix (Mandatory vs Preferred) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">
                  2. TECHNICAL SKILLS & TAXONOMY CLASSIFICATION
                </span>
                <span className="text-xs text-slate-500">
                  {skills.length} Total Competencies •{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{mandatoryCount} Mandatory</strong>,{' '}
                  <strong className="text-slate-600 dark:text-slate-400 font-semibold">{preferredCount} Preferred</strong>
                </span>
              </div>

              {/* Category filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-xs">Category:</span>
                <select
                  value={selectedSkillCategory}
                  onChange={(e) => setSelectedSkillCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="All">All Categories ({skills.length})</option>
                  <option value="Core Architecture">Core Architecture</option>
                  <option value="Technology Stack">Technology Stack</option>
                  <option value="Database & Data">Database & Data</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Domain & Governance">Domain & Governance</option>
                </select>
              </div>
            </div>

            {/* Add Skill Form Row */}
            <form
              onSubmit={handleAddSkill}
              className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-surface-darkBorder"
            >
              <input
                type="text"
                placeholder="Add new skill (e.g. Kubernetes, Redis, Groovy)..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="flex-1 min-w-[200px] px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              >
                <option value="Core Architecture">Core Architecture</option>
                <option value="Technology Stack">Technology Stack</option>
                <option value="Database & Data">Database & Data</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Domain & Governance">Domain & Governance</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSkillMandatory}
                  onChange={(e) => setNewSkillMandatory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Mandatory</span>
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </form>

            {/* Interactive Skills Chips Grid */}
            <div className="flex flex-wrap gap-2 pt-1">
              {filteredSkills.map((sk, idx) => (
                <div
                  key={idx}
                  className={`group p-2 rounded-lg border flex items-center gap-2 transition-colors duration-150 ${
                    sk.is_mandatory
                      ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${jdFontSize}`}>{sk.name}</span>
                      {sk.source && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-500 font-mono">
                          {sk.source}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {sk.category || 'Technology'}
                    </span>
                  </div>

                  {/* Toggle Mandatory button */}
                  <button
                    type="button"
                    onClick={() => handleToggleMandatory(sk.name)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors duration-150 cursor-pointer ${
                      sk.is_mandatory
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                    title="Click to toggle Mandatory vs Preferred"
                  >
                    {sk.is_mandatory ? 'Mandatory' : 'Preferred'}
                  </button>

                  {/* Remove skill button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(sk.name)}
                    className="opacity-40 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 transition-opacity cursor-pointer"
                    title={`Remove ${sk.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Responsibilities & Deliverables (Enterprise ATS Document Presentation) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">
                  3. RESPONSIBILITIES & FUNCTIONAL DELIVERABLES
                </span>
                <span className="text-xs text-slate-500">
                  {responsibilities.length} Core Responsibilities • {deliverables.length} Deliverables & Outcomes
                </span>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-surface-darkBorder">
                <button
                  type="button"
                  onClick={() => setBulletViewMode('doc')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    bulletViewMode === 'doc'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Document View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulletViewMode('edit')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    bulletViewMode === 'edit'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Mode</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Column 1: Core Responsibilities */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/40 dark:bg-slate-900/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 tracking-wide">
                        Core Responsibilities
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                        {responsibilities.length}
                      </span>
                    </div>
                    {bulletViewMode === 'doc' && !showAddRespInput && (
                      <button
                        type="button"
                        onClick={() => setShowAddRespInput(true)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>

                  {bulletViewMode === 'doc' ? (
                    <div className="space-y-1.5">
                      {responsibilities.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No responsibilities listed.</p>
                      ) : (
                        responsibilities.map((r, rIdx) => (
                          <div
                            key={rIdx}
                            className="group relative p-2.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-start gap-3"
                          >
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                            {editingBulletKey === `resp-${rIdx}` ? (
                              <div className="flex-1 space-y-2">
                                <textarea
                                  rows={3}
                                  value={editingBulletText}
                                  onChange={(e) => setEditingBulletText(e.target.value)}
                                  className="w-full p-2.5 rounded-lg border border-emerald-500 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none resize-none leading-relaxed"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBulletKey(null);
                                      setEditingBulletText('');
                                    }}
                                    className="px-2.5 py-1 rounded text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const trimmed = editingBulletText.trim();
                                      if (trimmed) {
                                        setResponsibilities((prev) =>
                                          prev.map((it, idx) => (idx === rIdx ? trimmed : it))
                                        );
                                        setIsDirty(true);
                                      }
                                      setEditingBulletKey(null);
                                      setEditingBulletText('');
                                    }}
                                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className={`flex-1 text-slate-800 dark:text-slate-200 ${jdFontSize} leading-relaxed font-normal`}>
                                  {r}
                                </p>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBulletKey(`resp-${rIdx}`);
                                      setEditingBulletText(r);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit bullet"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveResponsibility(rIdx)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Delete bullet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}

                      {showAddRespInput && (
                        <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 space-y-2 mt-2">
                          <textarea
                            rows={2}
                            placeholder="Enter new responsibility item..."
                            value={newRespText}
                            onChange={(e) => setNewRespText(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddRespInput(false);
                                setNewRespText('');
                              }}
                              className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddResponsibility();
                                setShowAddRespInput(false);
                              }}
                              disabled={!newRespText.trim()}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Add Bullet
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {responsibilities.map((r, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-2 group">
                          <span className="text-emerald-500 font-bold mt-1">•</span>
                          <textarea
                            rows={2}
                            value={r}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResponsibilities((prev) =>
                                prev.map((item, idx) => (idx === rIdx ? val : item))
                              );
                              setIsDirty(true);
                            }}
                            className={`flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 ${jdFontSize} leading-relaxed focus:ring-1 focus:ring-emerald-500 resize-none`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveResponsibility(rIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove bullet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {bulletViewMode === 'edit' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Add new responsibility bullet..."
                      value={newRespText}
                      onChange={(e) => setNewRespText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddResponsibility();
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddResponsibility}
                      disabled={!newRespText.trim()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Column 2: Key Deliverables & Outcomes */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/40 dark:bg-slate-900/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 tracking-wide">
                        Key Deliverables & Outcomes
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold">
                        {deliverables.length}
                      </span>
                    </div>
                    {bulletViewMode === 'doc' && !showAddDelivInput && (
                      <button
                        type="button"
                        onClick={() => setShowAddDelivInput(true)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>

                  {bulletViewMode === 'doc' ? (
                    <div className="space-y-1.5">
                      {deliverables.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No deliverables listed.</p>
                      ) : (
                        deliverables.map((d, dIdx) => (
                          <div
                            key={dIdx}
                            className="group relative p-2.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-start gap-3"
                          >
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                            {editingBulletKey === `deliv-${dIdx}` ? (
                              <div className="flex-1 space-y-2">
                                <textarea
                                  rows={3}
                                  value={editingBulletText}
                                  onChange={(e) => setEditingBulletText(e.target.value)}
                                  className="w-full p-2.5 rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none resize-none leading-relaxed"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBulletKey(null);
                                      setEditingBulletText('');
                                    }}
                                    className="px-2.5 py-1 rounded text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const trimmed = editingBulletText.trim();
                                      if (trimmed) {
                                        setDeliverables((prev) =>
                                          prev.map((it, idx) => (idx === dIdx ? trimmed : it))
                                        );
                                        setIsDirty(true);
                                      }
                                      setEditingBulletKey(null);
                                      setEditingBulletText('');
                                    }}
                                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className={`flex-1 text-slate-800 dark:text-slate-200 ${jdFontSize} leading-relaxed font-normal`}>
                                  {d}
                                </p>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBulletKey(`deliv-${dIdx}`);
                                      setEditingBulletText(d);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit bullet"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDeliverable(dIdx)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Delete bullet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}

                      {showAddDelivInput && (
                        <div className="p-3 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 space-y-2 mt-2">
                          <textarea
                            rows={2}
                            placeholder="Enter new deliverable or outcome..."
                            value={newDelivText}
                            onChange={(e) => setNewDelivText(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddDelivInput(false);
                                setNewDelivText('');
                              }}
                              className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddDeliverable();
                                setShowAddDelivInput(false);
                              }}
                              disabled={!newDelivText.trim()}
                              className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Add Bullet
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deliverables.map((d, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2 group">
                          <span className="text-indigo-500 font-bold mt-1">•</span>
                          <textarea
                            rows={2}
                            value={d}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDeliverables((prev) =>
                                prev.map((item, idx) => (idx === dIdx ? val : item))
                              );
                              setIsDirty(true);
                            }}
                            className={`flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 ${jdFontSize} leading-relaxed focus:ring-1 focus:ring-indigo-500 resize-none`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(dIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove bullet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {bulletViewMode === 'edit' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Add new deliverable outcome..."
                      value={newDelivText}
                      onChange={(e) => setNewDelivText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddDeliverable();
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddDeliverable}
                      disabled={!newDelivText.trim()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
