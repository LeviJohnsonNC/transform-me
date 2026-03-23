import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkoutExercises, useAddExercise, useUpdateExercise, useRemoveExercise } from '@/hooks/useWorkoutPlans';
import { WorkoutPlan } from './DayPlanCard';
import { useToast } from '@/hooks/use-toast';

export const EXERCISES = [
  // Lower Body
  'Back Squat', 'DB RDL', 'Split Squat', 'Calf Raises', 'Deadlift', 
  'Goblet Squat', 'Hip Thrust', 'Hamstring Curl',
  // Upper Body
  'Bench Press', '1-Arm DB Row', 'Incline DB', 'Inverted Row', 
  'DB Overhead Press', 'Pull-ups', 'Dips', 'Curls', 'Triceps Extensions',
  // Core
  'Ab roller', 'Side plank', 'Dead bug',
  // Other
  'Fun (Any lift)', 'Active Recovery'
];

const TIER_LABELS = {
  minimum: 'MED',
  good: 'Good',
  max: 'Max',
} as const;

interface TierValues {
  sets_minimum: number;
  reps_minimum: number;
  sets_good: number;
  reps_good: number;
  sets_max: number;
  reps_max: number;
}

interface ExerciseSelectorProps {
  workoutPlan: WorkoutPlan;
  onBack: () => void;
}

