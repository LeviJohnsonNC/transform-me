import { describe, expect, it } from 'vitest';
import { formatExercisePrescription, shapePlan, summarizeExercises, type ExerciseRow, type LogRow } from './plan';

const plans = [
  { id: 'p2', day_number: 2, day_name: 'Legs' },
  { id: 'p1', day_number: 1, day_name: 'Push' },
  { id: 'p3', day_number: 3, day_name: 'Pull' },
];

const exercise = (over: Partial<ExerciseRow>): ExerciseRow => ({
  workout_plan_id: 'p1',
  exercise_name: 'Bench Press',
  tier: 'good',
  order_index: 0,
  sets: 3,
  reps: 5,
  reps_high: null,
  rep_type: 'fixed',
  backoff_sets: null,
  backoff_reps: null,
  backoff_reps_high: null,
  notes: null,
  ...over,
});

const log = (over: Partial<LogRow>): LogRow => ({
  date_recorded: '2026-09-21',
  workout_plan_id: 'p1',
  exercise_name: 'Bench Press',
  set_type: 'standard',
  current_weight: 185,
  actual_reps: 5,
  ...over,
});

describe('formatExercisePrescription', () => {
  it('describes fixed, ranged, AMRAP and top-plus-backoff sets', () => {
    expect(formatExercisePrescription({ sets: 3, reps: 5, rep_type: 'fixed' })).toBe('3 sets × 5 reps');
    expect(formatExercisePrescription({ sets: 3, reps: 8, reps_high: 12, rep_type: 'fixed' })).toBe('3 sets × 8–12 reps');
    expect(formatExercisePrescription({ sets: 2, reps: 1, rep_type: 'amrap' })).toBe('2 sets × AMRAP');
    expect(formatExercisePrescription({ sets: 4, reps: 5, rep_type: 'fixed', backoff_sets: 3, backoff_reps: 8 })).toBe('1×5, then 3×8');
  });
});

describe('shapePlan', () => {
  it('orders days, splits exercises by tier, and attaches what was logged', () => {
    const { days } = shapePlan(
      plans,
      [
        exercise({ exercise_name: 'Dips', order_index: 1 }),
        exercise({}),
        exercise({ exercise_name: 'Push-Ups', tier: 'minimum' }),
        exercise({ workout_plan_id: 'p2', exercise_name: 'Back Squat', tier: 'max' }),
      ],
      [
        log({ date_recorded: '2026-09-14', current_weight: 190, actual_reps: 3 }),
        log({ date_recorded: '2026-09-21', current_weight: 185, actual_reps: 5 }),
      ],
    );
    expect(days.map((d) => d.day_number)).toEqual([1, 2, 3]);
    expect(days[0].tiers.good.map((e) => e.exercise)).toEqual(['Bench Press', 'Dips']);
    expect(days[0].tiers.minimum.map((e) => e.exercise)).toEqual(['Push-Ups']);
    expect(days[1].tiers.max.map((e) => e.exercise)).toEqual(['Back Squat']);
    expect(days[0].tiers.good[0].logged.standard).toEqual({
      last: { date: '2026-09-21', weight: 185, reps: 5 },
      best: { date: '2026-09-14', weight: 190, reps: 3 },
    });
    expect(days[0].tiers.good[1].unit).toBe('reps');
    expect(days[0].last_trained).toBe('2026-09-21');
    expect(days[2].last_trained).toBeNull();
  });

  it('suggests the day after the most recent, wrapping round', () => {
    const next = (logs: LogRow[]) => shapePlan(plans, [], logs).next_in_rotation;
    expect(next([])).toBe(1);
    expect(next([log({ workout_plan_id: 'p2' })])).toBe(3);
    expect(next([log({ workout_plan_id: 'p3', date_recorded: '2026-09-22' }), log({ workout_plan_id: 'p2' })])).toBe(1);
    // Two days trained on one date: the later-numbered one counts.
    expect(next([log({ workout_plan_id: 'p2' }), log({ workout_plan_id: 'p1' })])).toBe(3);
  });
});

describe('summarizeExercises', () => {
  const logs = [
    log({ date_recorded: '2026-09-14', current_weight: 225, actual_reps: 1 }),
    log({ date_recorded: '2026-09-21', current_weight: 205, actual_reps: 10 }),
    log({ date_recorded: '2026-09-21', set_type: 'backoff', current_weight: 165, actual_reps: 8 }),
    log({ date_recorded: '2026-09-22', workout_plan_id: 'p2', exercise_name: 'Leg Curl', current_weight: 90, actual_reps: 12 }),
  ];
  const names = { p1: 'Push', p2: 'Legs' };

  it('keeps each exercise’s latest and best per set type, most recent first', () => {
    const [curl, bench] = summarizeExercises(logs, names, null);
    expect(curl.exercise).toBe('Leg Curl');
    expect(curl.lift).toBeNull();
    expect(bench.sessions).toBe(2);
    expect(bench.first_logged).toBe('2026-09-14');
    expect(bench.by_set_type.standard.best).toEqual({ date: '2026-09-14', weight: 225, reps: 1 });
    expect(bench.by_set_type.standard.last).toEqual({ date: '2026-09-21', weight: 205, reps: 10 });
    expect(bench.by_set_type.backoff.best.weight).toBe(165);
    expect(bench.rating).toBeNull();
    expect(bench.history).toBeUndefined();
  });

  it('rates from the strongest set by estimated 1RM, not the heaviest', () => {
    const stats = { gender: 'male' as const, age: 30, bodyweight_lbs: 180 };
    const bench = summarizeExercises(logs, names, stats, true).find((e) => e.exercise === 'Bench Press')!;
    expect(bench.rating?.from).toEqual({ weight: 205, reps: 10 });
    expect(bench.rating?.level).toBeGreaterThan(0);
    expect(bench.history?.map((h) => h.set_type)).toEqual(['standard', 'standard', 'backoff']);
  });
});
