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

export const StreakRing: React.FC<StreakRingProps> = ({
  className,
}) => {
  const { getStreakData } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  // Read habits here rather than take a count from the parent: which habits
  // count varies per day, so a single number cannot express it.
  const { data: habits = [] } = useUserHabits();

  const streakData = getStreakData(entries || [], habits);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-[14px] overflow-hidden',
        className
      )}
      style={{
        width: 56,
        height: 40,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(190,160,255,0.10)',
      }}
    >
      {/* Subtle purple arc accent at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 32,
          height: 3,
          borderRadius: '0 0 999px 999px',
          background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-neon)))',
          opacity: 0.5,
        }}
      />
      <span className="text-[16px] font-bold leading-none text-foreground tabular-nums">
        {streakData.current}
      </span>
      <span className="text-[10px] font-medium leading-none text-muted-foreground -mt-0.5">
        {streakData.current === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
};
