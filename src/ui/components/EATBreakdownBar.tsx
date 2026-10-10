import React from 'react';

export interface EATSegment {
  label: string;
  ns: number;
  color: string; // Tailwind color classes e.g. 'bg-emerald-500'
  description?: string;
}

interface EATBreakdownBarProps {
  segments: EATSegment[];
  totalEATNs: number;
  baselineRAMNs?: number;
}

export const EATBreakdownBar: React.FC<EATBreakdownBarProps> = ({
  segments,
  totalEATNs,
  baselineRAMNs,
}) => {
  const formatTime = (ns: number): string => {
    if (ns >= 1_000_000) {
      return `${(ns / 1_000_000).toFixed(2)} ms`;
    }
    if (ns >= 1_000) {
      return `${(ns / 1_000).toFixed(2)} µs`;
    }
    return `${ns.toFixed(1)} ns`;
  };

  const slowdown = baselineRAMNs && baselineRAMNs > 0 ? totalEATNs / baselineRAMNs : null;

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-bold text-slate-300">
          Effective Access Time (EAT) Breakdown:
        </span>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold bg-indigo-950/80 border border-indigo-700/60 px-2.5 py-1 rounded">
            Total EAT: {formatTime(totalEATNs)}
          </span>
          {slowdown && slowdown > 1 && (
            <span className="text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-1 rounded font-bold">
              {slowdown.toFixed(1)}× Baseline RAM Delay
            </span>
          )}
        </div>
      </div>

      {/* Stacked Proportional Bar */}
      <div className="w-full bg-slate-900 h-5 rounded-lg overflow-hidden flex shadow-inner border border-slate-800">
        {segments.map((seg, idx) => {
          const pct = totalEATNs > 0 ? (seg.ns / totalEATNs) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <div
              key={idx}
              className={`${seg.color} h-full transition-all duration-300 relative group flex items-center justify-center`}
              style={{ width: `${Math.max(pct, 0.8)}%` }}
              title={`${seg.label}: ${formatTime(seg.ns)} (${pct.toFixed(2)}%)`}
            >
              {pct >= 12 && (
                <span className="text-[10px] text-white font-bold truncate px-1 drop-shadow">
                  {pct.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Segments Legend & Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-[11px]">
        {segments.map((seg, idx) => {
          const pct = totalEATNs > 0 ? (seg.ns / totalEATNs) * 100 : 0;
          return (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg flex flex-col gap-0.5"
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                <span className="text-slate-200 truncate">{seg.label}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{formatTime(seg.ns)}</span>
                <span className="text-indigo-300 font-bold">{pct.toFixed(2)}%</span>
              </div>
              {seg.description && (
                <div className="text-[10px] text-slate-500 truncate">{seg.description}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dominance Callout */}
      {segments.some((s) => s.ns / totalEATNs > 0.8) && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 text-[11px] text-amber-300">
          💡 <strong>Key GATE Insight:</strong> The disk page fault penalty (ms scale) dominates fast RAM
          access (ns scale) by up to 10⁵×. Even a minute 0.1% fault rate contributes ~98% of overall access latency!
        </div>
      )}
    </div>
  );
};
