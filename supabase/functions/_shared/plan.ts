// Pure shaping of the workout plan and the lifting log for the `api` edge
// function. Free of Deno and Supabase imports so vitest can run it.
//
// A plan is numbered days (Day 1, Day 2, ...). Each day holds three variants of
// its workout, by tier: `minimum` for a short day, `good` the usual, `max` the
// full session. The user picks a tier when they train; records do not store it.

import { unitFor, weightLabel, type Unit } from './recordMath.ts';
import { liftFor, type RatingStats } from './strengthStandards.ts';
import { rateExercises } from './progress.ts';

export const TIERS = ['minimum', 'good', 'max'] as const;
export type Tier = (typeof TIERS)[number];

export interface PlanRow {
  id: string;
  day_number: number;
  day_name: string;
}

export interface ExerciseRow {
  workout_plan_id: string;
  exercise_name: string;
  tier: string;
  order_index: number;
  sets: number;
  reps: number;
  reps_high: number | null;
  rep_type: string;
  backoff_sets: number | null;
  backoff_reps: number | null;
  backoff_reps_high: number | null;
  notes: string | null;
}

export interface LogRow {
  date_recorded: string;
  workout_plan_id: string;
  exercise_name: string;
  set_type: string | null;
  current_weight: number;
  actual_reps: number | null;
}

/** "3 sets × 8–12 reps", "1×5, then 3×8", "3 sets × AMRAP". */
export const formatExercisePrescription = (exercise: {
  sets: number;
  reps: number;
  rep_type: 'fixed' | 'amrap';
  reps_high?: number | null;
  backoff_sets?: number | null;
  backoff_reps?: number | null;
  backoff_reps_high?: number | null;
}): string => {
  const repsStr = exercise.reps_high
    ? `${exercise.reps}–${exercise.reps_high}`
    : `${exercise.reps}`;

  if (exercise.rep_type === 'amrap') {
    return `${exercise.sets} sets × AMRAP`;
  }

  if (exercise.backoff_sets && exercise.backoff_reps) {
    const backoffRepsStr = exercise.backoff_reps_high
      ? `${exercise.backoff_reps}–${exercise.backoff_reps_high}`
      : `${exercise.backoff_reps}`;
    return `1×${exercise.reps}, then ${exercise.backoff_sets}×${backoffRepsStr}`;
  }

  return `${exercise.sets} sets × ${repsStr} reps`;
};

export interface SetRef {
  date: string;
  weight: number;
  reps: number | null;
}

/** Heavier wins; equal weight goes to more reps. Mirrors `isBetter` in useWorkoutRecords. */
const beats = (a: { weight: number; reps: number | null }, b: { weight: number; reps: number | null }) =>
  a.weight > b.weight || (a.weight === b.weight && (a.reps ?? 0) > (b.reps ?? 0));

const setType = (r: LogRow) => r.set_type || 'standard';
const setRef = (r: LogRow): SetRef => ({ date: r.date_recorded, weight: Number(r.current_weight), reps: r.actual_reps });

/** Latest and best of some rows, which must be oldest first. */
const lastAndBest = (rows: readonly LogRow[]) => {
  let best: SetRef | null = null;
  for (const r of rows) {
    const s = setRef(r);
    if (!best || beats(s, best)) best = s;
  }
  return { last: rows.length ? setRef(rows[rows.length - 1]) : null, best };
};

export interface PlanExercise {
  exercise: string;
  order: number;
  prescription: string;
  sets: number;
  reps: number;
  reps_high: number | null;
  rep_type: string;
  backoff_sets: number | null;
  backoff_reps: number | null;
  backoff_reps_high: number | null;
  notes: string | null;
  unit: Unit;
  weight_label: string;
  /** What has been logged for this exercise on this plan day, per set type. */
  logged: Record<string, { last: SetRef | null; best: SetRef | null }>;
}

export interface PlanDay {
  day_number: number;
  day_name: string;
  last_trained: string | null;
  tiers: Record<Tier, PlanExercise[]>;
}

/**
 * Every plan day with its exercises by tier and what was last logged. `logs`
 * must be oldest first.
 */
