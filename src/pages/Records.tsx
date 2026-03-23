import React, { useState, useMemo } from 'react';
import { DaySelector } from '@/components/DaySelector';
import { RecordCard } from '@/components/RecordCard';
import { useWorkoutPlans, useWorkoutExercises, WorkoutTier, formatExercisePrescription } from '@/hooks/useWorkoutPlans';
import { useWorkoutRecords } from '@/hooks/useWorkoutRecords';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TIER_OPTIONS: { value: WorkoutTier; label: string }[] = [
  { value: 'minimum', label: 'MED' },
  { value: 'good', label: 'Good' },
  { value: 'max', label: 'Max' },
];

// Build the label string for a record card
const buildLabel = (exercise: any, setType: 'standard' | 'top' | 'backoff') => {
  if (setType === 'top') {
    return `Top Set · ${exercise.sets}×${exercise.reps}`;
  }
  if (setType === 'backoff') {
    const repsStr = exercise.backoff_reps_high 
      ? `${exercise.backoff_reps}-${exercise.backoff_reps_high}`
      : `${exercise.backoff_reps}`;
    return `Backoff · ${exercise.backoff_sets}×${repsStr}`;
  }
  // standard
  return formatExercisePrescription(exercise);
};

export const Records: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTier, setSelectedTier] = useState<WorkoutTier>('good');
  
  const { data: workoutPlans, isLoading: plansLoading } = useWorkoutPlans();
  
  const { data: allExercises } = useQuery({
    queryKey: ['allWorkoutExercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('workout_plan_id, exercise_name');
      
      if (error) throw error;
      return data || [];
    }
  });
  
  const plansWithExercises = useMemo(() => {
    if (!workoutPlans || !allExercises) return [];
    return workoutPlans.filter(plan => 
      allExercises.some(exercise => exercise.workout_plan_id === plan.id)
    );
  }, [workoutPlans, allExercises]);
  
  React.useEffect(() => {
    if (plansWithExercises.length > 0 && !plansWithExercises.find(p => p.day_number === selectedDay)) {
      setSelectedDay(plansWithExercises[0].day_number);
    }
  }, [plansWithExercises, selectedDay]);
  
  const selectedPlan = workoutPlans?.find(plan => plan.day_number === selectedDay);
  const { data: exercises, isLoading: exercisesLoading } = useWorkoutExercises(
    selectedPlan?.id || '',
    selectedTier
  );
  const { data: records } = useWorkoutRecords(selectedPlan?.id || '');

  // Helper to find a record by exercise_name + set_type
  const findRecord = (exerciseName: string, setType: string) => {
    return records?.find(
      r => r.exercise_name === exerciseName && (r.set_type || 'standard') === setType
    );
  };

  if (plansLoading) {
    return (
      <div className="container mx-auto p-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!plansWithExercises?.length) {
    return (
      <div className="container mx-auto p-6 pb-24">
        <h1 className="text-2xl font-bold mb-6">Weightlifting Records</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No workout plans with exercises found. Set up your workout plan in Settings first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Weightlifting Records</h1>
      
      <div className="mb-4">
        <DaySelector 
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          workoutPlans={plansWithExercises}
        />
      </div>

      {/* Tier selector */}
      <div className="flex gap-2 mb-6">
        {TIER_OPTIONS.map((tier) => (
          <Button
            key={tier.value}
            variant={selectedTier === tier.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTier(tier.value)}
            className={cn(
              "flex-1",
              selectedTier === tier.value && "bg-primary text-primary-foreground"
            )}
          >
            {tier.label}
          </Button>
        ))}
      </div>

      {exercisesLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      ) : !exercises?.length ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No exercises planned for this tier. Add exercises in Settings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map(exercise => {
            const hasBackoff = exercise.backoff_sets && exercise.backoff_sets > 0;

            if (hasBackoff) {
              // Render TWO cards: top set + backoff
              const topRecord = findRecord(exercise.exercise_name, 'top');
              const backoffRecord = findRecord(exercise.exercise_name, 'backoff');

              return (
                <React.Fragment key={exercise.id}>
                  <RecordCard
                    exerciseName={exercise.exercise_name}
                    workoutPlanId={selectedPlan?.id || ''}
                    label={buildLabel(exercise, 'top')}
                    setType="top"
                    existingRecord={topRecord ? {
                      current_weight: topRecord.current_weight,
                      previous_best: topRecord.previous_best,
                      actual_reps: topRecord.actual_reps,
                    } : undefined}
                  />
                  <RecordCard
                    exerciseName={exercise.exercise_name}
                    workoutPlanId={selectedPlan?.id || ''}
                    label={buildLabel(exercise, 'backoff')}
                    setType="backoff"
                    existingRecord={backoffRecord ? {
                      current_weight: backoffRecord.current_weight,
                      previous_best: backoffRecord.previous_best,
                      actual_reps: backoffRecord.actual_reps,
                    } : undefined}
                  />
                </React.Fragment>
              );
            }

            // Standard single card
            const record = findRecord(exercise.exercise_name, 'standard');
            return (
              <RecordCard
                key={exercise.id}
                exerciseName={exercise.exercise_name}
                workoutPlanId={selectedPlan?.id || ''}
                label={buildLabel(exercise, 'standard')}
                setType="standard"
                existingRecord={record ? {
                  current_weight: record.current_weight,
                  previous_best: record.previous_best,
                  actual_reps: record.actual_reps,
                } : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
