import { describe, it, expect } from 'vitest';
import {
  estimate1RM,
  findStandard,
  getRating,
  type Gender,
} from '@/lib/strengthStandards';

/** A 40-year-old 165lb man: old enough that the age factor is not 1. */
const stats = (over: Partial<{ gender: Gender; age: number; bodyweight_lbs: number }> = {}) => ({
  gender: 'male' as Gender,
  age: 25,
  bodyweight_lbs: 165,
  ...over,
});

// Bench, male, bodyweight<=165 — the bracket most of these cases use.
const BENCH_165 = [85, 115, 145, 175, 205, 240, 275, 310, 345, 380];
/** Mirrors the private ageFactor: full strength to 30, then 0.5%/yr, floored at 0.6. */
const ageFactor = (age: number) => (age <= 30 ? 1 : Math.max(0.6, 1 - (age - 30) * 0.005));

describe('findStandard', () => {
  it('prefers the more specific lift over the generic one', () => {
    // Each of these also matches a later, broader entry in STANDARDS_MAP.
    expect(findStandard('Close-Grip Bench Press')).not.toBe(findStandard('Bench Press'));
    expect(findStandard('Romanian Deadlift')).not.toBe(findStandard('Deadlift'));
    expect(findStandard('Goblet Squat')).not.toBe(findStandard('Back Squat'));
    expect(findStandard('Bulgarian Split Squat')).not.toBe(findStandard('Back Squat'));
    expect(findStandard('Hammer Curls')).not.toBe(findStandard('Barbell Curl'));
    expect(findStandard('Dumbbell Shoulder Press')).not.toBe(findStandard('Overhead Press'));
    expect(findStandard('Incline Dumbbell Bench')).not.toBe(findStandard('Flat Dumbbell Bench'));
  });

  it('resolves the naming variants the app accepts to the same standard', () => {
    expect(findStandard('RDL')).toBe(findStandard('Romanian Deadlift'));
    expect(findStandard('OHP')).toBe(findStandard('Overhead Press'));
    expect(findStandard('Military Press')).toBe(findStandard('Overhead Press'));
    expect(findStandard('Pendlay Row')).toBe(findStandard('Barbell Row'));
    expect(findStandard('Pull-Ups')).toBe(findStandard('chin up'));
    expect(findStandard('Lying Tricep Extension')).toBe(findStandard('Skull Crushers'));
    expect(findStandard('Ab Roller')).toBe(findStandard('Ab Wheel'));
  });

  it('is insensitive to case, punctuation and spacing', () => {
    const squat = findStandard('Back Squat');
    expect(findStandard('  BACK   SQUAT  ')).toBe(squat);
    expect(findStandard('Back-Squat')).toBe(squat);
    expect(findStandard('back squat (paused)')).toBe(squat);
  });

  it('returns null rather than guessing', () => {
    expect(findStandard('Cable Woodchopper')).toBeNull();
    expect(findStandard('')).toBeNull();
    expect(findStandard('   ')).toBeNull();
  });

  it('accepts the plurals and spellings people actually type', () => {
    expect(findStandard('Pullups')).toBe(findStandard('Pull-Ups'));
    expect(findStandard('Chinups')).toBe(findStandard('Pull-Ups'));
    expect(findStandard('Ab-Wheel')).toBe(findStandard('Ab Wheel'));
    expect(findStandard('Skullcrushers')).toBe(findStandard('Skull Crushers'));
    expect(findStandard('Reverse Flyes')).toBe(findStandard('Rear Delt Fly'));
    expect(findStandard('DB Bench Press')).toBe(findStandard('Flat Dumbbell Bench'));
    expect(findStandard('Seated Dumbbell Press')).toBe(findStandard('Dumbbell Shoulder Press'));
    expect(findStandard('Rear Lateral Raise')).toBe(findStandard('Rear Delt Fly'));
  });

  it('matches whole words, not fragments of other words', () => {
    // "dip" used to match anywhere in the name.
    expect(findStandard('Tripod Headstand')).toBeNull(); // contains "dip"
    expect(findStandard('Hurdle Hops')).toBeNull(); // contains "rdl"
  });

  it('refuses a variant rather than grading it on its parent lift', () => {
    // Each of these used to land on a standard for a different lift: bench
    // dips on bench press, dumbbell and leg curls on the barbell curl, front
    // and hack squats on the back squat, and so on.
    for (const name of [
      'Bench Dips', 'Incline Bench Press', 'Incline Dumbbell Curl', 'Dumbbell Curl', 'Leg Curl', 'Nordic Curl',
      'Cable Curl', 'Preacher Curl', 'Side Plank', 'Front Squat', 'Hack Squat', 'Smith Machine Squat',
      'Pistol Squat', 'Jump Squat', 'Split Squat', 'Stiff-Leg Deadlift', 'Trap Bar Deadlift',
      'Single-Leg RDL', 'DB RDL', 'Machine Shoulder Press', 'Push Press', 'Seated Calf Raise',
      'Assisted Pull-up', 'Weighted Pull-ups', 'Weighted Dips', 'Dumbbell Row', 'Cable Lateral Raise',
      'Bench Hip Thrust Single Leg', 'Hanging Knee Raise', 'Bench Leg Raise', 'Cable Reverse Fly',
    ]) {
      expect(findStandard(name), name).toBeNull();
    }
  });

  it('still grades the plain lift under its common names', () => {
    for (const name of [
      'Bench Press', 'Paused Bench', 'Back Squat', 'Box Squat', 'Deadlift', 'Sumo Deadlift', 'Barbell Hip Thrust',
      'Walking Lunges', 'Barbell Curl', 'EZ Bar Curl', 'Bicep Curls', 'Hammer Curls', 'Barbell Row',
      'Bent-Over Row', 'Upright Row', 'Lateral Raises', 'Standing Calf Raise', 'Calf Raise Machine',
      'Pull-Ups', 'Chin-Ups', 'Dips', 'Chest Dips', 'Hanging Leg Raises', 'Plank', 'Goblet Squat',
      'Bulgarian Split Squat', 'Overhead Press', 'Incline DB Press',
    ]) {
      expect(findStandard(name), name).not.toBeNull();
    }
  });

  it('carries the right unit for non-weight lifts', () => {
    expect(findStandard('Plank')!.unit).toBe('seconds');
    expect(findStandard('Pull-Ups')!.unit).toBe('reps');
    expect(findStandard('Dips')!.unit).toBe('reps');
    expect(findStandard('Bench Press')!.unit).toBe('lbs');
  });
});

