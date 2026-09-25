import { describe, it, expect } from 'vitest';
import { bestForRating, canSave, fixedRepsFor, formatAmount, personalBest, unitFor, weightLabel } from '@/lib/recordMath';
import { findStandard } from '@/lib/strengthStandards';

const exercise = (over: Partial<Parameters<typeof fixedRepsFor>[0]> = {}) => ({
  rep_type: 'fixed' as const,
  reps: 5,
  reps_high: null,
  backoff_reps: null,
  backoff_reps_high: null,
  ...over,
});

describe('canSave', () => {
  it('accepts 0 for a weighted lift, because 0 is bodyweight', () => {
    expect(canSave('0', 'lbs')).toBe(true);
    expect(canSave('0.0', 'lbs')).toBe(true);
  });

  it('refuses an empty or unreadable box', () => {
    expect(canSave('', 'lbs')).toBe(false);
    expect(canSave('   ', 'lbs')).toBe(false);
    expect(canSave('abc', 'lbs')).toBe(false);
    expect(canSave('-5', 'lbs')).toBe(false);
  });

  it('still refuses 0 when the box is the count itself', () => {
    // For planks and pull-ups the number IS the result; zero of them is not one.
    expect(canSave('0', 'reps')).toBe(false);
    expect(canSave('0', 'seconds')).toBe(false);
    expect(canSave('12', 'reps')).toBe(true);
  });
});

describe('fixedRepsFor', () => {
  it('pins a plain fixed prescription', () => {
    expect(fixedRepsFor(exercise(), 'standard')).toBe(5);
    expect(fixedRepsFor(exercise(), 'top')).toBe(5);
  });

  it('leaves a rep range or AMRAP for the user to fill in', () => {
    expect(fixedRepsFor(exercise({ reps: 8, reps_high: 12 }), 'standard')).toBeNull();
    expect(fixedRepsFor(exercise({ rep_type: 'amrap' }), 'standard')).toBeNull();
  });

  it('reads the backoff prescription for a backoff set, not the top set', () => {
    expect(fixedRepsFor(exercise({ reps: 3, backoff_reps: 8 }), 'backoff')).toBe(8);
    expect(fixedRepsFor(exercise({ backoff_reps: 8, backoff_reps_high: 10 }), 'backoff')).toBeNull();
    expect(fixedRepsFor(exercise({ backoff_reps: null }), 'backoff')).toBeNull();
  });
});

describe('personalBest', () => {
  const rec = (current_weight: number, actual_reps: number | null, previous_best: number | null, previous_best_reps: number | null) =>
    ({ current_weight, actual_reps, previous_best, previous_best_reps });

  it('counts a bodyweight set rather than treating 0 as no set', () => {
    // Regression: the old `if (cw)` check made a 0 lbs set vanish.
    expect(personalBest(rec(0, 12, null, null))).toEqual({ weight: 0, reps: 12 });
  });

  it('compares bodyweight sets on reps', () => {
    expect(personalBest(rec(0, 15, 0, 12))).toEqual({ weight: 0, reps: 15 });
    expect(personalBest(rec(0, 10, 0, 12))).toEqual({ weight: 0, reps: 12 });
  });

  it('prefers heavier, then more reps at equal weight', () => {
    expect(personalBest(rec(200, 5, 190, 8))).toEqual({ weight: 200, reps: 5 });
    expect(personalBest(rec(180, 5, 190, 3))).toEqual({ weight: 190, reps: 3 });
    expect(personalBest(rec(190, 6, 190, 5))).toEqual({ weight: 190, reps: 6 });
  });

  it('returns null with nothing stored', () => {
    expect(personalBest(undefined)).toBeNull();
  });
});

describe('formatAmount', () => {
  it('shows a 0 lbs set as bodyweight', () => {
    expect(formatAmount(0, 'lbs')).toEqual({ value: 'BW', suffix: '' });
  });

  it('keeps units for everything else', () => {
    expect(formatAmount(185, 'lbs')).toEqual({ value: '185', suffix: 'lbs' });
    expect(formatAmount(12, 'reps')).toEqual({ value: '12', suffix: 'reps' });
    expect(formatAmount(90, 'seconds')).toEqual({ value: '90', suffix: 's' });
  });
});

