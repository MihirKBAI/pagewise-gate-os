import { Step, Highlight } from '../types';
import { PageReplacementParams, PageReplacementState, FrameHistoryEntry } from './types';

export function simulatePageReplacement(params: PageReplacementParams): Step<PageReplacementState>[] {
  const { refString, frameCount, algorithm } = params;
  const steps: Step<PageReplacementState>[] = [];

  let frames: (number | null)[] = Array(frameCount).fill(null);
  let queueOrder: number[] = []; // for FIFO (oldest at [0])
  let recencyStack: number[] = []; // for LRU (oldest at [0], most recent at end)
  let clockBits: number[] = Array(frameCount).fill(0);
  let clockPointer = 0;
  let faultCount = 0;
  let hitCount = 0;
  const history: FrameHistoryEntry[] = [];

  // Helper to compute next uses for OPT
  const computeNextUses = (currentIndex: number, currentFrames: (number | null)[]): Record<number, number | null> => {
    const nextUses: Record<number, number | null> = {};
    for (const page of currentFrames) {
      if (page === null) continue;
      let nextIdx: number | null = null;
      for (let j = currentIndex + 1; j < refString.length; j++) {
        if (refString[j] === page) {
          nextIdx = j;
          break;
        }
      }
      nextUses[page] = nextIdx;
    }
    return nextUses;
  };

  // Initial step 0: initial blank state
  steps.push({
    index: 0,
    state: {
      refIndex: -1,
      currentPage: -1,
      frames: [...frames],
      isHit: false,
      faultCount: 0,
      hitCount: 0,
      victimPage: null,
      victimFrame: null,
      reason: 'Initial state: frames empty',
      queueOrder: [],
      recencyStack: [],
      nextUses: {},
      clockBits: [...clockBits],
      clockPointer: 0,
      history: [],
    },
    caption: `Starting simulation with ${frameCount} frames under ${algorithm.toUpperCase()}. Reference string length: ${refString.length}.`,
    highlights: [],
    event: 'init',
  });

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    const frameIndex = frames.indexOf(page);
    const isHit = frameIndex !== -1;
    let victimPage: number | null = null;
    let victimFrame: number | null = null;
    let reason = '';
    const highlights: Highlight[] = [];

    if (isHit) {
      hitCount++;
      highlights.push({
        target: `frame-${frameIndex}`,
        type: 'hit',
        label: 'HIT',
      });

      if (algorithm === 'lru') {
        recencyStack = recencyStack.filter((p) => p !== page);
        recencyStack.push(page);
        reason = `Page ${page} is already in frame ${frameIndex} → HIT. Moved to Most Recently Used (MRU).`;
      } else if (algorithm === 'clock') {
        clockBits[frameIndex] = 1;
        reason = `Page ${page} is in frame ${frameIndex} → HIT. Set reference bit to 1.`;
      } else {
        // FIFO does not modify queue on hit
        reason = `Page ${page} is already in frame ${frameIndex} → HIT. Queue order unchanged.`;
      }
    } else {
      faultCount++;
      const emptyFrameIdx = frames.indexOf(null);

      if (emptyFrameIdx !== -1) {
        // Cold miss / initial fill
        frames[emptyFrameIdx] = page;
        highlights.push({
          target: `frame-${emptyFrameIdx}`,
          type: 'fault',
          label: 'COLD MISS',
        });

        if (algorithm === 'fifo') {
          queueOrder.push(page);
        } else if (algorithm === 'lru') {
          recencyStack.push(page);
        } else if (algorithm === 'clock') {
          clockBits[emptyFrameIdx] = 1;
        }

        reason = `Page ${page} not resident → PAGE FAULT (Cold miss). Loaded into empty frame ${emptyFrameIdx}.`;
      } else {
        // Need to evict a page
        if (algorithm === 'fifo') {
          victimPage = queueOrder.shift()!;
          victimFrame = frames.indexOf(victimPage);
          frames[victimFrame] = page;
          queueOrder.push(page);
          reason = `Page ${page} not resident → PAGE FAULT. FIFO evicts oldest resident page (${victimPage}) from frame ${victimFrame}.`;
        } else if (algorithm === 'lru') {
          victimPage = recencyStack.shift()!;
          victimFrame = frames.indexOf(victimPage);
          frames[victimFrame] = page;
          recencyStack.push(page);
          reason = `Page ${page} not resident → PAGE FAULT. LRU evicts least-recently used page (${victimPage}) from frame ${victimFrame}.`;
        } else if (algorithm === 'opt') {
          // Look ahead in refString
          let farthestDist = -1;
          let bestVictim = frames[0]!;
          let candidateVictimsNeverUsed: number[] = [];

          for (const candidate of frames) {
            if (candidate === null) continue;
            let nextPos = -1;
            for (let k = i + 1; k < refString.length; k++) {
              if (refString[k] === candidate) {
                nextPos = k;
                break;
              }
            }
            if (nextPos === -1) {
              candidateVictimsNeverUsed.push(candidate);
            } else if (nextPos > farthestDist) {
              farthestDist = nextPos;
              bestVictim = candidate;
            }
          }

          if (candidateVictimsNeverUsed.length > 0) {
            // Tie-break: FIFO among ties (earliest loaded or first encountered in frame order)
            victimPage = candidateVictimsNeverUsed[0];
            victimFrame = frames.indexOf(victimPage);
            reason = `Page ${page} not resident → PAGE FAULT. OPT evicts page ${victimPage} (never referenced again in future).`;
          } else {
            victimPage = bestVictim;
            victimFrame = frames.indexOf(victimPage);
            reason = `Page ${page} not resident → PAGE FAULT. OPT evicts page ${victimPage} (next used farthest at ref #${farthestDist + 1}).`;
          }

          frames[victimFrame] = page;
        } else if (algorithm === 'clock') {
          // Second-chance clock replacement
          while (true) {
            if (clockBits[clockPointer] === 0) {
              victimFrame = clockPointer;
              victimPage = frames[victimFrame];
              frames[victimFrame] = page;
              clockBits[victimFrame] = 1;
              clockPointer = (clockPointer + 1) % frameCount;
              break;
            } else {
              clockBits[clockPointer] = 0;
              clockPointer = (clockPointer + 1) % frameCount;
            }
          }
          reason = `Page ${page} not resident → PAGE FAULT. Clock found ref-bit 0 at frame ${victimFrame}, evicted page ${victimPage}.`;
        }

        highlights.push({
          target: `frame-${victimFrame}`,
          type: 'evicted',
          label: `EVICT ${victimPage}`,
        });
      }
    }

    history.push({
      refIndex: i,
      page,
      frames: [...frames],
      isHit,
      victim: victimPage,
    });

    const nextUses = computeNextUses(i, frames);

    steps.push({
      index: i + 1,
      state: {
        refIndex: i,
        currentPage: page,
        frames: [...frames],
        isHit,
        faultCount,
        hitCount,
        victimPage,
        victimFrame,
        reason,
        queueOrder: [...queueOrder],
        recencyStack: [...recencyStack],
        nextUses,
        clockBits: [...clockBits],
        clockPointer,
        history: JSON.parse(JSON.stringify(history)),
      },
      caption: reason,
      formula: `Faults so far = ${faultCount} / ${i + 1} (${((faultCount / (i + 1)) * 100).toFixed(1)}% fault rate)`,
      highlights,
      event: isHit ? 'hit' : 'fault',
    });
  }

  return steps;
}

