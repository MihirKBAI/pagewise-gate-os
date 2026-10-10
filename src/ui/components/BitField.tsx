import React from 'react';

export interface BitFieldSegment {
  label: string;
  bits: number;
  colorClass: string; // e.g. "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
  description?: string;
  value?: number | string;
}

interface BitFieldProps {
  totalBits: number;
  segments: BitFieldSegment[];
  addressHex?: string;
  className?: string;
}

export const BitField: React.FC<BitFieldProps> = ({
  totalBits,
  segments,
  addressHex,
  className = '',
}) => {
  return (
    <div className={`bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 font-mono ${className}`}>
      {/* Top Header with Address Hex if provided */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-300">
          Address Field Layout ({totalBits}-bit)
        </span>
        {addressHex && (
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-indigo-300 font-bold">
            Hex: {addressHex}
          </span>
        )}
      </div>

      {/* Bit Segments Horizontal Strip */}
      <div className="flex w-full rounded-lg overflow-hidden border border-slate-700 shadow-inner">
        {segments.map((seg, idx) => {
          const flexGrow = seg.bits;
          return (
            <div
              key={idx}
              className={`p-2.5 flex flex-col items-center justify-center text-center transition-all ${seg.colorClass} border-r last:border-r-0 border-slate-700/60`}
              style={{ flex: `${flexGrow} 1 0%` }}
            >
              <div className="text-xs sm:text-sm font-bold tracking-tight">
                {seg.label}
              </div>
              <div className="text-[10px] sm:text-xs opacity-90 mt-0.5 font-medium">
                {seg.bits} bits
              </div>
              {seg.value !== undefined && (
                <div className="text-[11px] sm:text-xs font-black mt-1 px-1.5 py-0.5 rounded bg-slate-900/60 border border-current">
                  {typeof seg.value === 'number' ? `0x${seg.value.toString(16).toUpperCase()}` : seg.value}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bit Range Annotations underneath */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span>Bit {totalBits - 1} (MSB)</span>
        <span>Bit 0 (LSB)</span>
      </div>

      {/* Legend / Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-[11px]">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-start gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: 'currentColor' }} />
            <div>
              <strong className="text-slate-100">{seg.label}:</strong> {seg.description || `${seg.bits} bits`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
