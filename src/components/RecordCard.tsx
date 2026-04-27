import React, { useState, useEffect } from 'react';
import { Dumbbell, Save, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUpdateRecord } from '@/hooks/useWorkoutRecords';
import { useUserStats } from '@/hooks/useUserStats';
import { findStandard, getRating } from '@/lib/strengthStandards';
import { StrengthRating } from '@/components/StrengthRating';
import { toast } from 'sonner';

interface RecordCardProps {
  exerciseName: string;
  workoutPlanId: string;
  label: string;
  setType: 'standard' | 'top' | 'backoff';
  existingRecord?: {
    current_weight: number;
    previous_best: number | null;
    previous_best_reps: number | null;
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
  const { data: userStats } = useUserStats();

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

      toast.success("Record Saved", {
        description: `${exerciseName}: ${weight} ${unit}${reps ? ` × ${reps} reps` : ''}`,
      });
    } catch (error) {
      toast.error("Failed to save record");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const hasValue = currentWeight && parseFloat(currentWeight) > 0;

  // Compute true personal best from existingRecord
  let bestWeight: number | null = null;
  let bestReps: number | null = null;
  if (existingRecord) {
    const pb = existingRecord.previous_best;
    const pbReps = existingRecord.previous_best_reps;
    const cw = existingRecord.current_weight;
    const cr = existingRecord.actual_reps;
    if (pb !== null && cw) {
      if (cw > pb || (cw === pb && (cr || 0) > (pbReps || 0))) {
        bestWeight = cw;
        bestReps = cr;
      } else {
        bestWeight = pb;
        bestReps = pbReps;
      }
    } else if (pb !== null) {
      bestWeight = pb;
      bestReps = pbReps;
    } else if (cw) {
      bestWeight = cw;
      bestReps = cr;
    }
  }

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

        {/* Compute current personal best */}
        {(() => null)()}
        {/* Personal Best */}
        <div className="mb-3">
          <label className="text-sm font-medium text-muted-foreground">Personal Best</label>
          <div className="text-xl font-bold">
            {(() => {
              if (!bestWeight) return <span className="text-muted-foreground">—</span>;
              return (
                <span className="text-green-500">
                  {bestWeight} {unit}
                  {bestReps ? ` × ${bestReps} reps` : ''}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Strength Rating */}
        {bestWeight && findStandard(exerciseName) && (
          userStats ? (
            (() => {
              const rating = getRating(exerciseName, bestWeight, bestReps, userStats);
              if (!rating) return null;
              return (
                <StrengthRating
                  level={rating.level}
                  unit={rating.unit}
                  nextThreshold={rating.nextThreshold}
                  nextLevel={rating.nextLevel}
                />
              );
            })()
          ) : (
            <p className="text-xs text-muted-foreground mt-1 mb-1">
              <span className="opacity-70">Add your stats in </span>
              <span className="text-primary">Settings → My Stats</span>
              <span className="opacity-70"> to see a 1–10 rating</span>
            </p>
          )
        )}

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
                onKeyPress={handleKeyPress}
                className="text-lg font-semibold mt-1"
                min="0"
                step="1"
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={!hasValue || updateRecord.isPending}
          className="w-full mt-3"
          size="sm"
        >
          {updateRecord.isPending ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          {updateRecord.isPending ? 'Saving...' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
};