// Belady's anomaly evaluator
export function evaluateBeladyAnomaly(refString: number[], minFrames = 1, maxFrames = 8) {
  const curve: { frames: number; fifoFaults: number; lruFaults: number; optFaults: number }[] = [];
  for (let f = minFrames; f <= maxFrames; f++) {
    const fifoSteps = simulatePageReplacement({ refString, frameCount: f, algorithm: 'fifo' });
    const lruSteps = simulatePageReplacement({ refString, frameCount: f, algorithm: 'lru' });
    const optSteps = simulatePageReplacement({ refString, frameCount: f, algorithm: 'opt' });

    curve.push({
      frames: f,
      fifoFaults: fifoSteps[fifoSteps.length - 1].state.faultCount,
      lruFaults: lruSteps[lruSteps.length - 1].state.faultCount,
      optFaults: optSteps[optSteps.length - 1].state.faultCount,
    });
  }

  let hasAnomaly = false;
  let anomalyPair: { f1: number; f2: number; count1: number; count2: number } | null = null;
  for (let i = 0; i < curve.length - 1; i++) {
    if (curve[i + 1].fifoFaults > curve[i].fifoFaults) {
      hasAnomaly = true;
      anomalyPair = {
        f1: curve[i].frames,
        f2: curve[i + 1].frames,
        count1: curve[i].fifoFaults,
        count2: curve[i + 1].fifoFaults,
      };
      break;
    }
  }

  return { curve, hasAnomaly, anomalyPair };
}

// Effective Access Time with Page Faults
export function computeEATPageFaults(options: {
  memoryAccessNs: number;
  faultServiceNs: number;
  faultRate: number; // p
  dirtyFraction?: number;
  dirtyServiceNs?: number;
}) {
  const { memoryAccessNs, faultServiceNs, faultRate, dirtyFraction = 0, dirtyServiceNs = faultServiceNs } = options;
  const effectiveServiceNs = (1 - dirtyFraction) * faultServiceNs + dirtyFraction * dirtyServiceNs;
  const eatNs = (1 - faultRate) * memoryAccessNs + faultRate * effectiveServiceNs;
  return {
    eatNs,
    effectiveServiceNs,
    slowdownFactor: eatNs / memoryAccessNs,
    faultSharePercent: (faultRate * effectiveServiceNs / eatNs) * 100,
  };
}

export function computeMaxFaultRateForEAT(options: {
  memoryAccessNs: number;
  faultServiceNs: number;
  maxTargetEatNs: number;
}) {
  const { memoryAccessNs, faultServiceNs, maxTargetEatNs } = options;
  // EAT = (1-p)*m + p*S = m + p*(S-m) <= maxTargetEatNs
  // p <= (maxTargetEatNs - m) / (S - m)
  if (faultServiceNs <= memoryAccessNs) return 0;
  return (maxTargetEatNs - memoryAccessNs) / (faultServiceNs - memoryAccessNs);
}
