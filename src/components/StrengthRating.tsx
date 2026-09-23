import React from 'react';
import { cn } from '@/lib/utils';
import type { Unit } from '@/lib/strengthStandards';

interface StrengthRatingProps {
  level: number; // 0..10 fractional
  unit: Unit;
  nextThreshold: number | null;
  nextLevel: number | null;
}

/** Filled segments ramp magenta -> violet -> cyan, matching the progress meters. */
const FILL_BY_LEVEL = [
  'bg-magenta', 'bg-magenta', 'bg-magenta',
  'bg-violet', 'bg-violet', 'bg-violet',
  'bg-[#6D82F9]', 'bg-[#4F99FA]',
  'bg-cyan', 'bg-cyan',
];

const segmentClass = (segIndex: number, level: number): string => {
  // segIndex 0..9 represents levels 1..10. Round down: 4.8 fills four bars.
  const filled = Math.floor(level) >= segIndex + 1;
  return cn(
    'h-4 flex-1',
    filled ? FILL_BY_LEVEL[segIndex] : 'bg-[#150E28] border border-cyan/10',
  );
};

export const StrengthRating: React.FC<StrengthRatingProps> = ({
  level,
  unit,
  nextThreshold,
  nextLevel,
}) => {
  const display = level >= 10 ? '10' : level.toFixed(1);
  const unitLabel = unit === 'lbs' ? 'lbs' : unit === 'seconds' ? 's' : 'reps';

  return (
    <div className="mt-3 mb-1">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-[10px] tracking-[0.2em] text-faint">STRENGTH</span>
        <span className="font-display font-bold text-[15px] tabular">
          <span className="text-cyan">{display}</span>
          <span className="text-dim text-[11px]"> / 10</span>
        </span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={segmentClass(i, level)} />
        ))}
      </div>
    </div>
  );
};
