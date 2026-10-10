import { Question, AnswerDiagnosisResult } from './types';
import { validateLearnerSafeSequence } from '../banker/banker';

export const QUESTION_BANK: Question[] = [
  // --- MODULE 5: PAGE REPLACEMENT ---
  {
    id: 'pr-fifo-001',
    topicId: 'page-replacement',
    topicName: 'Page Fault & Replacement',
    archetype: 'Page fault count for given reference string and policy',
    title: 'FIFO Page Replacement on 20-Reference String',
    stem: 'Consider a system with **3 page frames** initially empty. The reference string of page accesses is:\n\n`7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1`\n\nHow many **page faults** occur using the First-In First-Out (**FIFO**) replacement algorithm?',
    type: 'NAT',
    difficulty: 2,
    params: {
      frames: 3,
      ref: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
      alg: 'fifo',
    },
    answer: 15,
    tolerance: 0,
    unit: 'faults',
    distractors: [
      {
        value: 12,
        diagnosis: 'You applied LRU instead of FIFO! LRU yields 12 faults on this string because it respects recency. FIFO replaces the oldest arrived page regardless of recent hits.',
      },
      {
        value: 9,
        diagnosis: 'You computed the Optimal (OPT) replacement count instead of FIFO. OPT yields 9 faults with future clairvoyance.',
      },
      {
        value: 5,
        diagnosis: 'You counted the number of HITS instead of FAULTS. Total references = 20; Hits = 5; Faults = 20 - 5 = 15.',
      },
      {
        value: 10,
        diagnosis: 'You simulated 4 frames instead of 3 frames (4 frames yields 10 faults). Check the question frame count!',
      },
    ],
    hintLadder: [
      'Method: Simulate FIFO with a queue of size 3. Oldest loaded page is evicted on fault. On HIT, the FIFO queue is NOT reordered.',
      'Steps 1–4: [7] (F), [7, 0] (F), [7, 0, 1] (F), [0, 1, 2] (F, evicts 7). At step 5, page 0 is a HIT; queue stays 0, 1, 2.',
      'Full trace yields 15 faults: faults occur at refs #1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14, 15, 18, 19, 20. Hits occur at #5, 12, 13, 16, 17.',
      'Explore in simulator: /sim/page-replacement?alg=fifo&frames=3&ref=7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1',
    ],
    simulatorLink: '/sim/page-replacement?alg=fifo&frames=3&ref=7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Twin of classic textbook & GATE benchmark reference string.',
      },
    ],
    tags: ['fifo', 'page-replacement', 'cold-miss'],
  },
  {
    id: 'pr-lru-002',
    topicId: 'page-replacement',
    topicName: 'Page Fault & Replacement',
    archetype: 'Page fault count for given reference string and policy',
    title: 'LRU Replacement on 20-Reference String',
    stem: 'For the same reference string:\n\n`7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1`\n\nwith **3 frames**, how many page faults occur under **LRU** (Least Recently Used)?',
    type: 'NAT',
    difficulty: 2,
    params: {
      frames: 3,
      ref: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
      alg: 'lru',
    },
    answer: 12,
    tolerance: 0,
    unit: 'faults',
    distractors: [
      {
        value: 15,
        diagnosis: 'You applied FIFO instead of LRU. FIFO ignores hits and evicts purely by arrival age, giving 15 faults.',
      },
      {
        value: 9,
        diagnosis: 'You computed the Optimal (OPT) page replacement count instead of LRU.',
      },
      {
        value: 8,
        diagnosis: 'You counted the number of HITS (8 hits) instead of page faults (12 faults).',
      },
    ],
    hintLadder: [
      'Method: Maintain a recency stack. On every access (hit or fault), the accessed page moves to the MRU position (top).',
      'On a page fault when all 3 frames are full, evict the page at the bottom of the stack (least recently accessed).',
      'Under LRU on this string, page faults occur at refs #1, 2, 3, 4, 6, 8, 9, 10, 14, 15, 18, 20. Total faults = 12.',
      'Explore in simulator: /sim/page-replacement?alg=lru&frames=3&ref=7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1',
    ],
    simulatorLink: '/sim/page-replacement?alg=lru&frames=3&ref=7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic benchmark string comparison for LRU.',
      },
    ],
    tags: ['lru', 'page-replacement', 'recency'],
  },
  {
    id: 'pr-belady-003',
    topicId: 'page-replacement',
    topicName: 'Page Fault & Replacement',
    archetype: 'Belady anomaly identification',
    title: 'Belady\'s Anomaly Fault Difference',
    stem: 'Consider the reference string:\n\n`1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5`\n\nUnder FIFO, how many MORE page faults occur with **4 frames** compared to **3 frames**?',
    type: 'NAT',
    difficulty: 2,
    answer: 1,
    tolerance: 0,
    unit: 'faults',
    distractors: [
      {
        value: -1,
        diagnosis: 'Belady\'s anomaly causes faults to INCREASE from 9 to 10 when frames increase from 3 to 4. Faults(4 frames) - Faults(3 frames) = 10 - 9 = +1.',
      },
      {
        value: 9,
        diagnosis: '9 is the fault count with 3 frames, not the difference.',
      },
      {
        value: 10,
        diagnosis: '10 is the fault count with 4 frames, not the difference.',
      },
      {
        value: 0,
        diagnosis: 'Stack algorithms like LRU never exhibit Belady\'s anomaly, but FIFO is NOT a stack algorithm and exhibits a bump here.',
      },
    ],
    hintLadder: [
      'Method: Simulate FIFO with 3 frames, then simulate FIFO with 4 frames on the Belady string.',
      'With 3 frames: faults = 9. With 4 frames: faults = 10.',
      'Difference = 10 - 9 = 1 extra fault with more memory!',
      'Check Belady Lab in simulator: /sim/page-replacement?view=belady',
    ],
    simulatorLink: '/sim/page-replacement?alg=fifo&frames=4&ref=1,2,3,4,1,2,5,1,2,3,4,5',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Celebrated Belady 1969 anomaly string.',
      },
    ],
    tags: ['belady', 'fifo', 'anomaly'],
  },
  {
    id: 'pr-eat-004',
    topicId: 'page-replacement',
    topicName: 'Page Fault & Replacement',
    archetype: 'EAT given fault-service time and probability',
    title: 'Effective Access Time with Dirty Pages',
    stem: 'A virtual memory system has a main memory access time of **200 ns**. A page fault takes **8 ms** if the victim is clean, and **20 ms** if dirty. 60% of replaced pages are clean and 40% are dirty. If the page fault rate is **1 per 1000 memory accesses** ($p = 0.001$), calculate the Effective Access Time in **nanoseconds** (rounded to nearest integer).',
    type: 'NAT',
    difficulty: 2,
    answer: 13000,
    tolerance: 5,
    unit: 'ns',
    distractors: [
      {
        value: 8199,
        diagnosis: 'You assumed all victim pages are clean (8 ms). 40% of victims require 20 ms write-back!',
      },
      {
        value: 20199,
        diagnosis: 'You assumed all victim pages are dirty (20 ms). Clean victims only take 8 ms.',
      },
      {
        value: 12800,
        diagnosis: 'You only computed the page fault service penalty without adding the normal memory access time component: (1-p)*200.',
      },
    ],
    hintLadder: [
      'Method: Compute weighted average fault service time: S = 0.60 * 8 ms + 0.40 * 20 ms.',
      'Convert ms to ns: 12.8 ms = 12,800,000 ns.',
      'EAT = (1 - p) * 200 ns + p * 12,800,000 ns = 0.999 * 200 + 0.001 * 12,800,000 = 199.8 + 12,800 = 12,999.8 ns ≈ 13,000 ns.',
      'Notice that the 0.1% page fault component contributes 98.5% of total time!',
    ],
    simulatorLink: '/sim/virtual-memory?view=eat',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Standard numerical archetype for dirty victim EAT calculation.',
      },
    ],
    tags: ['eat', 'dirty-page', 'page-fault'],
  },

  // --- MODULE 3: BANKER'S ALGORITHM ---
  {
    id: 'ba-safe-001',
    topicId: 'banker',
    topicName: "Banker's Algorithm",
    archetype: 'Find a safe sequence',
    title: 'Safe Sequence in Standard 5-Process System',
    stem: 'Consider 5 processes P0 through P4 and 3 resource types A, B, C with total instances [10, 5, 7].\n\n- Allocation:\n  - P0: (0, 1, 0), P1: (2, 0, 0), P2: (3, 0, 2), P3: (2, 1, 1), P4: (0, 0, 2)\n- Max:\n  - P0: (7, 5, 3), P1: (3, 2, 2), P2: (9, 0, 2), P3: (2, 2, 2), P4: (4, 3, 3)\n- Available: (3, 3, 2)\n\nEnter any valid safe sequence separated by commas (e.g. `P1, P3, P4, P0, P2`).',
    type: 'SEQUENCE',
    difficulty: 2,
    params: {
      processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
      resources: ['A', 'B', 'C'],
      total: [10, 5, 7],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
      available: [3, 3, 2],
    },
    answer: ['P1', 'P3', 'P4', 'P0', 'P2'],
    distractors: [
      {
        value: 'P0, P1, P2, P3, P4',
        diagnosis: 'P0 has Need (7, 4, 3) which exceeds Available (3, 3, 2). P0 cannot be scheduled first!',
      },
      {
        value: 'P2, P1, P3, P4, P0',
        diagnosis: 'P2 has Need (6, 0, 0) which exceeds Available (3, 3, 2) on resource A.',
      },
    ],
    hintLadder: [
      'Method: Compute Need = Max - Allocation. Start with Work = Available (3, 3, 2). Find an unfinished process with Need <= Work.',
      'Need matrix: P0(7,4,3), P1(1,2,2), P2(6,0,0), P3(0,1,1), P4(4,3,1). Initially, only P1 and P3 can run.',
      'If you pick P1 first, Work becomes (3,3,2) + (2,0,0) = (5,3,2). Next P3 can run, Work becomes (7,4,3). Then P4, P0, P2 can finish.',
      'Explore in simulator: /sim/bankers',
    ],
    simulatorLink: '/sim/bankers',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Textbook Silberschatz classic benchmark system.',
      },
    ],
    tags: ['banker', 'safe-sequence', 'deadlock-avoidance'],
  },
  {
    id: 'ba-req-002',
    topicId: 'banker',
    topicName: "Banker's Algorithm",
    archetype: 'Is system safe after granting request X?',
    title: 'Evaluating Resource Request for P1',
    stem: 'In the system above with Available = (3, 3, 2), process P1 requests **(1, 0, 2)**.\n\nShould the OS grant this request immediately?',
    type: 'MCQ',
    difficulty: 2,
    options: [
      {
        id: 'opt1',
        text: 'Yes, grant immediately because Request ≤ Need, Request ≤ Available, and the resulting state is Safe.',
        isCorrect: true,
      },
      {
        id: 'opt2',
        text: 'No, because P1 must wait as resource C does not have enough units.',
        isCorrect: false,
        diagnosis: 'Available for C is 2, and P1 requests 2. Request <= Available is satisfied!',
      },
      {
        id: 'opt3',
        text: 'No, because granting it produces an unsafe state.',
        isCorrect: false,
        diagnosis: 'After pretend allocation, Available=(2,3,0). P1 can finish and release (3,0,2), making Work=(5,3,2), leading to safe completion of all processes.',
      },
      {
        id: 'opt4',
        text: 'No, because P1 requested more than its declared Max claim.',
        isCorrect: false,
        diagnosis: 'P1 declared Max=(3,2,2) and Allocation=(2,0,0) → Need=(1,2,2). Request=(1,0,2) ≤ Need ✓.',
      },
    ],
    answer: 'opt1',
    distractors: [],
    hintLadder: [
      'Method: Run the 3-step Banker\'s Request algorithm: (1) Request <= Need, (2) Request <= Available, (3) Pretend-allocate and run Safety.',
      'P1 Need = (1, 2, 2); Request = (1, 0, 2) <= Need ✓. Available = (3, 3, 2) >= Request ✓.',
      'Pretend state: Available becomes (2, 3, 0). P1 Allocation becomes (3, 0, 2). Can a safe sequence be found? Yes: <P1, P3, P4, P0, P2>!',
      'Inspect rollback animation in simulator: /sim/bankers',
    ],
    simulatorLink: '/sim/bankers',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic request evaluation drill.',
      },
    ],
    tags: ['banker', 'request-algorithm'],
  },

  // --- MODULE 2: RAG & DEADLOCK ---
  {
    id: 'rag-min-001',
    topicId: 'rag',
    topicName: 'Resource Allocation & Deadlock',
    archetype: 'Minimum resource instances to guarantee deadlock-freedom',
    title: 'Pigeonhole Deadlock Freedom Guarantee',
    stem: 'A system has **3 processes**, each requiring at most **4 instances** of the same resource type $R$.\n\nWhat is the **minimum number of instances** of $R$ that **guarantees** the system will never deadlock?',
    type: 'NAT',
    difficulty: 1,
    answer: 10,
    tolerance: 0,
    unit: 'instances',
    distractors: [
      {
        value: 9,
        diagnosis: 'With R = 9, worst case is each of the 3 processes holds 3 instances (3 × 3 = 9) and requests 1 more. All wait forever → DEADLOCK is possible!',
      },
      {
        value: 12,
        diagnosis: '12 is 3 × 4 (total max demand). We do NOT need to satisfy all maximum demands simultaneously; only one process needs to finish at a time!',
      },
      {
        value: 7,
        diagnosis: '7 is insufficient. 3 processes holding 2 each = 6, but max is 4.',
      },
    ],
    hintLadder: [
      'Method: By Pigeonhole Principle, worst-case stall occurs when every process holds (max - 1) units.',
      'Worst-case held units = n * (m - 1) = 3 * (4 - 1) = 9 units.',
      'To guarantee that at least one process can finish and release its resources, add 1 extra unit: R_min = 9 + 1 = 10.',
      'Explore in simulator: /sim/rag?view=pigeonhole',
    ],
    simulatorLink: '/sim/rag',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic GATE numerical archetype R >= n(m-1) + 1.',
      },
    ],
    tags: ['rag', 'deadlock-free', 'pigeonhole'],
  },

  // --- MODULE 1: CRITICAL SECTION & SYNC ---
  {
    id: 'sync-race-001',
    topicId: 'sync',
    topicName: 'Critical Section & Concurrency',
    archetype: 'Final value of shared variable under race conditions',
    title: 'Minimum Final Value in 2-Thread Increment Race',
    stem: 'Two threads concurrently execute a loop 5 times each, incrementing a shared variable `x` initialized to 0:\n\n```c\nfor (int i = 0; i < 5; i++)\n    x = x + 1; // compiled to: LOAD R, x; ADD R, 1; STORE x, R;\n```\n\nWhat is the **minimum possible final value** of `x` after both threads finish?',
    type: 'NAT',
    difficulty: 3,
    answer: 2,
    tolerance: 0,
    distractors: [
      {
        value: 1,
        diagnosis: 'A final value of 1 is impossible because both threads must make at least one increment, and the last write occurs after a thread has observed x ≥ 1.',
      },
      {
        value: 5,
        diagnosis: '5 would occur if one thread ran entirely and completely overwrote the other, but with adversarial scheduling, a minimum of 2 is achievable.',
      },
      {
        value: 10,
        diagnosis: '10 is the MAXIMUM possible final value under perfect serial execution.',
      },
    ],
    hintLadder: [
      'Method: Construct an adversarial interleaving of LOAD, ADD, and STORE instructions.',
      'Thread 1 reads 0 into R1 and is preempted before STORE. Thread 2 executes 4 full increments (x becomes 4), then reads 4 into R2 and is preempted.',
      'Thread 1 wakes up, writes 1 (x becomes 1), then completes its remaining 4 increments, leaving x at 5. Thread 2 wakes up with its saved value 1, increments to 2, and writes 2.',
      'Explore in simulator: /sim/sync?view=race',
    ],
    simulatorLink: '/sim/sync',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Well-known GATE numerical: min value for n iterations is 2.',
      },
    ],
    tags: ['race-condition', 'concurrency', 'min-max'],
  },
  {
    id: 'sync-sem-002',
    topicId: 'sync',
    topicName: 'Critical Section & Concurrency',
    archetype: 'Final value of counting semaphore after P/V operations',
    title: 'Counting Semaphore Arithmetic',
    stem: 'A counting semaphore `S` is initialized to **10**. A sequence of **20 P (wait)** operations and **15 V (signal)** operations are executed on `S` in arbitrary order.\n\nWhat is the **final value** of `S`?',
    type: 'NAT',
    difficulty: 1,
    answer: 5,
    tolerance: 0,
    distractors: [
      {
        value: -10,
        diagnosis: 'You computed 10 - 20 = -10 and omitted the 15 V (signal) operations. Final value = Initial - P + V.',
      },
      {
        value: 25,
        diagnosis: 'You added P operations instead of subtracting them. P decrements semaphore value.',
      },
      {
        value: 0,
        diagnosis: '10 - 20 + 15 = 5. Order of operations does not affect the final value (though it affects who blocked).',
      },
    ],
    hintLadder: [
      'Method: Semaphore arithmetic is invariant under permutation: S_final = S_init - #P + #V.',
      'S_final = 10 - 20 + 15 = 5.',
      'The order only dictates which processes blocked temporarily along the timeline, but not the final count.',
      'Explore in simulator: /sim/sync?view=semaphore',
    ],
    simulatorLink: '/sim/sync',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Standard counting semaphore question.',
      },
    ],
    tags: ['semaphore', 'pv-operations'],
  },

  // --- MODULE 4: PAGING & SEGMENTATION ---
  {
    id: 'pg-split-001',
    topicId: 'paging',
    topicName: 'Paging & Segmentation',
    archetype: 'Number of bits for page number / offset / frame number',
    title: 'Physical Address Translation for 0x2A5C',
    stem: 'A computer system uses a **16-bit logical address**, a page size of **4 KB** ($2^{12}$ bytes), and a physical address space of **32 KB** ($2^{15}$ bytes).\n\nIf virtual page number **2** maps to frame **5**, what is the physical address (in hex, e.g. `0x5A5C`) corresponding to logical address `0x2A5C`?',
    type: 'NAT',
    difficulty: 1,
    answer: 0x5a5c,
    tolerance: 0,
    unit: 'hex',
    distractors: [
      {
        value: 0x2a5c,
        diagnosis: 'Logical address 0x2A5C must be translated: replace page number (2) with frame number (5).',
      },
      {
        value: 0xa5c,
        diagnosis: '0xA5C is only the offset (lower 12 bits). You must prepend the frame number (frame 5 = 0x5) to form 0x5A5C.',
      },
    ],
    hintLadder: [
      'Method: Page size = 4 KB = 2^12 B -> Offset = 12 bits. In 0x2A5C, page number = 0x2, offset = 0xA5C.',
      'Lookup: Page 2 maps to Frame 5 (binary 101).',
      'Physical address = (Frame << 12) | Offset = (5 << 12) | 0xA5C = 0x5A5C.',
      'Explore in simulator: /sim/paging?va=0x2A5C',
    ],
    simulatorLink: '/sim/paging',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic address split and translation drill.',
      },
    ],
    tags: ['paging', 'address-translation', 'offset'],
  },
  {
    id: 'pg-eat-002',
    topicId: 'paging',
    topicName: 'Paging & Segmentation',
    archetype: 'Effective memory access time with TLB',
    title: 'Effective Memory Access Time (EAT) with TLB',
    stem: 'A system has a single-level page table. TLB lookup time is **10 ns**, and main memory access time is **100 ns**. The TLB hit ratio is **90%** ($h = 0.90$). TLB lookup time is added on both hit and miss.\n\nCalculate the Effective Access Time (**EAT**) in **nanoseconds**.',
    type: 'NAT',
    difficulty: 2,
    answer: 120,
    tolerance: 0,
    unit: 'ns',
    distractors: [
      {
        value: 110,
        diagnosis: '110 ns is only the TLB HIT time (10 + 100). On a TLB miss, two memory accesses are required (one for page table, one for data).',
      },
      {
        value: 210,
        diagnosis: '210 ns is the TLB MISS penalty (10 + 100 + 100). You must compute the weighted average with h = 0.90.',
      },
      {
        value: 119,
        diagnosis: 'You forgot to include TLB lookup time on a miss (miss path: 10 + 100 + 100 = 210 ns).',
      },
    ],
    hintLadder: [
      'Method: EAT = h * (t + m) + (1 - h) * (t + 2*m).',
      'Hit path (90%): 10 ns (TLB) + 100 ns (RAM) = 110 ns.',
      'Miss path (10%): 10 ns (TLB) + 100 ns (Page Table) + 100 ns (RAM) = 210 ns.',
      'EAT = 0.90 * 110 + 0.10 * 210 = 99 + 21 = 120 ns.',
    ],
    simulatorLink: '/sim/paging?view=eat',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Standard single-level TLB EAT numerical.',
      },
    ],
    tags: ['tlb', 'eat', 'paging'],
  },

  // --- MODULE 6: VIRTUAL MEMORY ---
  {
    id: 'vm-inv-001',
    topicId: 'vm',
    topicName: 'Virtual Memory',
    archetype: 'Inverted page table size',
    title: 'Inverted Page Table Entry Count',
    stem: 'A 64-bit virtual memory computer has **1 GB** ($2^{30}$ bytes) of physical RAM and a page size of **4 KB** ($2^{12}$ bytes).\n\nHow many entries are present in an **inverted page table**?',
    type: 'NAT',
    difficulty: 2,
    answer: 262144, // 2^18
    tolerance: 0,
    unit: 'entries',
    distractors: [
      {
        value: 1048576,
        diagnosis: 'You calculated 2^20 entries (which would be for 4 GB RAM). 1 GB / 4 KB = 2^30 / 2^12 = 2^18 = 262,144.',
      },
      {
        value: 4503599627370496,
        diagnosis: 'An inverted page table is indexed by PHYSICAL FRAMES, not virtual pages! Its size is independent of the 64-bit virtual address space.',
      },
    ],
    hintLadder: [
      'Method: An inverted page table contains one entry per physical frame in main memory.',
      'Number of frames = Physical RAM size / Page size = 2^30 / 2^12 = 2^18.',
      '2^18 = 262,144 entries.',
      'Explore in simulator: /sim/virtual-memory',
    ],
    simulatorLink: '/sim/virtual-memory',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Frequent GATE conceptual numerical on inverted tables.',
      },
    ],
    tags: ['inverted-page-table', 'virtual-memory', 'frame-table'],
  },
  {
    id: 'pr-opt-005',
    topicId: 'page-replacement',
    topicName: 'Page Fault & Replacement',
    archetype: 'Optimal page replacement lower bound',
    title: 'Optimal (OPT) Replacement on 20-Reference String',
    stem: 'For the same reference string:\n\n`7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1`\n\nwith **3 frames**, how many page faults occur under the **Optimal (OPT/Bélády)** replacement algorithm?',
    type: 'NAT',
    difficulty: 2,
    params: {
      frames: 3,
      ref: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
      alg: 'opt',
    },
    answer: 9,
    tolerance: 0,
    unit: 'faults',
    distractors: [
      {
        value: 15,
        diagnosis: '15 is the FIFO fault count. OPT possesses future clairvoyance and evicts the page with the farthest next access.',
      },
      {
        value: 12,
        diagnosis: '12 is the LRU fault count. OPT achieves fewer faults than LRU (9 faults).',
      },
      {
        value: 11,
        diagnosis: 'You counted the number of hits (20 references - 9 faults = 11 hits) instead of faults.',
      },
    ],
    hintLadder: [
      'Method: When evicting, look ahead into future references and replace the page that will not be used for the longest period of time.',
      'Initial fills: 7, 0, 1 (3 faults). At ref #4 (page 2), pages resident are {7, 0, 1}. Next uses: 0 is at #5, 1 is at #14, 7 is at #18. Evict 7 (farthest)!',
      'Continuing this optimal choice at every fault results in exactly 9 page faults.',
      'Inspect OPT step trace: /sim/page-replacement?alg=opt&frames=3',
    ],
    simulatorLink: '/sim/page-replacement?alg=opt&frames=3',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic benchmark string comparison for OPT.',
      },
    ],
    tags: ['opt', 'belady-opt', 'page-replacement'],
  },
  {
    id: 'pr-cyclic-006',
    topicId: 'page-replacement',
    topicName: 'Page Fault & Replacement',
    archetype: 'Sequential flooding / cyclic access pattern trap',
    title: 'Cyclic Thrashing Loop (100% Faults Trap)',
    stem: 'Pages 1, 2, 3, 4 are accessed in a repeating loop 3 times:\n\n`1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4`\n\nin a system with **3 frames** under **LRU** replacement. How many **page faults** occur?',
    type: 'NAT',
    difficulty: 2,
    params: {
      frames: 3,
      ref: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4],
      alg: 'lru',
    },
    answer: 12,
    tolerance: 0,
    unit: 'faults',
    distractors: [
      {
        value: 4,
        diagnosis: 'You only counted the first cold misses. Because the loop length (4) exceeds frame count (3), every single subsequent reference misses under LRU!',
      },
      {
        value: 9,
        diagnosis: 'Check your step-by-step trace: EVERY access in this cyclic sequence misses under LRU, giving 12 faults for 12 references.',
      },
      {
        value: 0,
        diagnosis: 'None of the accesses hit. LRU evicts exactly the page needed at the next step.',
      },
    ],
    hintLadder: [
      'Method: Trace LRU for cyclic loop of size N + 1 pages with N frames.',
      'After [1, 2, 3], frame holds {1, 2, 3}. Next ref 4 evicts 1 (LRU). Frames now {2, 3, 4}.',
      'Next ref 1 needs page 1, which was just evicted! It evicts 2. Then ref 2 evicts 3, and so on.',
      'Every single reference is a page fault -> 12 faults for 12 accesses (100% fault rate)!',
    ],
    simulatorLink: '/sim/page-replacement?alg=lru&frames=3&ref=1,2,3,4,1,2,3,4,1,2,3,4',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic GATE trap on looping through N+1 pages with N frames.',
      },
    ],
    tags: ['cyclic-access', 'lru', 'thrashing'],
  },
  {
    id: 'pg-ptsize-003',
    topicId: 'paging',
    topicName: 'Paging & Segmentation',
    archetype: 'Page-table size calculation',
    title: 'Single-Level Page Table Size',
    stem: 'A computer system uses a **32-bit virtual address**, **4 KB** pages ($2^{12}$ bytes), and each Page Table Entry (PTE) takes **4 bytes**.\n\nWhat is the size of the single-level page table in **Megabytes (MB)**?',
    type: 'NAT',
    difficulty: 1,
    answer: 4,
    tolerance: 0,
    unit: 'MB',
    distractors: [
      {
        value: 1,
        diagnosis: 'You computed 2^20 entries = 1M entries, but each entry takes 4 bytes! 1M entries × 4 B = 4 MB.',
      },
      {
        value: 1048576,
        diagnosis: '1,048,576 is the number of entries (2^20), not the table size in Megabytes.',
      },
      {
        value: 16,
        diagnosis: 'Check your PTE size: 4 B × 2^20 = 4 MB, not 16 MB.',
      },
    ],
    hintLadder: [
      'Method: Number of pages = 2^(VA bits) / Page Size = 2^32 / 2^12 = 2^20 entries.',
      'Size = (# of entries) × (PTE size in bytes) = 2^20 × 4 Bytes = 4 × 2^20 Bytes.',
      'Since 1 MB = 2^20 Bytes, the table size is exactly 4 MB.',
      'Explore in simulator: /sim/paging?view=multilevel',
    ],
    simulatorLink: '/sim/paging',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Core textbook & GATE formula archetype.',
      },
    ],
    tags: ['page-table-size', 'paging', 'pte'],
  },
  {
    id: 'pg-levels-004',
    topicId: 'paging',
    topicName: 'Paging & Segmentation',
    archetype: 'Number of page table levels in multi-level paging',
    title: 'Multi-Level Paging Hierarchy Levels',
    stem: 'A 64-bit architecture uses a **48-bit virtual address**, **4 KB** ($2^{12}$ B) pages, and **8-byte** PTEs. Each level of the page table must fit completely within a single 4 KB page.\n\nHow many **levels of page tables** are required to support this virtual address space?',
    type: 'NAT',
    difficulty: 2,
    answer: 4,
    tolerance: 0,
    unit: 'levels',
    distractors: [
      {
        value: 3,
        diagnosis: 'You divided 36 bits by 12 bits instead of 9 bits per level. A 4 KB page with 8 B PTE holds 512 entries (9 bits).',
      },
      {
        value: 5,
        diagnosis: '36 VPN bits / 9 bits per level = 4 levels exactly.',
      },
      {
        value: 2,
        diagnosis: 'Two levels can only address 2^(9 + 9 + 12) = 30 bits, which is far too small for 48 bits.',
      },
    ],
    hintLadder: [
      'Method: Each page table page holds (Page Size / PTE Size) = 4 KB / 8 B = 512 entries = 2^9 entries.',
      'Each level consumes 9 bits of virtual address translation.',
      'Total VPN bits = Virtual Address (48) - Offset (12) = 36 bits.',
      'Number of levels = 36 / 9 = 4 levels.',
    ],
    simulatorLink: '/sim/paging',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Matches standard x86-64 4-level paging structure (PML4).',
      },
    ],
    tags: ['multilevel-paging', 'page-table-levels'],
  },
  {
    id: 'pg-seg-005',
    topicId: 'paging',
    topicName: 'Paging & Segmentation',
    archetype: 'Segment table translation and trap detection',
    title: 'Segmentation Limit Check & Trap Violation',
    stem: 'In a segmentation system, Segment 2 has base address **4300** and limit **400**.\n\nAn instruction issues logical address `(segment = 2, offset = 500)`. Does this memory access generate a Segmentation Fault (Trap)?',
    type: 'MCQ',
    difficulty: 1,
    options: [
      {
        id: 'opt1',
        text: 'Yes, a Trap (Segmentation Fault) is generated because offset 500 ≥ limit 400.',
        isCorrect: true,
      },
      {
        id: 'opt2',
        text: 'No, access is valid and translates to physical address 4800.',
        isCorrect: false,
        diagnosis: 'Offset 500 exceeds the segment limit of 400. Hardware generates an immediate protection trap before translation!',
      },
      {
        id: 'opt3',
        text: 'No, access is valid because limit only restricts physical address.',
        isCorrect: false,
        diagnosis: 'Limit defines the maximum legal offset within the segment. Any offset ≥ limit is illegal.',
      },
    ],
    answer: 'opt1',
    distractors: [],
    hintLadder: [
      'Method: Segmentation hardware always tests: `offset < limit`.',
      'Here, offset = 500 and limit = 400. Compare 500 < 400.',
      'Condition fails (500 >= 400). The CPU raises a trap (segmentation violation) to the operating system.',
      'Explore in simulator: /sim/paging?view=segmentation',
    ],
    simulatorLink: '/sim/paging?view=segmentation',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic segmentation hardware boundary check.',
      },
    ],
    tags: ['segmentation', 'limit-check', 'trap'],
  },
  {
    id: 'sync-peterson-003',
    topicId: 'sync',
    topicName: 'Critical Section & Concurrency',
    archetype: 'Peterson algorithm requirements analysis',
    title: 'Peterson\'s Mutation: Omitting the Turn Variable',
    stem: 'In Peterson\'s two-process synchronization algorithm, suppose the line `turn = j;` is omitted from both processes, leaving:\n\n```c\nflag[i] = true;\nwhile (flag[j]) ; // spin wait\n// Critical Section\nflag[i] = false;\n```\n\nWhich requirement of the Critical Section Problem is **violated** by this mutation?',
    type: 'MCQ',
    difficulty: 2,
    options: [
      {
        id: 'opt1',
        text: 'Progress (both processes can set flag=true simultaneously and deadlock waiting on each other).',
        isCorrect: true,
      },
      {
        id: 'opt2',
        text: 'Mutual Exclusion (both processes can enter the critical section together).',
        isCorrect: false,
        diagnosis: 'Mutual exclusion is still maintained because neither process can exit the while loop if both flags are true; but they both become stuck, violating Progress!',
      },
      {
        id: 'opt3',
        text: 'Bounded Waiting only.',
        isCorrect: false,
        diagnosis: 'Progress is violated because both threads cannot decide who enters when both want in, causing a deadlock.',
      },
    ],
    answer: 'opt1',
    distractors: [],
    hintLadder: [
      'Method: Trace what happens if Process 0 and Process 1 both execute `flag = true` simultaneously.',
      'P0 sees `flag[1] == true` and spins. P1 sees `flag[0] == true` and spins.',
      'Neither process can enter the Critical Section. No process in remainder is blocking, yet progress cannot occur -> Deadlock (violates Progress)!',
      'Explore in simulator: /sim/sync',
    ],
    simulatorLink: '/sim/sync',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Frequent GATE conceptual synchronization question.',
      },
    ],
    tags: ['peterson', 'progress', 'mutual-exclusion'],
  },
  {
    id: 'rag-reduce-002',
    topicId: 'rag',
    topicName: 'Resource Allocation & Deadlock',
    archetype: 'Multi-instance RAG cycle vs deadlock reduction',
    title: 'Multi-Instance RAG Cycle Reduction',
    stem: 'In a Resource Allocation Graph, a cycle exists between processes P1, P2 and resources R1, R2. However, resource R1 has **2 instances**, and process P3 holds 1 instance of R1 without requesting any other resources.\n\nIs the system deadlocked?',
    type: 'MCQ',
    difficulty: 2,
    options: [
      {
        id: 'opt1',
        text: 'No, because P3 has no outstanding requests, so it can finish and release its unit of R1, allowing the cycle to be fully reduced.',
        isCorrect: true,
      },
      {
        id: 'opt2',
        text: 'Yes, because any cycle in a Resource Allocation Graph guarantees deadlock.',
        isCorrect: false,
        diagnosis: 'A cycle in a RAG is a sufficient condition for deadlock ONLY if resources are single-instance! In multi-instance RAGs, a cycle is necessary but NOT sufficient.',
      },
      {
        id: 'opt3',
        text: 'Yes, because P1 and P2 are blocked.',
        isCorrect: false,
        diagnosis: 'Once P3 finishes, its held resource becomes available to satisfy P1/P2.',
      },
    ],
    answer: 'opt1',
    distractors: [],
    hintLadder: [
      'Method: Run the Graph Reduction algorithm.',
      '1. Process P3 has 0 requests -> P3 reduces and releases its held unit of R1.',
      '2. R1 now has an available unit! This satisfies the pending request in the cycle.',
      '3. All processes reduce to completion -> NO DEADLOCK!',
    ],
    simulatorLink: '/sim/rag',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic GATE trap: Cycle in multi-instance RAG is NOT necessarily a deadlock.',
      },
    ],
    tags: ['rag', 'graph-reduction', 'multi-instance'],
  },
  {
    id: 'vm-eat-002',
    topicId: 'vm',
    topicName: 'Virtual Memory',
    archetype: 'Combined hierarchical EAT calculation',
    title: 'Combined Hierarchical EAT (TLB + Page Table + Disk Fault)',
    stem: 'A virtual memory system has:\n- TLB lookup time = **10 ns**\n- Memory access time = **100 ns**\n- TLB hit ratio = **90%** ($h = 0.90$)\n- Page fault probability on TLB miss = **1%** ($p = 0.01$)\n- Page fault service time = **5 ms** ($5,000,000$ ns)\n\nCalculate the overall combined Effective Access Time (EAT) in **nanoseconds** (rounded to nearest integer).',
    type: 'NAT',
    difficulty: 3,
    answer: 5120,
    tolerance: 5,
    unit: 'ns',
    distractors: [
      {
        value: 120,
        diagnosis: '120 ns only accounts for TLB hits and misses without considering disk page fault latency (5 ms)!',
      },
      {
        value: 50120,
        diagnosis: 'Check your weighted probabilities: TLB miss is 10%, and page fault is 1% of that (0.10 × 0.01 = 0.001 overall fault probability).',
      },
      {
        value: 210,
        diagnosis: '210 ns is only the TLB miss time with no page fault.',
      },
    ],
    hintLadder: [
      'Method: Partition into three disjoint paths: TLB Hit, TLB Miss (no fault), and TLB Miss (with fault).',
      'Hit path (90%): 10 + 100 = 110 ns. Miss no-fault (9.9%): 10 + 100 + 100 = 210 ns. Fault (0.1%): 10 + 100 + 5,000,000 + 100 = 5,000,210 ns.',
      'Combined EAT = 0.90(110) + 0.099(210) + 0.001(5,000,210) = 99 + 20.79 + 5,000.21 ≈ 5,120 ns.',
      'Explore in simulator: /sim/virtual-memory',
    ],
    simulatorLink: '/sim/virtual-memory',
    pyq: [
      {
        exam: 'GATE CS',
        year: null,
        verified: false,
        notes: 'Classic Section 6.6 Worked Numerical 1 combined hierarchical access drill.',
      },
    ],
    tags: ['combined-eat', 'tlb-miss', 'page-fault-penalty'],
  },
];

