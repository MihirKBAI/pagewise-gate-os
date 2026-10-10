import { Step, Highlight } from '../types';
import { BankerParams, BankerState, CandidateCheck, RequestEvaluationResult, ResourceRequest } from './types';

export function computeNeedMatrix(max: number[][], allocation: number[][]): number[][] {
  return max.map((row, i) =>
    row.map((maxVal, j) => maxVal - allocation[i][j])
  );
}

export function computeAvailableVector(total: number[], allocation: number[][]): number[] {
  const m = total.length;
  const avail = [...total];
  for (let j = 0; j < m; j++) {
    for (let i = 0; i < allocation.length; i++) {
      avail[j] -= allocation[i][j];
    }
  }
  return avail;
}

export function simulateBankerSafety(params: BankerParams): Step<BankerState>[] {
  const { processes, resources, allocation, max } = params;
  const n = processes.length;

  const need = computeNeedMatrix(max, allocation);
  const total = params.total || resources.map((_, j) => {
    let sum = params.available ? params.available[j] : 0;
    for (let i = 0; i < n; i++) sum += allocation[i][j];
    return sum;
  });

  const available = params.available ? [...params.available] : computeAvailableVector(total, allocation);

  const steps: Step<BankerState>[] = [];
  let work = [...available];
  const finish = Array(n).fill(false);
  const safeSequence: string[] = [];
  const workHistory: number[][] = [[...work]];

  // Step 0: Initial state
  const initialCandidateChecks: CandidateCheck[] = processes.map((name, i) => {
    const colChecks = need[i].map((val, j) => val <= work[j]);
    return {
      procIndex: i,
      procName: name,
      need: [...need[i]],
      work: [...work],
      canRun: colChecks.every(Boolean),
      columnChecks: colChecks,
    };
  });

  steps.push({
    index: 0,
    state: {
      work: [...work],
      finish: [...finish],
      need: JSON.parse(JSON.stringify(need)),
      allocation: JSON.parse(JSON.stringify(allocation)),
      max: JSON.parse(JSON.stringify(max)),
      available: [...available],
      total: [...total],
      safeSequence: [],
      currentCandidate: null,
      candidateChecks: initialCandidateChecks,
      isSafe: null,
      phase: 'init',
      workHistory: JSON.parse(JSON.stringify(workHistory)),
    },
    caption: `Banker's Safety Algorithm initialized. Available Work = (${work.join(', ')}). Need = Max - Allocation computed.`,
    formula: `Need = Max - Allocation; Work = Available = (${work.join(', ')})`,
    highlights: [],
    event: 'init',
  });

  let stepCounter = 1;
  while (safeSequence.length < n) {
    // Evaluate candidates
    const candidateChecks: CandidateCheck[] = processes.map((name, i) => {
      const colChecks = need[i].map((val, j) => val <= work[j]);
      return {
        procIndex: i,
        procName: name,
        need: [...need[i]],
        work: [...work],
        canRun: !finish[i] && colChecks.every(Boolean),
        columnChecks: colChecks,
      };
    });

    // Find next candidate process whose Finish[i] == false and Need[i] <= Work
    let chosenProc = -1;
    for (let i = 0; i < n; i++) {
      if (!finish[i] && candidateChecks[i].canRun) {
        chosenProc = i;
        break;
      }
    }

    if (chosenProc === -1) {
      // Unsafe! No process can run
      const unfinished = processes.filter((_, i) => !finish[i]);
      steps.push({
        index: stepCounter++,
        state: {
          work: [...work],
          finish: [...finish],
          need: JSON.parse(JSON.stringify(need)),
          allocation: JSON.parse(JSON.stringify(allocation)),
          max: JSON.parse(JSON.stringify(max)),
          available: [...available],
          total: [...total],
          safeSequence: [...safeSequence],
          currentCandidate: null,
          candidateChecks,
          isSafe: false,
          phase: 'unsafe',
          workHistory: JSON.parse(JSON.stringify(workHistory)),
        },
        caption: `SYSTEM UNSAFE: No unfinished process satisfies Need ≤ Work (${work.join(', ')}). Blocked processes: ${unfinished.join(', ')}.`,
        formula: `∀ unfinished i, ∃ resource r such that Need[i][r] > Work[r]`,
        highlights: unfinished.map((p) => ({
          target: `proc-${processes.indexOf(p)}`,
          type: 'denied',
          label: 'BLOCKED',
        })),
        event: 'deadlock',
      });
      return steps;
    }

    // Step: process selected
    finish[chosenProc] = true;
    safeSequence.push(processes[chosenProc]);
    const oldWork = [...work];
    work = work.map((w, j) => w + allocation[chosenProc][j]);
    workHistory.push([...work]);

    const highlights: Highlight[] = [
      {
        target: `proc-${chosenProc}`,
        type: 'selected',
        label: `SELECTED ${processes[chosenProc]}`,
      },
      ...resources.map((_, j) => ({
        target: `cell-${chosenProc}-${j}`,
        type: 'hit' as const,
        label: `Need ≤ Work`,
      })),
    ];

    steps.push({
      index: stepCounter++,
      state: {
        work: [...work],
        finish: [...finish],
        need: JSON.parse(JSON.stringify(need)),
        allocation: JSON.parse(JSON.stringify(allocation)),
        max: JSON.parse(JSON.stringify(max)),
        available: [...available],
        total: [...total],
        safeSequence: [...safeSequence],
        currentCandidate: chosenProc,
        candidateChecks,
        isSafe: safeSequence.length === n ? true : null,
        phase: safeSequence.length === n ? 'complete' : 'allocated',
        workHistory: JSON.parse(JSON.stringify(workHistory)),
      },
      caption: `Process ${processes[chosenProc]} selected: Need (${need[chosenProc].join(', ')}) ≤ Work (${oldWork.join(', ')}). Releases Allocation (${allocation[chosenProc].join(', ')}). New Work = (${work.join(', ')}).`,
      formula: `Work_new = Work_old + Allocation[${processes[chosenProc]}] = (${oldWork.join(', ')}) + (${allocation[chosenProc].join(', ')}) = (${work.join(', ')})`,
      highlights,
      event: 'step',
    });
  }

  // Final confirmation
  steps.push({
    index: stepCounter,
    state: {
      work: [...work],
      finish: [...finish],
      need: JSON.parse(JSON.stringify(need)),
      allocation: JSON.parse(JSON.stringify(allocation)),
      max: JSON.parse(JSON.stringify(max)),
      available: [...available],
      total: [...total],
      safeSequence: [...safeSequence],
      currentCandidate: null,
      candidateChecks: [],
      isSafe: true,
      phase: 'complete',
      workHistory: JSON.parse(JSON.stringify(workHistory)),
    },
    caption: `SYSTEM SAFE! Found safe sequence ⟨${safeSequence.join(', ')}⟩. Final Work equals Total resources (${work.join(', ')}).`,
    formula: `Final Work (${work.join(', ')}) == Total (${total.join(', ')}) ✓`,
    highlights: processes.map((_, i) => ({
      target: `proc-${i}`,
      type: 'granted',
      label: 'COMPLETED',
    })),
    event: 'complete',
  });

  return steps;
}

