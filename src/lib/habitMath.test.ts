import { describe, it, expect } from 'vitest';
import {
  getEntriesForDate,
  getDayProgress,
  getStreakData,
  getRecentDays,
  STREAK_WINDOW_DAYS,
} from '@/lib/habitMath';
import type { Habit, HabitEntry } from '@/types/habits';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// A fixed "now" so streak windows are deterministic. Monday, verified against a
// real calendar. TZ is pinned to America/Los_Angeles in vitest.config.ts.
const MONDAY_2026_09_21 = new Date(2026, 8, 21, 12, 0, 0);

const FRIDAY = '2026-09-18';
const SATURDAY = '2026-09-19';
const SUNDAY = '2026-09-20';
const MONDAY = '2026-09-21';

const habit = (id: string, over: Partial<Habit> = {}): Habit => ({
  id,
  name: id,
  icon: 'check',
  orderIndex: 0,
  isActive: true,
  valueType: 'boolean',
  activeOnWeekdays: true,
  activeOnWeekends: true,
  ...over,
});

const everyDay = (...ids: string[]) => ids.map((id) => habit(id));
const weekdayOnly = (id: string) => habit(id, { activeOnWeekends: false });

const entry = (habitId: string, date: string, completed = true): HabitEntry => ({
  id: `${habitId}-${date}-${completed}`,
  habitId,
  date,
  completed,
});

/** Every habit in `habitIds` completed on each of `dates`. */
const allCompleted = (habitIds: string[], dates: string[]): HabitEntry[] =>
  dates.flatMap((d) => habitIds.map((h) => entry(h, d)));

/** The `count` days ending on (and including) `end`, as 'YYYY-MM-DD'. */
const daysEndingOn = (end: Date, count: number): string[] => {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return out;
};

// ---------------------------------------------------------------------------
// Basics
// ---------------------------------------------------------------------------

describe('getEntriesForDate', () => {
  const entries = [entry('a', SUNDAY), entry('b', SUNDAY), entry('a', MONDAY)];

  it('returns only that date', () => {
    expect(getEntriesForDate(entries, SUNDAY)).toHaveLength(2);
  });

  it('returns empty for a date with nothing', () => {
    expect(getEntriesForDate(entries, SATURDAY)).toEqual([]);
  });

  it('tolerates a non-array, which the query layer can hand it mid-load', () => {
    expect(getEntriesForDate(undefined as unknown as HabitEntry[], SUNDAY)).toEqual([]);
    expect(getEntriesForDate(null as unknown as HabitEntry[], SUNDAY)).toEqual([]);
  });
});

describe('getDayProgress', () => {
  const habits = everyDay('a', 'b', 'c');

  it('counts completed habits against the habits active that day', () => {
    const entries = [entry('a', MONDAY), entry('b', MONDAY), entry('c', MONDAY, false)];
    expect(getDayProgress(entries, MONDAY, habits)).toMatchObject({
      date: MONDAY,
      completedCount: 2,
      totalCount: 3,
    });
  });

  it('uses only the habits active on that day for the total', () => {
    // 'c' is weekday-only, so Saturday asks for 2 habits, not 3.
    const mixed = [...everyDay('a', 'b'), weekdayOnly('c')];
    expect(getDayProgress([], SATURDAY, mixed).totalCount).toBe(2);
    expect(getDayProgress([], MONDAY, mixed).totalCount).toBe(3);
  });

  it('reports zero for a date with no entries', () => {
    expect(getDayProgress([], MONDAY, habits)).toMatchObject({
      completedCount: 0,
      totalCount: 3,
    });
  });

  it('exposes every entry recorded that day, including ones that do not count', () => {
    // The counts ignore 'c' on a weekend, but callers still need to look it up.
    const mixed = [...everyDay('a', 'b'), weekdayOnly('c')];
    const entries = [entry('a', SATURDAY), entry('c', SATURDAY)];
    const progress = getDayProgress(entries, SATURDAY, mixed);
    expect(progress.entries).toHaveLength(2);
    expect(progress.completedCount).toBe(1);
  });

  it('tolerates a missing habit list', () => {
    expect(getDayProgress([], MONDAY, undefined as unknown as Habit[])).toMatchObject({
      completedCount: 0,
      totalCount: 0,
    });
  });
});

