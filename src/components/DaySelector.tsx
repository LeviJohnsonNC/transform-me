import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DaySelectorProps {
  selectedDay: number;
  onDaySelect: (dayNumber: number) => void;
  workoutPlans: Array<{ day_number: number; day_name: string }>;
}

export const DaySelector: React.FC<DaySelectorProps> = ({ 
  selectedDay, 
  onDaySelect, 
  workoutPlans 
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
      {workoutPlans.map((plan) => (
        <Button
          key={plan.day_number}
          variant={selectedDay === plan.day_number ? "default" : "outline"}
          size="sm"
          onClick={() => onDaySelect(plan.day_number)}
          className={cn(
            "snap-start flex-shrink-0 min-w-[80px]",
            selectedDay === plan.day_number && "bg-primary text-primary-foreground"
          )}
        >
          Day {plan.day_number}
        </Button>
      ))}
    </div>
  );
};