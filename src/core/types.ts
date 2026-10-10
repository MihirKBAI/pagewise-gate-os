export interface Highlight {
  target: string;
  type: 'hit' | 'fault' | 'active' | 'evicted' | 'candidate' | 'selected' | 'denied' | 'trap' | 'granted' | 'warning';
  label?: string;
}

export interface Step<S> {
  index: number;
  state: S;
  caption: string;
  formula?: string;
  highlights: Highlight[];
  event?: 'hit' | 'fault' | 'evict' | 'grant' | 'deny' | 'deadlock' | 'trap' | 'complete' | 'init' | 'step';
}

export type Simulator<P, S> = (params: P) => Step<S>[];