describe('getRecentDays', () => {
  it('returns the requested number of days, oldest first, ending today', () => {
    const days = getRecentDays([], 7, everyDay('a'), MONDAY_2026_09_21);
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-09-15');
    expect(days[6].date).toBe(MONDAY);
  });

  it('gives each day its own total', () => {
    const mixed = [...everyDay('a', 'b'), weekdayOnly('c')];
    const days = getRecentDays([], 7, mixed, MONDAY_2026_09_21);
    const totals = Object.fromEntries(days.map((d) => [d.date, d.totalCount]));
    expect(totals[SATURDAY]).toBe(2);
    expect(totals[SUNDAY]).toBe(2);
    expect(totals[MONDAY]).toBe(3);
  });
});

describe('getStreakData', () => {
  const habits = everyDay('a', 'b');

  it('counts consecutive fully-complete days up to today', () => {
    const entries = allCompleted(['a', 'b'], daysEndingOn(MONDAY_2026_09_21, 4));
    expect(getStreakData(entries, habits, undefined, MONDAY_2026_09_21).current).toBe(4);
  });

  it('does not break the streak just because today is still in progress', () => {
    const past = daysEndingOn(MONDAY_2026_09_21, 4).slice(0, 3);
    const entries = allCompleted(['a', 'b'], past);
    expect(getStreakData(entries, habits, undefined, MONDAY_2026_09_21).current).toBe(3);
  });

  it('breaks the streak on a genuinely incomplete past day', () => {
    const dates = daysEndingOn(MONDAY_2026_09_21, 4);
    const entries = allCompleted(['a', 'b'], dates).filter(
      (e) => !(e.date === dates[1] && e.habitId === 'b'),
    );
    expect(getStreakData(entries, habits, undefined, MONDAY_2026_09_21).current).toBe(2);
  });

  it('treats any completion as a complete day when scoped to one habit', () => {
    const entries = allCompleted(['a'], daysEndingOn(MONDAY_2026_09_21, 3));
    // 'b' is untouched, but in single-habit mode it is irrelevant.
    expect(getStreakData(entries, habits, 'a', MONDAY_2026_09_21).current).toBe(3);
  });

  it('returns a display window of exactly STREAK_WINDOW_DAYS, oldest first', () => {
    const data = getStreakData([], habits, undefined, MONDAY_2026_09_21).data;
    expect(data).toHaveLength(STREAK_WINDOW_DAYS);
    expect(data[STREAK_WINDOW_DAYS - 1].date).toBe(MONDAY);
  });

  it('reports zero for an empty history', () => {
    expect(getStreakData([], habits, undefined, MONDAY_2026_09_21)).toMatchObject({
      current: 0,
      longest: 0,
    });
  });

  it('does not let a duplicate entry fake a complete day', () => {
    // Two rows for 'a', none for 'b'. Counting rows would read this as 2 of 2.
    const entries = [entry('a', MONDAY), { ...entry('a', MONDAY), id: 'dup' }];
    expect(getStreakData(entries, habits, undefined, MONDAY_2026_09_21).longest).toBe(0);
    expect(getDayProgress(entries, MONDAY, habits).completedCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Regressions — each of these was a confirmed bug, reproduced before the fix.
// ---------------------------------------------------------------------------

describe('regression: weekends must not break the streak', () => {
  // Confirmed in real data: 3 of 10 habits are weekday-only, so a weekend can
  // never reach the full habit count. Comparing against one number for the whole
  // window reset the streak every Saturday, capping it at 5.
  const habits = [...everyDay('a', 'b'), weekdayOnly('c')];

  const entries = [
    ...allCompleted(['a', 'b', 'c'], [FRIDAY]),
    ...allCompleted(['a', 'b'], [SATURDAY, SUNDAY]), // 'c' is not asked for
    ...allCompleted(['a', 'b', 'c'], [MONDAY]),
  ];

  it('counts a 4-day streak across the weekend', () => {
    expect(getStreakData(entries, habits, undefined, MONDAY_2026_09_21).current).toBe(4);
  });

  it('still breaks when a weekend-active habit is actually missed', () => {
    const missedSaturday = entries.filter(
      (e) => !(e.date === SATURDAY && e.habitId === 'b'),
    );
    expect(
      getStreakData(missedSaturday, habits, undefined, MONDAY_2026_09_21).current,
    ).toBe(2); // Sunday and Monday only
  });

  it('bridges a day that asks for nothing at all', () => {
    // Every habit is weekday-only, so both weekend days are neutral: they
    // neither extend nor break the run.
    const weekdayHabits = [weekdayOnly('a'), weekdayOnly('b')];
    const weekdayEntries = allCompleted(['a', 'b'], [FRIDAY, MONDAY]);
    expect(
      getStreakData(weekdayEntries, weekdayHabits, undefined, MONDAY_2026_09_21).current,
    ).toBe(2);
  });
});

describe('regression: longest streak must see all history', () => {
  // The UI presents this as an all-time best, but only the last 30 days were
  // ever scanned. Confirmed in real data: 399 days of history.
  const habits = everyDay('a', 'b');

  const oldRunEnd = new Date(MONDAY_2026_09_21);
  oldRunEnd.setDate(oldRunEnd.getDate() - 60);
  const entries = allCompleted(['a', 'b'], daysEndingOn(oldRunEnd, 40));

  it('reports a 40-day run that ended 60 days ago', () => {
    expect(getStreakData(entries, habits, undefined, MONDAY_2026_09_21).longest).toBe(40);
  });

  it('still reports the current streak as broken', () => {
    expect(getStreakData(entries, habits, undefined, MONDAY_2026_09_21).current).toBe(0);
  });

  it('keeps the display window at 30 days regardless', () => {
    expect(
      getStreakData(entries, habits, undefined, MONDAY_2026_09_21).data,
    ).toHaveLength(STREAK_WINDOW_DAYS);
  });

  it('takes the longest of several separate runs', () => {
    const recent = allCompleted(['a', 'b'], daysEndingOn(MONDAY_2026_09_21, 3));
    const both = [...entries, ...recent];
    expect(getStreakData(both, habits, undefined, MONDAY_2026_09_21).longest).toBe(40);
  });
});

describe('regression: completed can never exceed total', () => {
  // getDayProgress used to filter by date alone, so a weekday-only habit logged
  // on a weekend landed in the numerator while the denominator excluded it.
  // Confirmed on 4 real weekend days, e.g. "5/7 bronze" where only 3 of the 7
  // weekend-active habits were actually done.
  const habits = [...everyDay('a', 'b'), weekdayOnly('weekday-only')];

  const entries = [
    entry('a', SATURDAY),
    entry('b', SATURDAY),
    entry('weekday-only', SATURDAY), // logged anyway; must not count
  ];

  it('ignores a habit that is not active that day', () => {
    const progress = getDayProgress(entries, SATURDAY, habits);
    expect(progress.completedCount).toBe(2);
    expect(progress.totalCount).toBe(2);
  });

  it('holds the invariant across every day of a real-shaped month', () => {
    const month = daysEndingOn(MONDAY_2026_09_21, 30);
    // Log every habit every day, including on days they are not asked for.
    const noisy = allCompleted(['a', 'b', 'weekday-only'], month);
    for (const date of month) {
      const progress = getDayProgress(noisy, date, habits);
      expect(progress.completedCount, date).toBeLessThanOrEqual(progress.totalCount);
    }
  });

  it('does not turn an over-logged weekend into a full clear', () => {
    // Only 'a' of the two weekend habits is done, plus an irrelevant extra.
    const partial = [entry('a', SATURDAY), entry('weekday-only', SATURDAY)];
    const progress = getDayProgress(partial, SATURDAY, habits);
    expect(progress.completedCount).toBe(1);
    expect(progress.totalCount).toBe(2);
  });
});