describe('estimate1RM', () => {
  it('returns the weight unchanged for a single rep or no rep count', () => {
    expect(estimate1RM(225, 1)).toBe(225);
    expect(estimate1RM(225, null)).toBe(225);
    expect(estimate1RM(225, 0)).toBe(225);
  });

  it('applies Epley above one rep', () => {
    expect(estimate1RM(225, 5)).toBeCloseTo(225 * (1 + 5 / 30), 6);
    expect(estimate1RM(100, 10)).toBeCloseTo(133.333, 3);
  });

  it('is monotonic in both weight and reps', () => {
    expect(estimate1RM(230, 5)).toBeGreaterThan(estimate1RM(225, 5));
    expect(estimate1RM(225, 6)).toBeGreaterThan(estimate1RM(225, 5));
  });
});

describe('getRating', () => {
  it('returns null when there is nothing to rate', () => {
    expect(getRating('Cable Woodchopper', 225, 5, stats())).toBeNull();
    expect(getRating('Bench Press', 0, 5, stats())).toBeNull();
    expect(getRating('Bench Press', -10, 5, stats())).toBeNull();
  });

  it('lands on a whole level when the lift sits exactly on a threshold', () => {
    // L5 for this bracket is 205, and a single rep means no Epley inflation.
    const r = getRating('Bench Press', BENCH_165[4], 1, stats())!;
    expect(r.level).toBe(5);
    expect(r.nextLevel).toBe(6);
    expect(r.nextThreshold).toBe(BENCH_165[5]);
  });

  it('interpolates between thresholds', () => {
    const midpoint = (BENCH_165[4] + BENCH_165[5]) / 2;
    const r = getRating('Bench Press', midpoint, 1, stats())!;
    expect(r.level).toBeCloseTo(5.5, 6);
  });

  it('scales from zero below level 1 rather than reporting a negative level', () => {
    const r = getRating('Bench Press', BENCH_165[0] / 2, 1, stats())!;
    expect(r.level).toBeCloseTo(0.5, 6);
    expect(r.nextLevel).toBe(1);
    expect(r.nextThreshold).toBe(BENCH_165[0]);
  });

  it('clamps at 10 and reports no next target', () => {
    const r = getRating('Bench Press', BENCH_165[9] + 100, 1, stats())!;
    expect(r.level).toBe(10);
    expect(r.nextLevel).toBeNull();
    expect(r.nextThreshold).toBeNull();
  });

  it('picks the bodyweight bracket on an inclusive upper bound', () => {
    const at = getRating('Bench Press', 200, 1, stats({ bodyweight_lbs: 132 }))!;
    const justAbove = getRating('Bench Press', 200, 1, stats({ bodyweight_lbs: 133 }))!;
    // Same lift, heavier athlete, tougher thresholds — so a lower level.
    expect(justAbove.level).toBeLessThan(at.level);
  });

  it('treats an unspecified gender as the male scale', () => {
    const other = getRating('Bench Press', 200, 1, stats({ gender: 'other' }))!;
    const male = getRating('Bench Press', 200, 1, stats({ gender: 'male' }))!;
    expect(other.level).toBe(male.level);
  });

  it('refuses a weighted set with no rep count instead of reading it as a single', () => {
    // Regression: 100 lbs with the reps box left blank was graded as a 100 lb
    // one-rep max, under-rating any rep-range set logged without reps.
    expect(getRating('Bench Press', 100, null, stats())).toBeNull();
    expect(getRating('Bench Press', 100, 0, stats())).toBeNull();
  });

  it('uses the weight field directly for rep- and time-based lifts', () => {
    // RecordCard puts the count in `weight` for these, and reps is meaningless.
    const withReps = getRating('Plank', 90, 5, stats())!;
    const without = getRating('Plank', 90, null, stats())!;
    expect(withReps.metric).toBe(90);
    expect(withReps.level).toBe(without.level);
  });
});

