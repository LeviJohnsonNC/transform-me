import React from 'react';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkoutExercises } from '@/hooks/useWorkoutPlans';

export interface WorkoutPlan {
  id: string;
  day_number: number;
  day_name: string;
  created_at: string;
  updated_at: string;
}

interface DayPlanCardProps {
  workoutPlan: WorkoutPlan;
  onClick: () => void;
}

export const DayPlanCard: React.FC<DayPlanCardProps> = ({ workoutPlan, onClick }) => {
  const { data: exercises } = useWorkoutExercises(workoutPlan.id);
  const exerciseCount = exercises?.length || 0;

  return (
    <Card className="bg-card/30 border-border/50 hover:bg-card/50 transition-colors">
      <Button
        onClick={onClick}
        variant="ghost"
        className="w-full p-4 h-auto justify-between hover:bg-transparent"
      >
        <div className="flex items-center">
          <div className="bg-primary/20 rounded-lg p-2 mr-3">
            <Dumbbell size={20} className="text-primary-neon" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">{workoutPlan.day_name}</h3>
            <p className="text-sm text-muted-foreground">
              {exerciseCount === 0 ? 'No exercises planned' : 
               exerciseCount === 1 ? '1 exercise' : 
               `${exerciseCount} exercises`}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </Button>
    </Card>
  );
};