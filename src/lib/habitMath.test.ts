import { describe, it, expect } from 'vitest';
import {
  getEntriesForDate,
  getDayProgress,
  getStreakData,
  getRecentDays,
  STREAK_WINDOW_DAYS,
} from '@/lib/habitMath';
import type { HabitEntry } from '@/types/habits';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// A fixed "now" so streak windows are deterministic. Monday, verified against a
// real calendar. TZ is pinned to America/Los_Angeles in vitest.config.ts.
const MONDAY_2026_09_21 = new Date(2026, 8, 21, 12, 0, 0);

const entry = (habitId: string, date: string, completed = true): HabitEntry => ({
  id: `${habitId}-${date}`,
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
  const entries = [entry('a', '2026-09-20'), entry('b', '2026-09-20'), entry('a', '2026-09-21')];

  it('returns only that date', () => {
    expect(getEntriesForDate(entries, '2026-09-20')).toHaveLength(2);
  });

  it('returns empty for a date with nothing', () => {
    expect(getEntriesForDate(entries, '2026-09-19')).toEqual([]);
  });

  it('tolerates a non-array, which the query layer can hand it mid-load', () => {
    expect(getEntriesForDate(undefined as unknown as HabitEntry[], '2026-09-20')).toEqual([]);
    expect(getEntriesForDate(null as unknown as HabitEntry[], '2026-09-20')).toEqual([]);
  });
});

describe('getDayProgress', () => {
  const entries = [
    entry('a', '2026-09-21'),
    entry('b', '2026-09-21'),
    entry('c', '2026-09-21', false),
  ];

  it('counts completed entries against the supplied total', () => {
    expect(getDayProgress(entries, '2026-09-21', 5)).toMatchObject({
      date: '2026-09-21',
      completedCount: 2,
      totalCount: 5,
    });
  });

  it('ignores incomplete entries', () => {
    expect(getDayProgress(entries, '2026-09-21', 5).entries).toHaveLength(3);
    expect(getDayProgress(entries, '2026-09-21', 5).completedCount).toBe(2);
  });
});

describe('getRecentDays', () => {
  it('returns the requested number of days, oldest first, ending today', () => {
    const days = getRecentDays([], 7, 5, MONDAY_2026_09_21);
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-09-15');
    expect(days[6].date).toBe('2026-09-21');
  });
});

