export interface BankerParams {
  processes: string[];          // e.g. ['P0', 'P1', 'P2', 'P3', 'P4']
  resources: string[];          // e.g. ['A', 'B', 'C']
  total?: number[];             // e.g. [10, 5, 7]
  allocation: number[][];       // [procIndex][resourceIndex]
  max: number[][];              // [procIndex][resourceIndex]
  available?: number[];         // if omitted, calculated as total - colSum(allocation)
}

export interface CandidateCheck {
  procIndex: number;
  procName: string;
  need: number[];
  work: number[];
  canRun: boolean;              // Need <= Work for all resources
  columnChecks: boolean[];      // per-resource comparison result
}

export interface BankerState {
  work: number[];
  finish: boolean[];
  need: number[][];
  allocation: number[][];
  max: number[][];
  available: number[];
  total: number[];
  safeSequence: string[];
  currentCandidate: number | null;
  candidateChecks: CandidateCheck[];
  isSafe: boolean | null;       // null if in-progress, true if safe, false if unsafe
  phase: 'init' | 'checking' | 'allocated' | 'complete' | 'unsafe';
  workHistory: number[][];
}

export interface ResourceRequest {
  procIndex: number;
  request: number[];
}

export interface RequestEvaluationResult {
  step1NeedCheck: boolean;      // Request <= Need
  step2AvailableCheck: boolean; // Request <= Available
  step3SafetyCheck: boolean;    // System safe after pretend allocation
  safeSequenceAfterGrant?: string[];
  reason: string;
  granted: boolean;
  pretendState?: {
    available: number[];
    allocation: number[][];
    need: number[][];
  };
}