describe('unitFor', () => {
  it('matches what the card previously computed', () => {
    expect(unitFor('Plank')).toBe('seconds');
    expect(unitFor('Chin-Ups')).toBe('reps');
    expect(unitFor('Dips')).toBe('reps');
    expect(unitFor('Walking Lunges')).toBe('lbs');
    expect(unitFor('Bench Press')).toBe('lbs');
  });

  it('takes the unit from the standard, so the card and the rating agree', () => {
    // Regression: "Pullups" was a weight on the card but a rep count to the
    // rating, so +25 lbs was graded as 25 pull-ups.
    expect(unitFor('Pullups')).toBe('reps');
    expect(unitFor('Chinups')).toBe('reps');
    expect(unitFor('Ab-Wheel')).toBe('reps');
    for (const name of ['Pullups', 'Chin-Ups', 'Dips', 'Plank', 'Ab Roller', 'Bench Press', 'Hanging Leg Raise', 'Lunges']) {
      expect(unitFor(name), name).toBe(findStandard(name)!.unit);
    }
  });

  it('counts unrated variants the way their family is counted', () => {
    expect(unitFor('Assisted Pull-ups')).toBe('reps');
    expect(unitFor('Knee Push-ups')).toBe('reps');
    expect(unitFor('Bench Dips')).toBe('reps');
    expect(unitFor('Side Plank')).toBe('seconds');
    expect(unitFor('Hack Squat')).toBe('lbs');
  });

  it('logs weighted calisthenics as the weight added', () => {
    expect(unitFor('Weighted Pull-ups')).toBe('lbs');
    expect(unitFor('Weighted Dips')).toBe('lbs');
    expect(unitFor('Weighted Ring Dips')).toBe('lbs');
    expect(unitFor('Weighted Plank')).toBe('seconds');
  });
});

describe('weightLabel', () => {
  it('says which weight to type', () => {
    expect(weightLabel('Bench Press')).toBe('Weight (lbs)');
    expect(weightLabel('Hammer Curls')).toBe('Weight per dumbbell (lbs)');
    expect(weightLabel('Incline Dumbbell Bench')).toBe('Weight per dumbbell (lbs)');
    expect(weightLabel('Walking Lunges')).toBe('Total weight, both hands (lbs)');
    expect(weightLabel('Weighted Pull-ups')).toBe('Added weight (lbs)');
    expect(weightLabel('Cable Woodchopper')).toBe('Weight (lbs)');
  });
});

describe('bestForRating', () => {
  const rec = (current_weight: number, actual_reps: number | null, previous_best: number | null = null, previous_best_reps: number | null = null) =>
    ({ current_weight, actual_reps, previous_best, previous_best_reps });

  it('picks the strongest set by estimated 1RM, not the heaviest', () => {
    // 205×10 (≈273) beats 225×1.
    expect(bestForRating([rec(225, 1, 205, 10)], 'lbs')).toEqual({ weight: 205, reps: 10 });
  });

  it('looks across every set on the card, not just the first', () => {
    const top = rec(225, 3);
    const backoff = rec(185, 12); // ≈259 vs ≈248
    expect(bestForRating([top, backoff], 'lbs')).toEqual({ weight: 185, reps: 12 });
  });

  it('skips weighted sets with no reps, and bodyweight sets', () => {
    expect(bestForRating([rec(300, null)], 'lbs')).toBeNull();
    expect(bestForRating([rec(0, 12)], 'lbs')).toBeNull();
    expect(bestForRating([rec(300, null, 200, 5)], 'lbs')).toEqual({ weight: 200, reps: 5 });
  });

  it('compares sets with the score it is given', () => {
    // Weighted pull-ups at 180 lbs: 25×8 (≈+79 added) beats 50×1 (+50), which
    // the default, on the belt weight alone, gets backwards.
    const records = [rec(50, 1), rec(25, 8)];
    const onTotal = (w: number, r: number | null) => (180 + w) * (1 + (r ?? 1) / 30);
    expect(bestForRating(records, 'lbs', onTotal)).toEqual({ weight: 25, reps: 8 });
  });

  it('takes the biggest count for rep- and time-counted lifts', () => {
    expect(bestForRating([rec(12, null, 15, null), rec(9, null)], 'reps')).toEqual({ weight: 15, reps: null });
  });

  it('returns null with nothing stored', () => {
    expect(bestForRating([undefined], 'lbs')).toBeNull();
    expect(bestForRating([], 'reps')).toBeNull();
  });
});