describe('getStreakData', () => {
  it('counts consecutive fully-complete days up to today', () => {
    const dates = daysEndingOn(MONDAY_2026_09_21, 4);
    const entries = allCompleted(['a', 'b'], dates);
    expect(getStreakData(entries, 2, undefined, MONDAY_2026_09_21).current).toBe(4);
  });

  it('does not break the streak just because today is still in progress', () => {
    // Three complete days, then today with nothing logged yet.
    const past = daysEndingOn(MONDAY_2026_09_21, 4).slice(0, 3);
    const entries = allCompleted(['a', 'b'], past);
    expect(getStreakData(entries, 2, undefined, MONDAY_2026_09_21).current).toBe(3);
  });

  it('breaks the streak on a genuinely incomplete past day', () => {
    const dates = daysEndingOn(MONDAY_2026_09_21, 4);
    const entries = allCompleted(['a', 'b'], dates).filter(
      (e) => !(e.date === dates[1] && e.habitId === 'b'),
    );
    expect(getStreakData(entries, 2, undefined, MONDAY_2026_09_21).current).toBe(2);
  });

  it('treats any completion as a complete day when scoped to one habit', () => {
    const dates = daysEndingOn(MONDAY_2026_09_21, 3);
    // Only habit 'a' logged, but totalHabits is 5 — irrelevant in habit mode.
    const entries = allCompleted(['a'], dates);
    expect(getStreakData(entries, 5, 'a', MONDAY_2026_09_21).current).toBe(3);
  });

  it('returns a window of exactly STREAK_WINDOW_DAYS, oldest first', () => {
    const data = getStreakData([], 2, undefined, MONDAY_2026_09_21);
    expect(data.data).toHaveLength(STREAK_WINDOW_DAYS);
    expect(data.data[STREAK_WINDOW_DAYS - 1].date).toBe('2026-09-21');
  });

  it('reports zero for an empty history', () => {
    expect(getStreakData([], 3, undefined, MONDAY_2026_09_21)).toMatchObject({
      current: 0,
      longest: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// BUG REPRODUCTIONS
//
// These use `it.fails`, which PASSES while the assertion inside is false. That
// keeps `npm test` green so CI is usable today, while pinning each bug: the
// moment someone fixes one, its `it.fails` goes red and tells you to delete the
// `.fails` and keep the test. To watch them fail for real, drop the `.fails`.
// ---------------------------------------------------------------------------

describe('BUG: weekends break the streak when some habits are weekday-only', () => {
  // Confirmed against real data: 3 of 10 habits are weekday-only, so on a
  // weekend at most 7 can be completed. getStreakData compares against a single
  // `totalHabits` for the whole window, so `count === totalHabits` can never
  // hold on a weekend and the streak resets every Saturday.
  //
  // Fix: take the per-day active-habit count (getActiveHabitsForDate) rather
  // than one number, then delete the `.fails` below.

  const WEEKDAY_HABITS = ['a', 'b', 'c'];
  const WEEKEND_HABITS = ['a', 'b']; // 'c' is weekday-only
  const TOTAL = WEEKDAY_HABITS.length;

  // Fri 09-18, Sat 09-19, Sun 09-20, Mon 09-21 — all perfectly completed.
  const entries = [
    ...allCompleted(WEEKDAY_HABITS, ['2026-09-18']),
    ...allCompleted(WEEKEND_HABITS, ['2026-09-19', '2026-09-20']),
    ...allCompleted(WEEKDAY_HABITS, ['2026-09-21']),
  ];

  it.fails('should count a 4-day streak across the weekend', () => {
    expect(getStreakData(entries, TOTAL, undefined, MONDAY_2026_09_21).current).toBe(4);
  });

  it('currently resets to 1, losing everything before Saturday', () => {
    // Documents today's behaviour so the regression is visible either way.
    expect(getStreakData(entries, TOTAL, undefined, MONDAY_2026_09_21).current).toBe(1);
  });
});

describe('BUG: longest streak only sees the last 30 days', () => {
  // The UI presents this as an all-time best. Confirmed against real data:
  // 399 days of history, of which only the last 30 are ever examined.
  //
  // Fix: compute `longest` over all entries rather than the display window,
  // then delete the `.fails` below.

  // A flawless 40-day run that ended 60 days ago — entirely outside the window.
  const oldRunEnd = new Date(MONDAY_2026_09_21);
  oldRunEnd.setDate(oldRunEnd.getDate() - 60);
  const entries = allCompleted(['a', 'b'], daysEndingOn(oldRunEnd, 40));

  it.fails('should report the 40-day run as the longest', () => {
    expect(getStreakData(entries, 2, undefined, MONDAY_2026_09_21).longest).toBe(40);
  });

  it('currently reports 0, as if the run never happened', () => {
    expect(getStreakData(entries, 2, undefined, MONDAY_2026_09_21).longest).toBe(0);
  });
});

describe('BUG: completed can exceed total', () => {
  // getDayProgress filters by date only, so it counts entries for habits that
  // are not in `totalHabits` — deleted, deactivated, or inactive on that day's
  // weekday/weekend setting. Confirmed on 4 real weekend days, e.g. a day shown
  // as "5/7 bronze" where only 3 of the 7 weekend-active habits were done.
  //
  // Fix: pass the set of habits that count and filter on it, then delete the
  // `.fails` below.

  const SATURDAY = '2026-09-19';
  const WEEKEND_ACTIVE_TOTAL = 2; // habits 'a' and 'b'

  const entries = [
    entry('a', SATURDAY),
    entry('b', SATURDAY),
    entry('weekday-only', SATURDAY), // logged anyway; should not count
  ];

  it.fails('should never report more completed than the day\'s total', () => {
    const progress = getDayProgress(entries, SATURDAY, WEEKEND_ACTIVE_TOTAL);
    expect(progress.completedCount).toBeLessThanOrEqual(progress.totalCount);
  });

  it('currently reports 3 of 2, which reads as a full clear', () => {
    const progress = getDayProgress(entries, SATURDAY, WEEKEND_ACTIVE_TOTAL);
    expect(progress.completedCount).toBe(3);
    expect(progress.totalCount).toBe(2);
  });
});
