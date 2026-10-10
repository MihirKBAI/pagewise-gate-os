import { Step } from '../types';
import { RAGGraph, ReductionStep } from './types';

// Detect cycles in directed graph
export function detectCycles(graph: RAGGraph): { hasCycle: boolean; cycles: string[][] } {
  const adj = new Map<string, string[]>();
  const allNodes = [
    ...graph.processes.map((p) => p.id),
    ...graph.resources.map((r) => r.id),
  ];

  for (const node of allNodes) {
    adj.set(node, []);
  }

  for (const edge of graph.edges) {
    adj.get(edge.from)?.push(edge.to);
  }

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  const cycles: string[][] = [];

  function dfs(u: string, path: string[]) {
    visited.set(u, 1);
    path.push(u);

    for (const v of adj.get(u) || []) {
      if (visited.get(v) === 1) {
        // Cycle found
        const cycleStartIndex = path.indexOf(v);
        const cycle = path.slice(cycleStartIndex).concat(v);
        cycles.push(cycle);
      } else if (!visited.get(v)) {
        dfs(v, path);
      }
    }

    path.pop();
    visited.set(u, 2);
  }

  for (const node of allNodes) {
    if (!visited.get(node)) {
      dfs(node, []);
    }
  }

  return {
    hasCycle: cycles.length > 0,
    cycles,
  };
}

// Check if graph is purely single-instance
export function isSingleInstanceGraph(graph: RAGGraph): boolean {
  return graph.resources.every((r) => r.instances === 1);
}

// Reduction algorithm simulation
export function simulateRAGReduction(graph: RAGGraph): Step<ReductionStep>[] {
  const steps: Step<ReductionStep>[] = [];

  // 1. Compute initially available instances
  const allocatedCounts: Record<string, number> = {};
  for (const res of graph.resources) {
    allocatedCounts[res.id] = 0;
  }

  for (const edge of graph.edges) {
    if (edge.type === 'assignment') {
      allocatedCounts[edge.from] = (allocatedCounts[edge.from] || 0) + 1;
    }
  }

  const available: Record<string, number> = {};
  for (const res of graph.resources) {
    available[res.id] = Math.max(0, res.instances - (allocatedCounts[res.id] || 0));
  }

  const reduced: string[] = [];
  const unreduced = graph.processes.map((p) => p.id);

  // Initial step
  steps.push({
    index: 0,
    state: {
      index: 0,
      availableUnits: { ...available },
      reducedProcesses: [],
      currentProcess: null,
      heldReleased: {},
      unreducedProcesses: [...unreduced],
      isDeadlocked: null,
      caption: 'Initial graph reduction state. Available resource units computed.',
    },
    caption: `Starting reduction algorithm. Initial available units: ${graph.resources
      .map((r) => `${r.name}: ${available[r.id]}`)
      .join(', ')}.`,
    highlights: [],
    event: 'init',
  });

  let stepIdx = 1;
  let progress = true;

  while (progress && unreduced.length > 0) {
    progress = false;

    // Find a process in unreduced whose requests can be satisfied
    let candidateProcId: string | null = null;
    for (const pId of unreduced) {
      // Find all requests by pId
      const requests = graph.edges.filter(
        (e) => e.type === 'request' && e.from === pId
      );

      // Count requests per resource
      const reqCounts: Record<string, number> = {};
      for (const req of requests) {
        reqCounts[req.to] = (reqCounts[req.to] || 0) + 1;
      }

      const canSatisfy = Object.entries(reqCounts).every(
        ([resId, count]) => (available[resId] || 0) >= count
      );

      if (canSatisfy) {
        candidateProcId = pId;
        break;
      }
    }

    if (candidateProcId) {
      progress = true;
      const pObj = graph.processes.find((p) => p.id === candidateProcId)!;

      // Collect held resources by this process
      const heldAssignments = graph.edges.filter(
        (e) => e.type === 'assignment' && e.to === candidateProcId
      );

      const heldCounts: Record<string, number> = {};
      for (const h of heldAssignments) {
        heldCounts[h.from] = (heldCounts[h.from] || 0) + 1;
        available[h.from] = (available[h.from] || 0) + 1;
      }

      // Move from unreduced to reduced
      const pIdx = unreduced.indexOf(candidateProcId);
      unreduced.splice(pIdx, 1);
      reduced.push(candidateProcId);

      const releasedDesc = Object.entries(heldCounts)
        .map(([rId, c]) => `${c} of ${graph.resources.find((r) => r.id === rId)?.name || rId}`)
        .join(', ');

      steps.push({
        index: stepIdx++,
        state: {
          index: stepIdx - 1,
          availableUnits: { ...available },
          reducedProcesses: [...reduced],
          currentProcess: candidateProcId,
          heldReleased: heldCounts,
          unreducedProcesses: [...unreduced],
          isDeadlocked: unreduced.length === 0 ? false : null,
          caption: `Process ${pObj.name} requests satisfied. Process reduces and releases ${releasedDesc || '0 resources'}.`,
        },
        caption: `Process ${pObj.name} can complete! It releases holdings: ${releasedDesc || 'none'}. Available units now: ${graph.resources.map((r) => `${r.name}: ${available[r.id]}`).join(', ')}.`,
        formula: `Available' = Available + Held(${pObj.name})`,
        highlights: [
          { target: candidateProcId, type: 'granted', label: 'REDUCED' },
        ],
        event: 'step',
      });
    }
  }

  const isDeadlocked = unreduced.length > 0;
  const deadlockedNames = unreduced
    .map((id) => graph.processes.find((p) => p.id === id)?.name || id)
    .join(', ');

  steps.push({
    index: stepIdx,
    state: {
      index: stepIdx,
      availableUnits: { ...available },
      reducedProcesses: [...reduced],
      currentProcess: null,
      heldReleased: {},
      unreducedProcesses: [...unreduced],
      isDeadlocked,
      caption: isDeadlocked
        ? `DEADLOCK DETECTED! Graph cannot be reduced further. Deadlocked processes: ${deadlockedNames}.`
        : `NO DEADLOCK! All processes successfully reduced.`,
    },
    caption: isDeadlocked
      ? `DEADLOCK! Unreducible cycle of processes [${deadlockedNames}] waiting on unavailable resources.`
      : `SAFE! The resource allocation graph is completely reducible. No deadlock.`,
    highlights: unreduced.map((id) => ({
      target: id,
      type: 'denied',
      label: 'DEADLOCKED',
    })),
    event: isDeadlocked ? 'deadlock' : 'complete',
  });

  return steps;
}

// Deadlock-free threshold calculator (Pigeonhole principle)
export function computeDeadlockFreeThreshold(n: number, m: number) {
  // Each of n processes needs at most m instances
  // Worst case allocation before deadlock: each holds (m - 1) instances
  // Total held in worst case = n * (m - 1)
  // One more instance guarantees at least one process finishes!
  const minGuaranteed = n * (m - 1) + 1;
  const worstCaseStall = n * (m - 1);
  return {
    n,
    m,
    worstCaseStall,
    minGuaranteed,
    isDeadlockFree: (r: number) => r >= minGuaranteed,
  };
}