// Find all valid safe sequences via DFS
export function findAllSafeSequences(params: BankerParams): string[][] {
  const { processes, allocation, max } = params;
  const n = processes.length;
  const need = computeNeedMatrix(max, allocation);
  const total = params.total || processes.map((_, j) => {
    let sum = params.available ? params.available[j] : 0;
    for (let i = 0; i < n; i++) sum += allocation[i][j];
    return sum;
  });
  const available = params.available ? [...params.available] : computeAvailableVector(total, allocation);

  const results: string[][] = [];

  function dfs(currentWork: number[], finished: boolean[], path: string[]) {
    if (path.length === n) {
      results.push([...path]);
      return;
    }

    for (let i = 0; i < n; i++) {
      if (!finished[i]) {
        const canRun = need[i].every((v, j) => v <= currentWork[j]);
        if (canRun) {
          finished[i] = true;
          path.push(processes[i]);
          const nextWork = currentWork.map((w, j) => w + allocation[i][j]);

          dfs(nextWork, finished, path);

          path.pop();
          finished[i] = false;
        }
      }
    }
  }

  dfs([...available], Array(n).fill(false), []);
  return results;
}

// Validate custom learner safe sequence by simulation (FLAG-7)
export function validateLearnerSafeSequence(params: BankerParams, submittedSequence: string[]): {
  valid: boolean;
  failedStepIndex?: number;
  failedProcess?: string;
  reason?: string;
} {
  const { processes, allocation, max } = params;
  const need = computeNeedMatrix(max, allocation);
  const total = params.total || processes.map((_, j) => {
    let sum = params.available ? params.available[j] : 0;
    for (let i = 0; i < processes.length; i++) sum += allocation[i][j];
    return sum;
  });
  let work = params.available ? [...params.available] : computeAvailableVector(total, allocation);

  if (submittedSequence.length !== processes.length) {
    return {
      valid: false,
      reason: `Expected ${processes.length} processes in sequence, got ${submittedSequence.length}.`,
    };
  }

  const seen = new Set<string>();

  for (let s = 0; s < submittedSequence.length; s++) {
    const pName = submittedSequence[s].trim();
    const pIdx = processes.indexOf(pName);

    if (pIdx === -1) {
      return {
        valid: false,
        failedStepIndex: s,
        failedProcess: pName,
        reason: `Process ${pName} does not exist in system.`,
      };
    }

    if (seen.has(pName)) {
      return {
        valid: false,
        failedStepIndex: s,
        failedProcess: pName,
        reason: `Process ${pName} appeared more than once.`,
      };
    }
    seen.add(pName);

    // Check Need <= Work
    const violates = need[pIdx].some((val, j) => val > work[j]);
    if (violates) {
      const offendingResources = need[pIdx]
        .map((val, j) => ({ res: j, need: val, work: work[j] }))
        .filter((c) => c.need > c.work)
        .map((c) => `resource #${c.res} (Need=${c.need} > Work=${c.work})`)
        .join(', ');

      return {
        valid: false,
        failedStepIndex: s,
        failedProcess: pName,
        reason: `At step ${s + 1}, process ${pName} cannot run because ${offendingResources}.`,
      };
    }

    // Allocate
    work = work.map((w, j) => w + allocation[pIdx][j]);
  }

  return { valid: true };
}

