import React, { useMemo } from 'react';
import { simulatePageReplacement } from '../../core/replacement/replacement';

interface CompareModeProps {
  refString: number[];
  frameCount: number;
  currentStep?: number;
}

export const CompareMode: React.FC<CompareModeProps> = ({
  refString,
  frameCount,
  currentStep: _currentStep,
}) => {
  const fifoSteps = useMemo(
    () => simulatePageReplacement({ refString, frameCount, algorithm: 'fifo' }),
    [refString, frameCount]
  );
  const lruSteps = useMemo(
    () => simulatePageReplacement({ refString, frameCount, algorithm: 'lru' }),
    [refString, frameCount]
  );
  const optSteps = useMemo(
    () => simulatePageReplacement({ refString, frameCount, algorithm: 'opt' }),
    [refString, frameCount]
  );

  const fifoLast = fifoSteps[fifoSteps.length - 1];
  const lruLast = lruSteps[lruSteps.length - 1];
  const optLast = optSteps[optSteps.length - 1];

  const fifoFaults = fifoLast?.state.faultCount || 0;
  const lruFaults = lruLast?.state.faultCount || 0;
  const optFaults = optLast?.state.faultCount || 0;

  const maxFaults = Math.max(fifoFaults, lruFaults, optFaults, refString.length, 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            📊 Policy Benchmark Comparison: FIFO vs LRU vs OPT
          </h3>
          <p className="text-xs text-slate-400">
            Running simultaneously on {frameCount} frames and {refString.length} references
          </p>
        </div>

        <span className="text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-800 px-2.5 py-1 rounded">
          OPT is the theoretical minimum bound
        </span>
      </div>

      {/* Fault Count Comparison Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FIFO card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">FIFO</span>
            <span className="text-xs font-mono text-slate-400">Arrival age</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400">{fifoFaults}</span>
            <span className="text-xs text-slate-400">faults / {refString.length}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(fifoFaults / maxFaults) * 100}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Ignores reference recency. Susceptible to Belady&apos;s Anomaly.
          </div>
        </div>

        {/* LRU card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">LRU</span>
            <span className="text-xs font-mono text-slate-400">Recency stack</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{lruFaults}</span>
            <span className="text-xs text-slate-400">faults / {refString.length}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(lruFaults / maxFaults) * 100}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Stack algorithm. Proven immune to Belady&apos;s Anomaly.
          </div>
        </div>

        {/* OPT card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">OPT (Belady MIN)</span>
            <span className="text-xs font-mono text-purple-400">Clairvoyant</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{optFaults}</span>
            <span className="text-xs text-slate-400">faults / {refString.length}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(optFaults / maxFaults) * 100}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Unimprovable lower bound for offline replacement.
          </div>
        </div>
      </div>

      {/* Synchronized Reference String Trace Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="p-2 text-left sticky left-0 bg-slate-900 z-10 w-28">Policy</th>
              {refString.map((ref, idx) => (
                <th key={idx} className="p-1.5 text-center min-w-[28px]">
                  <span className="text-slate-300 font-bold">{ref}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800/50">
              <td className="p-2 font-bold text-rose-400 sticky left-0 bg-slate-900 z-10">
                FIFO ({fifoFaults}F)
              </td>
              {fifoLast?.state.history.map((h, i) => (
                <td key={i} className="p-1 text-center">
                  <span
                    className={`inline-block w-5 h-5 rounded text-[10px] font-bold leading-5 ${
                      h.isHit
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {h.isHit ? 'H' : 'F'}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="border-b border-slate-800/50">
              <td className="p-2 font-bold text-amber-400 sticky left-0 bg-slate-900 z-10">
                LRU ({lruFaults}F)
              </td>
              {lruLast?.state.history.map((h, i) => (
                <td key={i} className="p-1 text-center">
                  <span
                    className={`inline-block w-5 h-5 rounded text-[10px] font-bold leading-5 ${
                      h.isHit
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {h.isHit ? 'H' : 'F'}
                  </span>
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-2 font-bold text-emerald-400 sticky left-0 bg-slate-900 z-10">
                OPT ({optFaults}F)
              </td>
              {optLast?.state.history.map((h, i) => (
                <td key={i} className="p-1 text-center">
                  <span
                    className={`inline-block w-5 h-5 rounded text-[10px] font-bold leading-5 ${
                      h.isHit
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {h.isHit ? 'H' : 'F'}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
