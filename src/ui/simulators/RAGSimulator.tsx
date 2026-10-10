import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  detectCycles,
  isSingleInstanceGraph,
  simulateRAGReduction,
  computeDeadlockFreeThreshold,
} from '../../core/rag/rag';
import { RAGGraph, RAGProcess, RAGResource, RAGEdge } from '../../core/rag/types';
import { Timeline } from '../components/Timeline';
import { CaptionBar } from '../components/CaptionBar';
import {
  AlertTriangle,
  CheckCircle2,
  GitGraph,
  ShieldAlert,
  Sparkles,
  Plus,
  Trash2,
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';

const PRESET_SINGLE_INSTANCE_CYCLE: RAGGraph = {
  processes: [
    { id: 'P1', name: 'P1' },
    { id: 'P2', name: 'P2' },
  ],
  resources: [
    { id: 'R1', name: 'R1', instances: 1 },
    { id: 'R2', name: 'R2', instances: 1 },
  ],
  edges: [
    { id: 'e1', from: 'P1', to: 'R1', type: 'request' },
    { id: 'e2', from: 'R1', to: 'P2', type: 'assignment' },
    { id: 'e3', from: 'P2', to: 'R2', type: 'request' },
    { id: 'e4', from: 'R2', to: 'P1', type: 'assignment' },
  ],
};

const PRESET_MULTI_INSTANCE_SAFE: RAGGraph = {
  processes: [
    { id: 'P1', name: 'P1' },
    { id: 'P2', name: 'P2' },
    { id: 'P3', name: 'P3' },
  ],
  resources: [
    { id: 'R1', name: 'R1', instances: 2 },
    { id: 'R2', name: 'R2', instances: 1 },
  ],
  edges: [
    { id: 'm1', from: 'P1', to: 'R1', type: 'request' },
    { id: 'm2', from: 'R1', to: 'P2', type: 'assignment' },
    { id: 'm3', from: 'P2', to: 'R2', type: 'request' },
    { id: 'm4', from: 'R2', to: 'P1', type: 'assignment' },
    { id: 'm5', from: 'R1', to: 'P3', type: 'assignment' },
  ],
};

const PRESET_MULTI_INSTANCE_DEADLOCK: RAGGraph = {
  processes: [
    { id: 'P1', name: 'P1' },
    { id: 'P2', name: 'P2' },
  ],
  resources: [
    { id: 'R1', name: 'R1', instances: 2 },
    { id: 'R2', name: 'R2', instances: 2 },
  ],
  edges: [
    { id: 'd1', from: 'R1', to: 'P1', type: 'assignment' },
    { id: 'd2', from: 'R1', to: 'P2', type: 'assignment' },
    { id: 'd3', from: 'P1', to: 'R2', type: 'request' },
    { id: 'd4', from: 'P1', to: 'R2', type: 'request' },
    { id: 'd5', from: 'R2', to: 'P1', type: 'assignment' },
    { id: 'd6', from: 'R2', to: 'P2', type: 'assignment' },
    { id: 'd7', from: 'P2', to: 'R1', type: 'request' },
  ],
};

export const RAGSimulator: React.FC = () => {
  const [currentPresetName, setCurrentPresetName] = useState<string>('single-cycle');
  const [graph, setGraph] = useState<RAGGraph>(PRESET_SINGLE_INSTANCE_CYCLE);
  const [reductionStep, setReductionStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showEditor, setShowEditor] = useState<boolean>(false);

  // New Edge form state
  const [newEdgeFrom, setNewEdgeFrom] = useState<string>('');
  const [newEdgeTo, setNewEdgeTo] = useState<string>('');
  const [newEdgeType, setNewEdgeType] = useState<'request' | 'assignment'>('request');
  const [newResInstances, setNewResInstances] = useState<number>(1);

  // Pigeonhole principle interactive calculator state
  const [nProcs, setNProcs] = useState<number>(3);
  const [mMax, setMMax] = useState<number>(4);
  const [totalR, setTotalR] = useState<number>(10);

  // Detect cycles
  const cycleInfo = useMemo(() => detectCycles(graph), [graph]);
  const isSingleInstance = useMemo(() => isSingleInstanceGraph(graph), [graph]);

  // Reduction steps
  const reductionSteps = useMemo(() => simulateRAGReduction(graph), [graph]);
  const activeReductionStep = reductionSteps[reductionStep] || reductionSteps[0];

  // Pigeonhole principle threshold
  const pigeonhole = useMemo(() => computeDeadlockFreeThreshold(nProcs, mMax), [nProcs, mMax]);
  const isThresholdSafe = totalR >= pigeonhole.minGuaranteed;

  // Autoplay reduction
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setReductionStep((prev) => {
          if (prev < reductionSteps.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, playbackSpeed * 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, reductionSteps.length]);

  const loadPreset = (name: string) => {
    setCurrentPresetName(name);
    setReductionStep(0);
    if (name === 'single-cycle') setGraph(PRESET_SINGLE_INSTANCE_CYCLE);
    else if (name === 'multi-safe') setGraph(PRESET_MULTI_INSTANCE_SAFE);
    else if (name === 'multi-deadlock') setGraph(PRESET_MULTI_INSTANCE_DEADLOCK);
  };

  // Graph editing handlers
  const handleAddProcess = () => {
    const nextIdx = graph.processes.length + 1;
    const newP: RAGProcess = { id: `P${nextIdx}`, name: `P${nextIdx}` };
    setGraph((prev) => ({
      ...prev,
      processes: [...prev.processes, newP],
    }));
    setReductionStep(0);
    setCurrentPresetName('custom');
  };

  const handleAddResource = () => {
    const nextIdx = graph.resources.length + 1;
    const newR: RAGResource = {
      id: `R${nextIdx}`,
      name: `R${nextIdx}`,
      instances: Math.max(1, Math.min(5, newResInstances)),
    };
    setGraph((prev) => ({
      ...prev,
      resources: [...prev.resources, newR],
    }));
    setReductionStep(0);
    setCurrentPresetName('custom');
  };

  const handleRemoveNode = (nodeId: string) => {
    setGraph((prev) => ({
      processes: prev.processes.filter((p) => p.id !== nodeId),
      resources: prev.resources.filter((r) => r.id !== nodeId),
      edges: prev.edges.filter((e) => e.from !== nodeId && e.to !== nodeId),
    }));
    setReductionStep(0);
    setCurrentPresetName('custom');
  };

  const handleAddEdge = () => {
    if (!newEdgeFrom || !newEdgeTo || newEdgeFrom === newEdgeTo) return;
    const id = `edge_${Date.now()}`;
    const newEdge: RAGEdge = {
      id,
      from: newEdgeFrom,
      to: newEdgeTo,
      type: newEdgeType,
    };
    setGraph((prev) => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }));
    setReductionStep(0);
    setCurrentPresetName('custom');
  };

  const handleRemoveEdge = (edgeId: string) => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
    setReductionStep(0);
    setCurrentPresetName('custom');
  };

  // Node position calculation for SVG Canvas (Bipartite Layout)
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const canvasWidth = 620;
    const procY = 70;
    const resY = 230;

    const nP = graph.processes.length;
    graph.processes.forEach((p, idx) => {
      const x = nP === 1 ? canvasWidth / 2 : (canvasWidth / (nP + 1)) * (idx + 1);
      map.set(p.id, { x, y: procY });
    });

    const nR = graph.resources.length;
    graph.resources.forEach((r, idx) => {
      const x = nR === 1 ? canvasWidth / 2 : (canvasWidth / (nR + 1)) * (idx + 1);
      map.set(r.id, { x, y: resY });
    });

    return map;
  }, [graph.processes, graph.resources]);

  // Set default from/to when nodes exist
  useEffect(() => {
    if (graph.processes.length > 0 && graph.resources.length > 0) {
      if (newEdgeType === 'request') {
        if (!graph.processes.some((p) => p.id === newEdgeFrom)) setNewEdgeFrom(graph.processes[0].id);
        if (!graph.resources.some((r) => r.id === newEdgeTo)) setNewEdgeTo(graph.resources[0].id);
      } else {
        if (!graph.resources.some((r) => r.id === newEdgeFrom)) setNewEdgeFrom(graph.resources[0].id);
        if (!graph.processes.some((p) => p.id === newEdgeTo)) setNewEdgeTo(graph.processes[0].id);
      }
    }
  }, [graph.processes, graph.resources, newEdgeType, newEdgeFrom, newEdgeTo]);

  // Check if an edge is part of any detected cycle
  const isEdgeInCycle = (edge: RAGEdge): boolean => {
    return cycleInfo.cycles.some((cycle) => {
      for (let i = 0; i < cycle.length - 1; i++) {
        if (cycle[i] === edge.from && cycle[i + 1] === edge.to) return true;
      }
      return false;
    });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header controls & preset switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <GitGraph className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Resource Allocation Graph (RAG) & Deadlock Explorer</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Visualize processes and resources. Test when cycles cause deadlock, step through the Graph Reduction algorithm, and evaluate the Pigeonhole threshold.
          </p>
        </div>

        {/* Preset Selector & Editor Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadPreset('single-cycle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              currentPresetName === 'single-cycle'
                ? 'bg-rose-950/70 border-rose-500/80 text-rose-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            1. Single-Instance Cycle
          </button>
          <button
            onClick={() => loadPreset('multi-safe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              currentPresetName === 'multi-safe'
                ? 'bg-teal-950/70 border-teal-500/80 text-teal-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            2. Multi-Instance Safe
          </button>
          <button
            onClick={() => loadPreset('multi-deadlock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              currentPresetName === 'multi-deadlock'
                ? 'bg-rose-950/70 border-rose-500/80 text-rose-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            3. Multi-Instance Deadlock
          </button>
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
              showEditor
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {showEditor ? 'Hide Editor' : 'Edit Graph'}
          </button>
        </div>
      </div>

      {/* Cycle Detection Banner & Single/Multi-Instance Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cycle status */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
            cycleInfo.hasCycle
              ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {cycleInfo.hasCycle ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <span className="font-bold text-sm block">
              {cycleInfo.hasCycle ? 'Cycle Detected in Graph!' : 'No Directed Cycle Found'}
            </span>
            <div className="mt-1 font-sans text-slate-200">
              {cycleInfo.hasCycle ? (
                <div>
                  Cycles found: {cycleInfo.cycles.map((c) => c.join(' → ')).join(' | ')}.
                  {isSingleInstance ? (
                    <strong className="text-rose-300 block mt-1">
                      ⚠️ Purely single-instance graph: A cycle is a NECESSARY AND SUFFICIENT condition for DEADLOCK!
                    </strong>
                  ) : (
                    <strong className="text-amber-300 block mt-1">
                      ℹ️ Multi-instance graph: A cycle is necessary but NOT SUFFICIENT. You must run the Reduction Algorithm below to decide!
                    </strong>
                  )}
                </div>
              ) : (
                'Since no circular wait cycle exists, the system is guaranteed free from deadlock.'
              )}
            </div>
          </div>
        </div>

        {/* Reduction Status */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
            activeReductionStep?.state.isDeadlocked === true
              ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
              : activeReductionStep?.state.isDeadlocked === false
              ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-sm block">
              Reduction State:{' '}
              {activeReductionStep?.state.isDeadlocked === true
                ? 'DEADLOCK'
                : activeReductionStep?.state.isDeadlocked === false
                ? 'COMPLETELY REDUCED (SAFE)'
                : 'STEPPING...'}
            </span>
            <div className="mt-1 font-mono text-[11px] text-slate-300 space-y-0.5">
              <div>
                Reduced Processes: [
                {activeReductionStep?.state.reducedProcesses.join(', ') || 'none'}]
              </div>
              <div>
                Pending Processes: [
                {activeReductionStep?.state.unreducedProcesses.join(', ') || 'none'}]
              </div>
              <div>
                Available Units:{' '}
                {Object.entries(activeReductionStep?.state.availableUnits || {})
                  .map(([k, v]) => `${k}:${v}`)
                  .join(', ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Graph Editor Panel */}
      {showEditor && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Sliders className="w-4 h-4" /> Graph Construction & Editing Controls
            </div>
            <button
              onClick={() => {
                setGraph({ processes: [], resources: [], edges: [] });
                setReductionStep(0);
                setCurrentPresetName('custom');
              }}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add Node Column */}
            <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-300">1. Manage Nodes</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddProcess}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Process (P{graph.processes.length + 1})
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">Instances:</span>
                  <select
                    value={newResInstances}
                    onChange={(e) => setNewResInstances(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-amber-300 font-bold"
                  >
                    {[1, 2, 3, 4, 5].map((inst) => (
                      <option key={inst} value={inst}>
                        {inst} instance{inst > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddResource}
                  className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-1.5 transition mt-4"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Resource (R{graph.resources.length + 1})
                </button>
              </div>

              {/* Node List with delete */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {graph.processes.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px]"
                  >
                    {p.name}
                    <button
                      onClick={() => handleRemoveNode(p.id)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {graph.resources.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]"
                  >
                    {r.name} ({r.instances})
                    <button
                      onClick={() => handleRemoveNode(r.id)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add Edge Column */}
            <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-300">2. Add Directed Edge</span>

              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Edge Type:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewEdgeType('request')}
                      className={`py-1 px-2 rounded border text-center transition font-bold ${
                        newEdgeType === 'request'
                          ? 'bg-rose-950 border-rose-500 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Request (P → R)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEdgeType('assignment')}
                      className={`py-1 px-2 rounded border text-center transition font-bold ${
                        newEdgeType === 'assignment'
                          ? 'bg-teal-950 border-teal-500 text-teal-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Assignment (R → P)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">From:</span>
                    <select
                      value={newEdgeFrom}
                      onChange={(e) => setNewEdgeFrom(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-slate-200"
                    >
                      {newEdgeType === 'request'
                        ? graph.processes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))
                        : graph.resources.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">To:</span>
                    <select
                      value={newEdgeTo}
                      onChange={(e) => setNewEdgeTo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-slate-200"
                    >
                      {newEdgeType === 'request'
                        ? graph.resources.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))
                        : graph.processes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddEdge}
                  disabled={!newEdgeFrom || !newEdgeTo}
                  className="mt-2 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Edge
                </button>
              </div>
            </div>

            {/* Existing Edges List */}
            <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-300">3. Current Edges ({graph.edges.length})</span>
              <div className="flex-1 overflow-y-auto max-h-44 space-y-1 pr-1">
                {graph.edges.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-900 border border-slate-800"
                  >
                    <span className="font-mono text-[11px]">
                      <strong className={e.type === 'request' ? 'text-indigo-300' : 'text-amber-300'}>
                        {e.from}
                      </strong>{' '}
                      <span className={e.type === 'request' ? 'text-rose-400' : 'text-teal-400'}>
                        {e.type === 'request' ? '—(req)→' : '—(alloc)→'}
                      </span>{' '}
                      <strong className={e.type === 'request' ? 'text-amber-300' : 'text-indigo-300'}>
                        {e.to}
                      </strong>
                    </span>
                    <button
                      onClick={() => handleRemoveEdge(e.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove edge"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {graph.edges.length === 0 && (
                  <div className="text-slate-600 italic py-4 text-center">No edges defined.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SVG Interactive Graph Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span className="font-bold text-slate-200">
            Resource Allocation Graph Canvas {isSingleInstance ? '(Single-Instance)' : '(Multi-Instance)'}
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Process (Circle)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500"></span> Resource (Rectangle)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              → Request
            </span>
            <span className="flex items-center gap-1.5 text-teal-400">
              → Assignment
            </span>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="w-full bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex items-center justify-center min-h-[320px]">
          <svg className="w-full max-w-3xl h-80" viewBox="0 0 620 300">
            <defs>
              <marker
                id="arrow-req"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
              </marker>
              <marker
                id="arrow-assign"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#14b8a6" />
              </marker>
              <marker
                id="arrow-cycle"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Empty state if no nodes */}
            {graph.processes.length === 0 && graph.resources.length === 0 && (
              <text x="310" y="150" textAnchor="middle" fill="#64748b" fontSize="14">
                Graph is empty. Click &quot;Edit Graph&quot; to add processes and resources!
              </text>
            )}

            {/* Dynamic Edges */}
            {graph.edges.map((edge) => {
              const fromPos = nodePositions.get(edge.from);
              const toPos = nodePositions.get(edge.to);
              if (!fromPos || !toPos) return null;

              const inCycle = isEdgeInCycle(edge);

              // Curvature offset to separate bidirectional or multi-edges
              const dx = toPos.x - fromPos.x;
              const dy = toPos.y - fromPos.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const nx = -dy / len;
              const ny = dx / len;
              const curveSign = edge.type === 'request' ? 1 : -1;
              const offset = 22 * curveSign;
              const cx = (fromPos.x + toPos.x) / 2 + nx * offset;
              const cy = (fromPos.y + toPos.y) / 2 + ny * offset;

              return (
                <path
                  key={edge.id}
                  d={`M ${fromPos.x} ${fromPos.y} Q ${cx} ${cy} ${toPos.x} ${toPos.y}`}
                  fill="none"
                  stroke={inCycle ? '#ef4444' : edge.type === 'request' ? '#f43f5e' : '#14b8a6'}
                  strokeWidth={inCycle ? 3.5 : 2.5}
                  strokeDasharray={inCycle ? '6 3' : undefined}
                  markerEnd={
                    inCycle
                      ? 'url(#arrow-cycle)'
                      : edge.type === 'request'
                      ? 'url(#arrow-req)'
                      : 'url(#arrow-assign)'
                  }
                  className={inCycle ? 'animate-pulse' : ''}
                />
              );
            })}

            {/* Dynamic Process Nodes */}
            {graph.processes.map((p) => {
              const pos = nodePositions.get(p.id);
              if (!pos) return null;

              const isReduced = activeReductionStep?.state.reducedProcesses.includes(p.id);
              const isCurrent = activeReductionStep?.state.currentProcess === p.id;
              const isDeadlocked =
                activeReductionStep?.state.isDeadlocked === true &&
                activeReductionStep?.state.unreducedProcesses.includes(p.id);

              return (
                <g key={p.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle
                    r="25"
                    fill={
                      isReduced
                        ? '#064e3b'
                        : isDeadlocked
                        ? '#881337'
                        : isCurrent
                        ? '#4338ca'
                        : '#312e81'
                    }
                    stroke={
                      isDeadlocked
                        ? '#ef4444'
                        : isReduced
                        ? '#10b981'
                        : isCurrent
                        ? '#a5b4fc'
                        : '#6366f1'
                    }
                    strokeWidth={isCurrent || isDeadlocked ? 3.5 : 2.5}
                    className="transition-colors duration-300"
                  />
                  <text
                    y="5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontWeight="bold"
                    fontSize="13"
                    className="select-none"
                  >
                    {p.name}
                  </text>
                  {isReduced && (
                    <text
                      y="-30"
                      textAnchor="middle"
                      fill="#34d399"
                      fontWeight="bold"
                      fontSize="10"
                    >
                      ✓ REDUCED
                    </text>
                  )}
                  {isDeadlocked && (
                    <text
                      y="-30"
                      textAnchor="middle"
                      fill="#f87171"
                      fontWeight="bold"
                      fontSize="10"
                    >
                      ⚠ DEADLOCKED
                    </text>
                  )}
                </g>
              );
            })}

            {/* Dynamic Resource Nodes */}
            {graph.resources.map((r) => {
              const pos = nodePositions.get(r.id);
              if (!pos) return null;

              const rectW = Math.max(56, 32 + 14 * r.instances);
              const rectH = 46;

              return (
                <g key={r.id} transform={`translate(${pos.x - rectW / 2}, ${pos.y - rectH / 2})`}>
                  <rect
                    width={rectW}
                    height={rectH}
                    rx="8"
                    fill="#451a03"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                  <text
                    x={rectW / 2}
                    y="18"
                    textAnchor="middle"
                    fill="#fde68a"
                    fontWeight="bold"
                    fontSize="12"
                    className="select-none"
                  >
                    {r.name} ({r.instances})
                  </text>
                  {/* Dots for instances */}
                  <g transform={`translate(${rectW / 2}, 32)`}>
                    {Array.from({ length: r.instances }).map((_, dotIdx) => {
                      const dotSpacing = 12;
                      const dotX = (dotIdx - (r.instances - 1) / 2) * dotSpacing;
                      return (
                        <circle
                          key={dotIdx}
                          cx={dotX}
                          cy="0"
                          r="3.5"
                          fill="#f59e0b"
                        />
                      );
                    })}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Reduction Timeline */}
        <Timeline
          currentStep={reductionStep}
          totalSteps={reductionSteps.length}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onStepChange={(s) => setReductionStep(s)}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onSpeedChange={(sp) => setPlaybackSpeed(sp)}
        />

        <CaptionBar
          stepIndex={reductionStep}
          caption={activeReductionStep?.caption || ''}
          formula={activeReductionStep?.formula}
          event={activeReductionStep?.event}
        />
      </div>

      {/* Pigeonhole Principle Deadlock-Free Calculator & Visual Slot Infographic */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Pigeonhole Deadlock-Freedom Guarantee Calculator & Slot Infographic
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              GATE Archetype: Minimum resource instances to guarantee deadlock cannot occur regardless of scheduling.
            </p>
          </div>

          <span className="font-mono text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-lg">
            Formula: R ≥ n·(m - 1) + 1
          </span>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 font-mono text-xs">
          {/* Processes slider */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Processes (n):</span>
              <strong className="text-indigo-400 text-sm">{nProcs}</strong>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={nProcs}
              onChange={(e) => setNProcs(parseInt(e.target.value, 10))}
              className="accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Number of competing processes</span>
          </div>

          {/* Max instances slider */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Max Needed (m):</span>
              <strong className="text-amber-400 text-sm">{mMax}</strong>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={mMax}
              onChange={(e) => setMMax(parseInt(e.target.value, 10))}
              className="accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Max demand each process can hold</span>
          </div>

          {/* Total Resources slider */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Total Available (R):</span>
              <strong className="text-teal-400 text-sm">{totalR}</strong>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              value={totalR}
              onChange={(e) => setTotalR(parseInt(e.target.value, 10))}
              className="accent-teal-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Current system resource capacity</span>
          </div>
        </div>

        {/* Visual Pigeonhole Slot Allocation Graphic */}
        <div className="bg-slate-950/90 rounded-xl p-5 border border-slate-800 flex flex-col gap-4 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
            <span className="font-bold text-slate-200">
              Worst-Case Stall Allocation Matrix: {nProcs} processes × ({mMax} - 1) held = {pigeonhole.worstCaseStall} held units
            </span>
            <span className="text-amber-300 text-[11px]">
              Available Pool: {Math.max(0, totalR - pigeonhole.worstCaseStall)} units
            </span>
          </div>

          {/* Process Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: nProcs }).map((_, pIdx) => {
              const isFirst = pIdx === 0;
              const getsPigeonholeUnit = isFirst && isThresholdSafe;

              return (
                <div
                  key={pIdx}
                  className={`p-3 rounded-xl border flex flex-col gap-2 transition ${
                    getsPigeonholeUnit
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300">Process P{pIdx + 1}</span>
                    <span className="text-[10px] text-slate-400">
                      Demand: {mMax}
                    </span>
                  </div>

                  {/* Slot units visualization */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Held (m-1) units */}
                    {Array.from({ length: Math.max(0, mMax - 1) }).map((_, slotIdx) => (
                      <span
                        key={slotIdx}
                        className="w-5 h-5 rounded bg-amber-500/30 border border-amber-500 flex items-center justify-center text-[10px] font-bold text-amber-300"
                        title={`Held unit ${slotIdx + 1}`}
                      >
                        ●
                      </span>
                    ))}

                    {/* Final m-th unit */}
                    {mMax > 0 && (
                      <span
                        className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] font-bold transition ${
                          getsPigeonholeUnit
                            ? 'bg-emerald-500 text-slate-950 border-emerald-300 animate-bounce'
                            : 'border-dashed border-rose-500/60 text-rose-400/80 bg-rose-950/20'
                        }`}
                        title={
                          getsPigeonholeUnit
                            ? '+1 Critical Pigeonhole unit granted!'
                            : 'Waiting for final unit'
                        }
                      >
                        {getsPigeonholeUnit ? <Check className="w-3.5 h-3.5" /> : '?'}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {getsPigeonholeUnit ? (
                      <strong className="text-emerald-400">✓ Completes & releases holdings!</strong>
                    ) : (
                      `Holds ${mMax - 1} / ${mMax} (stalled)`
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Threshold Bar & Status */}
        <div
          className={`p-4 rounded-xl border flex flex-col gap-3 ${
            isThresholdSafe
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              {isThresholdSafe ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
              <span>
                {isThresholdSafe
                  ? `DEADLOCK-FREE GUARANTEED! (R = ${totalR} ≥ ${pigeonhole.minGuaranteed})`
                  : `DEADLOCK IS POSSIBLE! (R = ${totalR} < ${pigeonhole.minGuaranteed})`}
              </span>
            </div>

            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-900 border border-current font-bold">
              Threshold: {pigeonhole.n} × ({pigeonhole.m} - 1) + 1 = {pigeonhole.minGuaranteed}
            </span>
          </div>

          {/* Visual slot breakdown text */}
          <div className="text-xs text-slate-300 font-sans leading-relaxed">
            Worst-case deadlock stall occurs when all <strong>{nProcs} processes</strong> simultaneously hold{' '}
            <strong>{mMax - 1} instances</strong> each without finishing, consuming{' '}
            <strong className="text-amber-300">{pigeonhole.worstCaseStall} total units</strong>.
            {isThresholdSafe ? (
              <span className="text-emerald-300 block mt-1">
                Because R = {totalR} provides at least 1 extra unit beyond {pigeonhole.worstCaseStall}, at least one process is guaranteed to get its final m-th unit, execute to completion, release all its holdings, and allow all remaining processes to finish!
              </span>
            ) : (
              <span className="text-rose-300 block mt-1">
                With only R = {totalR} units, the system can get stuck in circular wait with all {nProcs} processes holding {mMax - 1} units and waiting for unavailable resources.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
