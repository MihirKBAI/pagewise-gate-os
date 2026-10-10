import React from 'react';
import { FrameHistoryEntry, ReplacementAlgorithm } from '../../core/replacement/types';
import { CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';

interface FrameTableProps {
  algorithm: ReplacementAlgorithm;
  frameCount: number;
  refString: number[];
  currentStepIndex: number;
  history: FrameHistoryEntry[];
  recencyStack?: number[];
  queueOrder?: number[];
  nextUses?: Record<number, number | null>;
  clockBits?: number[];
  clockPointer?: number;
}

export const FrameTable: React.FC<FrameTableProps> = ({
  algorithm,
  frameCount,
  refString,
  currentStepIndex,
  history,
  recencyStack = [],
  queueOrder = [],
  nextUses = {},
  clockBits = [],
  clockPointer = 0,
}) => {
  // Current step state
  const currentEntry = history[currentStepIndex - 1] ?? null;
  const currentFrames = currentEntry ? currentEntry.frames : Array(frameCount).fill(null);
  const isCurrentHit = currentEntry ? currentEntry.isHit : false;
  const victimPage = currentEntry ? currentEntry.victim : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Top Header & Metrics Banner */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
            {algorithm.toUpperCase()} Frame Allocation
          </span>
          <span className="text-xs text-slate-400">
            {frameCount} Physical Frames | Ref String Length: {refString.length}
          </span>
        </div>

        {currentEntry && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-slate-300">
              Incoming:{' '}
              <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {currentEntry.page}
              </span>
            </span>
            <span
              className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                isCurrentHit
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-hit'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 glow-fault'
              }`}
            >
              {isCurrentHit ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> HIT
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> FAULT
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Main Signature Grid */}
      <div className="overflow-x-auto pb-3">
        <table className="w-full border-collapse font-mono text-xs sm:text-sm select-none">
          <thead>
            {/* Reference String Row */}
            <tr className="border-b border-slate-800">
              <th className="p-2 text-left text-slate-400 font-semibold sticky left-0 bg-slate-900 z-10 w-24">
                Reference
              </th>
              {refString.map((ref, idx) => {
                const isCurrent = idx === currentStepIndex - 1;
                const isPast = idx < currentStepIndex;
                return (
                  <th
                    key={idx}
                    className={`p-2 text-center transition-colors min-w-[40px] ${
                      isCurrent
                        ? 'bg-indigo-600/30 text-indigo-300 font-bold border-b-2 border-indigo-500'
                        : isPast
                        ? 'text-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    <div
                      className={`inline-block px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-md scale-110'
                          : isPast
                          ? 'bg-slate-800/80 text-slate-300'
                          : 'bg-slate-900/40 text-slate-600'
                      }`}
                    >
                      {ref}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Rows for Frames F0, F1, ... */}
            {Array.from({ length: frameCount }).map((_, fIdx) => (
              <tr key={fIdx} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="p-2 font-semibold text-slate-400 sticky left-0 bg-slate-900 z-10 flex items-center gap-1.5">
                  <span>Frame {fIdx}</span>
                  {algorithm === 'clock' && clockPointer === fIdx && (
                    <span className="text-[10px] text-amber-400" title="Clock Hand Pointer">
                      👉
                    </span>
                  )}
                </td>

                {refString.map((_, colIdx) => {
                  const hist = history[colIdx];
                  const hasHappened = colIdx < currentStepIndex;
                  const pageInFrame = hist ? hist.frames[fIdx] : null;
                  const isCurrentCol = colIdx === currentStepIndex - 1;
                  const isHitCol = hist?.isHit;
                  const isJustLoaded =
                    hasHappened &&
                    hist &&
                    hist.page === pageInFrame &&
                    (colIdx === 0 || history[colIdx - 1]?.frames[fIdx] !== pageInFrame);

                  return (
                    <td
                      key={colIdx}
                      className={`p-2 text-center transition-all ${
                        isCurrentCol ? 'bg-indigo-950/40' : ''
                      }`}
                    >
                      {hasHappened && pageInFrame !== null ? (
                        <div
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold transition-transform ${
                            isCurrentCol && isJustLoaded
                              ? 'bg-rose-500/30 text-rose-300 border-2 border-rose-500 scale-105 shadow-md animate-bounce'
                              : isCurrentCol && isHitCol && hist.page === pageInFrame
                              ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500 scale-105 shadow-md'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {pageInFrame}
                        </div>
                      ) : (
                        <span className="text-slate-700">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Hit / Fault Status Row */}
            <tr className="border-t-2 border-slate-800 bg-slate-950/40">
              <td className="p-2 font-bold text-slate-300 sticky left-0 bg-slate-900 z-10">
                Result
              </td>
              {refString.map((_, colIdx) => {
                const hist = history[colIdx];
                const hasHappened = colIdx < currentStepIndex;
                if (!hasHappened || !hist) {
                  return (
                    <td key={colIdx} className="p-2 text-center text-slate-700">
                      -
                    </td>
                  );
                }
                return (
                  <td key={colIdx} className="p-2 text-center font-bold">
                    {hist.isHit ? (
                      <span className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-xs">
                        HIT
                      </span>
                    ) : (
                      <span className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded text-xs">
                        FAULT
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Auxiliary Metadata Panel: Recency stack / Arrival Queue / OPT lookahead / Clock bits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
        {/* Supporting Policy Strip */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
          <div className="text-slate-400 font-semibold flex items-center justify-between">
            <span>
              {algorithm === 'fifo' && 'FIFO Arrival Queue (Oldest → Newest):'}
              {algorithm === 'lru' && 'LRU Recency Stack (LRU → MRU):'}
              {algorithm === 'opt' && 'OPT Future Clairvoyance Lookahead:'}
              {algorithm === 'clock' && 'Clock Second-Chance Reference Bits:'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {algorithm === 'fifo' &&
              (queueOrder.length > 0 ? (
                queueOrder.map((pg, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded text-center border ${
                      i === 0
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <div className="font-bold">{pg}</div>
                    <div className="text-[10px] text-slate-400">
                      {i === 0 ? 'Oldest (Next Evict)' : `#${i + 1}`}
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-slate-500">Queue empty</span>
              ))}

            {algorithm === 'lru' &&
              (recencyStack.length > 0 ? (
                recencyStack.map((pg, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded text-center border ${
                      i === 0
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : i === recencyStack.length - 1
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <div className="font-bold">{pg}</div>
                    <div className="text-[10px] text-slate-400">
                      {i === 0 ? 'LRU (Victim)' : i === recencyStack.length - 1 ? 'MRU' : `#${i + 1}`}
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-slate-500">Stack empty</span>
              ))}

            {algorithm === 'opt' &&
              currentFrames.filter((p) => p !== null).map((pg, i) => {
                const nextPos = nextUses[pg!];
                return (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded text-center border ${
                      nextPos === null
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <div className="font-bold">Page {pg}</div>
                    <div className="text-[10px] text-slate-400">
                      {nextPos === null ? 'Never reused' : `Ref #${nextPos + 1}`}
                    </div>
                  </div>
                );
              })}

            {algorithm === 'clock' &&
              clockBits.map((bit, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-1 rounded text-center border ${
                    clockPointer === idx
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-bold">Frame {idx}: bit={bit}</div>
                  <div className="text-[10px] text-slate-400">
                    {clockPointer === idx ? '👈 Pointer' : 'Resident'}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Eviction / Victim Callout */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-center">
          {victimPage !== null ? (
            <div className="flex items-center gap-2.5 text-amber-400">
              <ArrowRightLeft className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="font-bold text-amber-300">Eviction Event:</span> Page{' '}
                <span className="font-black underline">{victimPage}</span> was replaced to make
                room for incoming page{' '}
                <span className="font-black underline">{currentEntry?.page}</span>.
              </div>
            </div>
          ) : isCurrentHit ? (
            <div className="text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Page hit! Requested page is already cached in fast frame storage.</span>
            </div>
          ) : currentStepIndex > 0 ? (
            <div className="text-slate-400">
              Initial placement into an empty frame (Cold Miss). No victim eviction required.
            </div>
          ) : (
            <div className="text-slate-500">Ready to step through reference accesses.</div>
          )}
        </div>
      </div>
    </div>
  );
};
