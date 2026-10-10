import { describe, it, expect } from 'vitest';
import { simulatePageReplacement, evaluateBeladyAnomaly, computeEATPageFaults, computeMaxFaultRateForEAT } from '../core/replacement/replacement';
import { simulateBankerSafety, evaluateResourceRequest, validateLearnerSafeSequence, computeNeedMatrix } from '../core/banker/banker';
import { computeDeadlockFreeThreshold, simulateRAGReduction, detectCycles } from '../core/rag/rag';
import { simulateSemaphore, verifyRaceMinMax, simulatePeterson } from '../core/sync/sync';
import { translatePagingAddress, computeMultilevelStructure, computeTLBEAT, translateSegmentAddress } from '../core/paging/paging';
import { computeCombinedEAT, computeInvertedPageTableEntries } from '../core/vm/vm';

describe('GATE OS Visual Tutor: Section 11 Golden Traces', () => {
  // 1. Page Replacement Golden Traces
  describe('Page Replacement', () => {
    const string20 = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];

    it('FIFO on 20-ref string with 3 frames yields exactly 15 faults', () => {
      const steps = simulatePageReplacement({ refString: string20, frameCount: 3, algorithm: 'fifo' });
      const last = steps[steps.length - 1];
      expect(last.state.faultCount).toBe(15);
      expect(last.state.hitCount).toBe(5);
    });

    it('LRU on 20-ref string with 3 frames yields exactly 12 faults', () => {
      const steps = simulatePageReplacement({ refString: string20, frameCount: 3, algorithm: 'lru' });
      const last = steps[steps.length - 1];
      expect(last.state.faultCount).toBe(12);
      expect(last.state.hitCount).toBe(8);
    });

    it('OPT on 20-ref string with 3 frames yields exactly 9 faults', () => {
      const steps = simulatePageReplacement({ refString: string20, frameCount: 3, algorithm: 'opt' });
      const last = steps[steps.length - 1];
      expect(last.state.faultCount).toBe(9);
      expect(last.state.hitCount).toBe(11);
    });

    it('Beladys anomaly: 3 frames (9 faults) -> 4 frames (10 faults) on string [1,2,3,4,1,2,5,1,2,3,4,5]', () => {
      const beladyString = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
      const fifo3 = simulatePageReplacement({ refString: beladyString, frameCount: 3, algorithm: 'fifo' });
      const fifo4 = simulatePageReplacement({ refString: beladyString, frameCount: 4, algorithm: 'fifo' });

      expect(fifo3[fifo3.length - 1].state.faultCount).toBe(9);
      expect(fifo4[fifo4.length - 1].state.faultCount).toBe(10);

      const evaluation = evaluateBeladyAnomaly(beladyString, 1, 6);
      expect(evaluation.hasAnomaly).toBe(true);
    });

    it('Cyclic LRU [1,2,3,4 x 3] with 3 frames causes 12 faults (100% fault rate)', () => {
      const cyclicString = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
      const lruSteps = simulatePageReplacement({ refString: cyclicString, frameCount: 3, algorithm: 'lru' });
      expect(lruSteps[lruSteps.length - 1].state.faultCount).toBe(12);
    });

    it('EAT with page faults: max p for <= 10% slowdown with 200ns and 8ms', () => {
      const maxP = computeMaxFaultRateForEAT({
        memoryAccessNs: 200,
        faultServiceNs: 8000000,
        maxTargetEatNs: 220,
      });
      // 20 / 7,999,800 ≈ 2.5000625e-6
      expect(maxP).toBeCloseTo(2.5e-6, 8);
    });

    it('Dirty pages: 60% clean (8ms), 40% dirty (20ms), p=0.001, m=200ns yields EAT ≈ 13 µs', () => {
      const result = computeEATPageFaults({
        memoryAccessNs: 200,
        faultServiceNs: 8000000,
        dirtyServiceNs: 20000000,
        dirtyFraction: 0.40,
        faultRate: 0.001,
      });
      // 12999.8 ns ≈ 13000 ns = 13 µs
      expect(result.eatNs).toBeCloseTo(12999.8, 1);
    });
  });

  // 2. Banker's Algorithm Golden Traces
  describe('Bankers Algorithm', () => {
    const textbookBanker = {
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
    };

    it('computes correct Need matrix', () => {
      const need = computeNeedMatrix(textbookBanker.max, textbookBanker.allocation);
      expect(need).toEqual([
        [7, 4, 3],
        [1, 2, 2],
        [6, 0, 0],
        [0, 1, 1],
        [4, 3, 1],
      ]);
    });

    it('finds safe sequence and final work matches Total resources', () => {
      const steps = simulateBankerSafety(textbookBanker);
      const last = steps[steps.length - 1];
      expect(last.state.isSafe).toBe(true);
      expect(validateLearnerSafeSequence(textbookBanker, last.state.safeSequence).valid).toBe(true);
      expect(last.state.safeSequence.length).toBe(5);
      expect(last.state.work).toEqual([10, 5, 7]);
    });

    it('accepts alternative valid sequence <P3, P1, P4, P0, P2> (FLAG-7 simulation validation)', () => {
      const check1 = validateLearnerSafeSequence(textbookBanker, ['P1', 'P3', 'P4', 'P0', 'P2']);
      expect(check1.valid).toBe(true);

      const check2 = validateLearnerSafeSequence(textbookBanker, ['P3', 'P1', 'P4', 'P0', 'P2']);
      expect(check2.valid).toBe(true);

      const invalidCheck = validateLearnerSafeSequence(textbookBanker, ['P0', 'P1', 'P2', 'P3', 'P4']);
      expect(invalidCheck.valid).toBe(false);
      expect(invalidCheck.reason).toContain('cannot run');
    });

    it('Request P1(1,0,2) is granted and maintains safety', () => {
      const reqResult = evaluateResourceRequest(textbookBanker, {
        procIndex: 1,
        request: [1, 0, 2],
      });
      expect(reqResult.step1NeedCheck).toBe(true);
      expect(reqResult.step2AvailableCheck).toBe(true);
      expect(reqResult.step3SafetyCheck).toBe(true);
      expect(reqResult.granted).toBe(true);
    });
  });

  // 3. Resource Allocation Graph & Deadlock
  describe('Resource Allocation & Deadlock', () => {
    it('pigeonhole minimum resources for n=3, m=4 is exactly R = 10', () => {
      const result = computeDeadlockFreeThreshold(3, 4);
      expect(result.minGuaranteed).toBe(10);
      expect(result.worstCaseStall).toBe(9);
      expect(result.isDeadlockFree(10)).toBe(true);
      expect(result.isDeadlockFree(9)).toBe(false);
    });

    it('detects single-instance cycle as deadlock', () => {
      const graph = {
        processes: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }],
        resources: [{ id: 'r1', name: 'R1', instances: 1 }, { id: 'r2', name: 'R2', instances: 1 }],
        edges: [
          { id: 'e1', from: 'p1', to: 'r1', type: 'request' as const },
          { id: 'e2', from: 'r1', to: 'p2', type: 'assignment' as const },
          { id: 'e3', from: 'p2', to: 'r2', type: 'request' as const },
          { id: 'e4', from: 'r2', to: 'p1', type: 'assignment' as const },
        ],
      };
      const cycleCheck = detectCycles(graph);
      expect(cycleCheck.hasCycle).toBe(true);

      const redSteps = simulateRAGReduction(graph);
      expect(redSteps[redSteps.length - 1].state.isDeadlocked).toBe(true);
    });
  });

  // 4. Critical Section & Concurrency
  describe('Concurrency & Synchronization', () => {
    it('Semaphore counting: S_init=10, 20 P operations, 15 V operations -> final value 5', () => {
      const ops: { op: 'P' | 'V'; proc: string }[] = [];
      for (let i = 0; i < 20; i++) ops.push({ op: 'P', proc: `P${i}` });
      for (let i = 0; i < 15; i++) ops.push({ op: 'V', proc: `P${i}` });
      const sem = simulateSemaphore(10, ops);
      expect(sem.currentValue).toBe(5);
    });

    it('Race search for 2 threads incrementing 5 times yields max=10 and min=2', () => {
      const { min, max } = verifyRaceMinMax(5);
      expect(max).toBe(10);
      expect(min).toBe(2);
    });

    it('Petersons mutation without turn violates mutual exclusion', () => {
      const normal = simulatePeterson({ mutateRemoveTurn: false });
      const mutated = simulatePeterson({ mutateRemoveTurn: true });

      expect(normal.steps.some((s) => s.mutualExclusionViolated)).toBe(false);
      expect(mutated.steps.some((s) => s.mutualExclusionViolated)).toBe(true);
    });
  });

  // 5. Paging & Segmentation
  describe('Paging & Segmentation', () => {
    it('translates 0x2A5C with 4KB pages to page 2, offset 0xA5C, and frame 5 gives PA 0x5A5C', () => {
      const res = translatePagingAddress(0x2a5c, {
        logicalBits: 16,
        pageSizeBytes: 4096,
        physicalBits: 16,
        pteSizeBytes: 4,
      }, { 2: 5 });

      expect(res.pageNumber).toBe(2);
      expect(res.offset).toBe(0xa5c);
      expect(res.physicalAddress).toBe(0x5a5c);
      expect(res.hexPhysical).toBe('0x5A5C');
    });

    it('calculates 32-bit VA, 4KB page, 4B PTE single-level table size as 4 MB', () => {
      const res = translatePagingAddress(0, {
        logicalBits: 32,
        pageSizeBytes: 4096,
        physicalBits: 32,
        pteSizeBytes: 4,
      }, {});
      expect(res.pageTableSizeBytes).toBe(4 * 1024 * 1024); // 4 MB
    });

    it('48-bit VA, 4KB page, 8B PTE gives 4-level table hierarchy', () => {
      const res = computeMultilevelStructure(48, 4096, 8);
      expect(res.levels).toBe(4);
      expect(res.bitsPerLevel).toBe(9);
      expect(res.vpnBits).toBe(36);
    });

    it('computes TLB EAT with ADD_TLB_ON_MISS: 90% hit, 10ns TLB, 100ns RAM -> 120 ns', () => {
      const eat = computeTLBEAT({
        tlbHitRatio: 0.9,
        tlbLookupNs: 10,
        memoryAccessNs: 100,
        pageTableLevels: 1,
        convention: 'ADD_TLB_ON_MISS',
      });
      expect(eat.eatNs).toBe(120);
    });

    it('Segmentation traps on offset >= limit', () => {
      const table = [{ segNumber: 2, base: 4300, limit: 400 }];
      const valid = translateSegmentAddress(2, 53, table);
      expect(valid.isTrap).toBe(false);
      expect(valid.physicalAddress).toBe(4353);

      const trap = translateSegmentAddress(2, 500, table);
      expect(trap.isTrap).toBe(true);
      expect(trap.physicalAddress).toBeNull();
    });
  });

  // 6. Virtual Memory Golden Traces
  describe('Virtual Memory', () => {
    it('Combined EAT with TLB hit 90%, miss no fault 9.9%, fault 0.1% (5ms) -> 5,120 ns', () => {
      const res = computeCombinedEAT({
        tlbLookupNs: 10,
        memoryAccessNs: 100,
        tlbHitRate: 0.9,
        faultRateOnMiss: 0.01,
        faultServiceNs: 5000000,
      });
      expect(Math.round(res.eatNs)).toBe(5120);
    });

    it('Inverted page table: 1 GB RAM, 4 KB page -> 2^18 entries', () => {
      const entries = computeInvertedPageTableEntries(1024 * 1024 * 1024, 4096);
      expect(entries).toBe(Math.pow(2, 18));
    });
  });

  // 7. Section 11 Property Tests
  describe('Property Tests (Section 11)', () => {
    const string20 = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];

    it('OPT is lower-bound: OPT <= FIFO and OPT <= LRU across all frame counts', () => {
      for (let frames = 1; frames <= 6; frames++) {
        const fifo = simulatePageReplacement({ refString: string20, frameCount: frames, algorithm: 'fifo' });
        const lru = simulatePageReplacement({ refString: string20, frameCount: frames, algorithm: 'lru' });
        const opt = simulatePageReplacement({ refString: string20, frameCount: frames, algorithm: 'opt' });

        const fFaults = fifo[fifo.length - 1].state.faultCount;
        const lFaults = lru[lru.length - 1].state.faultCount;
        const oFaults = opt[opt.length - 1].state.faultCount;

        expect(oFaults).toBeLessThanOrEqual(fFaults);
        expect(oFaults).toBeLessThanOrEqual(lFaults);
      }
    });

    it('Stack property: LRU and OPT faults are monotonically non-increasing in frame count', () => {
      let prevLru = Infinity;
      let prevOpt = Infinity;

      for (let frames = 1; frames <= 7; frames++) {
        const lru = simulatePageReplacement({ refString: string20, frameCount: frames, algorithm: 'lru' });
        const opt = simulatePageReplacement({ refString: string20, frameCount: frames, algorithm: 'opt' });

        const lFaults = lru[lru.length - 1].state.faultCount;
        const oFaults = opt[opt.length - 1].state.faultCount;

        expect(lFaults).toBeLessThanOrEqual(prevLru);
        expect(oFaults).toBeLessThanOrEqual(prevOpt);

        prevLru = lFaults;
        prevOpt = oFaults;
      }
    });
  });
});
