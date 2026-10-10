import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRightLeft, ShieldAlert } from 'lucide-react';

interface CaptionBarProps {
  caption: string;
  formula?: string;
  event?: string;
  stepIndex: number;
}

export const CaptionBar: React.FC<CaptionBarProps> = ({
  caption,
  formula,
  event,
  stepIndex,
}) => {
  const renderBadge = () => {
    switch (event) {
      case 'hit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> HIT
          </span>
        );
      case 'fault':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <XCircle className="w-3.5 h-3.5" /> PAGE FAULT
          </span>
        );
      case 'evict':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <ArrowRightLeft className="w-3.5 h-3.5" /> EVICTION
          </span>
        );
      case 'grant':
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> SAFE
          </span>
        );
      case 'deadlock':
      case 'deny':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertTriangle className="w-3.5 h-3.5" /> DEADLOCK / DENIED
          </span>
        );
      case 'trap':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <ShieldAlert className="w-3.5 h-3.5" /> TRAP
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            STEP {stepIndex}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {renderBadge()}
          <span className="text-xs text-slate-400 font-mono">Trace explanation</span>
        </div>

        {formula && (
          <div className="text-xs font-mono bg-slate-950/70 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-900/40 flex items-center gap-1">
            <span className="text-slate-500">Formula:</span> {formula}
          </div>
        )}
      </div>

      <p
        aria-live="polite"
        className="text-sm md:text-base text-slate-200 leading-relaxed font-sans"
      >
        {caption || 'Initializing simulation...'}
      </p>
    </div>
  );
};
