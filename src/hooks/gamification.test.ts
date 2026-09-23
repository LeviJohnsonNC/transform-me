import { describe, it, expect } from 'vitest';
import { getDayTier, getNextTierInfo, computeDayTier } from '@/hooks/useGamification';

// These thresholds drive every tier badge, and feed tierToPoints, which drives
// cycle levels and therefore which rewards unlock. Pinning the exact boundaries
// so a refactor cannot quietly shift one.

describe('getDayTier', () => {
  it('returns missed when there are no habits, rather than dividing by zero', () => {
    expect(getDayTier(0, 0)).toBe('missed');
    expect(getDayTier(3, 0)).toBe('missed');
  });

  it('awards gold only at a full clear', () => {
    expect(getDayTier(10, 10)).toBe('gold');
    expect(getDayTier(9, 10)).toBe('silver');
  });

  it.each([
    // [completed, total, tier] — boundaries are inclusive lower bounds.
    [10, 10, 'gold'],
    [9, 10, 'silver'], // exactly 0.9
    [8, 10, 'bronze'], // 0.8
    [7, 10, 'bronze'], // exactly 0.7
    [6, 10, 'partial'], // 0.6
    [5, 10, 'partial'], // exactly 0.5
    [4, 10, 'missed'], // 0.4
    [0, 10, 'missed'],
  ])('%i of %i is %s', (completed, total, expected) => {
    expect(getDayTier(completed, total)).toBe(expected);
  });

  it('is inclusive at each boundary, not exclusive', () => {
    // A 20-habit day makes the .9/.7/.5 boundaries land on whole numbers.
    expect(getDayTier(18, 20)).toBe('silver'); // 0.90 exactly
    expect(getDayTier(17, 20)).toBe('bronze'); // 0.85
    expect(getDayTier(14, 20)).toBe('bronze'); // 0.70 exactly
    expect(getDayTier(13, 20)).toBe('partial'); // 0.65
    expect(getDayTier(10, 20)).toBe('partial'); // 0.50 exactly
    expect(getDayTier(9, 20)).toBe('missed'); // 0.45
  });

  it('clamps an over-count to gold rather than inventing a higher tier', () => {
    // completed > total should be impossible; see the invariant test in
    // habitMath.test.ts for the path that produces it. This documents that when
    // it does happen the damage stops at gold.
    expect(getDayTier(11, 10)).toBe('gold');
  });
});

describe('getNextTierInfo', () => {
  it('reports gold as the max tier with nothing left to do', () => {
    const info = getNextTierInfo(10, 10);
    expect(info).toMatchObject({
      tier: 'gold',
      nextTier: null,
      habitsToNext: 0,
      isMaxTier: true,
    });
  });

  it('counts habits remaining to the next tier, rounding up', () => {
    // 5/10 is partial; bronze needs ceil(0.7 * 10) = 7, so 2 more.
    expect(getNextTierInfo(5, 10)).toMatchObject({
      tier: 'partial',
      nextTier: 'bronze',
      habitsToNext: 2,
    });
  });

  it('steps missed -> partial -> bronze -> silver -> gold in order', () => {
    expect(getNextTierInfo(0, 10).nextTier).toBe('partial');
    expect(getNextTierInfo(5, 10).nextTier).toBe('bronze');
    expect(getNextTierInfo(7, 10).nextTier).toBe('silver');
    expect(getNextTierInfo(9, 10).nextTier).toBe('gold');
  });

  it('needs every habit for gold', () => {
    // silver at 9/10; gold needs ceil(1.0 * 10) = 10, so exactly 1 more.
    expect(getNextTierInfo(9, 10).habitsToNext).toBe(1);
  });

  it('rounds up on habit counts that do not divide evenly', () => {
    // 7 habits: bronze needs ceil(0.7 * 7) = ceil(4.9) = 5, not 4.
    expect(getDayTier(4, 7)).toBe('partial'); // 0.571
    expect(getDayTier(5, 7)).toBe('bronze'); // 0.714
    expect(getNextTierInfo(4, 7)).toMatchObject({ nextTier: 'bronze', habitsToNext: 1 });
  });

  it('never reports a negative number of habits remaining', () => {
    // 3/4 is bronze (0.75); silver needs ceil(0.9 * 4) = 4.
    expect(getNextTierInfo(3, 4).habitsToNext).toBeGreaterThanOrEqual(0);
    expect(getNextTierInfo(11, 10).habitsToNext).toBe(0);
  });

  it('degrades safely when there are no habits at all', () => {
    expect(getNextTierInfo(0, 0)).toMatchObject({
      tier: 'missed',
      nextTier: null,
      habitsToNext: 0,
      isMaxTier: false,
    });
  });
});

describe('computeDayTier', () => {
  const entries = [
    { habitId: 'a', date: '2026-09-14', completed: true },
    { habitId: 'b', date: '2026-09-14', completed: true },
    { habitId: 'c', date: '2026-09-14', completed: false },
    { habitId: 'a', date: '2026-09-15', completed: true },
  ];

  it('counts only completed entries on the requested date', () => {
    expect(computeDayTier(entries, 4, '2026-09-14')).toMatchObject({
      completed: 2,
      total: 4,
      tier: 'partial',
    });
  });

  it('returns zero completed for a date with no entries', () => {
    expect(computeDayTier(entries, 4, '2026-09-13')).toMatchObject({
      completed: 0,
      tier: 'missed',
    });
  });

  it('does not leak entries across dates', () => {
    expect(computeDayTier(entries, 4, '2026-09-15').completed).toBe(1);
  });
});
