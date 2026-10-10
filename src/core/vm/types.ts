export type VMLifecycleStepId =
  | 'cpu_request'
  | 'tlb_lookup'
  | 'tlb_hit'
  | 'tlb_miss'
  | 'pt_lookup'
  | 'pt_valid'
  | 'pt_invalid_fault'
  | 'os_trap_legal'
  | 'os_find_frame'
  | 'os_dirty_writeback'
  | 'os_disk_read'
  | 'os_update_tables'
  | 'instruction_restart'
  | 'memory_complete';

export interface VMLifecycleStep {
  stepId: VMLifecycleStepId;
  title: string;
  description: string;
  location: 'CPU' | 'MMU/TLB' | 'RAM' | 'OS_KERNEL' | 'DISK';
  timeScale: 'ns' | 'us' | 'ms';
  approxDurationNs: number;
  isPageFaultPhase: boolean;
}

export interface CombinedEATParams {
  tlbLookupNs: number;       // e.g. 10 ns
  memoryAccessNs: number;    // e.g. 100 ns
  tlbHitRate: number;        // e.g. 0.90
  faultRateOnMiss: number;   // e.g. 0.01 (1% of TLB misses cause page fault)
  faultServiceNs: number;    // e.g. 5,000,000 ns (5 ms)
}

export interface CombinedEATResult {
  eatNs: number;
  probTlbHit: number;
  probMissNoFault: number;
  probFault: number;
  timeTlbHitNs: number;
  timeMissNoFaultNs: number;
  timeFaultNs: number;
  contribTlbHitNs: number;
  contribMissNoFaultNs: number;
  contribFaultNs: number;
  faultTimeSharePercent: number;
}

export interface ThrashingPoint {
  degreeOfMultiprogramming: number;
  cpuUtilizationPercent: number;
  pageFaultRatePerSec: number;
  isThrashing: boolean;
  totalWorkingSetPages: number;
  availableFrames: number;
}
