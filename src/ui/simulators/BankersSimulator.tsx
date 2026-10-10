import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  simulateBankerSafety,
  findAllSafeSequences,
  validateLearnerSafeSequence,
  evaluateResourceRequest,
} from '../../core/banker/banker';
import { BankerParams, ResourceRequest } from '../../core/banker/types';
import { Timeline } from '../components/Timeline';
import { CaptionBar } from '../components/CaptionBar';
import { CheckCircle2, XCircle, ShieldCheck, AlertTriangle, RefreshCw, Sparkles, Send } from 'lucide-react';

const CLASSIC_PRESET: BankerParams = {
  processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
  resources: ['A', 'B', 'C'],
  total: [10, 5, 7],
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
};

interface BankersSimulatorProps {
  initialParams?: BankerParams;
}

export const BankersSimulator: React.FC<BankersSimulatorProps> = ({
  initialParams = CLASSIC_PRESET,
}) => {
  const [params, setParams] = useState<BankerParams>(initialParams);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Request panel state
  const [requestProc, setRequestProc] = useState<string>('P1');
  const [requestAmounts, setRequestAmounts] = useState<number[]>([1, 0, 2]);
  const [requestResult, setRequestResult] = useState<ReturnType<typeof evaluateResourceRequest> | null>(null);

  // All safe sequences toggle
  const [showAllSequences, setShowAllSequences] = useState<boolean>(false);

  // Learner sequence test input
  const [userSequenceInput, setUserSequenceInput] = useState<string>('P3, P1, P4, P0, P2');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; reason?: string } | null>(null);

  // Run Banker's Safety simulation
  const steps = useMemo(() => {
    return simulateBankerSafety(params);
  }, [params]);

  const activeStep = steps[currentStep] || steps[0];
  const state = activeStep?.state;

  // Compute all safe sequences
  const allSafeSeqs = useMemo(() => {
    return findAllSafeSequences(params);
  }, [params]);

  // Autoplay
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, playbackSpeed * 1000);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, steps.length]);

  const handleEvaluateRequest = () => {
    const pIdx = params.processes.indexOf(requestProc);
    if (pIdx === -1) return;
    const req: ResourceRequest = {
      procIndex: pIdx,
      request: requestAmounts,
    };
    const res = evaluateResourceRequest(params, req);
    setRequestResult(res);
  };

  const handleValidateLearnerSeq = () => {
    const seq = userSequenceInput
      .split(/[,>\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const res = validateLearnerSafeSequence(params, seq);
    setValidationResult(res);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header controls & preset switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Banker&apos;s Algorithm Safety Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulates dynamic multi-resource deadlock avoidance. Check whether the current state is safe, inspect per-process Need vectors, and evaluate incoming resource allocation requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setParams(CLASSIC_PRESET);
              setCurrentStep(0);
              setRequestResult(null);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Classic Worked Example
          </button>
        </div>
      </div>

      {/* Available & Total Resource Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-1">
          <span className="text-slate-400 font-semibold">Total System Resources:</span>
          <div className="flex gap-2">
            {params.resources.map((r, idx) => (
              <span key={r} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-bold">
                {r}: {params.total ? params.total[idx] : '-'}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-1">
          <span className="text-slate-400 font-semibold">Initial Available Vector:</span>
          <div className="flex gap-2">
            {params.resources.map((r, idx) => (
              <span key={r} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-300 font-bold">
                {r}: {state?.available[idx] ?? '-'}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-1">
          <span className="text-slate-400 font-semibold">Current Work Vector:</span>
          <div className="flex gap-2">
            {params.resources.map((r, idx) => (
              <span key={r} className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700 text-amber-300 font-black">
                {r}: {state?.work[idx] ?? '-'}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-1">
          <span className="text-slate-400 font-semibold">Safe Sequence So Far:</span>
          <div className="font-bold text-teal-400 truncate">
            {state?.safeSequence.length ? `⟨ ${state.safeSequence.join(', ')} ⟩` : '⟨ ⟩'}
          </div>
        </div>
      </div>

      {/* Main Banker's Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4 overflow-x-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wide">
            Process Allocation, Max Claim & Need Matrices
          </span>
          <span className="text-slate-400 font-mono">
            Formula: Need[i] = Max[i] - Allocation[i]
          </span>
        </div>

        <table className="w-full border-collapse font-mono text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="p-2.5">Process</th>
              <th className="p-2.5">Allocation (A B C)</th>
              <th className="p-2.5">Max Claim (A B C)</th>
              <th className="p-2.5 text-amber-300 font-bold">Need (A B C)</th>
              <th className="p-2.5">Need ≤ Work?</th>
              <th className="p-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {params.processes.map((proc, pIdx) => {
              const isFinished = state?.finish[pIdx];
              const isCandidate = state?.currentCandidate === pIdx;
              const checkInfo = state?.candidateChecks?.find((c) => c.procIndex === pIdx);

              return (
                <tr
                  key={proc}
                  className={`border-b border-slate-800/60 transition-colors ${
                    isCandidate
                      ? 'bg-amber-950/40 border-amber-600/60'
                      : isFinished
                      ? 'bg-teal-950/20 text-slate-400'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="p-2.5 font-bold flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isFinished ? 'bg-teal-400' : isCandidate ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <span className={isCandidate ? 'text-amber-300 font-black underline' : 'text-slate-200'}>
                      {proc}
                    </span>
                  </td>

                  {/* Allocation */}
                  <td className="p-2.5">
                    <div className="flex gap-1.5">
                      {params.allocation[pIdx].map((val, rIdx) => (
                        <span key={rIdx} className="w-6 py-0.5 rounded bg-slate-800/80 text-center text-slate-300 border border-slate-700">
                          {val}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Max */}
                  <td className="p-2.5">
                    <div className="flex gap-1.5">
                      {params.max[pIdx].map((val, rIdx) => (
                        <span key={rIdx} className="w-6 py-0.5 rounded bg-slate-800/80 text-center text-slate-300 border border-slate-700">
                          {val}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Need */}
                  <td className="p-2.5">
                    <div className="flex gap-1.5">
                      {state?.need[pIdx].map((val: number, rIdx: number) => (
                        <span
                          key={rIdx}
                          className={`w-6 py-0.5 rounded text-center font-bold border ${
                            isCandidate
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-800/80 text-slate-200 border-slate-700'
                          }`}
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Need <= Work per-column check */}
                  <td className="p-2.5">
                    {isFinished ? (
                      <span className="text-teal-400 text-[11px] font-sans">Already Finished ✓</span>
                    ) : checkInfo ? (
                      <div className="flex items-center gap-1.5">
                        {checkInfo.columnChecks.map((canPass, cIdx) => (
                          <span
                            key={cIdx}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-0.5 ${
                              canPass
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                            title={`${params.resources[cIdx]}: Need ${checkInfo.need[cIdx]} <= Work ${checkInfo.work[cIdx]}`}
                          >
                            {params.resources[cIdx]}: {canPass ? '✓' : '✗'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-2.5 text-center">
                    {isFinished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        <CheckCircle2 className="w-3 h-3" /> Finished
                      </span>
                    ) : isCandidate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Executing...
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stepper Timeline & Caption */}
      <Timeline
        currentStep={currentStep}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onStepChange={(s) => setCurrentStep(s)}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onSpeedChange={(sp) => setPlaybackSpeed(sp)}
      />

      <CaptionBar
        stepIndex={currentStep}
        caption={activeStep?.caption || ''}
        formula={activeStep?.formula}
        event={activeStep?.event}
      />

      {/* Two Auxiliary Interactive Panels: Resource Request Evaluator & Safe Sequence Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Resource Request Evaluation (Section 6.3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" /> Dynamic Resource Request Evaluator
            </h3>
            <span className="text-xs text-slate-400 font-mono">3-Step Safety Checklist</span>
          </div>

          <p className="text-xs text-slate-300">
            Suppose a process issues an immediate resource request. Can the OS safely grant it without risking deadlock?
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Process:</span>
              <select
                value={requestProc}
                onChange={(e) => setRequestProc(e.target.value)}
                className="bg-slate-950 border border-slate-700 px-2.5 py-1 rounded text-indigo-300 font-bold focus:outline-none"
              >
                {params.processes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Request:</span>
              {params.resources.map((r, rIdx) => (
                <div key={r} className="flex items-center gap-1">
                  <span className="text-slate-500">{r}:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={requestAmounts[rIdx] ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setRequestAmounts((prev) => {
                        const copy = [...prev];
                        copy[rIdx] = val;
                        return copy;
                      });
                    }}
                    className="w-12 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-center text-slate-200 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleEvaluateRequest}
              className="px-3.5 py-1.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow"
            >
              Evaluate Request
            </button>
          </div>

          {/* Evaluation Checklist Results */}
          {requestResult && (
            <div className={`p-4 rounded-xl border text-xs flex flex-col gap-2.5 ${
              requestResult.granted
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-bold text-sm">
                <span>Result: {requestResult.granted ? 'REQUEST GRANTED ✓' : 'REQUEST DENIED / MUST WAIT ✗'}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-current">
                  {requestProc} requests ({requestAmounts.join(', ')})
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  {requestResult.step1NeedCheck ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>
                    <strong>Step 1: Request ≤ Need</strong> — {requestResult.step1NeedCheck ? 'Passed (Request within max declared claim)' : 'Failed (Request exceeds declared Need)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {requestResult.step2AvailableCheck ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>
                    <strong>Step 2: Request ≤ Available</strong> — {requestResult.step2AvailableCheck ? 'Passed (Sufficient resources free in system)' : 'Failed (Insufficient available units; process must wait)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {requestResult.step3SafetyCheck ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>
                    <strong>Step 3: Post-allocation Safety Check</strong> — {requestResult.step3SafetyCheck ? 'Passed (System remains safe with a valid sequence)' : 'Failed (Granting request leads to an unsafe state)'}
                  </span>
                </div>
              </div>

              <div className="text-xs pt-1 border-t border-slate-700/60 font-mono">
                {requestResult.reason}
              </div>

              {requestResult.safeSequenceAfterGrant && (
                <div className="text-xs pt-1 border-t border-emerald-800/60 font-mono text-emerald-300">
                  New safe execution sequence: ⟨ {requestResult.safeSequenceAfterGrant.join(', ')} ⟩
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel 2: Interactive Safe Sequence Verifier (FLAG-7) & DFS All Sequences */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Safe Sequence Verifier (FLAG-7)
            </h3>
            <button
              onClick={() => setShowAllSequences(!showAllSequences)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
            >
              {showAllSequences ? 'Hide All' : `Show All Valid (${allSafeSeqs.length})`}
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Safe sequences are <strong>not unique</strong>. Enter any candidate ordering to test whether it avoids deadlock via full step-by-step simulation.
          </p>

          <div className="flex items-center gap-2 text-xs font-mono">
            <input
              type="text"
              value={userSequenceInput}
              onChange={(e) => setUserSequenceInput(e.target.value)}
              placeholder="e.g. P3, P1, P4, P0, P2"
              className="flex-1 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
            />
            <button
              onClick={handleValidateLearnerSeq}
              className="px-3.5 py-1.5 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-500 transition shadow"
            >
              Verify
            </button>
          </div>

          {validationResult && (
            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              validationResult.valid
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}>
              {validationResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <strong>{validationResult.valid ? 'VALID SAFE SEQUENCE! ✓' : 'INVALID SEQUENCE! ✗'}</strong>
                <p className="mt-0.5 text-slate-300 font-sans leading-relaxed">
                  {validationResult.valid
                    ? 'Every process in this ordering satisfies Need ≤ Work at the moment it runs, safely releasing its allocation.'
                    : validationResult.reason}
                </p>
              </div>
            </div>
          )}

          {/* All Safe Sequences DFS Drawer */}
          {showAllSequences && (
            <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 text-xs font-mono flex flex-col gap-2">
              <span className="font-bold text-slate-300">
                All {allSafeSeqs.length} Possible Safe Sequences (DFS Discovery):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {allSafeSeqs.map((seq, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setUserSequenceInput(seq.join(', '));
                      setValidationResult({ valid: true });
                    }}
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 cursor-pointer transition flex items-center justify-between"
                  >
                    <span>{idx + 1}. ⟨ {seq.join(', ')} ⟩</span>
                    <span className="text-[10px] text-slate-500">Click to test</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
