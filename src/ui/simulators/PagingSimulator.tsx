import React, { useState, useMemo } from 'react';
import {
  translatePagingAddress,
  computeMultilevelStructure,
  translateSegmentAddress,
  computeTLBEAT,
} from '../../core/paging/paging';
import { PagingConfig, SegmentationEntry } from '../../core/paging/types';
import { BitField } from '../components/BitField';
import { Layers, Cpu, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Sliders, PieChart } from 'lucide-react';

const DEFAULT_SEGMENT_TABLE: SegmentationEntry[] = [
  { segNumber: 0, base: 1400, limit: 1000 },
  { segNumber: 1, base: 6300, limit: 400 },
  { segNumber: 2, base: 4300, limit: 400 },
  { segNumber: 3, base: 3200, limit: 1100 },
  { segNumber: 4, base: 4700, limit: 1000 },
];

export const PagingSimulator: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'translate' | 'multilevel' | 'segmentation' | 'tlb'>('translate');

  // Sub-tab 1: Address Translation & Splitter
  const [logicalBits, setLogicalBits] = useState<number>(16);
  const [physicalBits, setPhysicalBits] = useState<number>(15);
  const [offsetBits, setOffsetBits] = useState<number>(12); // 12-bit offset = 4096 B (4 KB)
  const [logicalInputHex, setLogicalInputHex] = useState<string>('0x2A5C');
  const [testProcessSizeKb, setTestProcessSizeKb] = useState<number>(17); // 17 KB test process
  const [pageTableMapping] = useState<Record<number, number | null>>({
    0: 3,
    1: 7,
    2: 5, // 0x2A5C maps to page 2 -> frame 5
    3: null, // invalid
  });

  const pageSizeBytes = useMemo(() => Math.pow(2, offsetBits), [offsetBits]);

  const parsedLogicalAddress = useMemo(() => {
    try {
      const clean = logicalInputHex.trim();
      if (clean.toLowerCase().startsWith('0x')) return parseInt(clean, 16);
      return parseInt(clean, 10);
    } catch {
      return 0;
    }
  }, [logicalInputHex]);

  const pagingConfig: PagingConfig = useMemo(
    () => ({
      logicalBits,
      physicalBits,
      pageSizeBytes,
      pteSizeBytes: 4,
    }),
    [logicalBits, physicalBits, pageSizeBytes]
  );

  const translationResult = useMemo(() => {
    if (isNaN(parsedLogicalAddress)) return null;
    return translatePagingAddress(parsedLogicalAddress, pagingConfig, pageTableMapping);
  }, [parsedLogicalAddress, pagingConfig, pageTableMapping]);

  // Fragmentation calculations for the test process
  const fragmentationStats = useMemo(() => {
    const procBytes = testProcessSizeKb * 1024;
    const pagesNeeded = Math.ceil(procBytes / pageSizeBytes);
    const allocatedBytes = pagesNeeded * pageSizeBytes;
    const remainder = procBytes % pageSizeBytes;
    const bytesInLastPage = remainder === 0 ? pageSizeBytes : remainder;
    const internalWastedBytes = remainder === 0 ? 0 : pageSizeBytes - remainder;
    const averageWastedBytes = pageSizeBytes / 2;
    const optimalPageSize = Math.round(Math.sqrt(2 * procBytes * 4));

    return {
      procBytes,
      pagesNeeded,
      allocatedBytes,
      bytesInLastPage,
      internalWastedBytes,
      averageWastedBytes,
      optimalPageSize,
    };
  }, [testProcessSizeKb, pageSizeBytes]);

  // Sub-tab 2: Multilevel Page Tables
  const [mlVaBits, setMlVaBits] = useState<number>(32);
  const [mlPageSize, setMlPageSize] = useState<number>(4096);
  const [mlPteSize, setMlPteSize] = useState<number>(4);

  const multilevelResult = useMemo(
    () => computeMultilevelStructure(mlVaBits, mlPageSize, mlPteSize),
    [mlVaBits, mlPageSize, mlPteSize]
  );

  // Sub-tab 3: Segmentation
  const [segNumber, setSegNumber] = useState<number>(2);
  const [segOffset, setSegOffset] = useState<number>(53);
  const [segTable] = useState<SegmentationEntry[]>(DEFAULT_SEGMENT_TABLE);

  const segResult = useMemo(
    () => translateSegmentAddress(segNumber, segOffset, segTable),
    [segNumber, segOffset, segTable]
  );

  // Sub-tab 4: TLB & Effective Memory Access Time (FLAG-8)
  const [tlbHitRatio, setTlbHitRatio] = useState<number>(0.90);
  const [tlbLookupNs, setTlbLookupNs] = useState<number>(10);
  const [memoryAccessNs, setMemoryAccessNs] = useState<number>(100);
  const [pageTableLevels, setPageTableLevels] = useState<number>(1);
  const [eatConvention, setEatConvention] = useState<'ADD_TLB_ON_MISS' | 'PARALLEL_LOOKUP'>('ADD_TLB_ON_MISS');

  const tlbEatResult = useMemo(
    () =>
      computeTLBEAT({
        tlbHitRatio,
        tlbLookupNs,
        memoryAccessNs,
        pageTableLevels,
        convention: eatConvention,
      }),
    [tlbHitRatio, tlbLookupNs, memoryAccessNs, pageTableLevels, eatConvention]
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Paging & Segmentation Hardware Translation</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Explore address splitting with interactive bit-sliders, single and multi-level page table sizing, internal fragmentation tradeoffs, segmentation limit traps, and TLB effective access time calculations with explicit GATE convention toggles.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('translate')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'translate'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Address Splitter & Bit-Slider
          </button>
          <button
            onClick={() => setActiveSubTab('multilevel')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'multilevel'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Multi-level Tree
          </button>
          <button
            onClick={() => setActiveSubTab('segmentation')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'segmentation'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Segmentation Traps
          </button>
          <button
            onClick={() => setActiveSubTab('tlb')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'tlb'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4. TLB EAT (FLAG-8)
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Address Translation & Splitter */}
      {activeSubTab === 'translate' && (
        <div className="flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-semibold">Logical Address (VA):</span>
              <input
                type="text"
                value={logicalInputHex}
                onChange={(e) => setLogicalInputHex(e.target.value)}
                placeholder="e.g. 0x2A5C"
                className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-semibold">VA Bits ({logicalBits}-bit):</span>
              <select
                value={logicalBits}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setLogicalBits(val);
                  if (offsetBits >= val) setOffsetBits(val - 4);
                }}
                className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-bold"
              >
                <option value={16}>16-bit (64 KB space)</option>
                <option value={32}>32-bit (4 GB space)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-semibold">PA Bits ({physicalBits}-bit):</span>
              <select
                value={physicalBits}
                onChange={(e) => setPhysicalBits(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-bold"
              >
                <option value={15}>15-bit (32 KB RAM)</option>
                <option value={20}>20-bit (1 MB RAM)</option>
                <option value={32}>32-bit (4 GB RAM)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-semibold">Page Size ({pageSizeBytes >= 1024 ? `${pageSizeBytes / 1024} KB` : `${pageSizeBytes} B`}):</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[10, 11, 12, 13, 14].map((b) => (
                  <button
                    key={b}
                    onClick={() => setOffsetBits(b)}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
                      offsetBits === b
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {Math.pow(2, b) / 1024}K
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Direct-Manipulation Bit-Slider Boundary Widget (Spec Section 6.4) */}
          <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-5 shadow-2xl flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200 text-sm">
                  Interactive Page / Offset Bit Boundary Slider
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px]">
                  p = {logicalBits - offsetBits} bits
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]">
                  d = {offsetBits} bits ({pageSizeBytes / 1024} KB)
                </span>
              </div>
            </div>

            {/* Slider Track with boundary label */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="text-indigo-400 font-bold">
                  ← More Page Bits (p) [Smaller Page Size]
                </span>
                <span className="text-slate-500 font-bold">
                  Bit Boundary at d = {offsetBits}
                </span>
                <span className="text-amber-400 font-bold">
                  [Larger Page Size] More Offset Bits (d) →
                </span>
              </div>

              <input
                type="range"
                min="9"
                max={Math.min(16, logicalBits - 2)}
                value={offsetBits}
                onChange={(e) => setOffsetBits(parseInt(e.target.value, 10))}
                className="accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-slate-500 px-1">
                <span>9b (512 B)</span>
                <span>10b (1 KB)</span>
                <span>11b (2 KB)</span>
                <span>12b (4 KB - standard)</span>
                <span>13b (8 KB)</span>
                <span>14b (16 KB)</span>
                <span>16b (64 KB)</span>
              </div>
            </div>
          </div>

          {/* Visualization A: BitField & Address Translation Flow */}
          {translationResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: BitField Split & Calculations */}
              <div className="flex flex-col gap-4">
                <BitField
                  totalBits={logicalBits}
                  addressHex={translationResult.hexLogical}
                  segments={[
                    {
                      label: 'Page # (p)',
                      bits: translationResult.pageNumberBits,
                      colorClass: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60',
                      description: `Bits for page index = ${translationResult.pageNumberBits}`,
                      value: translationResult.pageNumber,
                    },
                    {
                      label: 'Offset (d)',
                      bits: translationResult.offsetBits,
                      colorClass: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
                      description: `Bits for in-page byte offset = ${translationResult.offsetBits}`,
                      value: translationResult.offset,
                    },
                  ]}
                />

                {/* Mathematical Derivation Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg text-xs font-mono flex flex-col gap-2">
                  <span className="font-bold text-slate-300 text-sm">
                    📐 Mathematical Derivations:
                  </span>
                  <div className="space-y-1 text-slate-400">
                    <div>Offset Bits: d = log₂(Page Size) = log₂({pageSizeBytes}) = <strong className="text-amber-400">{translationResult.offsetBits} bits</strong></div>
                    <div>Page Bits: p = VA_bits - d = {logicalBits} - {translationResult.offsetBits} = <strong className="text-indigo-400">{translationResult.pageNumberBits} bits</strong></div>
                    <div>Frame Bits: f = PA_bits - d = {physicalBits} - {translationResult.offsetBits} = <strong className="text-teal-400">{translationResult.frameBits} bits</strong></div>
                    <div>Page Table Entries: 2^p = 2^{translationResult.pageNumberBits} = <strong className="text-slate-200">{translationResult.pageTableEntries.toLocaleString()} entries</strong></div>
                    <div>Page Table Size: {translationResult.pageTableEntries} × 4 B = <strong className="text-slate-200">{(translationResult.pageTableSizeBytes / 1024).toFixed(1)} KB</strong></div>
                    <div>Average Expected Internal Fragmentation: Page Size / 2 = <strong className="text-amber-300">{(pageSizeBytes / 2).toLocaleString()} bytes</strong></div>
                  </div>
                </div>
              </div>

              {/* Right Column: Page Table Lookup & Physical Translation Result */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" /> Page Table Translation Lookup
                  </h3>
                  <span className="text-xs font-mono text-slate-400">Page → Frame Mapping</span>
                </div>

                {/* Page Table Interactive Mock */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-bold block mb-2">Page Table:</span>
                    <div className="space-y-1">
                      {[0, 1, 2, 3].map((pNum) => {
                        const isMatch = pNum === translationResult.pageNumber;
                        const frameMapped = pageTableMapping[pNum];
                        return (
                          <div
                            key={pNum}
                            className={`flex items-center justify-between p-1.5 rounded border ${
                              isMatch
                                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>Page {pNum}</span>
                            <span>{frameMapped !== null ? `Frame ${frameMapped}` : 'INVALID (Trap)'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Physical Address Outcome */}
                  <div className="flex flex-col justify-center gap-3">
                    {translationResult.isValid ? (
                      <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl p-4 text-emerald-100 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Translation Successful!
                        </div>
                        <div className="space-y-1 text-xs font-mono">
                          <div>Logical: <strong className="text-white">{translationResult.hexLogical}</strong></div>
                          <div>Page #: <strong className="text-indigo-300">{translationResult.pageNumber}</strong> → Frame #: <strong className="text-teal-300">{translationResult.frameNumber}</strong></div>
                          <div>Offset: <strong className="text-amber-300">0x{translationResult.offset.toString(16).toUpperCase()}</strong></div>
                          <div className="pt-2 border-t border-emerald-900/60">
                            Physical Address (PA):
                            <div className="text-base font-black text-emerald-300 mt-0.5">
                              {translationResult.hexPhysical}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Bin: {translationResult.binaryPhysical}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-950/40 border-2 border-rose-500/60 rounded-xl p-4 text-rose-100 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-sm text-rose-300">
                          <ShieldAlert className="w-4 h-4 text-rose-400" /> PAGE FAULT TRAP!
                        </div>
                        <p className="text-xs font-sans text-rose-200">
                          Page #{translationResult.pageNumber} is not present in RAM (Invalid bit set). A hardware trap to the OS kernel is triggered to service the page from backing store.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Internal Fragmentation & Trade-off Laboratory (Spec Section 6.4) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-5 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-400" /> Internal Fragmentation vs Page Table Trade-off Laboratory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  GATE Concept: Why page size cannot be arbitrarily large (severe internal fragmentation) nor arbitrarily small (gigantic page tables).
                </p>
              </div>

              <span className="px-3 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                Optimal Page Size ≈ √(2 · s · e)
              </span>
            </div>

            {/* Test Process Slider */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-slate-300">
                <span>Test Process Footprint Size (s):</span>
                <strong className="text-amber-400 text-sm">{testProcessSizeKb} KB ({fragmentationStats.procBytes.toLocaleString()} bytes)</strong>
              </div>
              <input
                type="range"
                min="1"
                max="128"
                value={testProcessSizeKb}
                onChange={(e) => setTestProcessSizeKb(parseInt(e.target.value, 10))}
                className="accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 KB</span>
                <span>17 KB (GATE default)</span>
                <span>32 KB</span>
                <span>64 KB</span>
                <span>128 KB</span>
              </div>
            </div>

            {/* Allocation & Wasted Memory Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Pages Needed:</span>
                <div className="text-xl font-black text-indigo-300 mt-1">
                  {fragmentationStats.pagesNeeded} pages
                </div>
                <div className="text-[10px] text-slate-500">
                  ⌈{testProcessSizeKb} KB / {pageSizeBytes / 1024} KB⌉
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Total Allocated RAM:</span>
                <div className="text-xl font-black text-slate-200 mt-1">
                  {(fragmentationStats.allocatedBytes / 1024).toFixed(1)} KB
                </div>
                <div className="text-[10px] text-slate-500">
                  {fragmentationStats.pagesNeeded} × {pageSizeBytes / 1024} KB
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Internal Fragmentation:</span>
                <div className="text-xl font-black text-rose-400 mt-1">
                  {fragmentationStats.internalWastedBytes} bytes
                </div>
                <div className="text-[10px] text-slate-500">
                  Wasted in page #{fragmentationStats.pagesNeeded - 1}
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Calculated Optimal Page:</span>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {fragmentationStats.optimalPageSize} bytes
                </div>
                <div className="text-[10px] text-slate-500">
                  √(2 × {fragmentationStats.procBytes} × 4 B)
                </div>
              </div>
            </div>

            {/* Visual Page Filling Bar */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <span className="text-slate-300 font-bold text-[11px]">
                Last Page Storage Breakdown (Page Size: {pageSizeBytes} B):
              </span>
              <div className="h-6 w-full rounded-lg bg-slate-800 overflow-hidden flex border border-slate-700">
                <div
                  className="bg-indigo-600 text-[10px] text-white flex items-center justify-center font-bold px-1 transition-all"
                  style={{ width: `${(fragmentationStats.bytesInLastPage / pageSizeBytes) * 100}%` }}
                >
                  Used: {fragmentationStats.bytesInLastPage} B
                </div>
                {fragmentationStats.internalWastedBytes > 0 && (
                  <div
                    className="bg-rose-600/80 text-[10px] text-white flex items-center justify-center font-bold px-1 transition-all"
                    style={{ width: `${(fragmentationStats.internalWastedBytes / pageSizeBytes) * 100}%` }}
                  >
                    Wasted: {fragmentationStats.internalWastedBytes} B
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>0 B</span>
                <span className="text-rose-400">
                  Internal Fragmentation: {((fragmentationStats.internalWastedBytes / pageSizeBytes) * 100).toFixed(1)}% of final page wasted
                </span>
                <span>{pageSizeBytes} B</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Multi-Level Page Tables */}
      {activeSubTab === 'multilevel' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Multilevel Hierarchy Sizing & Splitting
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculate hierarchical page table bit-splits and visualize how multi-level paging saves physical RAM by omitting unused sub-tables.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => {
                  setMlVaBits(32);
                  setMlPageSize(4096);
                  setMlPteSize(4);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                32-bit (10+10+12)
              </button>
              <button
                onClick={() => {
                  setMlVaBits(48);
                  setMlPageSize(4096);
                  setMlPteSize(8);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                48-bit (9+9+9+9+12)
              </button>
            </div>
          </div>

          {/* Derivation stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Total VA Bits:</span>
              <div className="text-lg font-black text-indigo-300 mt-1">{multilevelResult.vaBits} bits</div>
              <div className="text-[10px] text-slate-500">VPN: {multilevelResult.vpnBits} bits | Offset: {multilevelResult.offsetBits} bits</div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Entries / Page:</span>
              <div className="text-lg font-black text-amber-300 mt-1">
                {multilevelResult.entriesPerTable} entries
              </div>
              <div className="text-[10px] text-slate-500">Page Size ({multilevelResult.pageSizeBytes} B) / PTE ({multilevelResult.pteSizeBytes} B)</div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Bits per Level:</span>
              <div className="text-lg font-black text-teal-300 mt-1">
                {multilevelResult.bitsPerLevel} bits / level
              </div>
              <div className="text-[10px] text-slate-500">log₂({multilevelResult.entriesPerTable})</div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Required Levels:</span>
              <div className="text-lg font-black text-rose-300 mt-1">
                {multilevelResult.levels} levels
              </div>
              <div className="text-[10px] text-slate-500">⌈{multilevelResult.vpnBits} / {multilevelResult.bitsPerLevel}⌉</div>
            </div>
          </div>

          {/* Hierarchy Breakdown Visual */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-300 font-mono">
              Virtual Address Bit Split: [ {multilevelResult.levelBitSplits.map((b, i) => `L${i + 1}:${b}`).join(' | ')} | Offset:{multilevelResult.offsetBits} ]
            </span>

            {/* Tree level cards */}
            <div className="flex flex-wrap items-center gap-3">
              {multilevelResult.levelBitSplits.map((bits, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="bg-slate-900 border-2 border-indigo-600/60 rounded-xl p-3 min-w-[140px] text-center shadow">
                    <div className="text-xs font-bold text-indigo-300 font-mono">
                      Level {idx + 1} {idx === 0 ? '(Outer)' : idx === multilevelResult.levels - 1 ? '(Inner)' : 'Table'}
                    </div>
                    <div className="text-sm font-black text-white mt-1 font-mono">
                      {bits} bits
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {Math.pow(2, bits)} entries
                    </div>
                  </div>
                  <span className="text-slate-600 font-black">→</span>
                </div>
              ))}

              <div className="bg-slate-900 border-2 border-amber-600/60 rounded-xl p-3 min-w-[140px] text-center shadow">
                <div className="text-xs font-bold text-amber-300 font-mono">Physical Frame</div>
                <div className="text-sm font-black text-white mt-1 font-mono">
                  + {multilevelResult.offsetBits}b Offset
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Final Byte in RAM</div>
              </div>
            </div>

            {/* RAM Saving Callout */}
            <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-xl p-4 text-xs text-indigo-200 leading-relaxed font-sans mt-2">
              <strong>💡 Why Multi-Level Paging Saves Gigabytes of Memory:</strong> In a single-level 32-bit paging scheme with 4 KB pages, the page table requires <strong>4 MB of contiguous RAM</strong> even if a process only uses 12 KB! In a 2-level scheme, only the outer page table (4 KB) and active inner page tables (4 KB each) are allocated. Unused virtual memory regions consume <strong>zero</strong> inner page table memory.
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Segmentation & Limit Checks */}
      {activeSubTab === 'segmentation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> Segmentation Address Translation & Limit Traps
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                GATE Archetype: Segment limit comparison `d &lt; limit`. If `d &ge; limit`, a trap is generated!
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => {
                  setSegNumber(2);
                  setSegOffset(53);
                }}
                className="px-2.5 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900/60"
              >
                Valid: (2, 53)
              </button>
              <button
                onClick={() => {
                  setSegNumber(2);
                  setSegOffset(500);
                }}
                className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900/60"
              >
                Trap: (2, 500)
              </button>
            </div>
          </div>

          {/* Segment Selector Inputs */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Segment (s):</span>
              <select
                value={segNumber}
                onChange={(e) => setSegNumber(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-indigo-300 font-bold"
              >
                {segTable.map((s) => (
                  <option key={s.segNumber} value={s.segNumber}>Segment {s.segNumber}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Offset (d):</span>
              <input
                type="number"
                min="0"
                max="2000"
                value={segOffset}
                onChange={(e) => setSegOffset(parseInt(e.target.value, 10) || 0)}
                className="w-24 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-amber-300 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Segment Table Grid & Translation Outcome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs font-mono">
              <span className="font-bold text-slate-300 block mb-2">Segment Table:</span>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="p-2 text-left">Segment (s)</th>
                    <th className="p-2 text-left">Base</th>
                    <th className="p-2 text-left">Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {segTable.map((entry) => {
                    const isSelected = entry.segNumber === segNumber;
                    return (
                      <tr
                        key={entry.segNumber}
                        className={`border-b border-slate-800/40 ${
                          isSelected
                            ? 'bg-indigo-950/70 text-indigo-200 font-bold'
                            : 'text-slate-400 hover:bg-slate-900/50'
                        }`}
                      >
                        <td className="p-2">Segment {entry.segNumber}</td>
                        <td className="p-2">{entry.base}</td>
                        <td className="p-2">{entry.limit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Translation card */}
            <div className="flex flex-col justify-center">
              {segResult.isTrap ? (
                <div className="bg-rose-950/40 border-2 border-rose-500/80 rounded-xl p-5 shadow-2xl text-rose-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-black text-rose-300 text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>TRAP: SEGMENTATION FAULT!</span>
                  </div>
                  <div className="text-xs font-mono space-y-1">
                    <div>Condition check: Offset ({segResult.offset}) &lt; Limit ({segResult.limit})?</div>
                    <div className="text-rose-400 font-bold">Result: {segResult.offset} &ge; {segResult.limit} ✗ (TRAP)</div>
                  </div>
                  <p className="text-xs text-rose-200 font-sans leading-relaxed">
                    The requested offset exceeds the legal boundary of Segment #{segResult.segment}. Hardware generates a memory protection trap to prevent illegal access.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border-2 border-emerald-500/80 rounded-xl p-5 shadow-2xl text-emerald-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>VALID SEGMENT ACCESS ✓</span>
                  </div>
                  <div className="text-xs font-mono space-y-1">
                    <div>Condition check: Offset ({segResult.offset}) &lt; Limit ({segResult.limit}) ✓</div>
                    <div>Physical Address Calculation:</div>
                    <div className="text-lg font-black text-emerald-300 mt-1">
                      PA = Base ({segResult.base}) + Offset ({segResult.offset}) = {segResult.physicalAddress}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TLB Effective Access Time (FLAG-8) */}
      {activeSubTab === 'tlb' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-400" /> TLB Effective Memory Access Time (EAT)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculate average memory latency with Translation Lookaside Buffer caching and handle explicit GATE question conventions.
              </p>
            </div>

            {/* FLAG-8 Convention Toggle */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-amber-500/40">
              <span className="text-[11px] font-bold text-amber-300 uppercase px-1">FLAG-8 Convention:</span>
              <button
                onClick={() => setEatConvention('ADD_TLB_ON_MISS')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                  eatConvention === 'ADD_TLB_ON_MISS'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Add TLB on Miss (Sequential)
              </button>
              <button
                onClick={() => setEatConvention('PARALLEL_LOOKUP')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                  eatConvention === 'PARALLEL_LOOKUP'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Parallel Lookup
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            {/* TLB Hit ratio */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>Hit Ratio (h):</span>
                <strong className="text-emerald-400 text-sm">{(tlbHitRatio * 100).toFixed(0)}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={tlbHitRatio * 100}
                onChange={(e) => setTlbHitRatio(parseFloat(e.target.value) / 100)}
                className="accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* TLB Lookup Time */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>TLB Lookup (t):</span>
                <strong className="text-indigo-400 text-sm">{tlbLookupNs} ns</strong>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={tlbLookupNs}
                onChange={(e) => setTlbLookupNs(parseInt(e.target.value, 10))}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* RAM Access Time */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>RAM Access (m):</span>
                <strong className="text-amber-400 text-sm">{memoryAccessNs} ns</strong>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={memoryAccessNs}
                onChange={(e) => setMemoryAccessNs(parseInt(e.target.value, 10))}
                className="accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Page Table Levels */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between text-slate-300">
                <span>Page Table Levels (k):</span>
                <strong className="text-teal-400 text-sm">{pageTableLevels}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={pageTableLevels}
                onChange={(e) => setPageTableLevels(parseInt(e.target.value, 10))}
                className="accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Outcome Breakdown Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-300 text-sm">
                Effective Access Time Calculation:
              </span>
              <span className="px-3 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold text-sm">
                EAT = {tlbEatResult.eatNs.toFixed(2)} ns
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-400">1. TLB Hit Path (Probability: {(tlbHitRatio * 100).toFixed(0)}%)</div>
                <div className="text-slate-300">Time = t + m = {tlbLookupNs} + {memoryAccessNs} = <strong>{tlbEatResult.hitPathNs} ns</strong></div>
                <div className="text-slate-500 text-[11px]">Contribution: {tlbHitRatio} × {tlbEatResult.hitPathNs} = {tlbEatResult.hitContributionNs.toFixed(2)} ns</div>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="font-bold text-rose-400">2. TLB Miss Path (Probability: {((1 - tlbHitRatio) * 100).toFixed(0)}%)</div>
                <div className="text-slate-300">Time = {tlbEatResult.missPathNs} ns ({eatConvention === 'ADD_TLB_ON_MISS' ? `${tlbLookupNs} + ${pageTableLevels}×${memoryAccessNs} + ${memoryAccessNs}` : `${pageTableLevels}×${memoryAccessNs} + ${memoryAccessNs}`})</div>
                <div className="text-slate-500 text-[11px]">Contribution: {(1 - tlbHitRatio).toFixed(2)} × {tlbEatResult.missPathNs} = {tlbEatResult.missContributionNs.toFixed(2)} ns</div>
              </div>
            </div>

            <div className="text-slate-400 text-[11px] pt-2 border-t border-slate-800/80 font-sans">
              Formula used: <code className="text-indigo-300 font-mono">{tlbEatResult.formula}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