interface NewExercise {
  exercise_name: string;
  rep_type: 'fixed' | 'amrap';
  sets_minimum: number;
  reps_minimum: number;
  sets_good: number;
  reps_good: number;
  sets_max: number;
  reps_max: number;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ workoutPlan, onBack }) => {
  const { toast } = useToast();
  const { data: exercises, isLoading } = useWorkoutExercises(workoutPlan.id);
  const addExercise = useAddExercise();
  const updateExercise = useUpdateExercise();
  const removeExercise = useRemoveExercise();

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState<NewExercise>({
    exercise_name: '',
    rep_type: 'fixed',
    sets_minimum: 2,
    reps_minimum: 8,
    sets_good: 3,
    reps_good: 10,
    sets_max: 4,
    reps_max: 10,
  });

  const handleAddExercise = async () => {
    if (!newExercise.exercise_name) {
      toast({ title: "Error", description: "Please select an exercise", variant: "destructive" });
      return;
    }

    try {
      await addExercise.mutateAsync({
        workout_plan_id: workoutPlan.id,
        exercise_name: newExercise.exercise_name,
        sets: newExercise.sets_good,
        reps: newExercise.reps_good,
        rep_type: newExercise.rep_type,
        order_index: exercises?.length || 0,
        sets_minimum: newExercise.sets_minimum,
        reps_minimum: newExercise.reps_minimum,
        sets_good: newExercise.sets_good,
        reps_good: newExercise.reps_good,
        sets_max: newExercise.sets_max,
        reps_max: newExercise.reps_max,
      });

      setNewExercise({
        exercise_name: '', rep_type: 'fixed',
        sets_minimum: 2, reps_minimum: 8,
        sets_good: 3, reps_good: 10,
        sets_max: 4, reps_max: 10,
      });
      setIsAddingExercise(false);
      toast({ title: "Success", description: "Exercise added to your plan" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add exercise", variant: "destructive" });
    }
  };

  const handleUpdateTierValue = async (
    exerciseId: string,
    field: keyof TierValues,
    value: number
  ) => {
    try {
      await updateExercise.mutateAsync({ id: exerciseId, [field]: value });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update exercise", variant: "destructive" });
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      await removeExercise.mutateAsync(exerciseId);
      toast({ title: "Success", description: "Exercise removed from your plan" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove exercise", variant: "destructive" });
    }
  };

  const TierGrid = ({
    values,
    repType,
    onChange,
  }: {
    values: { sets_minimum: number; reps_minimum: number; sets_good: number; reps_good: number; sets_max: number; reps_max: number };
    repType: 'fixed' | 'amrap';
    onChange: (field: string, value: number) => void;
  }) => (
    <div className="grid grid-cols-3 gap-2">
      {(['minimum', 'good', 'max'] as const).map((tier) => (
        <div key={tier} className="space-y-2">
          <p className="text-xs font-medium text-center text-muted-foreground">
            {TIER_LABELS[tier]}
          </p>
          <div>
            <Label className="text-xs text-muted-foreground">Sets</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={values[`sets_${tier}`]}
              onChange={(e) => onChange(`sets_${tier}`, parseInt(e.target.value) || 1)}
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              {repType === 'amrap' ? 'Target' : 'Reps'}
            </Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={values[`reps_${tier}`]}
              onChange={(e) => onChange(`reps_${tier}`, parseInt(e.target.value) || 1)}
              className="mt-1 h-8 text-sm"
            />
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-neon"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center p-4 max-w-lg mx-auto">
          <Button onClick={onBack} variant="ghost" size="icon" className="mr-3">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{workoutPlan.day_name}</h1>
            <p className="text-sm text-muted-foreground">
              {exercises?.length || 0} exercises planned
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {exercises?.map((exercise) => (
          <Card key={exercise.id} className="bg-card/30 border-border/50 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{exercise.exercise_name}</h3>
                  {exercise.rep_type === 'amrap' && (
                    <span className="text-xs text-primary font-medium">AMRAP</span>
                  )}
                </div>
                <Button
                  onClick={() => handleRemoveExercise(exercise.id)}
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant={exercise.rep_type === 'fixed' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateExercise.mutate({ id: exercise.id, rep_type: 'fixed' })}
                  >
                    Fixed
                  </Button>
                  <Button
                    variant={exercise.rep_type === 'amrap' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateExercise.mutate({ id: exercise.id, rep_type: 'amrap' })}
                  >
                    AMRAP
                  </Button>
                </div>

                <TierGrid
                  values={{
                    sets_minimum: exercise.sets_minimum ?? exercise.sets,
                    reps_minimum: exercise.reps_minimum ?? exercise.reps,
                    sets_good: exercise.sets_good ?? exercise.sets,
                    reps_good: exercise.reps_good ?? exercise.reps,
                    sets_max: exercise.sets_max ?? exercise.sets,
                    reps_max: exercise.reps_max ?? exercise.reps,
                  }}
                  repType={exercise.rep_type}
                  onChange={(field, value) => handleUpdateTierValue(exercise.id, field as keyof TierValues, value)}
                />
              </div>
            </div>
          </Card>
        ))}

        {isAddingExercise && (
          <Card className="bg-card/30 border-border/50 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Add Exercise</h3>

              <div>
                <Label className="text-sm">Exercise</Label>
                <Select
                  value={newExercise.exercise_name}
                  onValueChange={(value) => setNewExercise(prev => ({ ...prev, exercise_name: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISES.map((exercise) => (
                      <SelectItem key={exercise} value={exercise}>
                        {exercise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={newExercise.rep_type === 'fixed' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setNewExercise(prev => ({ ...prev, rep_type: 'fixed' }))}
                  >
                    Fixed
                  </Button>
                  <Button
                    variant={newExercise.rep_type === 'amrap' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setNewExercise(prev => ({ ...prev, rep_type: 'amrap' }))}
                  >
                    AMRAP
                  </Button>
                </div>

                <TierGrid
                  values={newExercise}
                  repType={newExercise.rep_type}
                  onChange={(field, value) => setNewExercise(prev => ({ ...prev, [field]: value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddExercise} className="flex-1" disabled={addExercise.isPending}>
                  <Save size={16} className="mr-2" />
                  {addExercise.isPending ? 'Adding...' : 'Add Exercise'}
                </Button>
                <Button onClick={() => setIsAddingExercise(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Button
          onClick={() => setIsAddingExercise(true)}
          className="w-full"
          variant="outline"
          disabled={isAddingExercise}
        >
          <Plus size={16} className="mr-2" />
          Add Exercise
        </Button>
      </div>
    </div>
  );
};
