import React from 'react';
import { cn } from '@/lib/utils';
import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries } from '@/hooks/useHabits';

interface StreakRingProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  habitCount?: number;
}

export const StreakRing: React.FC<StreakRingProps> = ({ 
  size = 48, 
  strokeWidth = 4,
  className,
  habitCount = 5,
}) => {
  const { getStreakData } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  
  const safeEntries = entries || [];
  const streakData = getStreakData(safeEntries, habitCount);
  
  const recent14Days = streakData.data.slice(-14);
  const completedDays = recent14Days.filter(day => day.count === habitCount).length;
  const progress = (completedDays / 14) * 100;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth={strokeWidth} fill="transparent" opacity={0.2} />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--primary-neon))" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary-neon) / 0.6))' }} />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm font-bold text-primary-neon">{streakData.current}</div>
          <div className="text-xs text-muted-foreground -mt-1">day{streakData.current !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>
  );
};
