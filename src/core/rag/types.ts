export interface RAGProcess {
  id: string;
  name: string;
}

export interface RAGResource {
  id: string;
  name: string;
  instances: number;
}

export interface RAGEdge {
  id: string;
  from: string; // process or resource id
  to: string;   // resource or process id
  type: 'request' | 'assignment';
}

export interface RAGGraph {
  processes: RAGProcess[];
  resources: RAGResource[];
  edges: RAGEdge[];
}

export interface ReductionStep {
  index: number;
  availableUnits: Record<string, number>;
  reducedProcesses: string[];
  currentProcess: string | null;
  heldReleased: Record<string, number>;
  unreducedProcesses: string[];
  isDeadlocked: boolean | null;
  caption: string;
}

export interface DeadlockFreedomResult {
  n: number; // process count
  m: number; // max per process
  minResourcesGuaranteed: number;
  isDeadlockFreeForR: (r: number) => boolean;
}
