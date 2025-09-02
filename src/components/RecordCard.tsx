import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUpdateRecord } from '@/hooks/useWorkoutRecords';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
}

interface RecordCardProps {
  exercise: Exercise;
  workoutPlanId: string;
  existingRecord?: {
    current_weight: number;
    previous_best: number | null;
  };
}

export const RecordCard: React.FC<RecordCardProps> = ({ 
  exercise, 
  workoutPlanId, 
  existingRecord 
}) => {
  const [currentWeight, setCurrentWeight] = useState(
    existingRecord?.current_weight?.toString() || ''
  );
  const updateRecord = useUpdateRecord();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentWeight(existingRecord?.current_weight?.toString() || '');
  }, [existingRecord]);

  const handleWeightChange = (value: string) => {
    setCurrentWeight(value);
  };

  const handleWeightSave = async () => {
    const weight = parseFloat(currentWeight);
    if (!weight || weight <= 0) return;

    try {
      await updateRecord.mutateAsync({
        workout_plan_id: workoutPlanId,
        exercise_name: exercise.exercise_name,
        current_weight: weight,
      });

      const isNewBest = !existingRecord?.previous_best || weight > existingRecord.previous_best;
      if (isNewBest) {
        toast({
          title: "New Personal Best! 🎉",
          description: `${exercise.exercise_name}: ${weight} lbs`,
        });
      } else {
        toast({
          title: "Record Updated",
          description: `${exercise.exercise_name}: ${weight} lbs`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save record",
        variant: "destructive",
      });
    }
  };

  const handleBlur = () => {
    if (currentWeight && parseFloat(currentWeight) > 0) {
      handleWeightSave();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWeightSave();
    }
  };

  return (
    <Card className="bg-card/30 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-primary/20 rounded-lg p-2 mr-3">
              <Dumbbell size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{exercise.exercise_name}</h3>
              <p className="text-sm text-muted-foreground">
                {exercise.sets} sets × {exercise.reps} reps
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Previous Best
            </label>
            <div className="text-2xl font-bold">
              {existingRecord?.previous_best ? (
                <span className="text-green-500">
                  {existingRecord.previous_best} lbs
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Current
            </label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={currentWeight}
              onChange={(e) => handleWeightChange(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className="text-lg font-semibold mt-1"
              min="0"
              step="0.5"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};