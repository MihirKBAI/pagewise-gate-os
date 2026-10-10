import React, { useState, useMemo } from 'react';
import { evaluateBeladyAnomaly } from '../../core/replacement/replacement';
import { AlertTriangle, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export const BeladyLab: React.FC = () => {
  const [refStringInput, setRefStringInput] = useState<string>('1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5');
  const [maxFrames, setMaxFrames] = useState<number>(7);

  const refString = useMemo(() => {
    return refStringInput
      .split(/[,;\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }, [refStringInput]);

  const { curve, hasAnomaly, anomalyPair } = useMemo(() => {
    if (refString.length === 0) return { curve: [], hasAnomaly: false, anomalyPair: null };
    return evaluateBeladyAnomaly(refString, 1, maxFrames);
  }, [refString, maxFrames]);

  const maxFaultsInCurve = useMemo(() => {
    if (curve.length === 0) return 10;
    return Math.max(...curve.map((c) => Math.max(c.fifoFaults, c.lruFaults, c.optFaults)), 1);
  }, [curve]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Belady&apos;s Anomaly Research Laboratory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Normally, allocating more physical memory frames should reduce or maintain page faults.
            Under First-In First-Out (FIFO), allocating more frames can paradoxically INCREASE page faults!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefStringInput('1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60 hover:bg-amber-900/50 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Classic 1969 String
          </button>
        </div>
      </div>

      {/* Input row */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 text-xs font-mono">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-slate-400 font-semibold whitespace-nowrap">Reference String:</span>
          <input
            type="text"
            value={refStringInput}
            onChange={(e) => setRefStringInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-indigo-300 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Frame Range:</span>
          <select
            value={maxFrames}
            onChange={(e) => setMaxFrames(parseInt(e.target.value, 10))}
            className="bg-slate-950 border border-slate-800 text-indigo-400 px-3 py-1.5 rounded-lg font-bold"
          >
            <option value={5}>1 to 5 frames</option>
            <option value={6}>1 to 6 frames</option>
            <option value={7}>1 to 7 frames</option>
            <option value={8}>1 to 8 frames</option>
          </select>
        </div>
      </div>

      {/* Anomaly Detection Status Banner */}
      {hasAnomaly && anomalyPair ? (
        <div className="bg-rose-950/40 border-2 border-rose-500/60 rounded-xl p-4 shadow-xl flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="text-sm font-black text-rose-300 uppercase tracking-wide">
              Belady&apos;s Anomaly Detected!
            </span>
            <div className="text-slate-200 mt-0.5">
              Under FIFO, increasing frames from <strong>{anomalyPair.f1}</strong> to{' '}
              <strong>{anomalyPair.f2}</strong> increased page faults from{' '}
              <strong className="text-amber-400">{anomalyPair.count1}</strong> to{' '}
              <strong className="text-rose-400">{anomalyPair.count2}</strong> (+
              {anomalyPair.count2 - anomalyPair.count1} fault)!
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs text-slate-300">
            No anomaly on this string for frames 1..{maxFrames}. (Stack algorithms like LRU never exhibit it).
          </div>
        </div>
      )}

      {/* SVG Interactive Multi-Curve Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            Fault Curves vs Frame Count (Sweep 1..{maxFrames})
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-3 rounded bg-rose-500"></span> FIFO (Anomaly prone)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded bg-amber-500"></span> LRU (Stack algorithm)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded bg-emerald-500"></span> OPT (Lower bound)
            </span>
          </div>
        </div>

        {/* Bar & Curve Visualization */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-4">
          {curve.map((pt) => {
            const isAnomalyStep =
              anomalyPair &&
              (pt.frames === anomalyPair.f1 || pt.frames === anomalyPair.f2);

            return (
              <div
                key={pt.frames}
                className={`bg-slate-950/70 border rounded-xl p-3 flex flex-col items-center gap-2 ${
                  isAnomalyStep
                    ? 'border-rose-500/80 bg-rose-950/20 shadow-md'
                    : 'border-slate-800'
                }`}
              >
                <div className="text-xs font-bold font-mono text-slate-300">
                  {pt.frames} Frame{pt.frames > 1 ? 's' : ''}
                </div>

                {/* Vertical Comparison Bars */}
                <div className="h-44 w-full flex items-end justify-center gap-1.5 py-2 border-b border-slate-800">
                  {/* FIFO bar */}
                  <div className="w-4 flex flex-col items-center justify-end h-full">
                    <div className="text-[10px] font-mono text-rose-300 font-bold mb-0.5">
                      {pt.fifoFaults}
                    </div>
                    <div
                      className="w-full bg-rose-500 rounded-t transition-all duration-500"
                      style={{ height: `${(pt.fifoFaults / maxFaultsInCurve) * 100}%` }}
                    ></div>
                  </div>

                  {/* LRU bar */}
                  <div className="w-4 flex flex-col items-center justify-end h-full">
                    <div className="text-[10px] font-mono text-amber-300 font-bold mb-0.5">
                      {pt.lruFaults}
                    </div>
                    <div
                      className="w-full bg-amber-500 rounded-t transition-all duration-500"
                      style={{ height: `${(pt.lruFaults / maxFaultsInCurve) * 100}%` }}
                    ></div>
                  </div>

                  {/* OPT bar */}
                  <div className="w-4 flex flex-col items-center justify-end h-full">
                    <div className="text-[10px] font-mono text-emerald-300 font-bold mb-0.5">
                      {pt.optFaults}
                    </div>
                    <div
                      className="w-full bg-emerald-500 rounded-t transition-all duration-500"
                      style={{ height: `${(pt.optFaults / maxFaultsInCurve) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  Diff: {pt.fifoFaults - pt.lruFaults >= 0 ? `+${pt.fifoFaults - pt.lruFaults}` : pt.fifoFaults - pt.lruFaults}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mathematical Proof Card (Inclusion Property) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-3">
        <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          📖 Mathematical Principle: The Inclusion Property of Stack Algorithms
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-amber-300 block mb-1">
              Why LRU & OPT Never Suffer From Belady&apos;s Anomaly:
            </span>
            <p>
              An algorithm is a <em>stack algorithm</em> if the set of pages in memory with{' '}
              <code className="text-amber-300">k</code> frames is strictly a subset of the pages
              resident with <code className="text-amber-300">k + 1</code> frames at any time{' '}
              <code className="text-amber-300">t</code>:
            </p>
            <div className="my-2 p-2 bg-slate-900 rounded text-center font-mono text-indigo-300">
              S(t, k) ⊆ S(t, k + 1)
            </div>
            <p>
              Since a hit in the smaller memory is guaranteed to also hit in the larger memory, faults can
              never increase.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-rose-300 block mb-1">
              Why FIFO Violates the Inclusion Property:
            </span>
            <p>
              FIFO replaces the oldest arrived page, completely ignoring reference frequency and recency.
              A page that is actively accessed can remain resident in a 3-frame system while being evicted in
              a 4-frame system because its arrival timestamp was earlier, breaking the subset condition:
            </p>
            <div className="my-2 p-2 bg-slate-900 rounded text-center font-mono text-rose-300">
              S_FIFO(t, k) ⊈ S_FIFO(t, k + 1)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
