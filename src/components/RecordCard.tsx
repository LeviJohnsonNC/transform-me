import React, { useState, useEffect } from 'react';
import { Dumbbell, Save, Loader2 } from 'lucide-react';
import { getExerciseArt } from '@/lib/exerciseArt';
import { cn } from '@/lib/utils';
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

  // Saved values render as strings in the inputs, so compare the same way the
  // inputs hold them — an empty box and a null record both read as ''.
  const savedWeight = existingRecord?.current_weight?.toString() || '';
  const savedReps = existingRecord?.actual_reps?.toString() || '';
  const isDirty = currentWeight !== savedWeight || currentReps !== savedReps;

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

  const art = getExerciseArt(exerciseName);
  // A backoff card continues the set above it, so the art rides on the top-set
  // card only — otherwise the same image appears twice in a row.
  const showArt = Boolean(art) && setType !== 'backoff';

  return (
    <Card className="surface rounded-[3px] scanlines relative overflow-hidden p-0">
      {/* 16:9 box for 16:9 art, so the whole frame shows and nothing is cropped. */}
      {showArt && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={art!}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Two-axis scrim, kept off the middle of the frame: it stays clear
              until the last third, where the label needs a backing, rather
              than washing the whole image down. */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-surface via-background/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/55 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent opacity-50" />
          <div className="absolute left-4 bottom-3 right-4">
            <div className="font-display text-[10px] tracking-[0.22em] text-cyan">{label}</div>
            <h3
              className="font-display font-bold text-[22px] leading-[1.1] mt-0.5"
              style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}
            >
              {exerciseName}
            </h3>
          </div>
        </div>
      )}

      <CardContent className={cn('p-4', showArt && 'pt-4')}>
        {!showArt && (
          <div className="flex items-start mb-3">
            {/* A backoff card skips the banner, but there is no reason for it to
                fall back to a generic dumbbell when we have art for this exact
                lift. 16:9 like the banner, just smaller. */}
            {art ? (
              <img
                src={art}
                alt=""
                loading="lazy"
                decoding="async"
                className="rounded-[3px] w-[64px] h-[36px] object-cover border border-cyan/20 mr-3 shrink-0"
              />
            ) : (
              <div className="rounded-[3px] bg-cyan/10 border border-cyan/25 p-2 mr-3">
                <Dumbbell size={18} className="text-cyan" />
              </div>
            )}
            <div>
              <h3 className="font-display font-semibold text-[15px] tracking-[0.02em]">{exerciseName}</h3>
              <p className="font-display text-[10px] tracking-[0.16em] text-faint mt-1">{label}</p>
            </div>
          </div>
        )}

        {/* Personal Best */}
        <div className="mb-3">
          <label className="font-display text-[10px] tracking-[0.2em] text-faint">PERSONAL BEST</label>
          <div className="font-display text-[26px] font-bold leading-none mt-1.5 tabular">
            {(() => {
              if (!bestWeight) return <span className="text-muted-foreground">—</span>;
              return (
                <span className="text-cyan" style={{ textShadow: '0 0 18px rgba(43,232,255,0.35)' }}>
                  {bestWeight}
                  <span className="text-dim text-[15px] font-semibold"> {unit}</span>
                  {bestReps ? <span className="text-dim text-[15px] font-semibold"> × {bestReps}</span> : ''}
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
              <span className="text-cyan">Settings → My Stats</span>
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
          className={cn(
            'w-full mt-4 h-11 rounded-[3px] font-display font-bold tracking-[0.12em]',
            // Solid cyan is the loudest thing on the card, so it only lights up
            // when there is actually something unsaved. Otherwise it sits back
            // as an outline and the art stays the focus.
            isDirty && hasValue
              ? 'bg-cyan text-[#06121A] hover:bg-cyan-soft'
              : 'bg-transparent border border-cyan/30 text-cyan/70 hover:bg-cyan/10 hover:text-cyan',
            'disabled:bg-transparent disabled:border-cyan/15 disabled:text-dim disabled:opacity-100',
          )}
          size="sm"
        >
          {updateRecord.isPending ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          {updateRecord.isPending ? 'SAVING' : isDirty && hasValue ? 'SAVE' : 'SAVED'}
        </Button>
      </CardContent>
    </Card>
  );
};
