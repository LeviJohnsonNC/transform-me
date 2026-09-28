// Habit, streak and reward-cycle arithmetic for the `api` edge function.
//
// The app computes these in src/lib/habitMath.ts, src/hooks/useGamification.ts
// and src/hooks/useCycleProgression.ts, which lean on date-fns and `@/` imports
// that Deno cannot resolve. This is the same rules over plain `YYYY-MM-DD` day
// keys, and habits.test.ts checks it against the app's own functions so the two
// cannot drift apart unnoticed.
//
// A day key is the user's LOCAL calendar day, as the app stores it. Weekday
// arithmetic on a key is timezone-free: 2026-09-27 is a Sunday everywhere.

import { addDays } from './sessions.ts';

export interface HabitRow {
  id: string;
  name: string;
  is_active: boolean;
  active_on_weekdays: boolean | null;
  active_on_weekends: boolean | null;
}

export interface EntryRow {
  habit_id: string;
  date: string;
  completed: boolean;
}

export type DayTier = 'gold' | 'silver' | 'bronze' | 'partial' | 'missed';

/** Share of a day's habits that keeps the streak alive: Bronze or better. */
export const STREAK_MIN_RATIO = 0.7;

const TIER_ORDER: DayTier[] = ['missed', 'partial', 'bronze', 'silver', 'gold'];
const TIER_THRESHOLDS: Record<DayTier, number> = {
  missed: 0,
  partial: 0.5,
  bronze: STREAK_MIN_RATIO,
  silver: 0.9,
  gold: 1,
};

export const dayTier = (completed: number, total: number): DayTier => {
  if (total === 0) return 'missed';
  const ratio = completed / total;
  if (ratio >= 1) return 'gold';
  if (ratio >= 0.9) return 'silver';
  if (ratio >= STREAK_MIN_RATIO) return 'bronze';
  if (ratio >= 0.5) return 'partial';
  return 'missed';
};

/** Cycle points a day earns: gold 3, silver 2, bronze 1. */
export const tierPoints = (tier: DayTier): number =>
  tier === 'gold' ? 3 : tier === 'silver' ? 2 : tier === 'bronze' ? 1 : 0;

/** The next tier up and how many more habits reach it, or null at gold. */
export const nextTier = (
  completed: number,
  total: number,
): { tier: DayTier; habits_needed: number } | null => {
  if (total === 0) return null;
  const tier = dayTier(completed, total);
  if (tier === 'gold') return null;
  const next = TIER_ORDER[TIER_ORDER.indexOf(tier) + 1];
  return { tier: next, habits_needed: Math.max(0, Math.ceil(TIER_THRESHOLDS[next] * total) - completed) };
};

