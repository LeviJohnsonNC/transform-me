import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUpdateRecord } from '@/hooks/useWorkoutRecords';
import { useToast } from '@/hooks/use-toast';

interface RecordCardProps {
  exerciseName: string;
  workoutPlanId: string;
  label: string;
  setType: 'standard' | 'top' | 'backoff';
  existingRecord?: {
    current_weight: number;
    previous_best: number | null;
    actual_reps: number | null;
  };
}

export const RecordCard: React.FC<RecordCardProps> = ({ 
  exerciseName,
  workoutPlanId,
  label,
  setType,
  existingRecord,
}) => {
  const [currentWeight, setCurrentWeight] = useState(
    existingRecord?.current_weight?.toString() || ''
  );
  const [currentReps, setCurrentReps] = useState(
    existingRecord?.actual_reps?.toString() || ''
  );
  const updateRecord = useUpdateRecord();
  const { toast } = useToast();

  const getUnit = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('plank')) return 'seconds';
    if (n.includes('ab wheel') || n.includes('ab roller')) return 'reps';
    if (n.includes('hanging leg raise')) return 'reps';
    if (n.includes('pull-up') || n.includes('chin-up') || n.includes('pull up') || n.includes('chin up')) return 'reps';
    if (n.includes('dip')) return 'reps';
    if (n.includes('walking lunge') || n.includes('stationary lunge') || n.includes('lunge')) return 'lbs';
    return 'lbs';
  };

  const unit = getUnit(exerciseName);

  useEffect(() => {
    setCurrentWeight(existingRecord?.current_weight?.toString() || '');
    setCurrentReps(existingRecord?.actual_reps?.toString() || '');
  }, [existingRecord]);

  const handleSave = async () => {
    const weight = parseFloat(currentWeight);
    if (!weight || weight <= 0) return;

    const reps = currentReps ? parseInt(currentReps) : null;

    try {
      await updateRecord.mutateAsync({
        workout_plan_id: workoutPlanId,
        exercise_name: exerciseName,
        current_weight: weight,
        actual_reps: reps,
        set_type: setType,
      });

      const isNewBest = !existingRecord?.previous_best || weight > existingRecord.previous_best;
      toast({
        title: isNewBest ? "New Personal Best! 🎉" : "Record Updated",
        description: `${exerciseName}: ${weight} ${unit}${reps ? ` × ${reps} reps` : ''}`,
      });
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
      handleSave();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Card className="bg-card/30 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start mb-3">
          <div className="bg-primary/20 rounded-lg p-2 mr-3">
            <Dumbbell size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{exerciseName}</h3>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>

        {/* Previous best */}
        <div className="mb-3">
          <label className="text-sm font-medium text-muted-foreground">Previous Best</label>
          <div className="text-xl font-bold">
            {existingRecord?.previous_best ? (
              <span className="text-green-500">
                {existingRecord.previous_best} {unit}
                {existingRecord.actual_reps ? ` × ${existingRecord.actual_reps} reps` : ''}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Input row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {unit === 'reps' ? 'Reps' : unit === 'seconds' ? 'Seconds' : 'Weight (lbs)'}
            </label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className="text-lg font-semibold mt-1"
              min="0"
              step="0.5"
            />
          </div>
          {unit === 'lbs' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Reps</label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={currentReps}
                onChange={(e) => setCurrentReps(e.target.value)}
                onBlur={handleBlur}
                onKeyPress={handleKeyPress}
                className="text-lg font-semibold mt-1"
                min="0"
                step="1"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
