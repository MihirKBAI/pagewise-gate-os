import React, { useState } from 'react';
import { FileText, Copy, Check, Printer, BookOpen, CheckCircle2 } from 'lucide-react';
import { QUESTION_BANK } from '../../core/questions/questionBank';
import { Question } from '../../core/questions/types';

interface FormulaCardItem {
  topic: string;
  name: string;
  formula: string;
  derivation: string;
  notes: string;
}

const FORMULA_CARDS: FormulaCardItem[] = [
  {
    topic: 'Memory Management (Paging)',
    name: 'Address Bits & Splitting',
    formula: 'page# (p) = log₂(VA / Page Size);   offset (d) = log₂(Page Size)',
    derivation: 'VA = 2^(p + d). Frame number f = log₂(PA / Page Size).',
    notes: 'Physical Address (PA) = (Frame # << d) | Offset. Offset bits are identical in VA and PA.',
  },
  {
    topic: 'Memory Management (Paging)',
    name: 'Page Table Size (Single-Level)',
    formula: 'PT Size = 2^p × PTE_size = (VA / Page Size) × PTE_size',
    derivation: 'Number of entries = 2^p. Each entry is PTE_size bytes (typically 4 B or 8 B).',
    notes: 'Example: 32-bit VA, 4 KB page, 4 B PTE → 2^20 entries × 4 B = 4 MB.',
  },
  {
    topic: 'Memory Management (Paging)',
    name: 'Multi-Level Paging Hierarchy',
    formula: 'entries/table = Page Size / PTE_size;   bits/level = log₂(entries/table)',
    derivation: 'Levels k = ⌈(VA_bits - offset_bits) / bits_per_level⌉.',
    notes: 'Example: 48-bit VA, 4 KB page, 8 B PTE → 512 entries/table → 9 bits/level → 36/9 = 4 levels.',
  },
  {
    topic: 'TLB Caching',
    name: 'TLB Effective Access Time (Sequential)',
    formula: 'EAT = h·(t + m) + (1 - h)·(t + k·m + m)',
    derivation: 'h = TLB hit ratio; t = TLB lookup time; m = RAM access time; k = page table levels.',
    notes: 'Sequential lookup adds t on a miss. For 1-level table: EAT = h(t + m) + (1 - h)(t + 2m).',
  },
  {
    topic: 'TLB Caching',
    name: 'TLB Effective Access Time (Parallel Lookup)',
    formula: 'EAT = h·(t + m) + (1 - h)·(k·m + m)',
    derivation: 'TLB lookup and memory access happen concurrently on a miss.',
    notes: 'Always verify whether the GATE question specifies parallel or sequential lookup (FLAG-8).',
  },
  {
    topic: 'Page Replacement & Faults',
    name: 'EAT with Demand Page Faults',
    formula: 'EAT = (1 - p)·m + p·S',
    derivation: 'p = page fault rate; m = RAM access time; S = page fault service time.',
    notes: 'Dirty page service: S_eff = (1 - dirty)·S_clean + dirty·S_dirty.',
  },
  {
    topic: 'Page Replacement & Faults',
    name: 'Maximum Fault Rate for Slowdown Target',
    formula: 'p ≤ (EAT_target - m) / (S - m)',
    derivation: 'EAT = m + p(S - m) ≤ EAT_target → solve for p.',
    notes: 'Example: m = 200 ns, S = 8 ms, target ≤ 220 ns (10% slowdown) → p ≤ 2.5 × 10⁻⁶.',
  },
  {
    topic: 'Deadlock & RAG',
    name: 'Pigeonhole Deadlock-Freedom Guarantee',
    formula: 'R ≥ ∑(Max_i - 1) + 1   (or R ≥ n·(m - 1) + 1 if all max demands equal m)',
    derivation: 'Worst-case stall: every process holds m - 1 units. Total = n(m - 1). 1 more unit guarantees completion.',
    notes: 'Example: 3 processes with max 4 units each → worst case hold 9 units → R = 10 guarantees freedom.',
  },
  {
    topic: "Deadlock & Banker's Algorithm",
    name: "Banker's Algorithm Need Matrix",
    formula: 'Need[i][j] = Max[i][j] - Allocation[i][j]',
    derivation: 'Work starts at Available. If Need[i] ≤ Work for all resources, P_i runs and Work += Allocation[i].',
    notes: 'Safe sequences are NOT unique! Multiple valid orderings often exist.',
  },
  {
    topic: 'Virtual Memory Bounds',
    name: 'Inverted Page Table Entry Count',
    formula: '#entries = Physical RAM / Page Size',
    derivation: 'One entry per physical RAM frame. Completely independent of virtual address space size.',
    notes: 'Example: 1 GB RAM, 4 KB page → 2^30 / 2^12 = 2^18 = 262,144 entries.',
  },
  {
    topic: 'Virtual Memory Bounds',
    name: 'Optimal Page Size',
    formula: 'p_opt ≈ √(2 · s · e)',
    derivation: 'Minimizes overhead = (s/p)·e + p/2, where s = process size, e = PTE size.',
    notes: 'Balances internal fragmentation loss against page table memory overhead.',
  },
  {
    topic: 'Concurrency & Synchronization',
    name: 'Counter Race Min/Max Bounds',
    formula: 'Max(x) = 2·n;   Min(x) = 2   (for 2 threads each performing n ≥ 2 increments)',
    derivation: 'Max achieved by serial execution. Min achieved by double-clobber adversarial preemption.',
    notes: 'Verified by exhaustive state-space search (FLAG-6).',
  },
  {
    topic: 'Concurrency & Synchronization',
    name: 'Counting Semaphore Arithmetic',
    formula: 'S_final = S_init - #P + #V',
    derivation: 'Each P() decrements S; each V() increments S. Negative S indicates blocked processes in queue.',
    notes: 'Operation order affects which processes block, but never changes S_final.',
  },
];

