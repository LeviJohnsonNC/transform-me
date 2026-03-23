import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkoutExercises, useAddExercise, useUpdateExercise, useRemoveExercise, WorkoutTier, formatExercisePrescription } from '@/hooks/useWorkoutPlans';
import { WorkoutPlan } from './DayPlanCard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const EXERCISES = [
  // Chest
  'Bench Press', 'Incline Dumbbell Bench', 'Flat Dumbbell Bench', 'Close-Grip Bench',
  // Back
  'Barbell Row', '1-Arm DB Row', 'Inverted Row', 'Chin-Ups', 'Pull-Ups',
  // Shoulders
  'Overhead Press', 'DB Shoulder Press', 'Lateral Raise', 'Rear Delt DB Fly', 'Upright Row',
  // Arms
  'Barbell Curl', 'Hammer Curl', 'Skull Crushers', 'Dips', 'Triceps Extensions',
  // Lower Body
  'Back Squat', 'Deadlift', 'Romanian Deadlift', 'Goblet Squat', 'Bulgarian Split Squat',
  'Front Squat', 'Walking Lunges', 'Lunges', 'Barbell Hip Thrust',
  'Standing Calf Raise', 'Calf Raises',
  // Core
  'Ab Wheel', 'Hanging Leg Raise', 'Plank', 'Side Plank', 'Dead Bug',
  // Other
  'Fun (Any lift)', 'Active Recovery',
];

const TIER_OPTIONS: { value: WorkoutTier; label: string }[] = [
  { value: 'minimum', label: 'MED' },
  { value: 'good', label: 'Good' },
  { value: 'max', label: 'Max' },
];

interface ExerciseSelectorProps {
  workoutPlan: WorkoutPlan;
  onBack: () => void;
}

interface NewExercise {
  exercise_name: string;
  rep_type: 'fixed' | 'amrap';
  sets: number;
  reps: number;
  reps_high: number | null;
  backoff_sets: number | null;
  backoff_reps: number | null;
  backoff_reps_high: number | null;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ workoutPlan, onBack }) => {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<WorkoutTier>('good');
  const { data: exercises, isLoading } = useWorkoutExercises(workoutPlan.id, selectedTier);
  const addExercise = useAddExercise();
  const updateExercise = useUpdateExercise();
  const removeExercise = useRemoveExercise();

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [newExercise, setNewExercise] = useState<NewExercise>({
    exercise_name: '',
    rep_type: 'fixed',
    sets: 3,
    reps: 10,
    reps_high: null,
    backoff_sets: null,
    backoff_reps: null,
    backoff_reps_high: null,
  });

  const handleAddExercise = async () => {
    const name = customExerciseName || newExercise.exercise_name;
    if (!name) {
      toast({ title: "Error", description: "Please select or enter an exercise name", variant: "destructive" });
      return;
    }

    try {
      await addExercise.mutateAsync({
        workout_plan_id: workoutPlan.id,
        exercise_name: name,
        sets: newExercise.sets,
        reps: newExercise.reps,
        rep_type: newExercise.rep_type,
        order_index: exercises?.length || 0,
        tier: selectedTier,
        reps_high: newExercise.reps_high ?? undefined,
        backoff_sets: newExercise.backoff_sets ?? undefined,
        backoff_reps: newExercise.backoff_reps ?? undefined,
        backoff_reps_high: newExercise.backoff_reps_high ?? undefined,
      });

      setNewExercise({
        exercise_name: '', rep_type: 'fixed',
        sets: 3, reps: 10, reps_high: null,
        backoff_sets: null, backoff_reps: null, backoff_reps_high: null,
      });
      setCustomExerciseName('');
      setIsAddingExercise(false);
      toast({ title: "Success", description: "Exercise added" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add exercise", variant: "destructive" });
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      await removeExercise.mutateAsync(exerciseId);
      toast({ title: "Success", description: "Exercise removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove exercise", variant: "destructive" });
    }
  };

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
              {exercises?.length || 0} exercises · {TIER_OPTIONS.find(t => t.value === selectedTier)?.label}
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Tier selector */}
        <div className="flex gap-2">
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

        {exercises?.map((exercise) => (
          <Card key={exercise.id} className="bg-card/30 border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{exercise.exercise_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatExercisePrescription(exercise)}
                </p>
                {exercise.notes && (
                  <p className="text-xs text-muted-foreground/70 mt-1 italic">{exercise.notes}</p>
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
          </Card>
        ))}

        {isAddingExercise && (
          <Card className="bg-card/30 border-border/50 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Add Exercise ({TIER_OPTIONS.find(t => t.value === selectedTier)?.label})</h3>

              <div>
                <Label className="text-sm">Exercise (select or type custom)</Label>
                <select
                  value={newExercise.exercise_name}
                  onChange={(e) => {
                    setNewExercise(prev => ({ ...prev, exercise_name: e.target.value }));
                    setCustomExerciseName('');
                  }}
                  className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">-- Select --</option>
                  {EXERCISES.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
                <Input
                  placeholder="Or type a custom name..."
                  value={customExerciseName}
                  onChange={(e) => {
                    setCustomExerciseName(e.target.value);
                    setNewExercise(prev => ({ ...prev, exercise_name: '' }));
                  }}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Sets (top set)</Label>
                  <Input type="number" min="1" max="10" value={newExercise.sets}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, sets: parseInt(e.target.value) || 1 }))}
                    className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Reps</Label>
                  <Input type="number" min="1" max="100" value={newExercise.reps}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, reps: parseInt(e.target.value) || 1 }))}
                    className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Reps High (optional, for range)</Label>
                  <Input type="number" min="0" max="100"
                    value={newExercise.reps_high ?? ''}
                    placeholder="e.g. 10"
                    onChange={(e) => setNewExercise(prev => ({ ...prev, reps_high: e.target.value ? parseInt(e.target.value) : null }))}
                    className="mt-1 h-8 text-sm" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium">Backoff Sets (optional)</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <Label className="text-xs text-muted-foreground">Sets</Label>
                    <Input type="number" min="0" max="10"
                      value={newExercise.backoff_sets ?? ''}
                      placeholder="0"
                      onChange={(e) => setNewExercise(prev => ({ ...prev, backoff_sets: e.target.value ? parseInt(e.target.value) : null }))}
                      className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Reps</Label>
                    <Input type="number" min="0" max="100"
                      value={newExercise.backoff_reps ?? ''}
                      placeholder="0"
                      onChange={(e) => setNewExercise(prev => ({ ...prev, backoff_reps: e.target.value ? parseInt(e.target.value) : null }))}
                      className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Reps High</Label>
                    <Input type="number" min="0" max="100"
                      value={newExercise.backoff_reps_high ?? ''}
                      placeholder=""
                      onChange={(e) => setNewExercise(prev => ({ ...prev, backoff_reps_high: e.target.value ? parseInt(e.target.value) : null }))}
                      className="mt-1 h-8 text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={newExercise.rep_type === 'fixed' ? 'default' : 'outline'}
                  size="sm" className="flex-1"
                  onClick={() => setNewExercise(prev => ({ ...prev, rep_type: 'fixed' }))}
                >Fixed</Button>
                <Button
                  variant={newExercise.rep_type === 'amrap' ? 'default' : 'outline'}
                  size="sm" className="flex-1"
                  onClick={() => setNewExercise(prev => ({ ...prev, rep_type: 'amrap' }))}
                >AMRAP</Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddExercise} className="flex-1" disabled={addExercise.isPending}>
                  <Save size={16} className="mr-2" />
                  {addExercise.isPending ? 'Adding...' : 'Add'}
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
