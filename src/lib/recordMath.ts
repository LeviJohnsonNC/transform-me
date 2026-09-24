// Pure helpers for the Records page, kept out of the component so the rules
// that decide what counts as a lift and what the user is shown are testable.

import type { WorkoutExercise } from '@/hooks/useWorkoutPlans';

export type Unit = 'lbs' | 'reps' | 'seconds';
export type SetType = 'standard' | 'top' | 'backoff';

export interface StoredRecord {
  current_weight: number;
  previous_best: number | null;
  previous_best_reps: number | null;
  actual_reps: number | null;
}

/** What the single number on a card measures. Most lifts are weight × reps. */
export const unitFor = (exerciseName: string): Unit => {
  const n = exerciseName.toLowerCase();
  if (n.includes('plank')) return 'seconds';
  if (n.includes('ab wheel') || n.includes('ab roller')) return 'reps';
  if (n.includes('hanging leg raise')) return 'reps';
  if (n.includes('pull-up') || n.includes('chin-up') || n.includes('pull up') || n.includes('chin up')) return 'reps';
  if (n.includes('dip')) return 'reps';
  return 'lbs';
};

/**
 * The rep count the plan pins for this set, or null when the user should type
 * what they actually got — an AMRAP set, or a range like 8–12.
 */
export const fixedRepsFor = (
  exercise: Pick<WorkoutExercise, 'rep_type' | 'reps' | 'reps_high' | 'backoff_reps' | 'backoff_reps_high'>,
  setType: SetType,
): number | null => {
  if (setType === 'backoff') {
    if (!exercise.backoff_reps || exercise.backoff_reps_high) return null;
    return exercise.backoff_reps;
  }
  if (exercise.rep_type !== 'fixed' || exercise.reps_high || !exercise.reps) return null;
  return exercise.reps;
};

/**
 * Whether the weight box holds something savable. For a weighted lift 0 is a
 * real answer — bodyweight — so only an empty or non-numeric box is refused.
 * For rep- or time-counted lifts the box IS the count, and 0 of those is not a
 * record.
 */
export const canSave = (weightInput: string, unit: Unit): boolean => {
  if (weightInput.trim() === '') return false;
  const value = Number(weightInput);
  if (!Number.isFinite(value) || value < 0) return false;
  return unit === 'lbs' ? true : value > 0;
};

/**
 * Best of what is stored. `previous_best` is the best BEFORE today, so today's
 * set can beat it. Heavier wins; at equal weight, more reps wins.
 *
 * Checks for null explicitly rather than truthiness: a bodyweight set is stored
 * as 0, and the old `if (cw)` treated that as "no set at all".
 */
export const personalBest = (
  record: StoredRecord | undefined,
): { weight: number; reps: number | null } | null => {
  if (!record) return null;
  const { previous_best: pb, previous_best_reps: pbReps, current_weight: cw, actual_reps: cr } = record;
  const hasCurrent = cw !== null && cw !== undefined;

  if (pb === null) return hasCurrent ? { weight: cw, reps: cr } : null;
  if (!hasCurrent) return { weight: pb, reps: pbReps };
  if (cw > pb || (cw === pb && (cr ?? 0) > (pbReps ?? 0))) return { weight: cw, reps: cr };
  return { weight: pb, reps: pbReps };
};

/** "185 lbs", "BW" for an unweighted set, "12 reps", "90 s". */
export const formatAmount = (weight: number, unit: Unit): { value: string; suffix: string } => {
  if (unit === 'lbs' && weight === 0) return { value: 'BW', suffix: '' };
  if (unit === 'seconds') return { value: String(weight), suffix: 's' };
  return { value: String(weight), suffix: unit };
};