export const shapePlan = (
  plans: readonly PlanRow[],
  exercises: readonly ExerciseRow[],
  logs: readonly LogRow[],
): { days: PlanDay[]; next_in_rotation: number | null } => {
  const logsByKey = new Map<string, LogRow[]>();
  const lastTrained = new Map<string, string>();
  for (const r of logs) {
    const key = `${r.workout_plan_id}|${r.exercise_name}`;
    const list = logsByKey.get(key) ?? [];
    list.push(r);
    logsByKey.set(key, list);
    const prev = lastTrained.get(r.workout_plan_id);
    if (!prev || r.date_recorded > prev) lastTrained.set(r.workout_plan_id, r.date_recorded);
  }

  const days = [...plans]
    .sort((a, b) => a.day_number - b.day_number)
    .map((plan): PlanDay => {
      const tiers = { minimum: [], good: [], max: [] } as Record<Tier, PlanExercise[]>;
      const own = exercises
        .filter((e) => e.workout_plan_id === plan.id)
        .sort((a, b) => a.order_index - b.order_index);
      for (const e of own) {
        const tier = (TIERS as readonly string[]).includes(e.tier) ? (e.tier as Tier) : 'good';
        const rows = logsByKey.get(`${plan.id}|${e.exercise_name}`) ?? [];
        const logged: PlanExercise['logged'] = {};
        for (const type of [...new Set(rows.map(setType))]) {
          logged[type] = lastAndBest(rows.filter((r) => setType(r) === type));
        }
        tiers[tier].push({
          exercise: e.exercise_name,
          order: e.order_index,
          prescription: formatExercisePrescription({ ...e, rep_type: e.rep_type === 'amrap' ? 'amrap' : 'fixed' }),
          sets: e.sets,
          reps: e.reps,
          reps_high: e.reps_high,
          rep_type: e.rep_type,
          backoff_sets: e.backoff_sets,
          backoff_reps: e.backoff_reps,
          backoff_reps_high: e.backoff_reps_high,
          notes: e.notes,
          unit: unitFor(e.exercise_name),
          weight_label: weightLabel(e.exercise_name),
          logged,
        });
      }
      return { day_number: plan.day_number, day_name: plan.day_name, last_trained: lastTrained.get(plan.id) ?? null, tiers };
    });

  // The day after the most recently trained one, wrapping round. When two
  // days were trained on the same date, the later-numbered one counts.
  let latest: PlanDay | null = null;
  for (const d of days) {
    if (!d.last_trained) continue;
    if (!latest || d.last_trained > latest.last_trained! || (d.last_trained === latest.last_trained && d.day_number > latest.day_number)) {
      latest = d;
    }
  }
  const next = latest ? days[(days.indexOf(latest) + 1) % days.length] : days[0];
  return { days, next_in_rotation: next?.day_number ?? null };
};

export interface ExerciseSummary {
  exercise: string;
  unit: Unit;
  /** The strength standard it is graded against, or null when it has none. */
  lift: string | null;
  plan_days: string[];
  sessions: number;
  first_logged: string;
  last_logged: string;
  /** Per set type (`standard`, `top`, `backoff`): the latest and the best set. */
  by_set_type: Record<string, { last: SetRef; best: SetRef }>;
  /** Heaviest set, highest estimated 1RM, and so on: the same pick as the lift card. */
  rating: {
    level: number;
    from: { weight: number; reps: number | null };
    next_level: number | null;
    next_threshold: number | null;
  } | null;
  history?: Array<SetRef & { set_type: string; plan_day: string }>;
}

/**
 * One summary per exercise name across every plan day. `logs` must be oldest
 * first. Ratings need `stats`; without them `rating` is null throughout.
 */
export const summarizeExercises = (
  logs: readonly LogRow[],
  planNames: Record<string, string>,
  stats: RatingStats | null,
  withHistory = false,
): ExerciseSummary[] => {
  const byName = new Map<string, LogRow[]>();
  for (const r of logs) {
    const list = byName.get(r.exercise_name) ?? [];
    list.push(r);
    byName.set(r.exercise_name, list);
  }

  const ratings = new Map(
    (stats
      ? rateExercises(
          logs.map((r) => ({ exercise_name: r.exercise_name, current_weight: Number(r.current_weight), actual_reps: r.actual_reps })),
          stats,
        )
      : []
    ).map((r) => [r.name, r]),
  );

  return [...byName.entries()]
    .map(([name, rows]): ExerciseSummary => {
      const bySetType: ExerciseSummary['by_set_type'] = {};
      for (const type of [...new Set(rows.map(setType))]) {
        const { last, best } = lastAndBest(rows.filter((r) => setType(r) === type));
        bySetType[type] = { last: last!, best: best! };
      }
      const rated = ratings.get(name);
      return {
        exercise: name,
        unit: unitFor(name),
        lift: liftFor(name)?.label ?? null,
        plan_days: [...new Set(rows.map((r) => planNames[r.workout_plan_id] ?? 'Unknown'))],
        sessions: new Set(rows.map((r) => r.date_recorded)).size,
        first_logged: rows[0].date_recorded,
        last_logged: rows[rows.length - 1].date_recorded,
        by_set_type: bySetType,
        rating: rated
          ? {
              level: round(rated.level),
              from: { weight: rated.weight, reps: rated.reps },
              next_level: rated.nextLevel,
              next_threshold: rated.nextThreshold,
            }
          : null,
        ...(withHistory
          ? {
              history: rows.map((r) => ({
                ...setRef(r),
                set_type: setType(r),
                plan_day: planNames[r.workout_plan_id] ?? 'Unknown',
              })),
            }
          : {}),
      };
    })
    .sort((a, b) => b.last_logged.localeCompare(a.last_logged) || a.exercise.localeCompare(b.exercise));
};

/** Two decimals: levels are fractional, and 6.123456789 helps no one. */
export const round = (n: number): number => Math.round(n * 100) / 100;
