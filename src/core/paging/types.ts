export interface PagingConfig {
  logicalBits: number;       // e.g. 16 or 32
  pageSizeBytes: number;     // e.g. 4096 (4 KB)
  physicalBits: number;      // e.g. 15 (32 KB) or 24
  pteSizeBytes: number;      // e.g. 4 or 8
}

export interface AddressSplitResult {
  logicalAddress: number;
  hexLogical: string;
  binaryLogical: string;
  pageNumberBits: number;
  offsetBits: number;
  frameBits: number;
  pageNumber: number;
  offset: number;
  frameNumber: number | null;
  isValid: boolean;
  physicalAddress: number | null;
  hexPhysical: string | null;
  binaryPhysical: string | null;
  pageTableEntries: number;
  pageTableSizeBytes: number;
}

export interface SegmentationEntry {
  segNumber: number;
  base: number;
  limit: number;
}

export interface SegmentationLookupResult {
  segment: number;
  offset: number;
  limit: number;
  base: number;
  isTrap: boolean;
  physicalAddress: number | null;
  reason: string;
}

export type TLBConvention = 'ADD_TLB_ON_MISS' | 'PARALLEL_LOOKUP';

export interface TLBEATParams {
  tlbHitRatio: number;      // h (0.0 to 1.0)
  tlbLookupNs: number;      // t
  memoryAccessNs: number;   // m
  pageTableLevels: number;  // 1, 2, 3, 4
  convention: TLBConvention;
}

export interface TLBEATResult {
  eatNs: number;
  hitPathNs: number;
  missPathNs: number;
  hitContributionNs: number;
  missContributionNs: number;
  formula: string;
}
