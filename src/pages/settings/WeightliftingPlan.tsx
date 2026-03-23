import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkoutPlans, useAddWorkoutDay, useRenameWorkoutDay, useDeleteWorkoutDay } from '@/hooks/useWorkoutPlans';
import { DayPlanCard } from '@/components/DayPlanCard';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { useToast } from '@/hooks/use-toast';

interface WeightliftingPlanProps {
  onBack: () => void;
}

export const WeightliftingPlan: React.FC<WeightliftingPlanProps> = ({ onBack }) => {
  const { data: workoutPlans, isLoading } = useWorkoutPlans();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const addDay = useAddWorkoutDay();
  const renameDay = useRenameWorkoutDay();
  const deleteDay = useDeleteWorkoutDay();
  const { toast } = useToast();

  const handleAddDay = async () => {
    const nextNumber = (workoutPlans?.length || 0) + 1;
    try {
      await addDay.mutateAsync({ dayName: `Day ${nextNumber}`, dayNumber: nextNumber });
      toast({ title: "Success", description: `Day ${nextNumber} added` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add day", variant: "destructive" });
    }
  };

  const handleRename = async (id: string, newName: string) => {
    try {
      await renameDay.mutateAsync({ id, dayName: newName });
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename day", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDay.mutateAsync(id);
      toast({ title: "Success", description: "Day deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete day", variant: "destructive" });
    }
  };

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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center p-4 max-w-lg mx-auto">
          <Button onClick={onBack} variant="ghost" size="icon" className="mr-3">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Weightlifting Plan</h1>
            <p className="text-sm text-muted-foreground">
              {workoutPlans?.length || 0} days · Plan your weekly workouts
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
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))}

        <Button
          onClick={handleAddDay}
          className="w-full"
          variant="outline"
          disabled={addDay.isPending}
        >
          <Plus size={16} className="mr-2" />
          Add Day
        </Button>
      </div>
    </div>
  );
};
