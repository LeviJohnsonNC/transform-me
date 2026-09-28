import React, { useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkoutExercises, useAddExercise, useUpdateExercise, useRemoveExercise, WorkoutTier, WorkoutExercise, formatExercisePrescription } from '@/hooks/useWorkoutPlans';
import { WorkoutPlan } from './DayPlanCard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const EXERCISES = [
  // Chest
  'Bench Press', 'Incline Bench Press', 'Incline Dumbbell Bench', 'Flat Dumbbell Bench', 'Close-Grip Bench', 'Push-Ups',
  // Back
  'Barbell Row', '1-Arm DB Row', 'Lat Pulldown', 'Seated Cable Row', 'Inverted Row', 'Chin-Ups', 'Pull-Ups',
  // Shoulders
  'Overhead Press', 'DB Shoulder Press', 'Lateral Raise', 'Rear Delt DB Fly', 'Upright Row',
  // Arms
  'Barbell Curl', 'Hammer Curl', 'Skull Crushers', 'Dips', 'Triceps Extensions',
  // Lower Body
  'Back Squat', 'Deadlift', 'Romanian Deadlift', 'Goblet Squat', 'Bulgarian Split Squat',
  'Front Squat', 'Leg Press', 'Trap Bar Deadlift', 'Walking Lunges', 'Lunges', 'Barbell Hip Thrust',
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

type ExerciseFieldValues = Omit<NewExercise, 'exercise_name'>;

/** The sets, reps, backoff and fixed/AMRAP inputs, shared by add and edit. */
const ExerciseFields: React.FC<{
  value: ExerciseFieldValues;
  onChange: (patch: Partial<ExerciseFieldValues>) => void;
}> = ({ value, onChange }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs">Sets (top set)</Label>
        <Input type="number" min="1" max="10" value={value.sets}
          onChange={(e) => onChange({ sets: parseInt(e.target.value) || 1 })}
          className="mt-1 h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs">Reps</Label>
        <Input type="number" min="1" max="100" value={value.reps}
          onChange={(e) => onChange({ reps: parseInt(e.target.value) || 1 })}
          className="mt-1 h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs">Reps High (optional, for range)</Label>
        <Input type="number" min="0" max="100"
          value={value.reps_high ?? ''}
          placeholder="e.g. 10"
          onChange={(e) => onChange({ reps_high: e.target.value ? parseInt(e.target.value) : null })}
          className="mt-1 h-8 text-sm" />
      </div>
    </div>

    <div>
      <Label className="text-xs font-medium">Backoff Sets (optional)</Label>
      <div className="grid grid-cols-3 gap-2 mt-1">
        <div>
          <Label className="text-xs text-muted-foreground">Sets</Label>
          <Input type="number" min="0" max="10"
            value={value.backoff_sets ?? ''}
            placeholder="0"
            onChange={(e) => onChange({ backoff_sets: e.target.value ? parseInt(e.target.value) : null })}
            className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Reps</Label>
          <Input type="number" min="0" max="100"
            value={value.backoff_reps ?? ''}
            placeholder="0"
            onChange={(e) => onChange({ backoff_reps: e.target.value ? parseInt(e.target.value) : null })}
            className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Reps High</Label>
          <Input type="number" min="0" max="100"
            value={value.backoff_reps_high ?? ''}
            placeholder=""
            onChange={(e) => onChange({ backoff_reps_high: e.target.value ? parseInt(e.target.value) : null })}
            className="mt-1 h-8 text-sm" />
        </div>
      </div>
    </div>

    <div className="flex gap-2">
      <Button
        variant={value.rep_type === 'fixed' ? 'default' : 'outline'}
        size="sm" className="flex-1"
        onClick={() => onChange({ rep_type: 'fixed' })}
      >Fixed</Button>
      <Button
        variant={value.rep_type === 'amrap' ? 'default' : 'outline'}
        size="sm" className="flex-1"
        onClick={() => onChange({ rep_type: 'amrap' })}
      >AMRAP</Button>
    </div>
  </>
);

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

  // The exercise being edited, and its fields as typed so far.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExerciseFieldValues | null>(null);

  const startEditing = (exercise: WorkoutExercise) => {
    setEditingId(exercise.id);
    setDraft({
      rep_type: exercise.rep_type,
      sets: exercise.sets,
      reps: exercise.reps,
      reps_high: exercise.reps_high,
      backoff_sets: exercise.backoff_sets,
      backoff_reps: exercise.backoff_reps,
      backoff_reps_high: exercise.backoff_reps_high,
    });
  };

  const stopEditing = () => {
    setEditingId(null);
    setDraft(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !draft) return;
    try {
      await updateExercise.mutateAsync({ id: editingId, ...draft });
      stopEditing();
      toast({ title: "Success", description: "Exercise updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update exercise", variant: "destructive" });
    }
  };

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
              onClick={() => { setSelectedTier(tier.value); stopEditing(); }}
              className={cn(
                "flex-1",
                selectedTier === tier.value && "bg-primary text-primary-foreground"
              )}
            >
              {tier.label}
            </Button>
          ))}
        </div>

        {exercises?.map((exercise) =>
          editingId === exercise.id && draft ? (
            <Card key={exercise.id} className="bg-card/30 border-border/50 p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">{exercise.exercise_name}</h3>
                <ExerciseFields value={draft} onChange={(patch) => setDraft(prev => ({ ...prev, ...patch }))} />
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="flex-1" disabled={updateExercise.isPending}>
                    <Save size={16} className="mr-2" />
                    {updateExercise.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={stopEditing} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
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
                <div className="flex">
                  <Button
                    onClick={() => startEditing(exercise)}
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${exercise.exercise_name}`}
                    className="text-primary-neon hover:text-primary-neon/80"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    onClick={() => handleRemoveExercise(exercise.id)}
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${exercise.exercise_name}`}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ),
        )}

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

              <ExerciseFields value={newExercise} onChange={(patch) => setNewExercise(prev => ({ ...prev, ...patch }))} />

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
