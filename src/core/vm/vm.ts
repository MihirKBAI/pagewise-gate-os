import { CombinedEATParams, CombinedEATResult, ThrashingPoint, VMLifecycleStep } from './types';

export function computeCombinedEAT(params: CombinedEATParams): CombinedEATResult {
  const { tlbLookupNs, memoryAccessNs, tlbHitRate, faultRateOnMiss, faultServiceNs } = params;

  const probTlbHit = tlbHitRate;
  const probMissNoFault = (1 - tlbHitRate) * (1 - faultRateOnMiss);
  const probFault = (1 - tlbHitRate) * faultRateOnMiss;

  // Standard GATE convention from Section 6.6:
  // Path 1 (TLB hit): TLB lookup + Memory access
  const timeTlbHitNs = tlbLookupNs + memoryAccessNs;

  // Path 2 (TLB miss, Page table hit): TLB lookup + Page table lookup + Data memory access
  const timeMissNoFaultNs = tlbLookupNs + memoryAccessNs + memoryAccessNs;

  // Path 3 (TLB miss, Page fault): TLB lookup + Page table access + Fault service + restart memory access
  const timeFaultNs = tlbLookupNs + memoryAccessNs + faultServiceNs + memoryAccessNs;

  const contribTlbHitNs = probTlbHit * timeTlbHitNs;
  const contribMissNoFaultNs = probMissNoFault * timeMissNoFaultNs;
  const contribFaultNs = probFault * timeFaultNs;

  const eatNs = contribTlbHitNs + contribMissNoFaultNs + contribFaultNs;
  const faultTimeSharePercent = (contribFaultNs / eatNs) * 100;

  return {
    eatNs,
    probTlbHit,
    probMissNoFault,
    probFault,
    timeTlbHitNs,
    timeMissNoFaultNs,
    timeFaultNs,
    contribTlbHitNs,
    contribMissNoFaultNs,
    contribFaultNs,
    faultTimeSharePercent,
  };
}

// Compute Inverted Page Table size
export function computeInvertedPageTableEntries(ramSizeBytes: number, pageSizeBytes: number): number {
  return ramSizeBytes / pageSizeBytes;
}

// Compute Optimal Page Size: s = average process size, e = entry size
export function computeOptimalPageSize(processSizeBytes: number, pteSizeBytes: number): number {
  return Math.round(Math.sqrt(2 * processSizeBytes * pteSizeBytes));
}

// Generate Thrashing Curve points
export function generateThrashingCurve(maxProcesses = 20, physicalFrames = 50, avgWorkingSetPerProc = 6): ThrashingPoint[] {
  const points: ThrashingPoint[] = [];

  for (let d = 1; d <= maxProcesses; d++) {
    const totalWorkingSet = d * avgWorkingSetPerProc;
    const isThrashing = totalWorkingSet > physicalFrames;

    let cpuUtilizationPercent = 0;
    let faultRatePerSec = 0;

    if (!isThrashing) {
      // Utilization rises with multiprogramming as CPU stays busy overlapping I/O
      cpuUtilizationPercent = Math.min(95, 20 + 75 * Math.sin((d / (physicalFrames / avgWorkingSetPerProc)) * (Math.PI / 2)));
      faultRatePerSec = d * 15;
    } else {
      // Thrashing: CPU utilization collapses precipitously as processes wait on paging disk
      const overload = totalWorkingSet - physicalFrames;
      const decayFactor = Math.exp(-overload / 6);
      cpuUtilizationPercent = Math.max(4, 95 * decayFactor);
      faultRatePerSec = 150 + overload * 300;
    }

    points.push({
      degreeOfMultiprogramming: d,
      cpuUtilizationPercent: Math.round(cpuUtilizationPercent),
      pageFaultRatePerSec: Math.round(faultRatePerSec),
      isThrashing,
      totalWorkingSetPages: totalWorkingSet,
      availableFrames: physicalFrames,
    });
  }

  return points;
}

// Pre-defined Lifecycle Steps
export const DEMAND_PAGING_LIFECYCLE_STEPS: VMLifecycleStep[] = [
  {
    stepId: 'cpu_request',
    title: '1. CPU Issues Virtual Address',
    description: 'Running instruction dereferences a pointer; MMU receives virtual address (page number + offset).',
    location: 'CPU',
    timeScale: 'ns',
    approxDurationNs: 1,
    isPageFaultPhase: false,
  },
  {
    stepId: 'tlb_lookup',
    title: '2. TLB Associative Lookup',
    description: 'Hardware checks high-speed Translation Lookaside Buffer cache for page number.',
    location: 'MMU/TLB',
    timeScale: 'ns',
    approxDurationNs: 10,
    isPageFaultPhase: false,
  },
  {
    stepId: 'pt_lookup',
    title: '3. TLB Miss → Page Table Lookup',
    description: 'TLB miss occurs. MMU accesses Page Table in main RAM to locate page table entry.',
    location: 'RAM',
    timeScale: 'ns',
    approxDurationNs: 100,
    isPageFaultPhase: false,
  },
  {
    stepId: 'pt_invalid_fault',
    title: '4. Valid Bit = 0 → PAGE FAULT TRAP',
    description: 'Page table entry has valid bit = 0 (page not in physical memory). Hardware generates page fault trap to OS kernel.',
    location: 'OS_KERNEL',
    timeScale: 'us',
    approxDurationNs: 500,
    isPageFaultPhase: true,
  },
  {
    stepId: 'os_trap_legal',
    title: '5. OS Checks Address Legality',
    description: 'Kernel inspects process PCB / internal tables. If access is illegal or protection violation, issue SIGSEGV and terminate.',
    location: 'OS_KERNEL',
    timeScale: 'us',
    approxDurationNs: 1000,
    isPageFaultPhase: true,
  },
  {
    stepId: 'os_find_frame',
    title: '6. Find Free Frame or Select Victim',
    description: 'OS checks free-frame list. If empty, page replacement algorithm (FIFO/LRU/OPT) selects a resident victim page.',
    location: 'RAM',
    timeScale: 'us',
    approxDurationNs: 2000,
    isPageFaultPhase: true,
  },
  {
    stepId: 'os_dirty_writeback',
    title: '7. Write-back Dirty Page to Disk (if modified)',
    description: 'If victim page dirty bit is set, write page frame to swap space on disk before overwriting.',
    location: 'DISK',
    timeScale: 'ms',
    approxDurationNs: 5000000,
    isPageFaultPhase: true,
  },
  {
    stepId: 'os_disk_read',
    title: '8. Read Desired Page from Disk into Frame',
    description: 'OS issues disk I/O request to load page into frame. Process is placed on Wait queue. Disk transfers 4 KB block (HUGE ms-scale penalty!).',
    location: 'DISK',
    timeScale: 'ms',
    approxDurationNs: 8000000,
    isPageFaultPhase: true,
  },
  {
    stepId: 'os_update_tables',
    title: '9. Update Page Table & TLB',
    description: 'I/O interrupt arrives. OS updates page table entry (valid bit = 1, frame number), updates TLB, marks process Ready.',
    location: 'RAM',
    timeScale: 'us',
    approxDurationNs: 2000,
    isPageFaultPhase: true,
  },
  {
    stepId: 'instruction_restart',
    title: '10. Restart Faulting Instruction',
    description: 'Context switch resumes process. The CPU restarts the exact faulting instruction; now hits TLB / RAM smoothly!',
    location: 'CPU',
    timeScale: 'ns',
    approxDurationNs: 100,
    isPageFaultPhase: false,
  },
];
