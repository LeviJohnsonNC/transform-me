import React, { useState, useMemo, useEffect } from 'react';
import { DaySelector } from '@/components/DaySelector';
import { RecordCard, type RecordSet } from '@/components/RecordCard';
import { fixedRepsFor } from '@/lib/recordMath';
import { readResume, writeResume } from '@/lib/resumeState';
import {
  useWorkoutPlans,
  useWorkoutExercises,
  formatExercisePrescription,
  type WorkoutExercise,
  type WorkoutTier,
} from '@/hooks/useWorkoutPlans';
import { useLoggedToday, useWorkoutRecords } from '@/hooks/useWorkoutRecords';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SegmentedControl } from '@/components/SegmentedControl';

const TIER_OPTIONS: { value: WorkoutTier; label: string; ariaLabel: string }[] = [
  { value: 'minimum', label: 'MED', ariaLabel: 'Minimum effective dose' },
  { value: 'good', label: 'GOOD', ariaLabel: 'Good' },
  { value: 'max', label: 'MAX', ariaLabel: 'Max' },
];

const buildLabel = (exercise: WorkoutExercise, setType: 'standard' | 'top' | 'backoff') => {
  if (setType === 'top') {
    return `Top Set · ${exercise.sets}×${exercise.reps}`;
  }
  if (setType === 'backoff') {
    const repsStr = exercise.backoff_reps_high 
      ? `${exercise.backoff_reps}-${exercise.backoff_reps_high}`
      : `${exercise.backoff_reps}`;
    return `Backoff · ${exercise.backoff_sets}×${repsStr}`;
  }
  return formatExercisePrescription(exercise);
};

export const Records: React.FC = () => {
  // Reopen on the day and tier you were logging, if you left recently — the
  // difference between coming back to your workout and re-picking it.
  const [selectedDay, setSelectedDay] = useState<number | null>(
    () => readResume()?.recordsDay ?? null,
  );
  const [selectedTier, setSelectedTier] = useState<WorkoutTier | null>(() => {
    const tier = readResume()?.recordsTier;
    return tier === 'minimum' || tier === 'good' || tier === 'max' ? tier : null;
  });

  useEffect(() => {
    writeResume({ recordsDay: selectedDay, recordsTier: selectedTier });
  }, [selectedDay, selectedTier]);
  
  const { data: workoutPlans, isLoading: plansLoading } = useWorkoutPlans();
  const { data: loggedToday } = useLoggedToday();
  
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
  
  const selectedPlan = selectedDay !== null 
    ? workoutPlans?.find(plan => plan.day_number === selectedDay) 
    : undefined;

  const { data: exercises, isLoading: exercisesLoading } = useWorkoutExercises(
    (selectedPlan?.id && selectedTier) ? selectedPlan.id : '',
    selectedTier || 'good'
  );
  const { data: records } = useWorkoutRecords(
    (selectedPlan?.id && selectedTier) ? selectedPlan.id : ''
  );

  const findRecord = (exerciseName: string, setType: string) => {
    return records?.find(
      r => r.exercise_name === exerciseName && (r.set_type || 'standard') === setType
    );
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    setSelectedTier(null);
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

  const showTierSelector = selectedDay !== null;
  const showExercises = selectedDay !== null && selectedTier !== null;

  return (
    <div className="container mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Weightlifting Records</h1>
      
      <div className="mb-4">
        <DaySelector 
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
          workoutPlans={plansWithExercises}
          loggedToday={loggedToday}
        />
      </div>

      {showTierSelector && (
        <SegmentedControl<WorkoutTier>
          ariaLabel="Workout level"
          tone="cyan"
          className="mb-6"
          segmentClassName="h-10 text-[13px] font-semibold tracking-[0.12em]"
          value={selectedTier}
          onChange={setSelectedTier}
          segments={TIER_OPTIONS}
        />
      )}

      {!showTierSelector && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Select a day to get started.</p>
        </div>
      )}

      {showTierSelector && !showExercises && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Select a tier to see exercises.</p>
        </div>
      )}

      {showExercises && exercisesLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      )}

      {showExercises && !exercisesLoading && !exercises?.length && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No exercises planned for this tier. Add exercises in Settings.
          </p>
        </div>
      )}

      {showExercises && !exercisesLoading && exercises?.length ? (
        <div className="space-y-4">
          {exercises.map(exercise => {
            const hasBackoff = Boolean(exercise.backoff_sets && exercise.backoff_sets > 0);
            const toStored = (setType: string) => {
              const r = findRecord(exercise.exercise_name, setType);
              return r ? {
                current_weight: r.current_weight,
                previous_best: r.previous_best,
                previous_best_reps: r.previous_best_reps,
                actual_reps: r.actual_reps,
              } : undefined;
            };

            // A top set and its backoff are one exercise, so they share a card:
            // the backoff is a second row under the top set, not a card of its own.
            const sets: RecordSet[] = hasBackoff
              ? [
                  {
                    setType: 'top',
                    label: buildLabel(exercise, 'top'),
                    fixedReps: fixedRepsFor(exercise, 'top'),
                    existingRecord: toStored('top'),
                  },
                  {
                    setType: 'backoff',
                    label: buildLabel(exercise, 'backoff'),
                    fixedReps: fixedRepsFor(exercise, 'backoff'),
                    existingRecord: toStored('backoff'),
                  },
                ]
              : [
                  {
                    setType: 'standard',
                    label: buildLabel(exercise, 'standard'),
                    fixedReps: fixedRepsFor(exercise, 'standard'),
                    existingRecord: toStored('standard'),
                  },
                ];

            return (
              <RecordCard
                key={exercise.id}
                exerciseName={exercise.exercise_name}
                workoutPlanId={selectedPlan?.id || ''}
                subtitle={formatExercisePrescription(exercise)}
                sets={sets}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
