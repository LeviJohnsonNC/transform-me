import React from 'react';
import { 
  Dumbbell, 
  Activity, 
  Flame, 
  Beef, 
  Pill,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHabitStore } from '@/stores/habitStore';
import type { Habit } from '@/types/habits';

const iconMap = {
  Dumbbell,
  Activity,
  Flame,
  Beef,
  Pill
} as const;

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  onClick: () => void;
  className?: string;
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  completed, 
  onClick,
  className 
}) => {
  const IconComponent = iconMap[habit.icon as keyof typeof iconMap];

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-card bg-card/50 backdrop-blur-sm border border-border/50',
        'p-6 cursor-pointer select-none transition-all duration-smooth',
        'hover:bg-card/70 hover:border-border hover:shadow-card-hover hover:scale-[1.02]',
        'active:scale-[0.98]',
        completed && 'bg-gradient-primary border-primary/50 shadow-card-hover',
        className
      )}
    >
      {/* Glow effect when completed */}
      {completed && (
        <div className="absolute inset-0 bg-gradient-primary opacity-10 animate-pulse" />
      )}
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            'relative p-3 rounded-xl transition-all duration-smooth',
            'bg-muted/30 group-hover:bg-muted/50',
            completed && 'bg-primary-neon/20 text-primary-neon'
          )}>
            {IconComponent && (
              <IconComponent 
                size={28} 
                className={cn(
                  'transition-all duration-smooth',
                  completed && 'animate-wiggle text-primary-neon',
                  !completed && 'text-muted-foreground group-hover:text-foreground'
                )}
              />
            )}
          </div>
          
          <div>
            <h3 className={cn(
              'font-semibold text-lg transition-colors duration-smooth',
              completed ? 'text-foreground' : 'text-foreground/90 group-hover:text-foreground'
            )}>
              {habit.name}
            </h3>
            {habit.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {habit.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Check mark */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-smooth',
          completed 
            ? 'bg-success border-success text-success-foreground scale-110' 
            : 'border-muted-foreground/40 group-hover:border-muted-foreground/60'
        )}>
          {completed && (
            <Check 
              size={18} 
              className="animate-habit-check" 
            />
          )}
        </div>
      </div>

      {/* Ripple effect on click */}
      <div 
        className={cn(
          'absolute inset-0 rounded-card opacity-0 group-active:opacity-100',
          'bg-gradient-radial from-primary/20 to-transparent',
          'transition-opacity duration-200 pointer-events-none'
        )}
      />
    </div>
  );
};