describe('getRating age adjustment', () => {
  it('rates the same lift higher for an older athlete', () => {
    const young = getRating('Bench Press', 225, 1, stats({ age: 25 }))!;
    const older = getRating('Bench Press', 225, 1, stats({ age: 50 }))!;
    expect(older.level).toBeGreaterThan(young.level);
  });

  it('reports the next target on the SAME age-adjusted scale it scored against', () => {
    // Regression: nextThreshold was read off the raw table while the level was
    // computed against the age-adjusted one, so anyone over 30 was shown a
    // target higher than the number that would actually level them up.
    const age = 50;
    const factor = ageFactor(age);
    const r = getRating('Bench Press', BENCH_165[4] * factor, 1, stats({ age }))!;

    expect(r.level).toBeCloseTo(5, 6);
    expect(r.nextLevel).toBe(6);
    expect(r.nextThreshold).toBe(Math.ceil(BENCH_165[5] * factor));
    expect(r.nextThreshold).toBeLessThan(BENCH_165[5]);
  });

  it('leaves thresholds untouched at or under 30', () => {
    for (const age of [18, 25, 30]) {
      const r = getRating('Bench Press', BENCH_165[4], 1, stats({ age }))!;
      expect(r.nextThreshold, `age ${age}`).toBe(BENCH_165[5]);
    }
  });

  it('floors the decline so the scale stays meaningful at any age', () => {
    const r = getRating('Bench Press', 100, 1, stats({ age: 120 }))!;
    const atFloor = getRating('Bench Press', 100, 1, stats({ age: 110 }))!;
    expect(r.level).toBe(atFloor.level);
  });

  it('never names a target the lift has already passed', () => {
    // The property that makes the number trustworthy, across the whole range.
    for (const age of [25, 35, 45, 60, 80]) {
      for (const weight of [50, 100, 150, 200, 250, 300, 400]) {
        for (const reps of [1, 5, 10]) {
          const r = getRating('Bench Press', weight, reps, stats({ age }));
          if (!r || r.nextThreshold === null) continue;
          expect(r.nextThreshold, `age ${age}, ${weight}x${reps}`).toBeGreaterThan(r.metric);
        }
      }
    }
  });
});