// 10 Curated Drill Problems covering all core modules (Milestone M7 / Section 14)
const CURATED_DRILL_IDS = [
  'pr-fifo-001',
  'pr-lru-002',
  'pr-opt-003',
  'pr-belady-004',
  'pr-eat-005',
  'bk-need-001',
  'rag-thresh-001',
  'pg-split-001',
  'pg-multi-002',
  'sync-race-001',
];

export const CheatSheetsView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'formulas' | 'workbook' | 'all'>('formulas');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const curatedQuestions: Question[] = CURATED_DRILL_IDS.map(
    (id) => QUESTION_BANK.find((q) => q.id === id) || QUESTION_BANK[0]
  );

  const handleCopy = (formula: string, idx: number) => {
    navigator.clipboard.writeText(formula);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">GATE OS Formula Cards & Printable Workbook</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Authoritative revision cheat-sheet (Appendix A) and 10-drill printable practice workbook for GATE CS/IT Operating Systems.
          </p>
        </div>

        {/* View Mode Switcher & Print Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveMode('formulas')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeMode === 'formulas'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Formula Cards
            </button>
            <button
              onClick={() => setActiveMode('workbook')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                activeMode === 'workbook'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Practice Workbook
            </button>
            <button
              onClick={() => setActiveMode('all')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeMode === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Booklet
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet Header (Visible only when printing or in workbook view) */}
      {(activeMode === 'workbook' || activeMode === 'all') && (
        <div className="hidden print:block bg-white text-slate-900 border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight">PAGEWISE — GATE CS/IT OPERATING SYSTEMS</h1>
              <p className="text-xs text-slate-600 font-mono">Numerical Problem Solving Practice Workbook & Formula Booklet</p>
            </div>
            <div className="text-right text-xs font-mono space-y-1">
              <div>Student Name: _______________________</div>
              <div>Roll No / Date: _______________________</div>
              <div>Score: _______ / 10</div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Formula Reference Cards */}
      {(activeMode === 'formulas' || activeMode === 'all') && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2 print:text-slate-900">
              <FileText className="w-4 h-4 text-indigo-400 print:text-slate-900" /> Appendix A: Authoritative Formula Reference Cards
            </h3>
            <span className="text-xs font-mono text-slate-400 print:text-slate-600">{FORMULA_CARDS.length} Formulas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
            {FORMULA_CARDS.map((card, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col gap-3 transition print:bg-white print:border-slate-300 print:text-slate-900 print-avoid-break"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[11px] border border-indigo-900/60 font-semibold print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                    {card.topic}
                  </span>
                  <button
                    onClick={() => handleCopy(card.formula, idx)}
                    className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[11px] font-mono transition print:hidden"
                    title="Copy formula text"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>

                <h4 className="font-bold text-sm text-white print:text-slate-900">
                  {card.name}
                </h4>

                {/* Formula Pill */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs font-bold text-amber-300 overflow-x-auto print:bg-slate-50 print:text-slate-900 print:border-slate-300">
                  {card.formula}
                </div>

                <div className="space-y-1 text-xs font-mono text-slate-400 print:text-slate-700">
                  <div className="text-slate-300 font-sans print:text-slate-800">
                    <strong>Derivation:</strong> {card.derivation}
                  </div>
                  <div className="text-slate-500 font-sans text-[11px] print:text-slate-600">
                    <strong>Key Exam Note:</strong> {card.notes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Curated Practice Drills (Milestone M7 / Section 14) */}
      {(activeMode === 'workbook' || activeMode === 'all') && (
        <div className="flex flex-col gap-5 pt-4 print:pt-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-slate-400">
            <div>
              <h3 className="font-bold text-base text-slate-200 flex items-center gap-2 print:text-slate-900">
                <BookOpen className="w-5 h-5 text-indigo-400 print:text-slate-900" /> 10 Curated GATE OS Numerical Practice Drills
              </h3>
              <p className="text-xs text-slate-400 print:text-slate-600 font-sans mt-0.5">
                Representative problems covering all 6 syllabus modules. Solve in the scratchpad space below.
              </p>
            </div>

            {/* Answer Key Toggle */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  showAnswerKey
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {showAnswerKey ? '✓ Answer Key & Solutions Shown' : 'Show Answer Key & Solutions'}
              </button>
            </div>
          </div>

          {/* Drill Problem Cards */}
          <div className="flex flex-col gap-6">
            {curatedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4 print:bg-white print:border-slate-300 print:text-slate-900 print-avoid-break"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs print:bg-slate-900">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-200 print:text-slate-900 text-sm">
                      {q.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800 text-[11px] print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                      {q.topicName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800 text-[11px] print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                      Level {q.difficulty} • {q.type}
                    </span>
                  </div>
                </div>

                {/* Problem Stem */}
                <div className="text-xs sm:text-sm text-slate-300 print:text-slate-800 font-sans leading-relaxed whitespace-pre-line bg-slate-950/60 print:bg-slate-50 p-4 rounded-xl border border-slate-800/80 print:border-slate-200">
                  {q.stem}
                </div>

                {/* Candidate Scratch Space & Answer Entry Box */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 font-mono text-xs">
                  {/* Scratchpad */}
                  <div className="md:col-span-3 h-28 border border-dashed border-slate-700 print:border-slate-400 rounded-lg p-2.5 bg-slate-950/30 print:bg-white flex flex-col justify-between text-[11px] text-slate-500">
                    <span>Working & Derivation Scratchpad:</span>
                    <span className="text-[10px] text-slate-600 text-right">Step-by-step calculation</span>
                  </div>

                  {/* Final Answer Entry */}
                  <div className="md:col-span-1 border border-slate-700 print:border-slate-400 rounded-lg p-3 bg-slate-950/50 print:bg-white flex flex-col justify-between">
                    <span className="text-slate-400 font-bold print:text-slate-700">Final Answer:</span>
                    <div className="h-10 border-b-2 border-indigo-500 print:border-slate-900 flex items-center justify-center font-bold text-base text-amber-300 print:text-slate-900">
                      {/* Blank for candidate or print */}
                    </div>
                    <span className="text-[10px] text-slate-500 text-right">Unit: {q.unit || 'NAT value'}</span>
                  </div>
                </div>

                {/* Solution & Derivation (Toggled or printed in booklet) */}
                {(showAnswerKey || activeMode === 'all') && (
                  <div className="bg-emerald-950/30 border border-emerald-500/40 print:bg-slate-50 print:border-emerald-700 rounded-xl p-4 text-xs font-mono space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-emerald-300 print:text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Correct Answer: {String(q.answer)} {q.unit || ''}
                    </div>
                    <div className="text-slate-300 print:text-slate-800 font-sans leading-relaxed">
                      <strong>Method Hint:</strong> {q.hintLadder[0]}
                    </div>
                    <div className="text-slate-400 print:text-slate-700 font-sans text-[11px]">
                      <strong>Detailed Trace:</strong> {q.hintLadder[2]}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
