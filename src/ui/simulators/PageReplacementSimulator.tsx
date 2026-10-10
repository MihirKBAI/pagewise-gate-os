import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  simulatePageReplacement,
  computeEATPageFaults,
  computeMaxFaultRateForEAT,
} from '../../core/replacement/replacement';
import { ReplacementAlgorithm } from '../../core/replacement/types';
import { FrameTable } from '../components/FrameTable';
import { Timeline } from '../components/Timeline';
import { CaptionBar } from '../components/CaptionBar';
import { EATBreakdownBar } from '../components/EATBreakdownBar';
import { CompareMode } from './CompareMode';
import { QUESTION_BANK } from '../../core/questions/questionBank';
import { RefreshCw, HelpCircle, Check, X, BarChart2, Calculator, BookOpen } from 'lucide-react';

interface PageReplacementSimulatorProps {
  initialRefString?: number[];
  initialFrames?: number;
  initialAlgorithm?: ReplacementAlgorithm;
  initialStep?: number;
  onLinkUpdated?: (url: string) => void;
}

export const PageReplacementSimulator: React.FC<PageReplacementSimulatorProps> = ({
  initialRefString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
  initialFrames = 3,
  initialAlgorithm = 'fifo',
  initialStep = 0,
}) => {
  const [refStringInput, setRefStringInput] = useState<string>(initialRefString.join(', '));
  const [frameCount, setFrameCount] = useState<number>(initialFrames);
  const [algorithm, setAlgorithm] = useState<ReplacementAlgorithm>(initialAlgorithm);
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [predictMode, setPredictMode] = useState<boolean>(false);
  const [predictScore, setPredictScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [predictFeedback, setPredictFeedback] = useState<string | null>(null);

  // EAT & Dirty Pages Calculator Panel state (Section 6.5 Worked Numericals 3 & 4)
  const [showEatCalculator, setShowEatCalculator] = useState<boolean>(false);
  const [memoryAccessNs, setMemoryAccessNs] = useState<number>(200);
  const [faultServiceNs, setFaultServiceNs] = useState<number>(8000000); // 8 ms
  const [dirtyServiceNs, setDirtyServiceNs] = useState<number>(20000000); // 20 ms
  const [dirtyFraction, setDirtyFraction] = useState<number>(0.4); // 40% dirty
  const [faultRate, setFaultRate] = useState<number>(0.001); // 1 in 1000
  const [targetSlowdownPct, setTargetSlowdownPct] = useState<number>(10); // 10% slowdown target

  // Sync props when navigated to or deep-linked
  useEffect(() => {
    setRefStringInput(initialRefString.join(', '));
    setFrameCount(initialFrames);
    setAlgorithm(initialAlgorithm);
    setCurrentStep(initialStep);
  }, [initialRefString, initialFrames, initialAlgorithm, initialStep]);

  // Practice questions for "Load from Question"
  const practiceQuestions = useMemo(() => {
    return QUESTION_BANK.filter((q) => q.topicId === 'page-replacement');
  }, []);

  // Compute EAT values
  const eatResult = useMemo(() => {
    return computeEATPageFaults({
      memoryAccessNs,
      faultServiceNs,
      faultRate,
      dirtyFraction,
      dirtyServiceNs,
    });
  }, [memoryAccessNs, faultServiceNs, faultRate, dirtyFraction, dirtyServiceNs]);

  const maxPermissibleP = useMemo(() => {
    const targetEatNs = memoryAccessNs * (1 + targetSlowdownPct / 100);
    return computeMaxFaultRateForEAT({
      memoryAccessNs,
      faultServiceNs,
      maxTargetEatNs: targetEatNs,
    });
  }, [memoryAccessNs, faultServiceNs, targetSlowdownPct]);

  // Parse reference string
  const refString = useMemo(() => {
    return refStringInput
      .split(/[,;\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }, [refStringInput]);

  // Run simulation
  const steps = useMemo(() => {
    if (refString.length === 0) return [];
    return simulatePageReplacement({
      refString,
      frameCount,
      algorithm,
    });
  }, [refString, frameCount, algorithm]);

  // Bound currentStep
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(Math.max(0, steps.length - 1));
    }
  }, [steps.length, currentStep]);

  // Autoplay timer
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, playbackSpeed * 1000);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, steps.length]);

  const activeStep = steps[currentStep] || steps[0];
  const nextStep = steps[currentStep + 1];

  // Predict mode handlers
  const handlePredict = (predictedHit: boolean) => {
    if (!nextStep) return;
    const actualHit = nextStep.state.isHit;
    const isCorrect = predictedHit === actualHit;

    setPredictScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    setPredictFeedback(
      isCorrect
        ? `Spot on! Page ${nextStep.state.currentPage} resulted in a ${actualHit ? 'HIT' : 'PAGE FAULT'}.`
        : `Not quite. Page ${nextStep.state.currentPage} was a ${actualHit ? 'HIT' : 'PAGE FAULT'}.`
    );

    // Advance to next step
    setCurrentStep((prev) => prev + 1);
  };

  // Presets
  const loadPreset = (presetName: 'golden20' | 'belady' | 'cyclic' | 'random') => {
    if (presetName === 'golden20') {
      setRefStringInput('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1');
      setFrameCount(3);
    } else if (presetName === 'belady') {
      setRefStringInput('1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5');
      setFrameCount(3);
    } else if (presetName === 'cyclic') {
      setRefStringInput('1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4');
      setFrameCount(3);
      setAlgorithm('lru');
    } else if (presetName === 'random') {
      const randPages: number[] = [];
      for (let i = 0; i < 16; i++) {
        randPages.push(Math.floor(Math.random() * 6));
      }
      setRefStringInput(randPages.join(', '));
    }
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Control bar / parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Preset & Algorithm selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['fifo', 'lru', 'opt', 'clock'] as ReplacementAlgorithm[]).map((alg) => (
              <button
                key={alg}
                onClick={() => {
                  setAlgorithm(alg);
                  setCurrentStep(0);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition ${
                  algorithm === alg
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {alg}
              </button>
            ))}
          </div>

          {/* Frame count selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Frames:</span>
            <select
              value={frameCount}
              onChange={(e) => {
                setFrameCount(parseInt(e.target.value, 10));
                setCurrentStep(0);
              }}
              className="bg-transparent text-indigo-400 font-bold focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((f) => (
                <option key={f} value={f}>
                  {f} frames
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Compare Mode */}
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              compareMode
                ? 'bg-purple-600 text-white border-purple-500 shadow'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Compare Mode</span>
          </button>

          {/* Toggle EAT & Dirty Pages Calculator */}
          <button
            onClick={() => setShowEatCalculator(!showEatCalculator)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              showEatCalculator
                ? 'bg-teal-600 text-white border-teal-500 shadow'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>EAT Calculator</span>
          </button>
        </div>

        {/* Load from Practice Question & Preset quick buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Load from Question Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <select
              onChange={(e) => {
                const q = practiceQuestions.find((pq) => pq.id === e.target.value);
                if (q && q.params) {
                  if (q.params.ref) setRefStringInput(q.params.ref.join(', '));
                  if (q.params.frames) setFrameCount(q.params.frames);
                  if (q.params.alg) setAlgorithm(q.params.alg);
                  setCurrentStep(0);
                }
              }}
              defaultValue=""
              className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="" disabled>Load from Question...</option>
              {practiceQuestions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-500 font-mono">Presets:</span>
          <button
            onClick={() => loadPreset('golden20')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            GATE 20-Ref
          </button>
          <button
            onClick={() => loadPreset('belady')}
            className="px-2 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 hover:bg-amber-900/60"
          >
            Belady Anomaly
          </button>
          <button
            onClick={() => loadPreset('cyclic')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Cyclic Trap
          </button>
          <button
            onClick={() => loadPreset('random')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Random
          </button>
        </div>
      </div>

      {/* Reference string input field */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs font-mono">
        <span className="text-slate-400 whitespace-nowrap font-semibold">Reference String:</span>
        <input
          type="text"
          value={refStringInput}
          onChange={(e) => {
            setRefStringInput(e.target.value);
            setCurrentStep(0);
          }}
          placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-indigo-300 focus:border-indigo-500 focus:outline-none"
        />
        <span className="text-slate-500">({refString.length} references)</span>
      </div>

      {/* EAT & Dirty Pages Calculator Panel (Section 6.5 Worked Numericals 3 & 4) */}
      {showEatCalculator && (
        <div className="bg-slate-900 border border-teal-500/40 rounded-xl p-5 shadow-2xl flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                <Calculator className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Effective Memory Access Time (EAT) & Dirty Pages Laboratory
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Section 6.5 Worked Numericals 3 &amp; 4: Model how dirty write-back penalty and fault rate $p$ dominate overall access latency.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMemoryAccessNs(200);
                  setFaultServiceNs(8000000);
                  setDirtyServiceNs(8000000);
                  setDirtyFraction(0);
                  setFaultRate(0.0000025);
                  setTargetSlowdownPct(10);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Worked 3 (≤10% Slowdown)
              </button>
              <button
                onClick={() => {
                  setMemoryAccessNs(200);
                  setFaultServiceNs(8000000);
                  setDirtyServiceNs(20000000);
                  setDirtyFraction(0.40);
                  setFaultRate(0.001);
                  setTargetSlowdownPct(10);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Worked 4 (Dirty Pages ≈13 µs)
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {/* Slider 1: Memory Access Time m */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>RAM Access (m):</span>
                <span className="text-indigo-400 font-bold">{memoryAccessNs} ns</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={memoryAccessNs}
                onChange={(e) => setMemoryAccessNs(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500">Fast physical memory read cycle</span>
            </div>

            {/* Slider 2: Fault Probability p */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Fault Rate (p):</span>
                <span className="text-amber-400 font-bold">
                  {faultRate < 0.0001 ? faultRate.toExponential(2) : faultRate.toFixed(4)} ({faultRate * 100}%)
                </span>
              </div>
              <input
                type="range"
                min="0.000001"
                max="0.01"
                step="0.00001"
                value={faultRate}
                onChange={(e) => setFaultRate(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-500">Probability of page fault per access</span>
            </div>

            {/* Slider 3: Clean Page Service S_clean */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Clean Service (S_clean):</span>
                <span className="text-teal-400 font-bold">{(faultServiceNs / 1000000).toFixed(1)} ms</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="25000000"
                step="500000"
                value={faultServiceNs}
                onChange={(e) => setFaultServiceNs(parseInt(e.target.value, 10))}
                className="w-full accent-teal-500"
              />
              <span className="text-[10px] text-slate-500">Read disk block without writeback</span>
            </div>

            {/* Slider 4: Dirty Page Service S_dirty */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Dirty Service (S_dirty):</span>
                <span className="text-rose-400 font-bold">{(dirtyServiceNs / 1000000).toFixed(1)} ms</span>
              </div>
              <input
                type="range"
                min="5000000"
                max="40000000"
                step="1000000"
                value={dirtyServiceNs}
                onChange={(e) => setDirtyServiceNs(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-500">Disk write-back + new block fetch</span>
            </div>

            {/* Slider 5: Dirty Page Fraction */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Dirty Victim Ratio:</span>
                <span className="text-purple-400 font-bold">{(dirtyFraction * 100).toFixed(0)}% Dirty</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={dirtyFraction}
                onChange={(e) => setDirtyFraction(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
              <span className="text-[10px] text-slate-500">Mean service: {(eatResult.effectiveServiceNs / 1000000).toFixed(2)} ms</span>
            </div>

            {/* Slider 6: Slowdown Target Limit */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Slowdown Constraint:</span>
                <span className="text-emerald-400 font-bold">≤ {targetSlowdownPct}% Target</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={targetSlowdownPct}
                onChange={(e) => setTargetSlowdownPct(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500">
                Requires p ≤ {maxPermissibleP.toExponential(2)} (1 in {Math.round(1 / maxPermissibleP).toLocaleString()})
              </span>
            </div>
          </div>

          {/* Breakdown Bar */}
          <EATBreakdownBar
            segments={[
              {
                label: 'Physical RAM Access',
                ns: (1 - faultRate) * memoryAccessNs,
                color: 'bg-emerald-500',
                description: `(1 - p) × ${memoryAccessNs} ns`,
              },
              {
                label: 'Clean Fault Penalty',
                ns: faultRate * (1 - dirtyFraction) * faultServiceNs,
                color: 'bg-teal-500',
                description: `p × ${(1 - dirtyFraction).toFixed(2)} × ${(faultServiceNs / 1000000).toFixed(1)} ms`,
              },
              {
                label: 'Dirty Victim Writeback',
                ns: faultRate * dirtyFraction * dirtyServiceNs,
                color: 'bg-rose-500',
                description: `p × ${dirtyFraction.toFixed(2)} × ${(dirtyServiceNs / 1000000).toFixed(1)} ms`,
              },
            ]}
            totalEATNs={eatResult.eatNs}
            baselineRAMNs={memoryAccessNs}
          />
        </div>
      )}

      {/* Compare Mode vs Standard Infographic Mode */}
      {compareMode ? (
        <CompareMode refString={refString} frameCount={frameCount} currentStep={currentStep} />
      ) : (
        <>
          {/* Predict Mode Banner (if active) */}
          {predictMode && nextStep && (
            <div className="bg-amber-950/40 border-2 border-amber-500/60 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-amber-200 text-sm">
                    PREDICT NEXT STEP: Incoming Page {nextStep.state.currentPage}
                  </div>
                  <div className="text-xs text-amber-300/80">
                    Will this access cause a HIT or a PAGE FAULT?
                  </div>
                  {predictFeedback && (
                    <div className="text-xs font-semibold text-slate-200 mt-1">{predictFeedback}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePredict(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                >
                  <Check className="w-4 h-4" /> Predict HIT
                </button>
                <button
                  onClick={() => handlePredict(false)}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                >
                  <X className="w-4 h-4" /> Predict FAULT
                </button>
              </div>

              <div className="text-xs font-mono text-amber-400">
                Score: {predictScore.correct} / {predictScore.total} (
                {predictScore.total > 0
                  ? ((predictScore.correct / predictScore.total) * 100).toFixed(0)
                  : 0}
                %)
              </div>
            </div>
          )}

          {/* Primary Signature Visualizer: FrameTable */}
          {activeStep && (
            <FrameTable
              algorithm={algorithm}
              frameCount={frameCount}
              refString={refString}
              currentStepIndex={currentStep}
              history={activeStep.state.history}
              recencyStack={activeStep.state.recencyStack}
              queueOrder={activeStep.state.queueOrder}
              nextUses={activeStep.state.nextUses}
              clockBits={activeStep.state.clockBits}
              clockPointer={activeStep.state.clockPointer}
            />
          )}

          {/* Timeline playback controls */}
          <Timeline
            currentStep={currentStep}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onStepChange={(s) => {
              setCurrentStep(s);
              setIsPlaying(false);
            }}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onSpeedChange={setPlaybackSpeed}
            predictMode={predictMode}
            onTogglePredictMode={() => setPredictMode(!predictMode)}
          />

          {/* Caption Bar */}
          {activeStep && (
            <CaptionBar
              caption={activeStep.caption}
              formula={activeStep.formula}
              event={activeStep.event}
              stepIndex={currentStep}
            />
          )}
        </>
      )}
    </div>
  );
};
