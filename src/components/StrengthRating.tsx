import React from 'react';
import { cn } from '@/lib/utils';
import type { Unit } from '@/lib/strengthStandards';

interface StrengthRatingProps {
  level: number; // 0..10 fractional
  unit: Unit;
  nextThreshold: number | null;
  nextLevel: number | null;
}

const segmentClass = (segIndex: number, level: number): string => {
  // segIndex: 0..9 representing levels 1..10
  const filled = level >= segIndex + 1;
  const partial = !filled && level > segIndex && level < segIndex + 1;
  // Color tier based on segment index (the level it represents)
  const lvl = segIndex + 1;
  let color = 'bg-muted';
  if (filled || partial) {
    if (lvl <= 3) color = 'bg-muted-foreground';
    else if (lvl <= 6) color = 'bg-primary';
    else if (lvl <= 8) color = 'bg-amber-500';
    else color = 'bg-pink-500';
  }
  return cn('h-2 flex-1 rounded-sm', filled ? color : partial ? `${color} opacity-60` : 'bg-muted/40');
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
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">Strength Level</span>
        <span className="text-xs font-semibold">
          <span className="text-foreground">{display}</span>
          <span className="text-muted-foreground"> / 10</span>
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={segmentClass(i, level)} />
        ))}
      </div>
      {nextThreshold !== null && nextLevel !== null && (
        <p className="text-[11px] text-muted-foreground mt-1">
          Next: Lv {nextLevel} at {nextThreshold} {unitLabel}
        </p>
      )}
      {nextThreshold === null && (
        <p className="text-[11px] text-pink-500 mt-1 font-medium">Max level reached 🔥</p>
      )}
    </div>
  );
};
