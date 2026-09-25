// Pure helpers for the Records page, kept out of the component so the rules
// that decide what counts as a lift and what the user is shown are testable.

import type { WorkoutExercise } from '@/hooks/useWorkoutPlans';
import { estimate1RM, findStandard, nameHas, normalizeExerciseName } from '@/lib/strengthStandards';

export type Unit = 'lbs' | 'reps' | 'seconds';
export type SetType = 'standard' | 'top' | 'backoff';

export interface StoredRecord {
  current_weight: number;
  previous_best: number | null;
  previous_best_reps: number | null;
  actual_reps: number | null;
}

/**
 * What the single number on a card measures. Most lifts are weight × reps.
 *
 * A lift with a standard takes its unit from that standard, so the box the user
 * types into and the scale the rating reads can never disagree. They used to be
 * two hand-kept lists, and "Pullups" was a weight on the card but a rep count
 * to the rating: +25 lbs was graded as 25 pull-ups.
 *
 * Variants with no standard of their own (assisted pull-ups, side planks,
 * bench dips) are still counted the way their family is.
 */
export const unitFor = (exerciseName: string): Unit => {
  const standard = findStandard(exerciseName);
  if (standard) return standard.unit;
  const n = normalizeExerciseName(exerciseName);
  if (nameHas(n, 'plank')) return 'seconds';
  // Weighted calisthenics are logged as the weight added and the reps done.
  if (nameHas(n, 'weighted')) return 'lbs';
  const counted = [
    'ab wheel', 'ab roller', 'ab rollout', 'hanging leg raise', 'pull up', 'pullup', 'chin up', 'chinup', 'dip',
    'push up', 'pushup', 'press up', 'inverted row', 'australian pull up', 'australian row',
  ];
  if (counted.some((p) => nameHas(n, p))) return 'reps';
  return 'lbs';
};

/**
 * The label for a card's weight box. The standards assume a convention (one
 * dumbbell, both, or just the belt), and a set logged the other way was off by
 * a factor of two with nothing on the card to say which was meant.
 */
export const weightLabel = (exerciseName: string): string => {
  switch (findStandard(exerciseName)?.load) {
    case 'perDumbbell':
      return 'Weight per dumbbell (lbs)';
    case 'bothHands':
      return 'Total weight, both hands (lbs)';
    case 'added':
      return 'Added weight (lbs)';
    default:
      return 'Weight (lbs)';
  }
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

/**
 * The set a card's 1–10 rating should be read from: the strongest one there is,
 * across every set type on the card (current and previous best) and, when
 * given, every set of the exercise ever logged.
 *
 * Strongest means highest estimated 1RM, not heaviest. The rating used to take
 * the heaviest weight of the first set alone, so 225×1 beat 205×10 (≈273 1RM)
 * and a backoff set that implied more strength was never looked at.
 *
 * A weighted set needs its rep count and a real load; without reps there is no
 * telling a single from a set of ten, and 0 is bodyweight, which the weight
 * tables cannot grade. For rep- and time-counted lifts the stored number is the
 * count, so the biggest one wins.
 */
export const bestForRating = (
  records: Array<StoredRecord | undefined>,
  unit: Unit,
  options: {
    // How strong a set is. The default fits plain lifts; a weighted pull-up has
    // to be compared on bodyweight plus load, which only the caller knows.
    score?: (weight: number, reps: number | null) => number;
    // Every earlier set of the exercise, from `useLiftHistory`.
    history?: Array<{ weight: number; reps: number | null }>;
  } = {},
): { weight: number; reps: number | null } | null => {
  const score = options.score ?? ((weight, reps) => (unit === 'lbs' ? estimate1RM(weight, reps) : weight));
  const candidates: Array<{ weight: number | null | undefined; reps: number | null }> = [...(options.history ?? [])];
  for (const record of records) {
    if (!record) continue;
    candidates.push({ weight: record.current_weight, reps: record.actual_reps });
    candidates.push({ weight: record.previous_best, reps: record.previous_best_reps });
  }

  let best: { weight: number; reps: number | null; score: number } | null = null;
  for (const { weight, reps } of candidates) {
    if (weight === null || weight === undefined || !(weight > 0)) continue;
    if (unit === 'lbs' && !(reps && reps >= 1)) continue;
    const strength = score(weight, reps);
    if (!best || strength > best.score) best = { weight, reps, score: strength };
  }
  return best ? { weight: best.weight, reps: best.reps } : null;
};

/** "185 lbs", "BW" for an unweighted set, "12 reps", "90 s". */
export const formatAmount = (weight: number, unit: Unit): { value: string; suffix: string } => {
  if (unit === 'lbs' && weight === 0) return { value: 'BW', suffix: '' };
  if (unit === 'seconds') return { value: String(weight), suffix: 's' };
  return { value: String(weight), suffix: unit };
};
