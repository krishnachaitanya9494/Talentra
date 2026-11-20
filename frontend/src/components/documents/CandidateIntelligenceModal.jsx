import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Edit3,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Calendar,
  Star,
  CheckSquare,
  Plus,
  Send,
  Building2,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ManualCorrectionModal } from './ManualCorrectionModal';
import {
  getCandidateIntelligence,
  scheduleInterview,
  getCandidateInterviews,
  updateInterviewFeedback,
} from '../../services/api';

export const CandidateIntelligenceModal = ({
  isOpen,
  onClose,
  candidateId,
  initialRole = 'recruiter',
  onCandidateUpdated,
}) => {
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Interview state
  const [interviews, setInterviews] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [newInterview, setNewInterview] = useState({
    interview_type: 'technical',
    round_number: 1,
    scheduled_start: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    interviewer_names: '',
    meeting_link: '',
  });

  const fetchProfile = async (targetRole = role) => {
    if (!candidateId) return;
    try {
      setLoading(true);
      setError(null);
      const [data, intvData] = await Promise.all([
        getCandidateIntelligence(candidateId, targetRole),
        getCandidateInterviews(candidateId).catch(() => ({ interviews: [] })),
      ]);
      setProfile(data);
      setInterviews(intvData?.interviews || data?.interviews || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load candidate intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && candidateId) {
      fetchProfile(role);
    }
  }, [isOpen, candidateId, role]);

  const handleRoleToggle = (newRole) => {
    setRole(newRole);
    fetchProfile(newRole);
  };

  const handleCorrectionSaved = (updated) => {
    setProfile(updated);
    if (onCandidateUpdated) onCandidateUpdated(updated);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSchedulingLoading(true);
      await scheduleInterview({
        candidate_id: candidateId,
        round_number: parseInt(newInterview.round_number, 10) || 1,
        interview_type: newInterview.interview_type,
        scheduled_start: new Date(newInterview.scheduled_start).toISOString(),
        interviewer_names: newInterview.interviewer_names,
        meeting_link: newInterview.meeting_link,
      });
      setShowScheduleForm(false);
      // Refresh interviews
      const res = await getCandidateInterviews(candidateId);
      setInterviews(res.interviews || []);
    } catch (err) {
      alert(`Failed to schedule interview: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSchedulingLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: '1. Overview', icon: User },
    { id: 'skills', label: '2. Skills Inventory', icon: Sparkles },
    { id: 'experience', label: '3. Career History', icon: Briefcase },
    { id: 'education', label: '4. Education', icon: GraduationCap },
    { id: 'evidence', label: '5. Resume Evidence', icon: FileCheck },
    { id: 'timeline', label: '6. Activity Trail', icon: History },
    { id: 'interviews', label: `7. Interviews (${interviews.length})`, icon: Calendar },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={profile ? profile.full_name : 'Candidate Intelligence Profile'}
        subtitle={
          profile
            ? `${profile.candidate_code} • ${profile.current_title || 'Software Professional'} • ${profile.current_company || 'TALENTRA Repository'}`
            : 'Loading candidate structured intelligence...'
        }
        maxWidth="max-w-5xl"
      >
        <div className="p-6 space-y-5 max-h-[84vh] overflow-y-auto">
          {/* Header Action Bar: Privacy & Manual Correction */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder text-xs">
            {/* Role Privacy Control */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Privacy Role:</span>
              <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => handleRoleToggle('recruiter')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    role === 'recruiter'
                      ? 'bg-white dark:bg-surface-darkCard text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Recruiter (Full Access)
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleToggle('viewer')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    role === 'viewer'
                      ? 'bg-white dark:bg-surface-darkCard text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Viewer (Masked)
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('interviews');
                  setShowScheduleForm(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-subtle"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Interview</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCorrectionOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-subtle"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Correct Profile</span>
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-surface-darkBorder pb-2 overflow-x-auto text-xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && !profile && (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading detailed candidate intelligence...
            </div>
          )}

          {profile && (
            <div className="space-y-5">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Primary Contact & Metadata Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Address</span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block select-all">
                        {profile.email || '—'}
                      </span>
                      {profile.is_contact_masked && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block">
                          Masked (Viewer Role)
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Phone Number</span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block select-all">
                        {profile.phone || '—'}
                      </span>
                      {profile.is_contact_masked && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block">
                          Masked (Viewer Role)
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Total Experience</span>
                      </div>
                      <span className="text-sm font-bold text-navy-900 dark:text-slate-100 block">
                        {profile.total_experience_years !== null ? `${profile.total_experience_years} Years` : '—'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Location</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {profile.location || '—'}
                      </span>
                      {profile.preferred_location && (
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                          Prefers: {profile.preferred_location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Extraction Confidence Strip */}
                  <div className="p-3.5 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span className="font-semibold text-brand-900 dark:text-brand-100">
                        Zero-Hallucination Confidence Score:
                      </span>
                      <span className="font-mono font-bold text-brand-700 dark:text-brand-300">
                        {((profile.extraction_confidence || 0.95) * 100).toFixed(0)}%
                      </span>
                    </div>
                    {profile.is_manually_corrected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Manually Verified & Corrected</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Deterministic Resume Extraction
                      </span>
                    )}
                  </div>

                  {/* Quick Skills Summary */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Core Technical Skills ({profile.skills_list?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills_list && profile.skills_list.length > 0 ? (
                        profile.skills_list.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No skills documented in resume.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SKILLS INVENTORY */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Granular Skills Inventory & Provenance
                    </h4>
                    <span className="text-xs text-slate-500">
                      {profile.skills_inventory?.length || profile.skills_list?.length || 0} Identified Skills
                    </span>
                  </div>

                  {profile.skills_inventory && profile.skills_inventory.length > 0 ? (
                    <div className="border border-slate-200 dark:border-surface-darkBorder rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-surface-darkBorder">
                          <tr>
                            <th className="px-3.5 py-2.5">Skill Name</th>
                            <th className="px-3.5 py-2.5">Category</th>
                            <th className="px-3.5 py-2.5">Evidence Snippet</th>
                            <th className="px-3.5 py-2.5">Validation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                          {profile.skills_inventory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="px-3.5 py-2.5 font-semibold text-navy-900 dark:text-slate-100">
                                {item.skill_name}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-500">
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {item.category || 'Technical'}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] max-w-xs truncate">
                                {item.evidence_snippet || 'Documented in resume skills section'}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{item.validation_status || 'Verified'}</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                      No granular skills inventory available.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CAREER & EMPLOYMENT HISTORY */}
              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Employment Progression & Roles
                  </h4>
                  {profile.employers && profile.employers.length > 0 ? (
                    <div className="space-y-3">
                      {profile.employers.map((emp, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-brand-600" />
                              <span className="font-bold text-sm text-navy-900 dark:text-slate-100">
                                {emp.company_name}
                              </span>
                            </div>
                            {emp.is_current && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                Current Employer
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-slate-700 dark:text-slate-300">{emp.role_title || 'Software Professional'}</p>
                          {emp.duration && (
                            <p className="text-[11px] text-slate-400">{emp.duration}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                      No previous employers documented.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EDUCATION & CERTIFICATIONS */}
              {activeTab === 'education' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span>Academic Degrees & Credentials</span>
                    </h4>
                    {profile.educations && profile.educations.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profile.educations.map((ed, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder text-xs space-y-0.5"
                          >
                            <p className="font-semibold text-navy-900 dark:text-slate-100">{ed.degree}</p>
                            {ed.institution && <p className="text-slate-600 dark:text-slate-400">{ed.institution}</p>}
                            {ed.graduation_year && (
                              <span className="font-mono text-[10px] text-slate-400">Graduation Year: {ed.graduation_year}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No formal degree records documented in resume.</p>
                    )}
                  </div>

                  {profile.certifications && profile.certifications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        <span>Professional Certifications</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.certifications.map((c, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                          >
                            {c.certification_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: VERIFIABLE EVIDENCE */}
              {activeTab === 'evidence' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Source Text Snippets & Provenance
                  </h4>
                  {profile.verifiable_evidence && profile.verifiable_evidence.length > 0 ? (
                    <div className="space-y-2">
                      {profile.verifiable_evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-surface-darkBorder text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              Section: {ev.section_name}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {ev.page_or_position}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            "{ev.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                      Evidence was derived directly from the primary uploaded resume text.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: ACTIVITY TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Recruitment Activity Trail
                  </h4>
                  {profile.activity_timeline && profile.activity_timeline.length > 0 ? (
                    <div className="space-y-2.5">
                      {profile.activity_timeline.map((act, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-surface-darkBorder text-xs"
                        >
                          <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-navy-900 dark:text-slate-100">
                                {act.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {act.timestamp ? new Date(act.timestamp).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">{act.description}</p>
                            <span className="text-[10px] text-slate-400 block">Actor: {act.actor}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                      No external actions logged yet. Candidate profile ingested into TALENTRA.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: INTERVIEW SCHEDULING & STAGE MANAGER */}
              {activeTab === 'interviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Evaluation Rounds & Stages
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(!showScheduleForm)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-subtle"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showScheduleForm ? 'Cancel Form' : 'Schedule Round'}</span>
                    </button>
                  </div>

                  {/* Schedule Form */}
                  {showScheduleForm && (
                    <form
                      onSubmit={handleScheduleSubmit}
                      className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/50 space-y-3 text-xs"
                    >
                      <div className="font-bold text-brand-900 dark:text-brand-200">
                        Schedule Evaluation Session
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                            Round Type
                          </label>
                          <select
                            value={newInterview.interview_type}
                            onChange={(e) =>
                              setNewInterview({ ...newInterview, interview_type: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
                          >
                            <option value="screening">Phone Screening</option>
                            <option value="technical">Technical Round 1</option>
                            <option value="tech_deep_dive">Technical Round 2 (Deep Dive)</option>
                            <option value="managerial">Managerial / Culture</option>
                            <option value="client_final">Client Final Round</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                            Round Number
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={newInterview.round_number}
                            onChange={(e) =>
                              setNewInterview({ ...newInterview, round_number: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                            Scheduled Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={newInterview.scheduled_start}
                            onChange={(e) =>
                              setNewInterview({ ...newInterview, scheduled_start: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                            Interviewer(s)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Lead Architect Sarah, Eng Manager Dave"
                            value={newInterview.interviewer_names}
                            onChange={(e) =>
                              setNewInterview({ ...newInterview, interviewer_names: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                            Meeting Link (Google Meet / Teams)
                          </label>
                          <input
                            type="url"
                            placeholder="https://meet.google.com/..."
                            value={newInterview.meeting_link}
                            onChange={(e) =>
                              setNewInterview({ ...newInterview, meeting_link: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={schedulingLoading}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-subtle disabled:opacity-50"
                        >
                          {schedulingLoading ? 'Scheduling...' : 'Confirm Schedule'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Interview Rounds List */}
                  {interviews && interviews.length > 0 ? (
                    <div className="space-y-3">
                      {interviews.map((intv) => (
                        <div
                          key={intv.id}
                          className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-navy-900 dark:text-slate-100">
                                Round {intv.round_number}: {intv.interview_type}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                                {intv.status}
                              </span>
                            </div>
                            {intv.rating && (
                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>{intv.rating} / 5</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Scheduled: </span>
                              {intv.scheduled_start ? new Date(intv.scheduled_start).toLocaleString() : 'TBD'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Interviewers: </span>
                              {intv.interviewer_names || 'Unassigned'}
                            </div>
                          </div>

                          {intv.meeting_link && (
                            <div className="text-[11px]">
                              <a
                                href={intv.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Join Interview Room</span>
                              </a>
                            </div>
                          )}

                          {intv.feedback && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                Debrief Feedback & Notes:
                              </span>
                              <p className="text-slate-600 dark:text-slate-400">{intv.feedback}</p>
                              {intv.recommendation && (
                                <span className="inline-block mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                  Recommendation: {intv.recommendation.toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-surface-darkBorder text-xs text-slate-500">
                      No interviews scheduled yet. Click <strong>Schedule Round</strong> above to set up a screening or technical round.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-surface-darkBorder">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors cursor-pointer shadow-subtle"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual Correction Form Modal */}
      {profile && (
        <ManualCorrectionModal
          isOpen={isCorrectionOpen}
          onClose={() => setIsCorrectionOpen(false)}
          candidate={profile}
          onCorrected={handleCorrectionSaved}
        />
      )}
    </>
  );
};
