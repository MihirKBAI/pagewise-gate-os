import { PagingConfig, AddressSplitResult, SegmentationEntry, SegmentationLookupResult, TLBEATParams, TLBEATResult } from './types';

// Convert integer to zero-padded binary string
export function toBinaryString(val: number, bits: number): string {
  return (val >>> 0).toString(2).padStart(bits, '0');
}

// Convert integer to hex string with 0x prefix
export function toHexString(val: number, bits: number): string {
  const hexDigits = Math.ceil(bits / 4);
  return '0x' + (val >>> 0).toString(16).toUpperCase().padStart(hexDigits, '0');
}

export function translatePagingAddress(
  logicalAddress: number,
  config: PagingConfig,
  pageTable: Record<number, number | null> // page -> frame (or null if not present)
): AddressSplitResult {
  const { logicalBits, pageSizeBytes, physicalBits, pteSizeBytes } = config;
  const offsetBits = Math.round(Math.log2(pageSizeBytes));
  const pageNumberBits = logicalBits - offsetBits;
  const frameBits = physicalBits - offsetBits;

  const offsetMask = (1 << offsetBits) - 1;
  const offset = logicalAddress & offsetMask;
  const pageNumber = logicalAddress >>> offsetBits;

  const frameNumber = pageTable[pageNumber] ?? null;
  const isValid = frameNumber !== null;

  let physicalAddress: number | null = null;
  let hexPhysical: string | null = null;
  let binaryPhysical: string | null = null;

  if (isValid) {
    physicalAddress = (frameNumber << offsetBits) | offset;
    hexPhysical = toHexString(physicalAddress, physicalBits);
    binaryPhysical = toBinaryString(physicalAddress, physicalBits);
  }

  const pageTableEntries = Math.pow(2, pageNumberBits);
  const pageTableSizeBytes = pageTableEntries * pteSizeBytes;

  return {
    logicalAddress,
    hexLogical: toHexString(logicalAddress, logicalBits),
    binaryLogical: toBinaryString(logicalAddress, logicalBits),
    pageNumberBits,
    offsetBits,
    frameBits,
    pageNumber,
    offset,
    frameNumber,
    isValid,
    physicalAddress,
    hexPhysical,
    binaryPhysical,
    pageTableEntries,
    pageTableSizeBytes,
  };
}

// Compute multi-level page table hierarchy
export function computeMultilevelStructure(
  vaBits: number,
  pageSizeBytes: number,
  pteSizeBytes: number
) {
  const offsetBits = Math.round(Math.log2(pageSizeBytes));
  const vpnBits = vaBits - offsetBits;
  const entriesPerTable = pageSizeBytes / pteSizeBytes;
  const bitsPerLevel = Math.round(Math.log2(entriesPerTable));
  const levels = Math.ceil(vpnBits / bitsPerLevel);

  const levelBitSplits: number[] = [];
  let remainingBits = vpnBits;
  for (let i = 0; i < levels; i++) {
    const bits = Math.min(bitsPerLevel, remainingBits);
    levelBitSplits.push(bits);
    remainingBits -= bits;
  }

  return {
    vaBits,
    offsetBits,
    vpnBits,
    pteSizeBytes,
    pageSizeBytes,
    entriesPerTable,
    bitsPerLevel,
    levels,
    levelBitSplits,
  };
}

// Segmentation translation
export function translateSegmentAddress(
  segNumber: number,
  offset: number,
  table: SegmentationEntry[]
): SegmentationLookupResult {
  const entry = table.find((e) => e.segNumber === segNumber);

  if (!entry) {
    return {
      segment: segNumber,
      offset,
      limit: 0,
      base: 0,
      isTrap: true,
      physicalAddress: null,
      reason: `TRAP! Segment #${segNumber} does not exist in segment table.`,
    };
  }

  // Strict check: offset < limit. If offset >= limit, TRAP!
  if (offset >= entry.limit) {
    return {
      segment: segNumber,
      offset,
      limit: entry.limit,
      base: entry.base,
      isTrap: true,
      physicalAddress: null,
      reason: `TRAP (Segmentation Fault)! Offset (${offset}) ≥ Limit (${entry.limit}). Illegal memory access.`,
    };
  }

  const physicalAddress = entry.base + offset;
  return {
    segment: segNumber,
    offset,
    limit: entry.limit,
    base: entry.base,
    isTrap: false,
    physicalAddress,
    reason: `Valid access: Offset (${offset}) < Limit (${entry.limit}) ✓. PA = Base (${entry.base}) + Offset (${offset}) = ${physicalAddress}.`,
  };
}

// TLB Effective Access Time with FLAG-8 convention toggle
export function computeTLBEAT(params: TLBEATParams): TLBEATResult {
  const { tlbHitRatio: h, tlbLookupNs: t, memoryAccessNs: m, pageTableLevels: k, convention } = params;

  let hitPathNs = 0;
  let missPathNs = 0;
  let formula = '';

  if (convention === 'ADD_TLB_ON_MISS') {
    // Sequential lookup: check TLB first.
    // On hit: TLB lookup (t) + Memory access (m)
    // On miss: TLB lookup (t) + k memory accesses for page tables + 1 memory access for data
    hitPathNs = t + m;
    missPathNs = t + k * m + m;
    formula = `EAT = h·(t + m) + (1 - h)·(t + ${k}·m + m)`;
  } else {
    // Parallel lookup: TLB lookup and page table lookup happen simultaneously
    // On hit: max(t, m) or simply t + m
    hitPathNs = t + m;
    missPathNs = k * m + m;
    formula = `EAT = h·(t + m) + (1 - h)·(${k}·m + m)`;
  }

  const hitContributionNs = h * hitPathNs;
  const missContributionNs = (1 - h) * missPathNs;
  const eatNs = hitContributionNs + missContributionNs;

  return {
    eatNs,
    hitPathNs,
    missPathNs,
    hitContributionNs,
    missContributionNs,
    formula,
  };
}
