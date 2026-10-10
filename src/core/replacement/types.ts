export type ReplacementAlgorithm = 'fifo' | 'lru' | 'opt' | 'clock';

export interface PageReplacementParams {
  refString: number[];
  frameCount: number;
  algorithm: ReplacementAlgorithm;
}

export interface FrameHistoryEntry {
  refIndex: number;
  page: number;
  frames: (number | null)[];
  isHit: boolean;
  victim: number | null;
}

export interface PageReplacementState {
  refIndex: number;
  currentPage: number;
  frames: (number | null)[];
  isHit: boolean;
  faultCount: number;
  hitCount: number;
  victimPage: number | null;
  victimFrame: number | null;
  reason: string;
  queueOrder: number[];          // for FIFO: pages in arrival order (oldest first)
  recencyStack: number[];        // for LRU: pages ordered from LRU (index 0) to MRU (last)
  nextUses: Record<number, number | null>; // for OPT: next occurrence index in refString
  clockBits?: number[];          // for Clock: reference bit per frame
  clockPointer?: number;         // for Clock: current pointer index
  history: FrameHistoryEntry[];
}