export const isWeekendKey = (key: string): boolean => {
  const day = new Date(`${key}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

/**
 * The habits that count towards `key`: weekday-only habits drop out on
 * weekends and vice versa. Pass ACTIVE habits only — the app never counts an
 * archived habit towards a day.
 */
export const habitsOn = <H extends HabitRow>(habits: readonly H[], key: string): H[] => {
  const weekend = isWeekendKey(key);
  return habits.filter((h) => (weekend ? h.active_on_weekends !== false : h.active_on_weekdays !== false));
};

/** date -> ids of habits completed that day. Distinct ids, so duplicates cannot inflate. */
export const completedByDate = (entries: readonly EntryRow[]): Map<string, Set<string>> => {
  const index = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!e.completed) continue;
    const ids = index.get(e.date) ?? new Set<string>();
    ids.add(e.habit_id);
    index.set(e.date, ids);
  }
  return index;
};

export interface DayDetail {
  date: string;
  /** Every habit completed that day, including ones that do not count towards it. */
  completed: string[];
  /** Habits scheduled that day and not done. */
  missed: string[];
  /** Scheduled habits done: what the tier is read from. */
  completed_count: number;
  /** Habits scheduled that day. */
  total: number;
  tier: DayTier;
  points: number;
  next_tier: { tier: DayTier; habits_needed: number } | null;
}

/** One day as the Today screen sees it. `active` is the active habits, in display order. */
export const dayDetail = (
  key: string,
  active: readonly HabitRow[],
  allHabits: readonly HabitRow[],
  done: Map<string, Set<string>>,
): DayDetail => {
  const scheduled = habitsOn(active, key);
  const ids = done.get(key) ?? new Set<string>();
  const names = new Map(allHabits.map((h) => [h.id, h.name]));
  const completedCount = scheduled.filter((h) => ids.has(h.id)).length;
  const tier = dayTier(completedCount, scheduled.length);
  return {
    date: key,
    completed: [...ids].map((id) => names.get(id) ?? id),
    missed: scheduled.filter((h) => !ids.has(h.id)).map((h) => h.name),
    completed_count: completedCount,
    total: scheduled.length,
    tier,
    points: tierPoints(tier),
    next_tier: nextTier(completedCount, scheduled.length),
  };
};

type DayState = 'complete' | 'incomplete' | 'neutral';

const dayState = (
  key: string,
  active: readonly HabitRow[],
  done: Map<string, Set<string>>,
  habitId?: string,
): DayState => {
  const scheduled = habitsOn(active, key);
  const ids = done.get(key);
  if (habitId) {
    // Matches habitMath: a habit not in the list is treated as due every day.
    const known = active.some((h) => h.id === habitId);
    if (known && !scheduled.some((h) => h.id === habitId)) return 'neutral';
    return ids?.has(habitId) ? 'complete' : 'incomplete';
  }
  if (scheduled.length === 0) return 'neutral';
  if (!ids) return 'incomplete';
  const n = scheduled.filter((h) => ids.has(h.id)).length;
  return n / scheduled.length >= STREAK_MIN_RATIO ? 'complete' : 'incomplete';
};

/**
 * Current and longest streak, the way `getStreakData` counts them: a day
 * counts at Bronze or better (or, for one habit, when that habit is done), a
 * day with nothing scheduled is skipped, and an unfinished today never breaks
 * a streak. History starts at the earliest entry of any kind.
 */
export const streaks = (
  entries: readonly EntryRow[],
  active: readonly HabitRow[],
  today: string,
  habitId?: string,
): { current: number; longest: number } => {
  let earliest: string | null = null;
  for (const e of entries) if (!earliest || e.date < earliest) earliest = e.date;
  if (!earliest) return { current: 0, longest: 0 };

  const done = completedByDate(entries);
  const stateOf = (key: string) => dayState(key, active, done, habitId);

  let current = 0;
  for (let key = today; key >= earliest; key = addDays(key, -1)) {
    const state = stateOf(key);
    if (key === today && state === 'incomplete') continue;
    if (state === 'complete') current++;
    else if (state === 'incomplete') break;
  }

  let longest = 0;
  let running = 0;
  for (let key = earliest; key <= today; key = addDays(key, 1)) {
    const state = stateOf(key);
    if (state === 'complete') longest = Math.max(longest, ++running);
    else if (state === 'incomplete' && key !== today) running = 0;
  }

  return { current, longest };
};

export interface CycleStanding {
  total_points: number;
  level: number;
  level_progress: number;
  points_per_level: number;
  points_to_next_level: number;
}

/**
 * Where a reward cycle stands, as `computeCycleProgress` has it: every day from
 * the cycle's start through today earns its tier's points against today's
 * active habits, capped at the top level.
 */
export const cycleStanding = (
  entries: readonly EntryRow[],
  active: readonly HabitRow[],
  startedAt: string,
  today: string,
  pointsPerLevel = 12,
  maxLevel = 10,
): CycleStanding => {
  if (active.length === 0) {
    return { total_points: 0, level: 1, level_progress: 0, points_per_level: pointsPerLevel, points_to_next_level: pointsPerLevel };
  }
  const done = completedByDate(entries);
  let points = 0;
  for (let key = startedAt.slice(0, 10); key <= today; key = addDays(key, 1)) {
    const scheduled = habitsOn(active, key);
    if (scheduled.length === 0) continue;
    const ids = done.get(key);
    const n = ids ? scheduled.filter((h) => ids.has(h.id)).length : 0;
    points += tierPoints(dayTier(n, scheduled.length));
  }
  const capped = Math.min(points, maxLevel * pointsPerLevel);
  const level = Math.min(Math.floor(capped / pointsPerLevel) + 1, maxLevel);
  const progress = capped - (level - 1) * pointsPerLevel;
  return {
    total_points: capped,
    level,
    level_progress: progress,
    points_per_level: pointsPerLevel,
    points_to_next_level: pointsPerLevel - progress,
  };
};
