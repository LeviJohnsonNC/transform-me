import { describe, it, expect } from 'vitest';
import { canSave, fixedRepsFor, formatAmount, personalBest, unitFor } from '@/lib/recordMath';

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
});
