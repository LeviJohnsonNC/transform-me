// Pure habit/streak calculations.
//
// These were extracted verbatim from `src/stores/habitStore.ts`. They never read
// store state — every input arrives as an argument — so they live here where they
// can be tested directly. `habitStore` now delegates to them and keeps only the
// `selectedDate` state, so every existing call site is unaffected.
//
// Behaviour is preserved exactly, KNOWN BUGS INCLUDED. See habitMath.test.ts for
// the reproductions; do not "tidy" the logic here without flipping those tests.

import { format, subDays } from 'date-fns';
import type { HabitEntry, DayProgress, StreakData } from '@/types/habits';

/**
 * How far back streak calculations look.
 *
 * BUG: `longest` is computed inside this window, so it is really "longest streak
 * in the last 30 days", not "longest ever" as the UI claims.
 */
export const STREAK_WINDOW_DAYS = 30;

const toSafeArray = (entries: HabitEntry[]): HabitEntry[] =>
  Array.isArray(entries) ? entries : [];

export const getEntriesForDate = (entries: HabitEntry[], date: string): HabitEntry[] =>
  toSafeArray(entries).filter((entry) => entry.date === date);

/**
 * BUG: filters by date only, so it counts entries belonging to habits that are
 * not part of `totalHabits` — deleted habits, deactivated habits, and habits
 * inactive on that day's weekday/weekend setting. That lets `completedCount`
 * exceed `totalCount`.
 */
export const getDayProgress = (
  entries: HabitEntry[],
  date: string,
  totalHabits: number,
): DayProgress => {
  const dayEntries = getEntriesForDate(entries, date);
  const completedCount = dayEntries.filter((e) => e.completed).length;
  return { date, entries: dayEntries, completedCount, totalCount: totalHabits };
};

/**
 * `today` is injectable so tests are deterministic; it defaults to now, which is
 * what every caller relies on.
 *
 * BUG: `totalHabits` is a single number for the whole window, so a day where
 * fewer habits are active (a weekend, with weekday-only habits) can never reach
 * `count === totalHabits` and always breaks the streak.
 */
export const getStreakData = (
  entries: HabitEntry[],
  totalHabits: number,
  habitId?: string,
  today: Date = new Date(),
): StreakData => {
  const safeEntries = toSafeArray(entries);

  const days = Array.from({ length: STREAK_WINDOW_DAYS }, (_, i) => {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const dayEntries = safeEntries.filter((e) => e.date === date);

    const count = habitId
      ? dayEntries.filter((e) => e.habitId === habitId && e.completed).length
      : dayEntries.filter((e) => e.completed).length;

    return { date, count };
  }).reverse();

  const isDayComplete = (count: number) => (habitId ? count > 0 : count === totalHabits);

  let currentStreak = 0;
  const todayStr = format(today, 'yyyy-MM-dd');

  for (let i = days.length - 1; i >= 0; i--) {
    const dayData = days[i];
    const isComplete = isDayComplete(dayData.count);

    // An incomplete today does not break the streak — the day is not over yet.
    if (dayData.date === todayStr && !isComplete) continue;

    if (isComplete) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let tempStreak = 0;
  days.forEach((day) => {
    if (isDayComplete(day.count)) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });

  return { current: currentStreak, longest: longestStreak, data: days };
};

export const getRecentDays = (
  entries: HabitEntry[],
  days: number,
  totalHabits: number,
  today: Date = new Date(),
): DayProgress[] => {
  const safeEntries = toSafeArray(entries);
  return Array.from({ length: days }, (_, i) => {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    return getDayProgress(safeEntries, date, totalHabits);
  }).reverse();
};
