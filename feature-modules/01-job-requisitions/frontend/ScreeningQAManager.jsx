import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  Plus,
  Copy,
  Download,
  Printer,
  Trash2,
  Edit3,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { getSavedScreeningQuestions, saveScreeningQuestions } from '../../services/api';

export const ScreeningQAManager = ({ jd, interviewKit, kitLoading }) => {
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    let active = true;
    setQuestions(interviewKit?.screening_questions || []);
    setSaveMessage('');
    setSaveError('');
    if (jd?.id) {
      getSavedScreeningQuestions(jd.id)
        .then(({ questions: stored }) => {
          if (active && stored.length) setQuestions(stored);
        })
        .catch((err) => {
          if (active) setSaveError(err.response?.data?.detail || 'Saved screening questions could not be loaded.');
        });
    }
    return () => { active = false; };
  }, [jd?.id, interviewKit]);
  const [questionFilter, setQuestionFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [copiedQAId, setCopiedQAId] = useState(null);
  const [activeScorecard, setActiveScorecard] = useState({});
  const [checkedSignals, setCheckedSignals] = useState({});

  // Add Question Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingQId, setEditingQId] = useState(null);
  const [formCategory, setFormCategory] = useState('Architecture & Implementation');
  const [formStage, setFormStage] = useState('Technical Round 1');
  const [formDifficulty, setFormDifficulty] = useState('Advanced');
  const [formQuestion, setFormQuestion] = useState('');
  const [formModelAnswer, setFormModelAnswer] = useState('');
  const [formSignals, setFormSignals] = useState('');
  const [formRedFlags, setFormRedFlags] = useState('');

  const handleCopyQA = (q) => {
    const text = `Question: ${q.question}\nStage: ${q.recommended_stage}\nDifficulty: ${q.difficulty}\n\nModel Answer:\n${q.model_answer}\n\nExpected Signals:\n${(q.expected_signals || []).map((s) => '- ' + s).join('\n')}\n\nRed Flags:\n${(q.red_flags || []).map((r) => '- ' + r).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedQAId(q.id);
    setTimeout(() => setCopiedQAId(null), 2000);
  };

  const handleDuplicateQA = (q) => {
    const dup = {
      ...q,
      id: `sq-${Date.now()}`,
      question: `${q.question} (Copy)`,
    };
    setQuestions((prev) => [dup, ...prev]);
  };

  const handleDeleteQA = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleApproveQA = (id) => {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, review_status: 'approved' } : q));
  };

  const handleSaveQuestions = async () => {
    if (!jd?.id) return;
    setSaving(true);
    setSaveMessage('');
    setSaveError('');
    try {
      await saveScreeningQuestions(jd.id, { questions });
      setSaveMessage('Questions saved. Drafts remain unapproved.');
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Questions could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (q) => {
    setModalMode('edit');
    setEditingQId(q.id);
    setFormCategory(q.category || 'Architecture & Implementation');
    setFormStage(q.recommended_stage || 'Technical Round 1');
    setFormDifficulty(q.difficulty || 'Advanced');
    setFormQuestion(q.question || '');
    setFormModelAnswer(q.model_answer || '');
    setFormSignals((q.expected_signals || []).join('\n'));
    setFormRedFlags((q.red_flags || []).join('\n'));
    setShowAddModal(true);
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    const signalsArr = formSignals.split('\n').map((s) => s.trim()).filter(Boolean);
    const redFlagsArr = formRedFlags.split('\n').map((r) => r.trim()).filter(Boolean);

    if (modalMode === 'add') {
      const newQ = {
        id: `sq-${Date.now()}`,
        review_status: 'draft',
        category: formCategory,
        recommended_stage: formStage,
        difficulty: formDifficulty,
        question: formQuestion,
        model_answer: formModelAnswer,
        expected_signals: signalsArr.length > 0 ? signalsArr : ['Demonstrates concrete implementation experience.'],
        red_flags: redFlagsArr.length > 0 ? redFlagsArr : ['Vague or generic answers.'],
        rubric: {
          below_bar: 'Lacks conceptual grounding.',
          meets_bar: 'Accurately explains concepts and provides examples.',
          exceeds_bar: 'Comprehensive architectural depth with trade-offs.',
        },
      };
      setQuestions((prev) => [newQ, ...prev]);
    } else {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQId
            ? {
                ...q,
                category: formCategory,
                recommended_stage: formStage,
                difficulty: formDifficulty,
                question: formQuestion,
                model_answer: formModelAnswer,
                expected_signals: signalsArr,
                red_flags: redFlagsArr,
                review_status: 'draft',
              }
            : q
        )
      );
    }
    setShowAddModal(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `Screening_Questions_${jd?.req_code || 'JD'}.json`);
    dlAnchorElem.click();
  };

  const handleExportMarkdown = () => {
    const lines = [
      `# Technical Screening Questions — ${jd?.title || 'Requisition'} (${jd?.req_code || 'JD'})`,
      `*Generated deterministically for recruiter phone screens and hiring manager rounds.*`,
      '\n---\n',
    ];
    questions.forEach((q, idx) => {
      lines.push(`### Question ${idx + 1}: ${q.category}`);
      lines.push(`**Stage:** ${q.recommended_stage} | **Difficulty:** ${q.difficulty}`);
      lines.push(`\n> "${q.question}"\n`);
      lines.push(`**Ideal Model Answer:**\n${q.model_answer}\n`);
      lines.push('**Expected Signals:**');
      (q.expected_signals || []).forEach((s) => lines.push(`- [x] ${s}`));
      lines.push('\n**Watch-outs & Red Flags:**');
      (q.red_flags || []).forEach((r) => lines.push(`- [!] ${r}`));
      lines.push('\n---\n');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Screening_Questions_${jd?.req_code || 'JD'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredQuestions = questions.filter((q) => {
    const matchCat =
      questionFilter === 'All' || (q.category || '').toLowerCase().includes(questionFilter.toLowerCase());
    const matchDiff =
      difficultyFilter === 'All' || (q.difficulty || '').toLowerCase() === difficultyFilter.toLowerCase();
    return matchCat && matchDiff;
  });

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-navy-900 dark:text-slate-100">
                Technical Screening Q&A & Evaluation Signals
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {questions.length} Questions
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Deterministic question management with difficulty tiers, verbatim model answers, and signals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModalMode('add');
                setFormQuestion('');
                setFormModelAnswer('');
                setFormSignals('');
                setFormRedFlags('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
            <button
              type="button"
              onClick={handleSaveQuestions}
              disabled={saving || !questions.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-semibold cursor-pointer disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving…' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .md</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
        {(saveMessage || saveError) && (
          <p role={saveError ? 'alert' : 'status'} className={`text-xs ${saveError ? 'text-rose-600' : 'text-emerald-700'}`}>
            {saveError || saveMessage}
          </p>
        )}

        {/* Dual Filter Bars */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Category:</span>
            {['All', 'Architecture', 'Tuning', 'Integration', 'Domain', 'Quality'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setQuestionFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  questionFilter === cat
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Difficulty:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 font-semibold"
            >
              <option value="All">All Tiers</option>
              <option value="Basic">Basic</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert / Scenario</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-navy-900 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>{modalMode === 'add' ? 'Add Screening Question' : 'Edit Screening Question'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Stage</label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900"
                  >
                    <option value="Recruiter Phone Screen">Recruiter Phone Screen</option>
                    <option value="Technical Round 1">Technical Round 1</option>
                    <option value="Technical Deep Dive">Technical Deep Dive</option>
                    <option value="Hiring Manager Round">Hiring Manager Round</option>
                    <option value="Leadership Round">Leadership Round</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert / Scenario</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">The Technical Question *</label>
                <textarea
                  rows={2}
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="Enter the scenario or technical prompt..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Ideal Model Technical Answer *</label>
                <textarea
                  rows={3}
                  required
                  value={formModelAnswer}
                  onChange={(e) => setFormModelAnswer(e.target.value)}
                  placeholder="Verbatim model answer an interviewer should look for..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Expected Positive Signals (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formSignals}
                    onChange={(e) => setFormSignals(e.target.value)}
                    placeholder="Mentions Dense vs Sparse\nDetails essbase.cfg sizing"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Watch-Outs & Red Flags (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formRedFlags}
                    onChange={(e) => setFormRedFlags(e.target.value)}
                    placeholder="Cannot explain index caches\nOnly worked as a report consumer"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {modalMode === 'add' ? 'Add Question' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List of Detailed Question Cards */}
      <div className="space-y-4">
        {!filteredQuestions.length ? (
          <div className="p-6 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-300 dark:border-surface-darkBorder">
            {kitLoading ? 'Loading screening questions…' : 'No saved questions for this requisition. Add a question to start a recruiter-reviewed set.'}
            <p className="mt-2 text-xs">Nemotron generation is unavailable for hosted free inference with confidential job content.</p>
          </div>
        ) : filteredQuestions.map((q, idx) => (
          <div
            key={q.id || idx}
            className="p-5 rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-subtle space-y-3.5"
          >
            {/* Question Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  QUESTION {idx + 1}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {q.category}
                </span>
                <span className="text-[10px] text-slate-400">
                  • Stage: <strong>{q.recommended_stage || 'Technical Round 1'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.review_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {q.review_status === 'approved' ? 'Approved' : 'Draft · approval needed'}
                </span>
                {q.review_status !== 'approved' && (
                  <button type="button" onClick={() => handleApproveQA(q.id)} className="text-[10px] font-semibold text-emerald-700 hover:underline">
                    Approve
                  </button>
                )}
                <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {q.difficulty || 'Advanced'}
                </span>
                <button
                  type="button"
                  onClick={() => openEditModal(q)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  title="Edit question"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateQA(q)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  title="Duplicate question"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyQA(q)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  title="Copy question and model answer"
                >
                  {copiedQAId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteQA(q.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* The Question in Quotes */}
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/60 dark:border-surface-darkBorder">
              "{q.question}"
            </p>

            {/* Full Ideal Model Answer */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-medium text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Model evaluation answer</span>
              </span>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                {q.model_answer}
              </p>
            </div>

            {/* Expected Positive Signals (Interactive Checklist) */}
            <div className="space-y-1.5 pt-1">
              <span className="font-medium text-[10px] text-slate-500 block">
                Expected evaluation signals
              </span>
              <div className="space-y-1">
                {(q.expected_signals || []).map((signal, sIdx) => {
                  const sigKey = `${q.id}_sig_${sIdx}`;
                  const isChecked = !!checkedSignals[sigKey];
                  return (
                    <div
                      key={sIdx}
                      onClick={() => setCheckedSignals((prev) => ({ ...prev, [sigKey]: !prev[sigKey] }))}
                      className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isChecked
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span>{signal}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scoring Rubric & Red Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {q.rubric && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-surface-darkBorder space-y-1.5 text-[11px]">
                  <span className="font-bold uppercase text-[10px] text-slate-500 block">
                    SCORING RUBRIC (1 - 5 SCALE)
                  </span>
                  <div>
                    <strong className="text-rose-600">1-2 (Below Bar):</strong> {q.rubric.below_bar}
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">3 (Meets Bar):</strong> {q.rubric.meets_bar}
                  </div>
                  <div>
                    <strong className="text-emerald-600">4-5 (Exceeds):</strong> {q.rubric.exceeds_bar}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1 text-[11px] text-rose-800 dark:text-rose-300">
                <span className="font-bold uppercase text-[10px] text-rose-700 dark:text-rose-400 block">
                  ⚠ WATCH-OUTS & RED FLAGS:
                </span>
                <ul className="space-y-0.5 list-disc pl-3">
                  {(q.red_flags || []).map((r, rIdx) => (
                    <li key={rIdx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recruiter Score Rating Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400 font-semibold">Rate Candidate Response:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveScorecard((prev) => ({ ...prev, [q.id]: num }))}
                    className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center cursor-pointer transition-all ${
                      activeScorecard[q.id] === num
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Green & Red Flags Cards (Frame 00) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
          <span className="font-bold text-xs uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <span>🟢</span>
            <span>GREEN FLAGS (STRONG POSITIVE SIGNALS)</span>
          </span>
          <ul className="text-slate-700 dark:text-slate-300 space-y-1.5 text-xs list-disc pl-4">
            <li>Concrete architectural ownership rather than superficial configuration.</li>
            <li>Deep fluency in MAXL, EPM Automate, and REST API scheduling.</li>
            <li>Proven hands-on experience handling multi-currency and intercompany eliminations.</li>
            <li>Articulates precise trade-offs between dynamic vs stored calculations.</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
          <span className="font-bold text-xs uppercase text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <span>🔴</span>
            <span>RED FLAGS (WATCH-OUTS & RISKS)</span>
          </span>
          <ul className="text-slate-700 dark:text-slate-300 space-y-1.5 text-xs list-disc pl-4">
            <li>Only worked as a report viewer/Smart View consumer with no backend rule writing.</li>
            <li>Cannot explain the difference between dense and sparse dimensions.</li>
            <li>Vague answers on production release management and change control.</li>
            <li>Relies on manual Excel manipulation rather than automated Data Management mapping.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