// Diagnose a learner's answer
export function diagnoseAnswer(question: Question, rawInput: string): AnswerDiagnosisResult {
  const cleanInput = rawInput.trim();

  if (question.type === 'SEQUENCE') {
    // Sequence answer check
    const items = cleanInput.split(/[,>\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
    const params = question.params;

    if (params && params.processes && params.allocation && params.max) {
      const validation = validateLearnerSafeSequence(params as any, items);
      if (validation.valid) {
        return {
          isCorrect: true,
          score: 1,
          submittedAnswer: items.join(', '),
          correctAnswerFormatted: Array.isArray(question.answer) ? question.answer.join(', ') : String(question.answer),
          diagnosisText: 'Safe sequence validated by live simulation! All processes run to completion safely.',
          suggestedSimLink: question.simulatorLink,
        };
      } else {
        return {
          isCorrect: false,
          score: 0,
          submittedAnswer: items.join(', '),
          correctAnswerFormatted: Array.isArray(question.answer) ? question.answer.join(', ') : String(question.answer),
          diagnosisText: validation.reason || 'This sequence causes a deadlock or exceeds available work.',
          diffSummary: `Step ${validation.failedStepIndex !== undefined ? validation.failedStepIndex + 1 : '?'}: Process ${validation.failedProcess || ''} failed check Need ≤ Work.`,
          suggestedSimLink: question.simulatorLink,
        };
      }
    }
  }

  if (question.type === 'NAT') {
    // Parse numeric input (handles hex like 0x5A5C or decimal 15 or 120)
    let userVal: number;
    if (cleanInput.toLowerCase().startsWith('0x')) {
      userVal = parseInt(cleanInput, 16);
    } else {
      userVal = parseFloat(cleanInput);
    }

    const expectedVal = typeof question.answer === 'number' ? question.answer : parseFloat(String(question.answer));
    const tolerance = question.tolerance ?? 0;
    const isCorrect = Math.abs(userVal - expectedVal) <= tolerance;

    if (isCorrect) {
      return {
        isCorrect: true,
        score: 1,
        submittedAnswer: cleanInput,
        correctAnswerFormatted: String(expectedVal),
        diagnosisText: 'Correct! Your numerical calculation matches the authoritative simulator trace.',
        suggestedSimLink: question.simulatorLink,
      };
    }

    // Check distractors for known misconceptions
    for (const distractor of question.distractors) {
      const distVal = typeof distractor.value === 'number' ? distractor.value : parseFloat(String(distractor.value));
      if (Math.abs(userVal - distVal) <= tolerance) {
        return {
          isCorrect: false,
          score: 0,
          submittedAnswer: cleanInput,
          correctAnswerFormatted: String(expectedVal),
          diagnosisText: distractor.diagnosis,
          diffSummary: `Misconception detected: Your calculation matches a known trap (got ${cleanInput}, expected ${expectedVal}).`,
          suggestedSimLink: question.simulatorLink,
        };
      }
    }

    // Generic diff diagnosis
    return {
      isCorrect: false,
      score: 0,
      submittedAnswer: cleanInput,
      correctAnswerFormatted: String(expectedVal),
      diagnosisText: `Your answer (${cleanInput}) does not match the correct value (${expectedVal}). Verify intermediate steps against the animated worked example.`,
      diffSummary: `Difference: ${userVal > expectedVal ? `+${(userVal - expectedVal).toFixed(2)}` : (userVal - expectedVal).toFixed(2)} from correct answer.`,
      suggestedSimLink: question.simulatorLink,
    };
  }

  if (question.type === 'MCQ') {
    const isCorrect = cleanInput === question.answer;
    const selectedOption = question.options?.find((o) => o.id === cleanInput);
    const correctOption = question.options?.find((o) => o.id === question.answer);

    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      submittedAnswer: selectedOption?.text || cleanInput,
      correctAnswerFormatted: correctOption?.text || String(question.answer),
      diagnosisText: isCorrect
        ? 'Correct choice!'
        : selectedOption?.diagnosis || 'Incorrect option selected. Re-read the Coffman and safety conditions.',
      suggestedSimLink: question.simulatorLink,
    };
  }

  return {
    isCorrect: false,
    score: 0,
    submittedAnswer: cleanInput,
    correctAnswerFormatted: String(question.answer),
    suggestedSimLink: question.simulatorLink,
  };
}