// Evaluate a resource request
export function evaluateResourceRequest(
  params: BankerParams,
  request: ResourceRequest
): RequestEvaluationResult {
  const { procIndex, request: reqVector } = request;
  const { processes, allocation, max } = params;
  const need = computeNeedMatrix(max, allocation);
  const total = params.total || processes.map((_, j) => {
    let sum = params.available ? params.available[j] : 0;
    for (let i = 0; i < processes.length; i++) sum += allocation[i][j];
    return sum;
  });
  const available = params.available ? [...params.available] : computeAvailableVector(total, allocation);

  // Check 1: Request <= Need
  const step1NeedCheck = reqVector.every((val, j) => val <= need[procIndex][j]);
  if (!step1NeedCheck) {
    return {
      step1NeedCheck: false,
      step2AvailableCheck: false,
      step3SafetyCheck: false,
      reason: `Error: Process ${processes[procIndex]} requested more than its declared maximum claim (Request > Need).`,
      granted: false,
    };
  }

  // Check 2: Request <= Available
  const step2AvailableCheck = reqVector.every((val, j) => val <= available[j]);
  if (!step2AvailableCheck) {
    return {
      step1NeedCheck: true,
      step2AvailableCheck: false,
      step3SafetyCheck: false,
      reason: `Process ${processes[procIndex]} must wait: requested resources not currently available in system.`,
      granted: false,
    };
  }

  // Step 3: Pretend allocation
  const pretendAvailable = available.map((a, j) => a - reqVector[j]);
  const pretendAllocation = allocation.map((row, i) =>
    i === procIndex ? row.map((val, j) => val + reqVector[j]) : [...row]
  );
  const pretendNeed = need.map((row, i) =>
    i === procIndex ? row.map((val, j) => val - reqVector[j]) : [...row]
  );

  const testParams: BankerParams = {
    processes,
    resources: params.resources,
    total,
    allocation: pretendAllocation,
    max,
    available: pretendAvailable,
  };

  const safetySteps = simulateBankerSafety(testParams);
  const lastStep = safetySteps[safetySteps.length - 1];
  const isSafe = lastStep.state.isSafe === true;

  if (isSafe) {
    return {
      step1NeedCheck: true,
      step2AvailableCheck: true,
      step3SafetyCheck: true,
      safeSequenceAfterGrant: lastStep.state.safeSequence,
      reason: `Request granted! System remains safe with sequence ⟨${lastStep.state.safeSequence.join(', ')}⟩.`,
      granted: true,
      pretendState: {
        available: pretendAvailable,
        allocation: pretendAllocation,
        need: pretendNeed,
      },
    };
  } else {
    return {
      step1NeedCheck: true,
      step2AvailableCheck: true,
      step3SafetyCheck: false,
      reason: `Request DENIED (Rollback applied): granting request leads to an UNSAFE state with no safe sequence.`,
      granted: false,
      pretendState: {
        available: pretendAvailable,
        allocation: pretendAllocation,
        need: pretendNeed,
      },
    };
  }
}
