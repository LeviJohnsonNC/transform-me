import React, { useState, useEffect } from 'react';
import { Dumbbell, Save, Loader2, Check } from 'lucide-react';
import { getExerciseArt } from '@/lib/exerciseArt';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUpdateRecord } from '@/hooks/useWorkoutRecords';
import { useUserStats } from '@/hooks/useUserStats';
import { findStandard, getRating } from '@/lib/strengthStandards';
import { StrengthRating } from '@/components/StrengthRating';
import {
  bestForRating,
  canSave,
  formatAmount,
  personalBest,
  unitFor,
  type SetType,
  type StoredRecord,
  type Unit,
} from '@/lib/recordMath';
import { toast } from 'sonner';

export interface RecordSet {
  setType: SetType;
  /** Shown above the set's row, e.g. "Top Set · 1×5". */
  label: string;
  /** When the plan pins the rep count, the reps box shows it and cannot be edited. */
  fixedReps: number | null;
  existingRecord?: StoredRecord;
}

interface RecordCardProps {
  exerciseName: string;
  workoutPlanId: string;
  /** Line above the exercise name, e.g. "1×5, then 3×8". */
  subtitle: string;
  /** One entry per set type. A top set and its backoff share a card. */
  sets: RecordSet[];
}

/**
 * One exercise. A lift with a backoff used to render as two cards — the second
 * with its own header and a thumbnail of the same art — which read as two
 * exercises. Now the backoff is a second row inside the same card.
 */
