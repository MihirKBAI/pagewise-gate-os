export interface TopicInfo {
  id: string;
  number: number;
  title: string;
  shortDesc: string;
  flagship?: boolean;
  hook: string;
  methodChecklist: string[];
  misconceptions: string[];
  formulas: { label: string; formula: string; note?: string }[];
  simRoute: string;
}

export const TOPICS: TopicInfo[] = [
  {
    id: 'page-replacement',
    number: 5,
    title: 'Page Fault & Replacement',
    shortDesc: 'Trace FIFO, LRU, OPT, and Clock on reference strings. Uncover Belady\'s Anomaly.',
    flagship: true,
    hook: 'When physical RAM fills up, the OS must choose which page to discard. Pick the wrong victim and disk swapping grinds execution to a halt.',
    methodChecklist: [
      'Draw the frame table with frame rows F0, F1... and reference columns.',
      'Initial empty slots are cold misses (page faults unless stated as preloaded).',
      'For FIFO: Maintain arrival queue. Hits DO NOT change queue order. Evict the oldest page.',
      'For LRU: Maintain recency. Every access (hit or fault) moves page to MRU. Evict the page at LRU.',
      'For OPT: Look ahead into the future reference string. Evict the page referenced farthest in the future (or never).',
      'Count faults vs hits: Fault rate = Faults / Total References.',
    ],
    misconceptions: [
      'Counting initial frame fills as free (cold misses ARE faults).',
      'Updating arrival queue on a hit under FIFO (FIFO ignores hits).',
      'Believing adding more frames always reduces page faults (Belady\'s Anomaly in FIFO).',
      'Forgetting that stack algorithms (LRU, OPT) are mathematically immune to Belady\'s Anomaly.',
    ],
    formulas: [
      { label: 'Fault Rate', formula: 'p = Page Faults / Total References' },
      { label: 'EAT with Page Fault', formula: 'EAT = (1 - p)·m + p·S', note: 'm = memory time, S = fault service time' },
      { label: 'Max p for Target EAT', formula: 'p ≤ (EAT_target - m) / (S - m)' },
      { label: 'Dirty Page Service', formula: 'S_eff = (1 - dirty)·S_clean + dirty·S_dirty' },
    ],
    simRoute: '/sim/page-replacement',
  },
  {
    id: 'banker',
    number: 3,
    title: "Banker's Algorithm",
    shortDesc: 'Need matrices, safety verification, request grants, and rollback on unsafe states.',
    hook: 'Like a conservative bank managing cash reserves, the OS guarantees that loans (resources) are only granted if all clients can eventually complete without deadlock.',
    methodChecklist: [
      'Calculate Need matrix: Need[i][j] = Max[i][j] - Allocation[i][j].',
      'Initialize Work = Available vector, Finish = [false, ...].',
      'Search for an unfinished process i where Need[i] ≤ Work for all resources.',
      'If found: Work = Work + Allocation[i], Finish[i] = true, add to sequence.',
      'Repeat until all finish (SAFE) or none can run (UNSAFE).',
      'Request evaluation: Check Request ≤ Need, Request ≤ Available, then pretend-allocate and verify safety.',
    ],
    misconceptions: [
      'Comparing Max instead of Need against Work.',
      'Assuming the safe sequence is unique (multiple valid orderings often exist!).',
      'Equating "unsafe" with "deadlocked" (unsafe means deadlock is possible, not guaranteed).',
      'Forgetting to verify ALL resource dimensions before scheduling a candidate.',
    ],
    formulas: [
      { label: 'Need Matrix', formula: 'Need[i][j] = Max[i][j] - Allocation[i][j]' },
      { label: 'Available Vector', formula: 'Available = Total - ∑ Allocation_i' },
      { label: 'Work Update', formula: 'Work_new = Work_old + Allocation_i' },
      { label: 'Request Condition', formula: 'Req ≤ Need ∧ Req ≤ Available' },
    ],
    simRoute: '/sim/bankers',
  },
  {
    id: 'rag',
    number: 2,
    title: 'Resource Allocation & Deadlock',
    shortDesc: 'Analyze Resource Allocation Graphs, Coffman conditions, reduction, and pigeonhole thresholds.',
    hook: 'A cycle in a graph can freeze an entire operating system. Learn when a cycle causes deadlock and when graph reduction proves freedom.',
    methodChecklist: [
      'Identify nodes: Circles = Processes, Rectangles = Resources (dots = instances).',
      'Request edge: Process → Resource; Assignment edge: Resource → Process.',
      'Single-instance resource rule: Cycle ⟺ Deadlock.',
      'Multi-instance rule: Cycle is necessary but NOT sufficient; must run Reduction Algorithm.',
      'Pigeonhole threshold: Deadlock impossible iff Total Resources R ≥ n·(m - 1) + 1.',
    ],
    misconceptions: [
      'Claiming a cycle always means deadlock in multi-instance graphs.',
      'Forgetting that a process request does not consume an instance until assigned.',
      'Confusing the four Coffman conditions (Mutual exclusion, Hold & wait, No preemption, Circular wait).',
    ],
    formulas: [
      { label: 'Guaranteed Deadlock-Free', formula: 'R ≥ ∑(Max_i - 1) + 1' },
      { label: 'Identical Max Demands', formula: 'R ≥ n·(m - 1) + 1', note: 'n processes, max m units each' },
      { label: 'Worst-case Stall', formula: 'Hold_worst = n·(m - 1)' },
    ],
    simRoute: '/sim/rag',
  },
  {
    id: 'paging',
    number: 4,
    title: 'Paging & Segmentation',
    shortDesc: 'Address splitters, multi-level page table hierarchies, TLB hit/miss EAT, and segmentation limit traps.',
    hook: 'How does a 32-bit or 48-bit pointer find a 4 KB chunk of silicon in nanoseconds? Master hardware address translation mechanics.',
    methodChecklist: [
      'Find offset bits: d = log2(Page Size).',
      'Page number bits: p = Logical Address Bits - d.',
      'Frame bits: f = Physical Address Bits - d.',
      'Single-level table size: 2^p entries × PTE size bytes.',
      'Multilevel splitting: Entries per table = Page Size / PTE size; Bits per level = log2(Entries).',
      'Segmentation rule: If Offset ≥ Limit → TRAP (Segmentation Fault). Else PA = Base + Offset.',
      'TLB EAT: Note convention (sequential vs parallel lookup).',
    ],
    misconceptions: [
      'Forgetting that a page table lookup consumes memory cycles (miss = 2+ memory accesses).',
      'Treating segmentation limit check as ≤ instead of strictly <.',
      'Confusing internal fragmentation (fixed paging) with external fragmentation (variable segmentation).',
    ],
    formulas: [
      { label: 'Offset Bits', formula: 'd = log₂(Page Size)' },
      { label: 'Page Number Bits', formula: 'p = VA_bits - d' },
      { label: 'Single-level PT Size', formula: '2^p × PTE_size' },
      { label: 'TLB EAT (Sequential)', formula: 'EAT = h·(t + m) + (1 - h)·(t + 2m)' },
      { label: 'TLB EAT (k-level)', formula: 'EAT = h·(t + m) + (1 - h)·(t + (k + 1)m)' },
    ],
    simRoute: '/sim/paging',
  },
  {
    id: 'sync',
    number: 1,
    title: 'Critical Section & Concurrency',
    shortDesc: 'Interleaving traces, race conditions (min/max), Peterson\'s algorithm mutation, and semaphores.',
    hook: 'Two threads incrementing a variable 5 times can end up with 2 instead of 10. Trace adversarial preemptions and prove synchronization safety.',
    methodChecklist: [
      'Each high-level `x = x + 1` consists of LOAD, ADD, STORE.',
      'Serial execution gives maximum value: 2 × n for two threads.',
      'Adversarial preemption yields minimum value: exactly 2 for n ≥ 2 iterations.',
      'Peterson\'s requirements: flag indicates intent; turn provides courteous tie-breaking.',
      'Counting Semaphore: Final value = S_initial - #P + #V.',
    ],
    misconceptions: [
      'Believing disabling interrupts works for multi-core CPUs.',
      'Omitting the `turn` variable in Peterson\'s (causes mutual exclusion violation).',
      'Confusing Progress (no deadlock among contending threads) with Bounded Waiting (no starvation).',
      'Thinking operation order changes final semaphore value (it only affects blocking).',
    ],
    formulas: [
      { label: 'Semaphore Arithmetic', formula: 'S_final = S_init - #P + #V' },
      { label: 'Race Increment Max', formula: 'Max(x) = 2·n' },
      { label: 'Race Increment Min', formula: 'Min(x) = 2 (for n ≥ 2)' },
    ],
    simRoute: '/sim/sync',
  },
  {
    id: 'vm',
    number: 6,
    title: 'Virtual Memory & Thrashing',
    shortDesc: 'Demand paging lifecycle token flow, thrashing working set curve, inverted tables, and combined EAT.',
    hook: 'When physical memory runs out, the CPU can spend 99% of its time waiting on disk paging. Unpack the microsecond-to-millisecond penalty.',
    methodChecklist: [
      'Trace demand paging trap: MMU checks valid bit → Trap to OS → Find frame → Disk I/O → Update PTE/TLB → Restart.',
      'Notice time scale difference: RAM is ~100 ns; Disk is ~8 ms (80,000× slower!).',
      'Inverted Page Table: Indexed by physical frames. Entries = RAM Size / Page Size.',
      'Thrashing occurs when ∑ Working Sets > Total Physical Frames.',
    ],
    misconceptions: [
      'Thinking virtual memory increases speed (it only increases address capacity).',
      'Confusing the Valid/Invalid bit (memory resident) with Read/Write protection bits.',
      'Assuming inverted page table size depends on virtual address space size.',
    ],
    formulas: [
      { label: 'Inverted PT Entries', formula: '#entries = Physical RAM / Page Size' },
      { label: 'Optimal Page Size', formula: 'p_opt ≈ √(2·s·e)', note: 's = process size, e = PTE size' },
      { label: 'Combined EAT', formula: 'EAT = h·(t+m) + (1-h)(1-p)·(t+2m) + (1-h)p·(t+2m+S)' },
    ],
    simRoute: '/sim/virtual-memory',
  },
];
