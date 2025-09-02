import React, { useState } from 'react';
import { DaySelector } from '@/components/DaySelector';
import { RecordCard } from '@/components/RecordCard';
import { useWorkoutPlans, useWorkoutExercises } from '@/hooks/useWorkoutPlans';
import { useWorkoutRecords } from '@/hooks/useWorkoutRecords';

export const Records: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  
  const { data: workoutPlans, isLoading: plansLoading } = useWorkoutPlans();
  
  const selectedPlan = workoutPlans?.find(plan => plan.day_number === selectedDay);
  const { data: exercises, isLoading: exercisesLoading } = useWorkoutExercises(
    selectedPlan?.id || ''
  );
  const { data: records } = useWorkoutRecords(selectedPlan?.id || '');

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

  if (!workoutPlans?.length) {
    return (
      <div className="container mx-auto p-6 pb-24">
        <h1 className="text-2xl font-bold mb-6">Weightlifting Records</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No workout plans found. Set up your workout plan in Settings first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Weightlifting Records</h1>
      
      <div className="mb-6">
        <DaySelector 
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          workoutPlans={workoutPlans}
        />
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
            No exercises planned for Day {selectedDay}. Add exercises in Settings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map(exercise => {
            const existingRecord = records?.find(
              record => record.exercise_name === exercise.exercise_name
            );
            
            return (
              <RecordCard
                key={exercise.id}
                exercise={exercise}
                workoutPlanId={selectedPlan?.id || ''}
                existingRecord={existingRecord ? {
                  current_weight: existingRecord.current_weight,
                  previous_best: existingRecord.previous_best
                } : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};