import React from 'react';
import { cn } from '@/lib/utils';
import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';
import { Flame } from 'lucide-react';

interface StreakRingProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Current streak, as a lit readout chip.
 *
 * Reads the habit list itself rather than taking a count from the parent:
 * which habits count varies per day, so a single number cannot express it.
 */
export const StreakRing: React.FC<StreakRingProps> = ({ className }) => {
  const { getStreakData } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();

  const streakData = getStreakData(entries || [], habits);
  const alive = streakData.current > 0;

  return (
    <div
      className={cn(
        'rounded-[3px] flex items-center gap-[7px] px-[11px] py-[7px] border transition-colors duration-300',
        alive
          ? 'bg-surface border-cyan/30 shadow-[0_0_16px_rgba(43,232,255,0.12)]'
          : 'bg-surface-deep border-[rgba(110,103,160,0.22)]',
        className,
      )}
    >
      <Flame
        size={14}
        strokeWidth={2}
        className={alive ? 'text-cyan' : 'text-dim'}
        style={alive ? { filter: 'drop-shadow(0 0 6px rgba(43,232,255,0.8))' } : undefined}
        aria-hidden="true"
      />
      <span className="font-display font-bold text-[15px] leading-none tabular">
        {streakData.current}
      </span>
      <span className="font-display text-[10px] tracking-[0.14em] text-faint">
        {streakData.current === 1 ? 'DAY' : 'DAYS'}
      </span>
    </div>
  );
};
