import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  simulateCounterSchedule,
  simulatePeterson,
  simulateSemaphore,
} from '../../core/sync/sync';
import { Timeline } from '../components/Timeline';
import { CaptionBar } from '../components/CaptionBar';
import {
  Zap,
  Users,
  Lock,
  Shuffle,
  RotateCcw,
  Plus,
  AlertTriangle,
} from 'lucide-react';

export const SyncSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'race' | 'peterson' | 'semaphore'>('race');

  // Tab 1: Interleaving Race Explorer
  const [incrementsPerThread, setIncrementsPerThread] = useState<number>(5);
  const [scheduleType, setScheduleType] = useState<
    'serial-max' | 'interleaved' | 'adversarial-min' | 'random' | 'custom'
  >('serial-max');
  const [customSchedule, setCustomSchedule] = useState<('A' | 'B')[]>([]);
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [raceStep, setRaceStep] = useState<number>(0);
  const [isRacePlaying, setIsRacePlaying] = useState<boolean>(false);
  const [raceSpeed, setRaceSpeed] = useState<number>(0.6);

  // Helper to build random interleaving
  const generateRandomSchedule = (n: number) => {
    const totalA = n * 3;
    const totalB = n * 3;
    const result: ('A' | 'B')[] = [];
    let countA = 0;
    let countB = 0;

    while (countA < totalA || countB < totalB) {
      if (countA >= totalA) {
        result.push('B');
        countB++;
      } else if (countB >= totalB) {
        result.push('A');
        countA++;
      } else {
        if (Math.random() < 0.5) {
          result.push('A');
          countA++;
        } else {
          result.push('B');
          countB++;
        }
      }
    }
    return result;
  };

  const schedule = useMemo(() => {
    const totalInst = incrementsPerThread * 3;
    if (scheduleType === 'serial-max') {
      const sched: ('A' | 'B')[] = [];
      for (let i = 0; i < totalInst; i++) sched.push('A');
      for (let i = 0; i < totalInst; i++) sched.push('B');
      return sched;
    } else if (scheduleType === 'interleaved') {
      const sched: ('A' | 'B')[] = [];
      for (let i = 0; i < totalInst; i++) {
        sched.push('A');
        sched.push('B');
      }
      return sched;
    } else if (scheduleType === 'adversarial-min') {
      const sched: ('A' | 'B')[] = [];
      sched.push('A'); // T1 load 0
      for (let i = 0; i < (incrementsPerThread - 1) * 3; i++) sched.push('B'); // T2 runs n-1 times
      sched.push('B'); // T2 load (n-1)
      sched.push('A'); // T1 add
      sched.push('A'); // T1 store 1 (clobber!)
      for (let i = 0; i < (incrementsPerThread - 1) * 3; i++) sched.push('A'); // T1 finishes
      sched.push('B'); // T2 add
      sched.push('B'); // T2 store (clobber!)
      return sched;
    } else if (scheduleType === 'random') {
      return generateRandomSchedule(incrementsPerThread);
    } else {
      // custom
      return customSchedule;
    }
  }, [scheduleType, incrementsPerThread, randomSeed, customSchedule]);

  const raceSteps = useMemo(() => {
    return simulateCounterSchedule(schedule, incrementsPerThread);
  }, [schedule, incrementsPerThread]);

  const activeRaceStep = raceSteps[raceStep] || raceSteps[0];
  const raceState = activeRaceStep?.state;

  // Detect if current step caused a lost update
  const lostUpdateInfo = useMemo(() => {
    if (raceStep === 0) return null;
    const current = raceSteps[raceStep];
    const prev = raceSteps[raceStep - 1];
    if (!current || !prev) return null;

    // A STORE occurred:
    const instr = current.state.activeInstruction;
    if (instr && instr.type === 'STORE') {
      const prevX = prev.state.x;
      const newX = current.state.x;
      if (newX <= prevX) {
        return {
          thread: instr.thread,
          newX,
          prevX,
          message: `Thread ${instr.thread} executed STORE ${newX}, but x was already ${prevX}! Stale register overwritten: LOST UPDATE.`,
        };
      }
    }
    return null;
  }, [raceStep, raceSteps]);

  // Autoplay race
  const raceTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isRacePlaying) {
      raceTimerRef.current = setInterval(() => {
        setRaceStep((prev) => {
          if (prev < raceSteps.length - 1) return prev + 1;
          setIsRacePlaying(false);
          return prev;
        });
      }, raceSpeed * 1000);
    } else {
      if (raceTimerRef.current) clearInterval(raceTimerRef.current);
    }
    return () => {
      if (raceTimerRef.current) clearInterval(raceTimerRef.current);
    };
  }, [isRacePlaying, raceSpeed, raceSteps.length]);

  // Tab 2: Peterson's Algorithm & Mutation
  const [mutateRemoveTurn, setMutateRemoveTurn] = useState<boolean>(false);
  const [petersonStep, setPetersonStep] = useState<number>(0);

  const petersonData = useMemo(() => {
    return simulatePeterson({ mutateRemoveTurn });
  }, [mutateRemoveTurn]);

  const activePetersonStep = petersonData.steps[petersonStep] || petersonData.steps[0];

  // Tab 3: Counting Semaphore
  const [initialS, setInitialS] = useState<number>(10);
  const [numPOps, setNumPOps] = useState<number>(20);
  const [numVOps, setNumVOps] = useState<number>(15);

  const semState = useMemo(() => {
    const ops: { op: 'P' | 'V'; proc: string }[] = [];
    for (let i = 0; i < numPOps; i++) ops.push({ op: 'P', proc: `P${i + 1}` });
    for (let i = 0; i < numVOps; i++) ops.push({ op: 'V', proc: `V${i + 1}` });
    return simulateSemaphore(initialS, ops);
  }, [initialS, numPOps, numVOps]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Critical Section & Synchronization Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Explore thread interleavings, investigate adversarial lost-update races (Min = 2, Max = 10), customize instruction schedules, test Peterson&apos;s algorithm mutations, and trace counting semaphores.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('race')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'race'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Interleaving Race
          </button>
          <button
            onClick={() => setActiveTab('peterson')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'peterson'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Peterson&apos;s Mutation
          </button>
          <button
            onClick={() => setActiveTab('semaphore')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'semaphore'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Semaphore Arithmetic
          </button>
        </div>
      </div>

      {/* TAB 1: Interleaving Race Explorer */}
      {activeTab === 'race' && (
        <div className="flex flex-col gap-6">
          {/* Preset Buttons & Archetype info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-bold">Schedule Archetype:</span>
              <button
                onClick={() => {
                  setScheduleType('serial-max');
                  setRaceStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg border font-bold transition ${
                  scheduleType === 'serial-max'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Serial Execution (Max = {incrementsPerThread * 2})
              </button>
              <button
                onClick={() => {
                  setScheduleType('interleaved');
                  setRaceStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg border font-bold transition ${
                  scheduleType === 'interleaved'
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Fine-Grained Interleaved
              </button>
              <button
                onClick={() => {
                  setScheduleType('adversarial-min');
                  setRaceStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg border font-bold transition ${
                  scheduleType === 'adversarial-min'
                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Adversarial Stale-Load (Min = 2)
              </button>
              <button
                onClick={() => {
                  setScheduleType('random');
                  setRandomSeed((s) => s + 1);
                  setRaceStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1.5 ${
                  scheduleType === 'random'
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" /> Random Schedule
              </button>
              <button
                onClick={() => {
                  setScheduleType('custom');
                  setCustomSchedule([]);
                  setRaceStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg border font-bold transition ${
                  scheduleType === 'custom'
                    ? 'bg-purple-950 border-purple-500 text-purple-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Custom Builder
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Increments / Thread:</span>
              <select
                value={incrementsPerThread}
                onChange={(e) => {
                  setIncrementsPerThread(parseInt(e.target.value, 10));
                  setRaceStep(0);
                }}
                className="bg-slate-950 border border-slate-700 px-2.5 py-1 rounded text-indigo-300 font-bold"
              >
                <option value={2}>2 (Min=2, Max=4)</option>
                <option value={3}>3 (Min=2, Max=6)</option>
                <option value={5}>5 (GATE: Min=2, Max=10)</option>
              </select>
            </div>
          </div>

          {/* Custom Schedule Builder Toolbar (if custom selected) */}
          {scheduleType === 'custom' && (
            <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs shadow-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-purple-300 font-bold">Custom Sequence ({customSchedule.length} / {incrementsPerThread * 6} steps):</span>
                <button
                  onClick={() => {
                    if (customSchedule.filter((t) => t === 'A').length < incrementsPerThread * 3) {
                      setCustomSchedule((prev) => [...prev, 'A']);
                      setRaceStep(0);
                    }
                  }}
                  disabled={customSchedule.filter((t) => t === 'A').length >= incrementsPerThread * 3}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 disabled:opacity-40 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Thread A
                </button>
                <button
                  onClick={() => {
                    if (customSchedule.filter((t) => t === 'B').length < incrementsPerThread * 3) {
                      setCustomSchedule((prev) => [...prev, 'B']);
                      setRaceStep(0);
                    }
                  }}
                  disabled={customSchedule.filter((t) => t === 'B').length >= incrementsPerThread * 3}
                  className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1 disabled:opacity-40 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Thread B
                </button>
                <button
                  onClick={() => {
                    setCustomSchedule((prev) => prev.slice(0, -1));
                    setRaceStep(0);
                  }}
                  disabled={customSchedule.length === 0}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
                >
                  Pop Last
                </button>
                <button
                  onClick={() => {
                    setCustomSchedule([]);
                    setRaceStep(0);
                  }}
                  className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Reset
                </button>
              </div>

              <div className="text-slate-400 text-[11px]">
                A steps: {customSchedule.filter((t) => t === 'A').length}/{incrementsPerThread * 3} | B steps: {customSchedule.filter((t) => t === 'B').length}/{incrementsPerThread * 3}
              </div>
            </div>
          )}

          {/* Interactive Schedule Ribbon Strip (Spec Section 6.1) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
              <span className="text-slate-400 text-[11px] font-bold">
                Interleaved Instruction Stream (Click chip to jump to step):
              </span>
              <span className="text-indigo-400 text-[11px]">
                Final x = {raceSteps[raceSteps.length - 1]?.state.x}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
              {schedule.map((t, idx) => {
                const isActive = raceStep === idx + 1;
                const isPassed = raceStep > idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setRaceStep(idx + 1)}
                    className={`px-2 py-1 rounded text-[11px] font-bold flex-shrink-0 transition border ${
                      isActive
                        ? t === 'A'
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400'
                          : 'bg-teal-600 text-white border-teal-400 shadow-md ring-2 ring-teal-400'
                        : isPassed
                        ? t === 'A'
                          ? 'bg-indigo-950/70 border-indigo-800/80 text-indigo-300'
                          : 'bg-teal-950/70 border-teal-800/80 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t}
                    {Math.floor(idx / 2) + 1}
                  </button>
                );
              })}
              {schedule.length === 0 && (
                <span className="text-slate-600 italic">No instructions in schedule. Add steps above.</span>
              )}
            </div>
          </div>

          {/* Lost Update Warning Banner */}
          {lostUpdateInfo && (
            <div className="bg-rose-950/60 border border-rose-500 rounded-xl p-4 shadow-xl flex items-center gap-3 text-rose-200 text-xs font-mono">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <strong className="text-rose-300 block text-sm font-sans">
                  ⚠ LOST UPDATE ANOMALY!
                </strong>
                {lostUpdateInfo.message}
              </div>
            </div>
          )}

          {/* Visual Thread Registers & Shared Variable Stage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* Thread A Panel with Side-by-Side Assembly Code */}
            <div
              className={`p-4 rounded-xl border flex flex-col gap-3 ${
                raceState?.activeInstruction?.thread === 'A'
                  ? 'bg-indigo-950/50 border-indigo-500/80 shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-indigo-300 text-sm">Thread A</span>
                <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  PC: {raceState?.pcA} / {incrementsPerThread * 3}
                </span>
              </div>

              {/* Local Register */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Local Register (R_A):</span>
                <span className="text-xl font-black text-indigo-300 bg-indigo-950/60 px-3 py-0.5 rounded border border-indigo-800">
                  {raceState?.regA}
                </span>
              </div>

              {/* Code Box */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  Assembly (Loop iteration {(raceState?.pcA ? Math.floor((raceState.pcA - 1) / 3) + 1 : 1)} / {incrementsPerThread})
                </div>
                <div
                  className={`px-2 py-1 rounded flex items-center gap-2 ${
                    raceState?.activeInstruction?.thread === 'A' && raceState.activeInstruction.type === 'LOAD'
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-indigo-400 w-3">{raceState?.activeInstruction?.thread === 'A' && raceState.activeInstruction.type === 'LOAD' ? '▶' : ' '}</span>
                  <span>1: LOAD R_A ← x</span>
                </div>
                <div
                  className={`px-2 py-1 rounded flex items-center gap-2 ${
                    raceState?.activeInstruction?.thread === 'A' && raceState.activeInstruction.type === 'ADD'
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-indigo-400 w-3">{raceState?.activeInstruction?.thread === 'A' && raceState.activeInstruction.type === 'ADD' ? '▶' : ' '}</span>
                  <span>2: ADD  R_A ← R_A + 1</span>
                </div>
                <div
                  className={`px-2 py-1 rounded flex items-center gap-2 ${
                    raceState?.activeInstruction?.thread === 'A' && raceState.activeInstruction.type === 'STORE'
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-indigo-400 w-3">{raceState?.activeInstruction?.thread === 'A' && raceState.activeInstruction.type === 'STORE' ? '▶' : ' '}</span>
                  <span>3: STORE x ← R_A</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                State:{' '}
                {raceState?.activeInstruction?.thread === 'A' ? (
                  <span className="text-indigo-300 font-bold">Executing {raceState.activeInstruction.type}</span>
                ) : (
                  <span className="text-slate-500">Preempted / Idle</span>
                )}
              </div>
            </div>

            {/* Shared Memory Cell (x) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center gap-3 font-mono shadow-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Shared Memory Location [x]
              </span>
              <div className="text-5xl font-black text-amber-300 bg-slate-950 border-2 border-amber-500/60 px-8 py-3 rounded-2xl shadow-inner">
                {raceState?.x}
              </div>
              <div className="text-center space-y-1 text-slate-400 text-[11px]">
                <div>Initial: <strong>0</strong></div>
                <div>Serial Theoretical Max: <strong className="text-emerald-400">{incrementsPerThread * 2}</strong></div>
                <div>Adversarial Theoretical Min: <strong className="text-rose-400">2</strong></div>
              </div>
            </div>

            {/* Thread B Panel with Side-by-Side Assembly Code */}
            <div
              className={`p-4 rounded-xl border flex flex-col gap-3 ${
                raceState?.activeInstruction?.thread === 'B'
                  ? 'bg-teal-950/50 border-teal-500/80 shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-teal-300 text-sm">Thread B</span>
                <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  PC: {raceState?.pcB} / {incrementsPerThread * 3}
                </span>
              </div>

              {/* Local Register */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Local Register (R_B):</span>
                <span className="text-xl font-black text-teal-300 bg-teal-950/60 px-3 py-0.5 rounded border border-teal-800">
                  {raceState?.regB}
                </span>
              </div>

              {/* Code Box */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  Assembly (Loop iteration {(raceState?.pcB ? Math.floor((raceState.pcB - 1) / 3) + 1 : 1)} / {incrementsPerThread})
                </div>
                <div
                  className={`px-2 py-1 rounded flex items-center gap-2 ${
                    raceState?.activeInstruction?.thread === 'B' && raceState.activeInstruction.type === 'LOAD'
                      ? 'bg-teal-600/30 text-teal-200 border border-teal-500 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-teal-400 w-3">{raceState?.activeInstruction?.thread === 'B' && raceState.activeInstruction.type === 'LOAD' ? '▶' : ' '}</span>
                  <span>1: LOAD R_B ← x</span>
                </div>
                <div
                  className={`px-2 py-1 rounded flex items-center gap-2 ${
                    raceState?.activeInstruction?.thread === 'B' && raceState.activeInstruction.type === 'ADD'
                      ? 'bg-teal-600/30 text-teal-200 border border-teal-500 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-teal-400 w-3">{raceState?.activeInstruction?.thread === 'B' && raceState.activeInstruction.type === 'ADD' ? '▶' : ' '}</span>
                  <span>2: ADD  R_B ← R_B + 1</span>
                </div>
                <div
                  className={`px-2 py-1 rounded flex items-center gap-2 ${
                    raceState?.activeInstruction?.thread === 'B' && raceState.activeInstruction.type === 'STORE'
                      ? 'bg-teal-600/30 text-teal-200 border border-teal-500 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-teal-400 w-3">{raceState?.activeInstruction?.thread === 'B' && raceState.activeInstruction.type === 'STORE' ? '▶' : ' '}</span>
                  <span>3: STORE x ← R_B</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                State:{' '}
                {raceState?.activeInstruction?.thread === 'B' ? (
                  <span className="text-teal-300 font-bold">Executing {raceState.activeInstruction.type}</span>
                ) : (
                  <span className="text-slate-500">Preempted / Idle</span>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Timeline & Caption */}
          <Timeline
            currentStep={raceStep}
            totalSteps={raceSteps.length}
            isPlaying={isRacePlaying}
            playbackSpeed={raceSpeed}
            onStepChange={(s) => setRaceStep(s)}
            onTogglePlay={() => setIsRacePlaying(!isRacePlaying)}
            onSpeedChange={(sp) => setRaceSpeed(sp)}
          />

          <CaptionBar
            stepIndex={raceStep}
            caption={activeRaceStep?.caption || ''}
            formula={activeRaceStep?.formula}
            event={activeRaceStep?.event}
          />
        </div>
      )}

      {/* TAB 2: Peterson's Algorithm Mutation & Critical Section Room */}
      {activeTab === 'peterson' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" /> Peterson&apos;s Algorithm Mutation Explorer
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Investigate how the `turn` variable resolves ties and prevents simultaneous entry into the critical section.
              </p>
            </div>

            {/* Mutation Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMutateRemoveTurn(!mutateRemoveTurn);
                  setPetersonStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                  mutateRemoveTurn
                    ? 'bg-rose-950 border-rose-500 text-rose-300 shadow'
                    : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                }`}
              >
                {mutateRemoveTurn ? '⚠️ Mutation Active: `turn` Deleted!' : '✓ Normal Peterson (Turn Included)'}
              </button>
            </div>
          </div>

          {/* Critical Section "Room" Infographic */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-full max-w-lg p-6 rounded-2xl border-4 text-center transition-all duration-300 shadow-2xl ${
                activePetersonStep?.mutualExclusionViolated
                  ? 'bg-rose-950/80 border-rose-500 animate-pulse text-rose-200'
                  : activePetersonStep?.inCSA || activePetersonStep?.inCSB
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                  : 'bg-slate-950/60 border-slate-700 text-slate-400'
              }`}
            >
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-1">
                {activePetersonStep?.mutualExclusionViolated ? '🚨 CRITICAL SECTION BREACH!' : 'Protected Room'}
              </div>
              <div className="text-lg font-black">
                {activePetersonStep?.mutualExclusionViolated
                  ? 'MUTUAL EXCLUSION VIOLATED! BOTH THREADS INSIDE!'
                  : activePetersonStep?.inCSA
                  ? 'Thread A is executing in Critical Section'
                  : activePetersonStep?.inCSB
                  ? 'Thread B is executing in Critical Section'
                  : 'Critical Section is Empty'}
              </div>
              <div className="flex justify-center gap-4 mt-3 font-mono text-xs">
                <span className={`px-2 py-1 rounded border ${activePetersonStep?.inCSA ? 'bg-indigo-600 text-white border-indigo-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  Thread A {activePetersonStep?.inCSA ? 'Inside' : 'Outside'}
                </span>
                <span className={`px-2 py-1 rounded border ${activePetersonStep?.inCSB ? 'bg-teal-600 text-white border-teal-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  Thread B {activePetersonStep?.inCSB ? 'Inside' : 'Outside'}
                </span>
              </div>
            </div>
          </div>

          {/* Peterson Code Display Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Thread A Code */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-indigo-400 font-bold mb-2">Thread A (Process 0):</div>
              <div className="text-slate-300">1: flag[0] = true;</div>
              <div className={mutateRemoveTurn ? 'line-through text-rose-500' : 'text-slate-300'}>
                2: turn = 1; {mutateRemoveTurn && '(DELETED)'}
              </div>
              <div className="text-slate-300">3: while (flag[1] {mutateRemoveTurn ? '' : '&& turn == 1'});</div>
              <div className="text-emerald-400 font-bold">4: // CRITICAL SECTION</div>
              <div className="text-slate-400">5: flag[0] = false;</div>
            </div>

            {/* Thread B Code */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-teal-400 font-bold mb-2">Thread B (Process 1):</div>
              <div className="text-slate-300">1: flag[1] = true;</div>
              <div className={mutateRemoveTurn ? 'line-through text-rose-500' : 'text-slate-300'}>
                2: turn = 0; {mutateRemoveTurn && '(DELETED)'}
              </div>
              <div className="text-slate-300">3: while (flag[0] {mutateRemoveTurn ? '' : '&& turn == 0'});</div>
              <div className="text-emerald-400 font-bold">4: // CRITICAL SECTION</div>
              <div className="text-slate-400">5: flag[1] = false;</div>
            </div>
          </div>

          {/* Peterson Stepper Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-xs font-mono text-slate-400">
              Step {petersonStep + 1} of {petersonData.steps.length}: {activePetersonStep?.caption}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPetersonStep(Math.max(0, petersonStep - 1))}
                disabled={petersonStep === 0}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPetersonStep(Math.min(petersonData.steps.length - 1, petersonStep + 1))}
                disabled={petersonStep >= petersonData.steps.length - 1}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Counting Semaphore Arithmetic & Queue */}
      {activeTab === 'semaphore' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Counting Semaphore Arithmetic (GATE Archetype)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                S starts at initial value. Each P() decrements S; if negative, process blocks. Each V() increments S and wakes a blocked process.
              </p>
            </div>

            <span className="font-mono text-xs px-3 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              Formula: S_final = S_init - #P + #V
            </span>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>Initial S:</span>
                <strong className="text-indigo-400 text-sm">{initialS}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={initialS}
                onChange={(e) => setInitialS(parseInt(e.target.value, 10))}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>P (wait) operations:</span>
                <strong className="text-rose-400 text-sm">{numPOps}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={numPOps}
                onChange={(e) => setNumPOps(parseInt(e.target.value, 10))}
                className="accent-rose-500 cursor-pointer"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>V (signal) operations:</span>
                <strong className="text-emerald-400 text-sm">{numVOps}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={numVOps}
                onChange={(e) => setNumVOps(parseInt(e.target.value, 10))}
                className="accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1 text-slate-300">
              <div className="text-sm font-bold text-white">
                Final Semaphore Value: <span className="text-indigo-300 text-lg">{semState.currentValue}</span>
              </div>
              <div>Calculation: {initialS} - {numPOps} + {numVOps} = <strong>{semState.currentValue}</strong></div>
              <div className="text-slate-500 text-[11px]">
                {semState.currentValue < 0
                  ? `Negative value indicates ${Math.abs(semState.currentValue)} processes currently blocked in wait queue.`
                  : 'Non-negative value indicates resource units currently available.'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block">Blocked Processes</span>
                <span className="text-base font-bold text-rose-400">{semState.blockedQueue.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
