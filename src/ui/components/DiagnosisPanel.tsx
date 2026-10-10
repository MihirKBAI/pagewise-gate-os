import React from 'react';
import { AlertOctagon, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import { AnswerDiagnosisResult } from '../../core/questions/types';

interface DiagnosisPanelProps {
  diagnosis: AnswerDiagnosisResult;
  onOpenSimulator?: (link: string) => void;
  onRetry?: () => void;
}

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({
  diagnosis,
  onOpenSimulator,
  onRetry,
}) => {
  if (diagnosis.isCorrect) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 shadow-lg text-emerald-200 flex flex-col gap-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>EXCELLENT! Answer Correct</span>
          </div>
          <span className="text-xs font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
            Score: +1
          </span>
        </div>

        <p className="text-sm text-emerald-100">{diagnosis.diagnosisText}</p>

        {onOpenSimulator && (
          <div className="pt-1">
            <button
              onClick={() => onOpenSimulator(diagnosis.suggestedSimLink)}
              className="text-xs font-semibold text-emerald-300 hover:text-emerald-100 flex items-center gap-1 underline"
            >
              Verify animated trace in simulator <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-rose-950/40 border-2 border-rose-500/50 rounded-xl p-5 shadow-2xl text-rose-100 flex flex-col gap-4 animate-fade-in">
      {/* Header comparison banner */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-rose-900/50">
        <div className="flex items-center gap-2 font-bold text-rose-300 text-base">
          <XCircle className="w-5 h-5 text-rose-400" />
          <span>Incorrect Answer</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-rose-900 text-rose-300">
            Your answer: <strong className="text-white">{diagnosis.submittedAnswer}</strong>
          </span>
          <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-emerald-800 text-emerald-300">
            Correct answer: <strong className="text-white">{diagnosis.correctAnswerFormatted}</strong>
          </span>
        </div>
      </div>

      {/* Explicit Diagnosis Box (FLAG: Section 3.3 core feature) */}
      <div className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-3.5 flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">
            Probable Misconception Diagnosed:
          </span>
          <p className="text-slate-200 leading-relaxed font-sans">
            {diagnosis.diagnosisText || 'Intermediate step divergence from correct trace.'}
          </p>
          {diagnosis.diffSummary && (
            <p className="text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/80 mt-1">
              Diff note: {diagnosis.diffSummary}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Try Again
          </button>
        )}

        {onOpenSimulator && (
          <button
            onClick={() => onOpenSimulator(diagnosis.suggestedSimLink)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition shadow"
          >
            Open in Simulator to Inspect Trace <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
