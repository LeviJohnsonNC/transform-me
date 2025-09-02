import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWorkoutPlans } from '@/hooks/useWorkoutPlans';
import { DayPlanCard } from '@/components/DayPlanCard';
import { ExerciseSelector } from '@/components/ExerciseSelector';

interface WeightliftingPlanProps {
  onBack: () => void;
}

export const WeightliftingPlan: React.FC<WeightliftingPlanProps> = ({ onBack }) => {
  const { data: workoutPlans, isLoading } = useWorkoutPlans();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-neon"></div>
      </div>
    );
  }

  const selectedPlan = workoutPlans?.find(plan => plan.id === selectedDay);

  if (selectedDay && selectedPlan) {
    return (
      <ExerciseSelector
        workoutPlan={selectedPlan}
        onBack={() => setSelectedDay(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center p-4 max-w-lg mx-auto">
          <Button onClick={onBack} variant="ghost" size="icon" className="mr-3">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Weightlifting Plan</h1>
            <p className="text-sm text-muted-foreground">
              Plan your weekly workouts
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {workoutPlans?.map((plan) => (
          <DayPlanCard
            key={plan.id}
            workoutPlan={plan}
            onClick={() => setSelectedDay(plan.id)}
          />
        ))}
      </div>
    </div>
  );
};