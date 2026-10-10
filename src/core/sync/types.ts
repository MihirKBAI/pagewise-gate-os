export interface SyncInstruction {
  id: string;
  thread: 'A' | 'B';
  type: 'LOAD' | 'ADD' | 'STORE' | 'SET_FLAG' | 'SET_TURN' | 'CHECK_WHILE' | 'ENTER_CS' | 'EXIT_CS' | 'P' | 'V';
  desc: string;
  lineNum: number;
}

export interface SyncState {
  pcA: number;
  pcB: number;
  regA: number;
  regB: number;
  x: number;
  flagA: boolean;
  flagB: boolean;
  turn: 'A' | 'B';
  inCSA: boolean;
  inCSB: boolean;
  mutualExclusionViolated: boolean;
  activeInstruction: SyncInstruction | null;
  history: { thread: 'A' | 'B'; instruction: string; xAfter: number }[];
}

export interface SemaphoreState {
  initialValue: number;
  currentValue: number;
  blockedQueue: string[];
  history: { op: 'P' | 'V'; proc: string; valueAfter: number; blockedAfter: string[] }[];
}
