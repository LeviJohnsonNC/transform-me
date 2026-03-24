import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHabitIcon } from '@/utils/habitIcons';
import type { Habit } from '@/types/habits';

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  completed, 
  onClick,
  disabled = false,
  className 
}) => {
  const IconComponent = getHabitIcon(habit.icon);
  const [justCompleted, setJustCompleted] = useState(false);
  const [wasCompleted, setWasCompleted] = useState(completed);

  useEffect(() => {
    if (completed && !wasCompleted) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 500);
      return () => clearTimeout(timer);
    }
    setWasCompleted(completed);
  }, [completed]);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'group relative overflow-hidden rounded-habit select-none transition-all duration-300',
        'min-h-[88px] p-3.5',
        !disabled && 'cursor-pointer active:scale-[0.985]',
        disabled && 'cursor-not-allowed opacity-75',
        completed ? 'habit-card-active' : 'habit-card-inactive',
        justCompleted && 'animate-glow-pulse',
        className
      )}
    >
      {/* Glossy top highlight for completed cards */}
      {completed && <div className="absolute inset-0 rounded-habit pointer-events-none" style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent)'
      }} />}

      <div className="relative z-10 flex items-center gap-3">
        {/* Icon chip */}
        <div className={cn(
          'flex items-center justify-center w-[38px] h-[38px] rounded-[14px] shrink-0 transition-all duration-300',
          completed
            ? 'bg-white/[0.08] border border-white/[0.10]'
            : 'bg-white/[0.03] border border-white/[0.04]'
        )}>
          {IconComponent && (
            <IconComponent 
              size={20} 
              className={cn(
                'transition-all duration-300',
                completed
                  ? 'text-white/90 animate-wiggle'
                  : 'text-foreground/[0.58] group-hover:text-foreground/80'
              )}
            />
          )}
        </div>

        {/* Label */}
        <h3 className={cn(
          'font-semibold text-[17px] leading-tight flex-1 min-w-0 truncate transition-colors duration-300',
          completed ? 'text-white' : 'text-foreground/[0.92]'
        )}>
          {habit.name}
        </h3>

        {/* Check control */}
        <div className={cn(
          'flex items-center justify-center w-[28px] h-[28px] rounded-full shrink-0 transition-all duration-300',
          completed 
            ? 'check-circle-done scale-110' 
            : 'border-2 border-foreground/[0.28] bg-white/[0.01] group-hover:border-foreground/[0.40]'
        )}>
          {completed && (
            <Check size={15} strokeWidth={2.5} className="text-white animate-check-pop" />
          )}
        </div>
      </div>
    </div>
  );
};