export const RecordCard: React.FC<RecordCardProps> = ({ exerciseName, workoutPlanId, subtitle, sets }) => {
  const { data: userStats } = useUserStats();
  const unit = unitFor(exerciseName);
  const art = getExerciseArt(exerciseName);
  const multi = sets.length > 1;
  const rating = (
    <CardRating
      exerciseName={exerciseName}
      unit={unit}
      records={sets.map((s) => s.existingRecord)}
      userStats={userStats}
    />
  );

  return (
    <Card className="surface rounded-[3px] scanlines relative overflow-hidden p-0">
      {art ? (
        // 16:9 box for 16:9 art, so the whole frame shows and nothing is cropped.
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={art}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-surface via-background/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/55 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent opacity-50" />
          <div className="absolute left-4 bottom-3 right-4">
            <div className="font-display text-[10px] tracking-[0.22em] text-cyan">{subtitle}</div>
            <h3
              className="font-display font-bold text-[22px] leading-[1.1] mt-0.5"
              style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}
            >
              {exerciseName}
            </h3>
          </div>
        </div>
      ) : null}

      <CardContent className="p-4">
        {!art && (
          <div className="flex items-start mb-3">
            <div className="rounded-[3px] bg-cyan/10 border border-cyan/25 p-2 mr-3">
              <Dumbbell size={18} className="text-cyan" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-[15px] tracking-[0.02em]">{exerciseName}</h3>
              <p className="font-display text-[10px] tracking-[0.16em] text-faint mt-1">{subtitle}</p>
            </div>
          </div>
        )}

        {sets.map((set, i) => (
          <div key={set.setType} className={cn(i > 0 && 'mt-4 pt-4 border-t border-cyan/10')}>
            <SetEntry
              exerciseName={exerciseName}
              workoutPlanId={workoutPlanId}
              unit={unit}
              set={set}
              showLabel={multi}
              // One bar per card keeps the card short. It is read from the
              // strongest set on the card, whichever row that is.
              rating={i === 0 ? rating : null}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

interface SetEntryProps {
  exerciseName: string;
  workoutPlanId: string;
  unit: Unit;
  set: RecordSet;
  showLabel: boolean;
  rating: React.ReactNode;
}

interface CardRatingProps {
  exerciseName: string;
  unit: Unit;
  records: Array<StoredRecord | undefined>;
  userStats: ReturnType<typeof useUserStats>['data'];
}

const CardRating: React.FC<CardRatingProps> = ({ exerciseName, unit, records, userStats }) => {
  if (!findStandard(exerciseName)) return null;
  const source = bestForRating(records, unit);
  if (!source) {
    // A weighted set with no rep count cannot be told from a single, so it is
    // not rated. Say so, rather than leaving the bar to vanish.
    const missingReps =
      unit === 'lbs' &&
      records.some((r) => r && ((r.current_weight > 0 && !r.actual_reps) || ((r.previous_best ?? 0) > 0 && !r.previous_best_reps)));
    return missingReps ? (
      <p className="text-xs text-muted-foreground mb-3 opacity-70">Log your reps to see a 1–10 rating</p>
    ) : null;
  }
  if (!userStats) {
    return (
      <p className="text-xs text-muted-foreground mb-3">
        <span className="opacity-70">Add your stats in </span>
        <span className="text-cyan">Settings → My Stats</span>
        <span className="opacity-70"> to see a 1–10 rating</span>
      </p>
    );
  }
  const rating = getRating(exerciseName, source.weight, source.reps, userStats);
  return rating ? (
    <div className="mb-3 -mt-1">
      <StrengthRating
        level={rating.level}
        unit={rating.unit}
        nextThreshold={rating.nextThreshold}
        nextLevel={rating.nextLevel}
      />
    </div>
  ) : null;
};

const SetEntry: React.FC<SetEntryProps> = ({
  exerciseName,
  workoutPlanId,
  unit,
  set,
  showLabel,
  rating,
}) => {
  const { setType, label, fixedReps, existingRecord } = set;
  const savedWeight = existingRecord ? String(existingRecord.current_weight) : '';
  const savedReps = existingRecord?.actual_reps != null ? String(existingRecord.actual_reps) : '';

  const [weight, setWeight] = useState(savedWeight);
  const [reps, setReps] = useState(savedReps);
  const updateRecord = useUpdateRecord();

  useEffect(() => {
    setWeight(savedWeight);
    setReps(savedReps);
  }, [savedWeight, savedReps]);

  const showReps = unit === 'lbs';
  // With the reps pinned by the plan, only the weight can make the row dirty.
  const effectiveReps = showReps ? (fixedReps !== null ? String(fixedReps) : reps) : '';
  const savable = canSave(weight, unit);
  const isDirty =
    weight !== savedWeight || (showReps && effectiveReps !== savedReps);

  const handleSave = async () => {
    if (!savable || updateRecord.isPending) return;
    const value = Number(weight);
    const repCount = showReps && effectiveReps !== '' ? parseInt(effectiveReps, 10) : null;

    try {
      await updateRecord.mutateAsync({
        workout_plan_id: workoutPlanId,
        exercise_name: exerciseName,
        current_weight: value,
        actual_reps: repCount,
        set_type: setType,
      });
      const amount = formatAmount(value, unit);
      toast.success('Record saved', {
        description: `${exerciseName}: ${amount.value}${amount.suffix ? ` ${amount.suffix}` : ''}${
          repCount ? ` × ${repCount}` : ''
        }`,
      });
    } catch {
      toast.error('Failed to save record');
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  const best = personalBest(existingRecord);
  const bestAmount = best ? formatAmount(best.weight, unit) : null;

  return (
    <div>
      {showLabel && (
        <div className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2">{label.toUpperCase()}</div>
      )}

      <div className="flex items-baseline justify-between mb-3">
        <span className="font-display text-[10px] tracking-[0.2em] text-faint">PERSONAL BEST</span>
        <span className="font-display text-[20px] font-bold leading-none tabular">
          {best && bestAmount ? (
            <span className="text-cyan" style={{ textShadow: '0 0 18px rgba(43,232,255,0.35)' }}>
              {bestAmount.value}
              {bestAmount.suffix && (
                <span className="text-dim text-[13px] font-semibold"> {bestAmount.suffix}</span>
              )}
              {best.reps ? <span className="text-dim text-[13px] font-semibold"> × {best.reps}</span> : null}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      </div>

      {rating}

      {/* Weight, reps and save on one line. */}
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium text-muted-foreground">
            {unit === 'reps' ? 'Reps' : unit === 'seconds' ? 'Seconds' : 'Weight (lbs)'}
          </label>
          <Input
            type="number"
            inputMode="decimal"
            placeholder={unit === 'lbs' ? '0 = BW' : '0'}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={onKey}
            className="text-lg font-semibold mt-1 h-11"
            min="0"
            step="0.5"
          />
        </div>

        {showReps && (
          <div className="w-[76px] shrink-0">
            <label className="text-xs font-medium text-muted-foreground">Reps</label>
            {fixedReps !== null ? (
              // Pinned by the plan, so not an input: nothing to type, nothing to get wrong.
              <div
                className="mt-1 h-11 flex items-center px-3 rounded-md border border-cyan/10 bg-[#150E28] text-lg font-semibold text-muted-foreground tabular"
                aria-label={`Reps fixed at ${fixedReps}`}
              >
                {fixedReps}
              </div>
            ) : (
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                onKeyDown={onKey}
                className="text-lg font-semibold mt-1 h-11"
                min="0"
                step="1"
              />
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!savable || updateRecord.isPending}
          aria-label={isDirty ? 'Save' : 'Saved'}
          className={cn(
            'h-11 w-12 shrink-0 rounded-[3px] flex items-center justify-center transition-colors',
            // Lights up only when there is something unsaved.
            isDirty && savable
              ? 'bg-cyan text-[#06121A] hover:bg-cyan-soft'
              : 'bg-transparent border border-cyan/30 text-cyan/70',
            'disabled:border-cyan/15 disabled:text-dim disabled:bg-transparent',
          )}
        >
          {updateRecord.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isDirty ? (
            <Save size={18} />
          ) : (
            <Check size={18} />
          )}
        </button>
      </div>
    </div>
  );
};
