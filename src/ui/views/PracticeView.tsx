import React, { useState, useMemo, useEffect } from 'react';
import { QUESTION_BANK, diagnoseAnswer } from '../../core/questions/questionBank';
import { Question, AnswerDiagnosisResult } from '../../core/questions/types';
import { DiagnosisPanel } from '../components/DiagnosisPanel';
import { Cpu, HelpCircle, AlertOctagon } from 'lucide-react';

interface PracticeViewProps {
  initialTopicId?: string;
  onOpenSimulator: (link: string) => void;
}

const LOCAL_STORAGE_MISTAKES_KEY = 'pagewise_mistake_log_v1';

export const PracticeView: React.FC<PracticeViewProps> = ({
  initialTopicId = 'all',
  onOpenSimulator,
}) => {
  const [topicFilter, setTopicFilter] = useState<string>(initialTopicId);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [onlyMistakes, setOnlyMistakes] = useState<boolean>(false);

  // Mistake log state from localStorage
  const [mistakeIds, setMistakeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MISTAKES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Active question user answer input
  const [userAnswerInput, setUserAnswerInput] = useState<string>('');
  const [selectedMcqOption, setSelectedMcqOption] = useState<string>('');
  const [diagnosisResult, setDiagnosisResult] = useState<AnswerDiagnosisResult | null>(null);

  // Hint ladder state: 0 (none), 1 (Method), 2 (First steps), 3 (Full trace), 4 (Link)
  const [revealedHintTier, setRevealedHintTier] = useState<number>(0);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return QUESTION_BANK.filter((q) => {
      if (topicFilter !== 'all' && q.topicId !== topicFilter) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== parseInt(difficultyFilter, 10)) return false;
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;
      if (onlyMistakes && !mistakeIds.includes(q.id)) return false;
      return true;
    });
  }, [topicFilter, difficultyFilter, typeFilter, onlyMistakes, mistakeIds]);

  const activeQuestion: Question | undefined = filteredQuestions[currentQuestionIndex];

  // Reset inputs when switching questions
  useEffect(() => {
    setUserAnswerInput('');
    setSelectedMcqOption('');
    setDiagnosisResult(null);
    setRevealedHintTier(0);
  }, [currentQuestionIndex, topicFilter, difficultyFilter, typeFilter, onlyMistakes]);

  // Record mistake
  const handleRecordMistake = (qId: string, isCorrect: boolean) => {
    setMistakeIds((prev) => {
      let updated: string[];
      if (isCorrect) {
        // Remove from mistake log if solved correctly
        updated = prev.filter((id) => id !== qId);
      } else {
        // Add to mistake log if not already there
        updated = prev.includes(qId) ? prev : [...prev, qId];
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_MISTAKES_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const handleSubmitAnswer = () => {
    if (!activeQuestion) return;
    const raw = activeQuestion.type === 'MCQ' ? selectedMcqOption : userAnswerInput;
    if (!raw.trim()) return;

    const result = diagnoseAnswer(activeQuestion, raw);
    setDiagnosisResult(result);
    handleRecordMistake(activeQuestion.id, result.isCorrect);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">GATE Numerical Practice & Diagnostics Engine</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Solve exam-style NAT, MCQ, and sequence numericals with automated misconception diagnosis (Section 3.3).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyMistakes(!onlyMistakes)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                onlyMistakes
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold shadow'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Mistake Log ({mistakeIds.length})</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Topic:</span>
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value);
                setCurrentQuestionIndex(0);
              }}
              className="bg-slate-950 border border-slate-700 px-2.5 py-1 rounded text-indigo-300 font-bold"
            >
              <option value="all">All Topics ({QUESTION_BANK.length})</option>
              <option value="page-replacement">Page Replacement</option>
              <option value="banker">Banker&apos;s Algorithm</option>
              <option value="rag">RAG & Deadlock</option>
              <option value="paging">Paging & Segmentation</option>
              <option value="sync">Concurrency & Sync</option>
              <option value="vm">Virtual Memory</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Difficulty:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setCurrentQuestionIndex(0);
              }}
              className="bg-slate-950 border border-slate-700 px-2.5 py-1 rounded text-slate-200"
            >
              <option value="all">All Difficulties</option>
              <option value="1">Level 1 (Fundamental)</option>
              <option value="2">Level 2 (Standard GATE)</option>
              <option value="3">Level 3 (Challenging)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentQuestionIndex(0);
              }}
              className="bg-slate-950 border border-slate-700 px-2.5 py-1 rounded text-slate-200"
            >
              <option value="all">All Types</option>
              <option value="NAT">NAT (Numerical Answer)</option>
              <option value="MCQ">MCQ (Multiple Choice)</option>
              <option value="SEQUENCE">SEQUENCE (Safe Order)</option>
            </select>
          </div>

          <span className="text-slate-500 ml-auto">
            Showing {filteredQuestions.length} drill{filteredQuestions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Practice Workspace: Question Carousel & Solver */}
      {activeQuestion ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Question Navigator Drawer on the Left (3 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 max-h-[700px] overflow-y-auto">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Question Navigator ({currentQuestionIndex + 1}/{filteredQuestions.length})
            </span>

            {filteredQuestions.map((q, idx) => {
              const isSelected = idx === currentQuestionIndex;
              const isMistake = mistakeIds.includes(q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`p-3 rounded-lg border cursor-pointer transition flex flex-col gap-1 text-xs ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 shadow text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-indigo-400 font-bold">{q.type}</span>
                    <div className="flex items-center gap-1">
                      {isMistake && (
                        <span className="text-rose-400 font-bold">⚠️ Review</span>
                      )}
                      <span className="text-slate-500">Diff: {q.difficulty}</span>
                    </div>
                  </div>
                  <div className="font-bold truncate">{idx + 1}. {q.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{q.topicName}</div>
                </div>
              );
            })}
          </div>

          {/* Question Card & Solver on the Right (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              {/* Question metadata header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                    {activeQuestion.topicName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">
                    Type: {activeQuestion.type}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  {activeQuestion.pyq.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px]">
                      {activeQuestion.pyq[0].verified ? '✓ GATE Verified' : 'GATE Twin (Unverified)'}
                    </span>
                  )}
                  <span className="text-slate-400">
                    Difficulty: {'★'.repeat(activeQuestion.difficulty)}{'☆'.repeat(3 - activeQuestion.difficulty)}
                  </span>
                </div>
              </div>

              {/* Title & Stem */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">
                  {activeQuestion.title}
                </h3>
                <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {activeQuestion.stem}
                </div>
              </div>

              {/* Answer Input Area */}
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 flex flex-col gap-4">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide">
                  Your Solution Entry
                </span>

                {/* NAT Input */}
                {activeQuestion.type === 'NAT' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={userAnswerInput}
                      onChange={(e) => setUserAnswerInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                      placeholder="Enter numerical answer (e.g. 15 or 0x5A5C)..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-indigo-500"
                    />
                    {activeQuestion.unit && (
                      <span className="text-slate-400 font-mono text-xs font-bold">
                        {activeQuestion.unit}
                      </span>
                    )}
                    <button
                      onClick={handleSubmitAnswer}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow transition"
                    >
                      Check Answer
                    </button>
                  </div>
                )}

                {/* MCQ Options */}
                {activeQuestion.type === 'MCQ' && (
                  <div className="space-y-2">
                    {activeQuestion.options?.map((opt) => (
                      <label
                        key={opt.id}
                        onClick={() => setSelectedMcqOption(opt.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
                          selectedMcqOption === opt.id
                            ? 'bg-indigo-950/80 border-indigo-500 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="mcq"
                          value={opt.id}
                          checked={selectedMcqOption === opt.id}
                          onChange={() => setSelectedMcqOption(opt.id)}
                          className="accent-indigo-500"
                        />
                        <span className="text-xs font-sans font-medium">{opt.text}</span>
                      </label>
                    ))}
                    <div className="pt-2">
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedMcqOption}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition disabled:opacity-40"
                      >
                        Submit Choice
                      </button>
                    </div>
                  </div>
                )}

                {/* SEQUENCE Input (for Banker's safe sequence) */}
                {activeQuestion.type === 'SEQUENCE' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={userAnswerInput}
                        onChange={(e) => setUserAnswerInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                        placeholder="e.g. P1, P3, P4, P0, P2"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={handleSubmitAnswer}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow transition"
                      >
                        Validate Sequence
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      FLAG-7: Safe sequence verified by live simulation (any valid ordering accepted).
                    </span>
                  </div>
                )}
              </div>

              {/* Explicit Diagnosis Panel (Section 3.3) */}
              {diagnosisResult && (
                <DiagnosisPanel
                  diagnosis={diagnosisResult}
                  onOpenSimulator={(link) => onOpenSimulator(link)}
                  onRetry={() => {
                    setDiagnosisResult(null);
                    setUserAnswerInput('');
                  }}
                />
              )}

              {/* 4-Tier Hint Ladder */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    Progressive Hint Ladder ({revealedHintTier}/4 Revealed)
                  </span>

                  {revealedHintTier < 4 && (
                    <button
                      onClick={() => setRevealedHintTier((prev) => Math.min(4, prev + 1))}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
                    >
                      Reveal Next Hint
                    </button>
                  )}
                </div>

                {revealedHintTier >= 1 && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300">
                    <strong className="text-amber-300 block mb-0.5">Tier 1 — Recommended Method:</strong>
                    {activeQuestion.hintLadder[0]}
                  </div>
                )}

                {revealedHintTier >= 2 && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300">
                    <strong className="text-amber-300 block mb-0.5">Tier 2 — First Steps:</strong>
                    {activeQuestion.hintLadder[1]}
                  </div>
                )}

                {revealedHintTier >= 3 && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300">
                    <strong className="text-amber-300 block mb-0.5">Tier 3 — Full Trace Derivation:</strong>
                    {activeQuestion.hintLadder[2]}
                  </div>
                )}

                {revealedHintTier >= 4 && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-indigo-300 flex items-center justify-between">
                    <span><strong>Tier 4 — Interactive Link:</strong> Open concept in simulator.</span>
                    <button
                      onClick={() => onOpenSimulator(activeQuestion.simulatorLink)}
                      className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-xs"
                    >
                      Open Simulator
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
          No questions matched the active filters. Clear filters or select a different topic.
        </div>
      )}
    </div>
  );
};
