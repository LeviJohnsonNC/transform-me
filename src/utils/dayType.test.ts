import { describe, it, expect } from 'vitest';
import { isWeekend, getActiveHabitsForDate } from '@/utils/dayType';
import type { Habit } from '@/types/habits';

// Every date asserted here was checked against a real calendar.
const MONDAY = '2026-09-14';
const FRIDAY = '2026-09-18';
const SATURDAY = '2026-09-19';
const SUNDAY = '2026-09-20';

const habit = (over: Partial<Habit> & { id: string }): Habit => ({
  name: over.id,
  icon: 'check',
  orderIndex: 0,
  isActive: true,
  valueType: 'boolean',
  ...over,
});

describe('isWeekend', () => {
  it('is false Monday through Friday', () => {
    for (const d of ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']) {
      expect(isWeekend(d), d).toBe(false);
    }
  });

  it('is true on Saturday and Sunday', () => {
    expect(isWeekend(SATURDAY)).toBe(true);
    expect(isWeekend(SUNDAY)).toBe(true);
  });

  it('accepts a Date as well as a string', () => {
    // Month is 0-indexed: 8 === September. Local time, matching parseISO's
    // behaviour for date-only strings.
    expect(isWeekend(new Date(2026, 8, 19))).toBe(true);
    expect(isWeekend(new Date(2026, 8, 21))).toBe(false);
  });

  it('is correct on daylight-saving transition days', () => {
    // Both are Sundays. A date-only string parses to local midnight, which on a
    // spring-forward day is still the same calendar day.
    expect(isWeekend('2026-03-08')).toBe(true); // DST begins (US)
    expect(isWeekend('2026-11-01')).toBe(true); // DST ends (US)
  });
});

describe('getActiveHabitsForDate', () => {
  const weekdayOnly = habit({ id: 'weekday-only', activeOnWeekdays: true, activeOnWeekends: false });
  const weekendOnly = habit({ id: 'weekend-only', activeOnWeekdays: false, activeOnWeekends: true });
  const everyDay = habit({ id: 'every-day', activeOnWeekdays: true, activeOnWeekends: true });
  const all = [weekdayOnly, weekendOnly, everyDay];

  it('excludes weekend-inactive habits on a weekend', () => {
    expect(getActiveHabitsForDate(all, SATURDAY).map((h) => h.id)).toEqual([
      'weekend-only',
      'every-day',
    ]);
  });

  it('excludes weekday-inactive habits on a weekday', () => {
    expect(getActiveHabitsForDate(all, MONDAY).map((h) => h.id)).toEqual([
      'weekday-only',
      'every-day',
    ]);
  });

  it('treats undefined flags as active, since only an explicit false excludes', () => {
    // Habits created before the weekday/weekend columns existed have no flags.
    const legacy = habit({ id: 'legacy' });
    expect(getActiveHabitsForDate([legacy], MONDAY)).toHaveLength(1);
    expect(getActiveHabitsForDate([legacy], SATURDAY)).toHaveLength(1);
  });

  it('can return an empty list when nothing is active that day', () => {
    expect(getActiveHabitsForDate([weekdayOnly], SUNDAY)).toEqual([]);
  });

  it('does not filter on isActive — that is the caller\'s job', () => {
    // useUserHabits filters is_active in its query, so this function only ever
    // sees active habits. Pinning the behaviour so the split stays deliberate.
    const deactivated = habit({ id: 'deactivated', isActive: false });
    expect(getActiveHabitsForDate([deactivated], MONDAY)).toHaveLength(1);
  });

  it('preserves input order', () => {
    expect(getActiveHabitsForDate(all, FRIDAY).map((h) => h.id)).toEqual([
      'weekday-only',
      'every-day',
    ]);
  });
});
