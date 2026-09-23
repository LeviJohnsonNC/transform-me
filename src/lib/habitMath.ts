// Pure habit/streak calculations.
//
// These take the habit list rather than a habit *count*, because how many habits
// count towards a day varies by day: a habit can be weekday-only or weekend-only.
// A single number cannot express that, which was the source of three bugs (a
// weekend always breaking the streak, tiers computed against the wrong total, and
// completed being able to exceed total).
//
// Nothing here reads store state — every input arrives as an argument — so it is
// all directly testable. `habitStore` delegates to these and keeps only the
// `selectedDate` state.

import { subDays } from 'date-fns';
import type { Habit, HabitEntry, DayProgress, StreakData } from '@/types/habits';
import { getActiveHabitsForDate } from '@/utils/dayType';
import { toDateKey } from '@/lib/dates';

/** How many days of per-day detail `getStreakData` returns for display. */
export const STREAK_WINDOW_DAYS = 30;

const toSafeArray = <T,>(value: T[]): T[] => (Array.isArray(value) ? value : []);

/** The earliest date with any recorded entry, or null when there is no history. */
const earliestDate = (entries: HabitEntry[]): string | null => {
  let earliest: string | null = null;
  for (const entry of entries) {
    if (!earliest || entry.date < earliest) earliest = entry.date;
  }
  return earliest;
};

export const getEntriesForDate = (entries: HabitEntry[], date: string): HabitEntry[] =>
  toSafeArray(entries).filter((entry) => entry.date === date);

/**
 * Index of date -> set of habit ids completed on that date.
 *
 * Counting distinct habit ids rather than rows means a duplicate entry (possible
 * until habit_entries gains a UNIQUE (user_id, habit_id, date) constraint) cannot
 * inflate a day's completion count.
 */
const indexCompletedByDate = (entries: HabitEntry[]): Map<string, Set<string>> => {
  const index = new Map<string, Set<string>>();
  for (const entry of toSafeArray(entries)) {
    if (!entry.completed) continue;
    let forDate = index.get(entry.date);
    if (!forDate) {
      forDate = new Set();
      index.set(entry.date, forDate);
    }
    forDate.add(entry.habitId);
  }
  return index;
};

/**
 * Progress for one date.
 *
 * `completedCount` and `totalCount` are both measured against the habits active
 * on that specific date, so `completedCount <= totalCount` always holds.
 *
 * `entries` deliberately stays unfiltered — every entry recorded on that date,
 * including ones for habits that do not count towards the totals above. Callers
 * use it to look up individual habits; do not recompute the counts from it.
 */
export const getDayProgress = (
  entries: HabitEntry[],
  date: string,
  habits: Habit[],
): DayProgress => {
  const activeHabits = getActiveHabitsForDate(toSafeArray(habits), date);
  const dayEntries = getEntriesForDate(entries, date);

  const completedIds = new Set(
    dayEntries.filter((e) => e.completed).map((e) => e.habitId),
  );
  const completedCount = activeHabits.filter((h) => completedIds.has(h.id)).length;

  return { date, entries: dayEntries, completedCount, totalCount: activeHabits.length };
};

/**
 * Whether a date counts as complete.
 *
 * 'neutral' means the day asked nothing of you — no habits were active — so it
 * neither extends nor breaks a streak.
 */
type DayState = 'complete' | 'incomplete' | 'neutral';

const getDayState = (
  date: string,
  habits: Habit[],
  completedByDate: Map<string, Set<string>>,
  habitId?: string,
): DayState => {
  const activeHabits = getActiveHabitsForDate(habits, date);
  const completed = completedByDate.get(date);

  if (habitId) {
    // A habit the caller does not know about is treated as active every day,
    // matching the previous behaviour of ignoring the habit list entirely.
    const known = habits.some((h) => h.id === habitId);
    const activeToday = !known || activeHabits.some((h) => h.id === habitId);
    if (!activeToday) return 'neutral';
    return completed?.has(habitId) ? 'complete' : 'incomplete';
  }

  if (activeHabits.length === 0) return 'neutral';
  if (!completed) return 'incomplete';
  return activeHabits.every((h) => completed.has(h.id)) ? 'complete' : 'incomplete';
};

/**
 * Current and longest streaks.
 *
 * `current` counts back from today. Today never breaks a streak while it is still
 * in progress. `longest` scans the entire history, not just the display window.
 *
 * `today` is injectable so tests are deterministic; it defaults to now.
 */
export const getStreakData = (
  entries: HabitEntry[],
  habits: Habit[],
  habitId?: string,
  today: Date = new Date(),
): StreakData => {
  const safeEntries = toSafeArray(entries);
  const safeHabits = toSafeArray(habits);
  const completedByDate = indexCompletedByDate(safeEntries);
  const stateOf = (date: string) => getDayState(date, safeHabits, completedByDate, habitId);

  // Per-day detail for the display window, most recent last.
  const data = Array.from({ length: STREAK_WINDOW_DAYS }, (_, i) => {
    const date = toDateKey(subDays(today, i));
    const dayEntries = safeEntries.filter((e) => e.date === date);
    const count = habitId
      ? dayEntries.filter((e) => e.habitId === habitId && e.completed).length
      : dayEntries.filter((e) => e.completed).length;
    return { date, count };
  }).reverse();

  const todayKey = toDateKey(today);
  const earliest = earliestDate(safeEntries);

  // Current streak: walk backwards from today until a day breaks it. Bounded by
  // the start of history, so an all-neutral history terminates.
  let current = 0;
  if (earliest) {
    for (let i = 0; ; i++) {
      const date = toDateKey(subDays(today, i));
      if (date < earliest) break;

      const state = stateOf(date);

      // An unfinished today does not break the streak — the day is not over.
      if (date === todayKey && state === 'incomplete') continue;

      if (state === 'complete') current++;
      else if (state === 'incomplete') break;
      // 'neutral' days are skipped: they neither extend nor break the streak.
    }
  }

  // Longest streak: scan every day from the first recorded entry to today.
  let longest = 0;
  let running = 0;
  if (earliest) {
    for (let cursor = new Date(`${earliest}T00:00:00`); toDateKey(cursor) <= todayKey; ) {
      const date = toDateKey(cursor);
      const state = stateOf(date);

      if (state === 'complete') {
        running++;
        longest = Math.max(longest, running);
      } else if (state === 'incomplete') {
        // Today being unfinished should not truncate a run that is still alive.
        if (date !== todayKey) running = 0;
      }
      // 'neutral' days leave the run untouched, bridging across them.

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { current, longest, data };
};

export const getRecentDays = (
  entries: HabitEntry[],
  days: number,
  habits: Habit[],
  today: Date = new Date(),
): DayProgress[] => {
  const safeEntries = toSafeArray(entries);
  return Array.from({ length: days }, (_, i) =>
    getDayProgress(safeEntries, toDateKey(subDays(today, i)), habits),
  ).reverse();
};
