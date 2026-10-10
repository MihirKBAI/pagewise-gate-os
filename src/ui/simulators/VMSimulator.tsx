import React, { useState, useMemo } from 'react';
import {
  computeCombinedEAT,
  computeInvertedPageTableEntries,
  computeOptimalPageSize,
  generateThrashingCurve,
  DEMAND_PAGING_LIFECYCLE_STEPS,
} from '../../core/vm/vm';
import { HardDrive, Cpu, AlertTriangle, CheckCircle2, Activity, Sparkles, RefreshCw, Layers } from 'lucide-react';

export const VMSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'eat' | 'thrashing' | 'inverted'>('lifecycle');

  // Sub-tab 1: Lifecycle state
  const [lifecycleStepIndex, setLifecycleStepIndex] = useState<number>(0);
  const activeLifecycleStep = DEMAND_PAGING_LIFECYCLE_STEPS[lifecycleStepIndex];

  // Sub-tab 2: Combined EAT
  const [tlbHitRate, setTlbHitRate] = useState<number>(0.90);
  const [tlbLookupNs, setTlbLookupNs] = useState<number>(10);
  const [memoryAccessNs, setMemoryAccessNs] = useState<number>(100);
  const [faultRateOnMiss, setFaultRateOnMiss] = useState<number>(0.01); // 1%
  const [faultServiceNs, setFaultServiceNs] = useState<number>(5000000); // 5 ms = 5,000,000 ns

  const eatResult = useMemo(() => {
    return computeCombinedEAT({
      tlbLookupNs,
      memoryAccessNs,
      tlbHitRate,
      faultRateOnMiss,
      faultServiceNs,
    });
  }, [tlbLookupNs, memoryAccessNs, tlbHitRate, faultRateOnMiss, faultServiceNs]);

  // Sub-tab 3: Thrashing Curve
  const [degreeOfMultiprogramming, setDegreeOfMultiprogramming] = useState<number>(8);
  const [physicalFrames, setPhysicalFrames] = useState<number>(50);
  const [avgWorkingSet, setAvgWorkingSet] = useState<number>(6);

  const thrashingCurve = useMemo(() => {
    return generateThrashingCurve(20, physicalFrames, avgWorkingSet);
  }, [physicalFrames, avgWorkingSet]);

  const currentThrashingPoint = thrashingCurve[degreeOfMultiprogramming - 1] || thrashingCurve[0];

  // Sub-tab 4: Inverted Page Table & Optimal Page Size
  const [ramSizeGB, setRamSizeGB] = useState<number>(1);
  const [pageSizeKB, setPageSizeKB] = useState<number>(4);
  const [processSizeKB, setProcessSizeKB] = useState<number>(256);
  const [pteSizeBytes, setPteSizeBytes] = useState<number>(4);

  const invertedEntries = useMemo(() => {
    const ramBytes = ramSizeGB * 1024 * 1024 * 1024;
    const pageBytes = pageSizeKB * 1024;
    return computeInvertedPageTableEntries(ramBytes, pageBytes);
  }, [ramSizeGB, pageSizeKB]);

  const optimalPageSize = useMemo(() => {
    return computeOptimalPageSize(processSizeKB * 1024, pteSizeBytes);
  }, [processSizeKB, pteSizeBytes]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <HardDrive className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Virtual Memory & Thrashing Architecture</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Trace the 10-step demand paging fault lifecycle, evaluate 3-path combined EAT models, inspect thrashing utilization collapse, and compute inverted page table bounds.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'lifecycle'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Fault Lifecycle
          </button>
          <button
            onClick={() => setActiveTab('eat')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'eat'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Combined EAT
          </button>
          <button
            onClick={() => setActiveTab('thrashing')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'thrashing'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Thrashing Curve
          </button>
          <button
            onClick={() => setActiveTab('inverted')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'inverted'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Inverted PT & Optimal
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Demand Paging Fault Lifecycle */}
      {activeTab === 'lifecycle' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> 10-Step Demand Paging Fault Handling Flow
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                From virtual address dereference to hardware trap, disk block fetch, page table update, and instruction restart.
              </p>
            </div>

            <span className="text-xs font-mono px-3 py-1 rounded bg-slate-950 text-indigo-300 border border-slate-800">
              Step {lifecycleStepIndex + 1} of {DEMAND_PAGING_LIFECYCLE_STEPS.length}
            </span>
          </div>

          {/* Stepper Cards Horizontal Strip */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-[700px]">
              {DEMAND_PAGING_LIFECYCLE_STEPS.map((step, idx) => {
                const isActive = idx === lifecycleStepIndex;
                const isPast = idx < lifecycleStepIndex;
                return (
                  <button
                    key={step.stepId}
                    onClick={() => setLifecycleStepIndex(idx)}
                    className={`flex-1 p-2.5 rounded-xl border text-left transition flex flex-col gap-1 min-w-[90px] ${
                      isActive
                        ? 'bg-indigo-600/30 border-indigo-500 shadow-lg scale-105'
                        : isPast
                        ? 'bg-slate-950/80 border-slate-700 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-600'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold">#{idx + 1}</span>
                    <span className="text-xs font-bold truncate">{step.title.split('.')[1] || step.title}</span>
                    <span className={`text-[10px] font-mono px-1 rounded inline-block w-max ${
                      step.location === 'DISK'
                        ? 'bg-rose-950 text-rose-300'
                        : step.location === 'RAM'
                        ? 'bg-teal-950 text-teal-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {step.location}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Detailed Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                  activeLifecycleStep.location === 'DISK'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}>
                  Subsystem: {activeLifecycleStep.location}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Approx Latency: {activeLifecycleStep.approxDurationNs >= 1000000 ? `${activeLifecycleStep.approxDurationNs / 1000000} ms` : `${activeLifecycleStep.approxDurationNs} ns`}
                </span>
              </div>

              <h4 className="text-lg font-bold text-white">
                {activeLifecycleStep.title}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {activeLifecycleStep.description}
              </p>
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setLifecycleStepIndex(Math.max(0, lifecycleStepIndex - 1))}
                disabled={lifecycleStepIndex === 0}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setLifecycleStepIndex(Math.min(DEMAND_PAGING_LIFECYCLE_STEPS.length - 1, lifecycleStepIndex + 1))}
                disabled={lifecycleStepIndex >= DEMAND_PAGING_LIFECYCLE_STEPS.length - 1}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40 transition shadow"
              >
                Next Step
              </button>
            </div>
          </div>

          {/* Visual Latency Disparity Bar: Nanoseconds vs Milliseconds */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-slate-300">⏱ Logarithmic Latency Gap: RAM (100 ns) vs Disk Paging (8 ms)</span>
              <span className="text-rose-400 font-bold">Disk is 80,000× Slower!</span>
            </div>
            <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full w-[2%]" title="RAM Access: 100 ns"></div>
              <div className="bg-rose-500 h-full w-[98%]" title="Disk Transfer: 8,000,000 ns"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>RAM Cache: ~100 ns (Instant Silicon)</span>
              <span>Mechanical / Flash Disk I/O: ~8,000,000 ns (Kernel Sleep)</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Combined EAT Calculator */}
      {activeTab === 'eat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-400" /> Combined Effective Access Time (3-Path Model)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                GATE Archetype: TLB Hit vs TLB Miss (Page Table Resident) vs Page Fault (Disk Service).
              </p>
            </div>

            <button
              onClick={() => {
                setTlbHitRate(0.90);
                setTlbLookupNs(10);
                setMemoryAccessNs(100);
                setFaultRateOnMiss(0.01);
                setFaultServiceNs(5000000);
              }}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset GATE Example
            </button>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            {/* TLB Hit Rate */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>TLB Hit Rate (h):</span>
                <strong className="text-emerald-400 text-sm">{(tlbHitRate * 100).toFixed(0)}%</strong>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={tlbHitRate * 100}
                onChange={(e) => setTlbHitRate(parseFloat(e.target.value) / 100)}
                className="accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* RAM Access Time */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>RAM Time (m):</span>
                <strong className="text-indigo-400 text-sm">{memoryAccessNs} ns</strong>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={memoryAccessNs}
                onChange={(e) => setMemoryAccessNs(parseInt(e.target.value, 10))}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Fault Probability on Miss */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>Fault Rate on Miss (p):</span>
                <strong className="text-rose-400 text-sm">{(faultRateOnMiss * 100).toFixed(1)}%</strong>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={faultRateOnMiss * 100}
                onChange={(e) => setFaultRateOnMiss(parseFloat(e.target.value) / 100)}
                className="accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Fault Service Time */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>Fault Service (S):</span>
                <strong className="text-amber-400 text-sm">{faultServiceNs / 1000000} ms</strong>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={faultServiceNs / 1000000}
                onChange={(e) => setFaultServiceNs(parseInt(e.target.value, 10) * 1000000)}
                className="accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Three Paths Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* Path 1: TLB Hit */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/40 space-y-1.5">
              <span className="font-bold text-emerald-400 block">Path 1: TLB Hit</span>
              <div className="text-slate-300">Probability: <strong>{(eatResult.probTlbHit * 100).toFixed(1)}%</strong></div>
              <div className="text-slate-300">Latency: <strong>{eatResult.timeTlbHitNs} ns</strong></div>
              <div className="text-slate-500 text-[11px]">Contrib: {eatResult.contribTlbHitNs.toFixed(1)} ns</div>
            </div>

            {/* Path 2: TLB Miss, No Fault */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/40 space-y-1.5">
              <span className="font-bold text-indigo-400 block">Path 2: TLB Miss, RAM Hit</span>
              <div className="text-slate-300">Probability: <strong>{(eatResult.probMissNoFault * 100).toFixed(2)}%</strong></div>
              <div className="text-slate-300">Latency: <strong>{eatResult.timeMissNoFaultNs} ns</strong></div>
              <div className="text-slate-500 text-[11px]">Contrib: {eatResult.contribMissNoFaultNs.toFixed(1)} ns</div>
            </div>

            {/* Path 3: Page Fault */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/40 space-y-1.5">
              <span className="font-bold text-rose-400 block">Path 3: Page Fault (Disk)</span>
              <div className="text-slate-300">Probability: <strong>{(eatResult.probFault * 100).toFixed(3)}%</strong></div>
              <div className="text-slate-300">Latency: <strong>{eatResult.timeFaultNs.toLocaleString()} ns</strong></div>
              <div className="text-slate-500 text-[11px]">Contrib: {eatResult.contribFaultNs.toFixed(1)} ns</div>
            </div>
          </div>

          {/* Final Combined EAT Banner & Stacked Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-slate-300 font-bold text-sm">Combined Average EAT:</span>
              <span className="text-xl font-black text-amber-300 px-3 py-1 rounded bg-amber-950/60 border border-amber-600/50">
                {eatResult.eatNs.toLocaleString(undefined, { maximumFractionDigits: 1 })} ns (~{(eatResult.eatNs / 1000).toFixed(2)} µs)
              </span>
            </div>

            {/* Stacked Share Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Latency Contribution Share:</span>
                <span className="text-rose-400 font-bold">Fault path contributes {eatResult.faultTimeSharePercent.toFixed(1)}% of total delay!</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${100 - eatResult.faultTimeSharePercent}%` }}
                  title="Hits Contribution"
                ></div>
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${eatResult.faultTimeSharePercent}%` }}
                  title="Faults Contribution"
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Thrashing Curve */}
      {activeTab === 'thrashing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-400" /> Thrashing & Multiprogramming Curve
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Observe CPU utilization rise as more processes overlap I/O, then collapse precipitously once memory is overcommitted.
              </p>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>Degree of Multiprogramming (Processes):</span>
                <strong className="text-indigo-400 text-sm">{degreeOfMultiprogramming}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={degreeOfMultiprogramming}
                onChange={(e) => setDegreeOfMultiprogramming(parseInt(e.target.value, 10))}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>Available Physical Frames:</span>
                <strong className="text-teal-400 text-sm">{physicalFrames}</strong>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={physicalFrames}
                onChange={(e) => setPhysicalFrames(parseInt(e.target.value, 10))}
                className="accent-teal-500 cursor-pointer"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>Working Set per Process (Pages):</span>
                <strong className="text-amber-400 text-sm">{avgWorkingSet}</strong>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={avgWorkingSet}
                onChange={(e) => setAvgWorkingSet(parseInt(e.target.value, 10))}
                className="accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* State Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4 font-mono text-xs ${
            currentThrashingPoint.isThrashing
              ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
          }`}>
            <div className="flex items-center gap-3">
              {currentThrashingPoint.isThrashing ? (
                <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              )}
              <div>
                <span className="text-sm font-black uppercase">
                  {currentThrashingPoint.isThrashing ? 'SYSTEM IS THRASHING! 🚨' : 'OPTIMAL OPERATING ZONE ✓'}
                </span>
                <div className="text-xs text-slate-300 font-sans mt-0.5">
                  Demand: {currentThrashingPoint.totalWorkingSetPages} pages needed vs {physicalFrames} physical frames available.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">CPU Utilization</span>
                <span className="text-xl font-black text-white">{currentThrashingPoint.cpuUtilizationPercent}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Page Fault Rate</span>
                <span className="text-xl font-black text-rose-400">{currentThrashingPoint.pageFaultRatePerSec} / sec</span>
              </div>
            </div>
          </div>

          {/* Visualization of the Curve using Bars */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-slate-300">
              CPU Utilization Curve vs Multiprogramming Level (1..20 processes):
            </span>
            <div className="h-44 w-full flex items-end gap-1.5 pt-4 border-b border-slate-800">
              {thrashingCurve.map((pt) => {
                const isSelected = pt.degreeOfMultiprogramming === degreeOfMultiprogramming;
                return (
                  <div
                    key={pt.degreeOfMultiprogramming}
                    onClick={() => setDegreeOfMultiprogramming(pt.degreeOfMultiprogramming)}
                    className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                    title={`Processes: ${pt.degreeOfMultiprogramming}, CPU: ${pt.cpuUtilizationPercent}%`}
                  >
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        pt.isThrashing
                          ? 'bg-rose-500/80 group-hover:bg-rose-400'
                          : 'bg-emerald-500/80 group-hover:bg-emerald-400'
                      } ${isSelected ? 'ring-2 ring-white scale-105' : ''}`}
                      style={{ height: `${pt.cpuUtilizationPercent}%` }}
                    ></div>
                    <span className={`text-[9px] font-mono mt-1 ${isSelected ? 'text-white font-bold' : 'text-slate-500'}`}>
                      {pt.degreeOfMultiprogramming}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Inverted Page Table & Optimal Page Size */}
      {activeTab === 'inverted' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Inverted Page Table & Optimal Page Size Calculators
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Two standard GATE CS numerical archetypes for page-table memory bounds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Inverted Page Table */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col gap-4 font-mono text-xs">
              <span className="font-bold text-sm text-indigo-300">
                1. Inverted Page Table Entries (GATE Numerical)
              </span>
              <p className="text-slate-400 font-sans">
                An inverted page table has exactly one entry per physical frame, independent of virtual address size!
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Physical RAM:</span>
                  <select
                    value={ramSizeGB}
                    onChange={(e) => setRamSizeGB(parseFloat(e.target.value))}
                    className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-white"
                  >
                    <option value={0.5}>512 MB</option>
                    <option value={1}>1 GB</option>
                    <option value={2}>2 GB</option>
                    <option value={4}>4 GB</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span>Page Size:</span>
                  <select
                    value={pageSizeKB}
                    onChange={(e) => setPageSizeKB(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-white"
                  >
                    <option value={2}>2 KB</option>
                    <option value={4}>4 KB</option>
                    <option value={8}>8 KB</option>
                  </select>
                </div>

                <div className="bg-indigo-950/60 p-3 rounded-lg border border-indigo-700/60 text-slate-200">
                  <div>Formula: RAM_Bytes / Page_Bytes</div>
                  <div className="text-base font-black text-indigo-300 mt-1">
                    Entries = {invertedEntries.toLocaleString()} (2^{Math.round(Math.log2(invertedEntries))})
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Optimal Page Size */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col gap-4 font-mono text-xs">
              <span className="font-bold text-sm text-teal-300">
                2. Optimal Page Size (Internal Frag vs Table Size)
              </span>
              <p className="text-slate-400 font-sans">
                Balancing internal fragmentation (half a page wasted) against page table size: p_opt ≈ √(2·s·e).
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Process Size (s):</span>
                  <select
                    value={processSizeKB}
                    onChange={(e) => setProcessSizeKB(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-white"
                  >
                    <option value={64}>64 KB</option>
                    <option value={128}>128 KB</option>
                    <option value={256}>256 KB</option>
                    <option value={1024}>1 MB</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span>PTE Size (e):</span>
                  <select
                    value={pteSizeBytes}
                    onChange={(e) => setPteSizeBytes(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-white"
                  >
                    <option value={4}>4 Bytes</option>
                    <option value={8}>8 Bytes</option>
                  </select>
                </div>

                <div className="bg-teal-950/60 p-3 rounded-lg border border-teal-700/60 text-slate-200">
                  <div>Formula: √(2 × s × e)</div>
                  <div className="text-base font-black text-teal-300 mt-1">
                    p_opt ≈ {optimalPageSize.toLocaleString()} Bytes (~{(optimalPageSize / 1024).toFixed(1)} KB)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
