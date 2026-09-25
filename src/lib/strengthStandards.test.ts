import { describe, it, expect } from 'vitest';
import {
  ageCoefficient,
  ageFactor,
  estimate1RM,
  findStandard,
  getRating,
  scaleFor,
  type Gender,
  type RatingScale,
} from '@/lib/strengthStandards';

/** A 40-year-old 165lb man: old enough that the age factor is not 1. */
const stats = (
  over: Partial<{ gender: Gender; age: number; bodyweight_lbs: number; rating_scale: RatingScale | null }> = {},
) => ({
  gender: 'male' as Gender,
  age: 25,
  bodyweight_lbs: 165,
  ...over,
});

// Bench, male, bodyweight<=165 — the bracket most of these cases use.
const BENCH_165 = [85, 115, 145, 175, 205, 240, 275, 300, 320, 345];

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
      'Bench Dips', 'Incline Dumbbell Curl', 'Dumbbell Curl', 'Leg Curl', 'Nordic Curl',
      'Cable Curl', 'Preacher Curl', 'Hack Squat', 'Smith Machine Squat',
      'Pistol Squat', 'Jump Squat', 'Split Squat', 'Single-Leg RDL', 'DB RDL', 'Machine Shoulder Press',
      'Push Press', 'Seated Calf Raise', 'Assisted Pull-up', 'Cable Lateral Raise',
      'Bench Hip Thrust Single Leg', 'Hanging Knee Raise', 'Bench Leg Raise', 'Cable Reverse Fly',
      'Knee Push-ups', 'Diamond Push-ups', 'Straight-Arm Pulldown', 'Dumbbell Upright Row', 'Trap Bar Shrug',
      'Single-Leg Leg Press', 'Weighted Ring Dips', 'Copenhagen Side Plank',
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

  it('grades the variants that now have a standard of their own', () => {
    // Each of these used to go unrated (or, before that, on the parent lift).
    const own = [
      ['Front Squat', 'Back Squat'], ['Incline Bench Press', 'Bench Press'], ['Trap Bar Deadlift', 'Deadlift'],
      ['Leg Press', 'Back Squat'], ['Lat Pulldown', 'Barbell Row'], ['Seated Cable Row', 'Barbell Row'],
      ['1-Arm DB Row', 'Barbell Row'], ['Side Plank', 'Plank'], ['Weighted Pull-ups', 'Pull-Ups'], ['Weighted Dips', 'Dips'],
    ];
    for (const [variant, parent] of own) {
      expect(findStandard(variant), variant).not.toBeNull();
      expect(findStandard(variant), variant).not.toBe(findStandard(parent));
    }
    expect(findStandard('Push-Ups')).not.toBeNull();
    expect(findStandard('Inverted Row')).not.toBeNull();
    expect(findStandard('Australian Pull-ups')).toBe(findStandard('Inverted Row'));
    expect(findStandard('Lat Pull-Down')).toBe(findStandard('Lat Pulldown'));
  });

  it('grades a stiff-leg deadlift like an RDL', () => {
    expect(findStandard('Stiff-Leg Deadlift')).toBe(findStandard('Romanian Deadlift'));
    expect(findStandard('SLDL')).toBe(findStandard('Romanian Deadlift'));
  });

  it('derives variants from their parent at the stated ratio', () => {
    const at = (name: string, i: number) => findStandard(name)!.male[2].levels[i];
    for (const i of [0, 4, 9]) {
      expect(at('Front Squat', i)).toBe(Math.round(at('Back Squat', i) * 0.8));
      expect(at('Incline Bench Press', i)).toBe(Math.round(at('Bench Press', i) * 0.8));
      expect(at('Leg Press', i)).toBe(Math.round(at('Back Squat', i) * 1.75));
      expect(at('Dumbbell Row', i)).toBe(Math.round(at('Barbell Row', i) * 0.45));
    }
  });

  it('says what the logged weight means', () => {
    expect(findStandard('Hammer Curl')!.load).toBe('perDumbbell');
    expect(findStandard('Dumbbell Row')!.load).toBe('perDumbbell');
    expect(findStandard('Bulgarian Split Squat')!.load).toBe('perDumbbell');
    expect(findStandard('Walking Lunges')!.load).toBe('bothHands');
    expect(findStandard('Weighted Pull-ups')!.load).toBe('added');
    expect(findStandard('Bench Press')!.load).toBeUndefined();
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

  it('counts reps past 12 as 12', () => {
    // Regression: Epley at 30 reps doubled the weight.
    expect(estimate1RM(100, 30)).toBe(estimate1RM(100, 12));
    expect(estimate1RM(100, 13)).toBe(estimate1RM(100, 12));
    expect(estimate1RM(100, 12)).toBeCloseTo(140, 6);
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

  it('rates the same lift lower for a heavier athlete', () => {
    const at = getRating('Bench Press', 200, 1, stats({ bodyweight_lbs: 132 }))!;
    const justAbove = getRating('Bench Press', 200, 1, stats({ bodyweight_lbs: 133 }))!;
    expect(justAbove.level).toBeLessThan(at.level);
  });

  it('does not guess a scale for "prefer not to say"', () => {
    // Regression: it was silently scored on the male table.
    expect(getRating('Bench Press', 200, 1, stats({ gender: 'other' }))).toBeNull();
    expect(getRating('Bench Press', 200, 1, stats({ gender: 'other', rating_scale: null }))).toBeNull();
  });

  it('scores "prefer not to say" on the scale the lifter chose', () => {
    for (const scale of ['male', 'female'] as RatingScale[]) {
      const other = getRating('Bench Press', 135, 1, stats({ gender: 'other', rating_scale: scale }))!;
      const same = getRating('Bench Press', 135, 1, stats({ gender: scale }))!;
      expect(other.level, scale).toBe(same.level);
    }
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

  it('leaves thresholds untouched from 23 through 39', () => {
    for (const age of [23, 25, 30, 35, 39]) {
      const r = getRating('Bench Press', BENCH_165[4], 1, stats({ age }))!;
      expect(r.nextThreshold, `age ${age}`).toBe(BENCH_165[5]);
    }
  });

  it('holds the decline past the end of the masters table', () => {
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

describe('scaleFor', () => {
  it('uses gender when given and the chosen scale otherwise', () => {
    expect(scaleFor({ gender: 'male', rating_scale: 'female' })).toBe('male');
    expect(scaleFor({ gender: 'female' })).toBe('female');
    expect(scaleFor({ gender: 'other', rating_scale: 'female' })).toBe('female');
    expect(scaleFor({ gender: 'other' })).toBeNull();
  });
});

describe('ageCoefficient', () => {
  it('follows the McCulloch masters table from 40', () => {
    expect(ageCoefficient(40)).toBe(1);
    expect(ageCoefficient(50)).toBe(1.13);
    expect(ageCoefficient(60)).toBe(1.34);
    expect(ageCoefficient(70)).toBe(1.645);
    expect(ageCoefficient(80)).toBe(2.05);
    expect(ageCoefficient(90)).toBe(2.555);
  });

  it('follows the Foster teen table to 22', () => {
    expect(ageCoefficient(14)).toBe(1.23);
    expect(ageCoefficient(17)).toBe(1.08);
    expect(ageCoefficient(22)).toBe(1.01);
    expect(ageCoefficient(23)).toBe(1);
  });

  it('extends the teen trend below 14 rather than treating a child as an adult', () => {
    expect(ageCoefficient(13)).toBeCloseTo(1.28, 6);
    expect(ageCoefficient(10)).toBeCloseTo(1.43, 6);
  });

  it('falls to 1 approaching the open years and rises steadily after', () => {
    for (let age = 10; age < 23; age++) {
      expect(ageCoefficient(age + 1), `${age}`).toBeLessThan(ageCoefficient(age));
    }
    for (let age = 40; age < 90; age++) {
      expect(ageCoefficient(age + 1), `${age}`).toBeGreaterThan(ageCoefficient(age));
    }
  });

  it('gives a 70-year-old far more allowance than the old flat curve did', () => {
    // The old curve gave 0.80 at 70; the masters table gives about 0.61.
    expect(ageFactor(70)).toBeCloseTo(1 / 1.645, 6);
    expect(ageFactor(70)).toBeLessThan(0.62);
  });
});

describe('getRating bodyweight scaling', () => {
  const bench = (bodyweight_lbs: number, gender: Gender = 'male', weight = 300) =>
    getRating('Bench Press', weight, 1, stats({ bodyweight_lbs, gender }))!;

  it('scores a lifter at a bracket bodyweight on exactly that bracket', () => {
    const r = bench(165, 'male', BENCH_165[4]);
    expect(r.level).toBeCloseTo(5, 6);
    expect(r.nextThreshold).toBe(BENCH_165[5]);
  });

  it('has no cliffs: one pound never moves the rating more than a sliver', () => {
    // Regression: brackets were steps, and bench 300 went from 6.75 at 198 lbs
    // to 6.11 at 199.
    for (const gender of ['male', 'female'] as Gender[]) {
      const weight = gender === 'male' ? 300 : 150;
      for (let bw = 90; bw <= 320; bw++) {
        const step = bench(bw, gender, weight).level - bench(bw + 1, gender, weight).level;
        expect(step, `${gender} ${bw}→${bw + 1}`).toBeLessThan(0.1);
      }
    }
  });

  it('never rates the same lift higher for a heavier lifter', () => {
    for (let bw = 90; bw <= 320; bw++) {
      expect(bench(bw + 1).level, `${bw}→${bw + 1}`).toBeLessThanOrEqual(bench(bw).level);
    }
  });

  it('scores a lifter between brackets between them, not at the heavier one', () => {
    // A 166 lb lifter used to face the 198 lb numbers outright.
    const r = bench(166);
    expect(r.level).toBeGreaterThan(bench(198).level);
    expect(r.level).toBeCloseTo(bench(165).level, 1);
  });

  it('places the open-ended top bracket at the next weight class up', () => {
    // Men's top bracket is the 275 class: at and above it the thresholds hold.
    expect(bench(275).level).toBe(bench(400).level);
    expect(bench(260).level).toBeGreaterThan(bench(275).level);
  });

  it('keeps scaling down below the lightest bracket', () => {
    // A 110 lb man used to be scored as a 132 lb one.
    expect(bench(110, 'male', 200).level).toBeGreaterThan(bench(132, 'male', 200).level);
  });

  it('leaves a table with no bodyweight in it alone', () => {
    const light = getRating('Lateral Raise', 20, 1, stats({ gender: 'female', bodyweight_lbs: 110 }))!;
    const heavy = getRating('Lateral Raise', 20, 1, stats({ gender: 'female', bodyweight_lbs: 250 }))!;
    expect(light.level).toBe(heavy.level);
  });
});

describe('standards tables', () => {
  const names = [
    'Bench Press', 'Back Squat', 'Deadlift', 'Overhead Press', 'Incline Dumbbell Bench', 'Walking Lunges', 'Pull-Ups',
    'Dips', 'Ab Wheel', 'Hanging Leg Raise', 'Plank', 'Close-Grip Bench', 'Flat Dumbbell Bench', 'DB Shoulder Press',
    'Barbell Row', 'Romanian Deadlift', 'Barbell Hip Thrust', 'Goblet Squat', 'Bulgarian Split Squat', 'Barbell Curl',
    'Hammer Curl', 'Skull Crushers', 'Lateral Raise', 'Rear Delt Fly', 'Upright Row', 'Calf Raise', 'Front Squat',
    'Incline Bench Press', 'Trap Bar Deadlift', 'Leg Press', 'Lat Pulldown', 'Seated Cable Row', 'Dumbbell Row',
    'Push-Ups', 'Inverted Row', 'Side Plank', 'Weighted Pull-ups', 'Weighted Dips',
  ];

  it('rises strictly from L1 to L10 in every bracket', () => {
    for (const name of names) {
      const standard = findStandard(name)!;
      for (const gender of ['male', 'female'] as const) {
        for (const b of standard[gender]) {
          for (let i = 0; i < 9; i++) {
            expect(b.levels[i + 1], `${name} ${gender} ${b.bodyweightMax} L${i + 2}`).toBeGreaterThan(b.levels[i]);
          }
        }
      }
    }
  });

  it('puts L10 at about elite: a 198 lb man', () => {
    // Recalibrated: L10 used to be one level beyond elite, 3.8× bodyweight on
    // the deadlift at the top of this bracket.
    const l10 = (name: string) => findStandard(name)!.male.find((b) => b.bodyweightMax === 198)!.levels[9] / 198;
    expect(l10('Bench Press')).toBeCloseTo(1.97, 2);
    expect(l10('Back Squat')).toBeCloseTo(2.75, 2);
    expect(l10('Deadlift')).toBeCloseTo(3.46, 2);
  });
});

describe('getRating weighted calisthenics', () => {
  it('rates the added load on top of the body, against a fraction of bodyweight', () => {
    // 45×8 at 180 lbs: Epley on 225 total is 285, so +105 added, 0.583× bodyweight:
    // between L6 (0.5) and L7 (0.6) on the male table.
    const r = getRating('Weighted Pull-ups', 45, 8, stats({ bodyweight_lbs: 180 }))!;
    expect(r.metric).toBeCloseTo(105, 6);
    expect(r.level).toBeCloseTo(6 + (0.5833 - 0.5) / 0.1, 2);
    expect(r.nextThreshold).toBe(Math.ceil(0.6 * 180));
  });

  it('asks a heavier lifter for less added load but more total load', () => {
    // At L5 (+0.4 at the reference): about +76 at 150 lbs (226 moved) and
    // about +64 at 220 lbs (284 moved). The body is part of the load.
    // Fewest whole pounds added, for a single, that reach L5.
    const addedAtL5 = (bw: number) => {
      let w = 1;
      while (getRating('Weighted Pull-ups', w, 1, stats({ bodyweight_lbs: bw }))!.level < 5) w++;
      return w;
    };
    const light = addedAtL5(150);
    const heavy = addedAtL5(220);
    expect(heavy).toBeLessThan(light);
    expect(heavy + 220).toBeGreaterThan(light + 150);
  });
});

describe('getRating bodyweight feats', () => {
  const pullUpsFor = (level: number, bodyweight_lbs: number, gender: Gender = 'male') => {
    // Fewest whole reps that reach the level.
    let n = 1;
    while (getRating('Pull-Ups', n, null, stats({ bodyweight_lbs, gender }))!.level < level) n++;
    return n;
  };

  it('leaves the table as written at the reference bodyweight', () => {
    // Male pull-ups: L5 is 12, L10 is 30, for a 180 lb man.
    expect(pullUpsFor(5, 180)).toBe(12);
    expect(pullUpsFor(10, 180)).toBe(30);
    expect(pullUpsFor(5, 145, 'female')).toBe(6);
  });

  it('asks fewer reps of a heavier lifter and more of a lighter one', () => {
    // Regression: 20 pull-ups asked the same of a 150 lb and a 250 lb lifter.
    expect(pullUpsFor(10, 250)).toBeLessThan(pullUpsFor(10, 180));
    expect(pullUpsFor(10, 140)).toBeGreaterThan(pullUpsFor(10, 180));
    expect(pullUpsFor(10, 250)).toBe(23);
  });

  it('rates the same count lower for a lighter lifter, for every bodyweight feat', () => {
    for (const name of ['Pull-Ups', 'Dips', 'Push-Ups', 'Inverted Row']) {
      let prev = -Infinity;
      for (let bw = 110; bw <= 300; bw += 10) {
        const level = getRating(name, 15, null, stats({ bodyweight_lbs: bw }))!.level;
        expect(level, `${name} at ${bw}`).toBeGreaterThanOrEqual(prev);
        prev = level;
      }
    }
  });

  it('leaves core endurance alone', () => {
    const light = getRating('Plank', 90, null, stats({ bodyweight_lbs: 130 }))!;
    const heavy = getRating('Plank', 90, null, stats({ bodyweight_lbs: 260 }))!;
    expect(light.level).toBe(heavy.level);
  });
});

