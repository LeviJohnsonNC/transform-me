import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStreakData } from '@/lib/habitMath';
import { getDayTier, getNextTierInfo } from '@/hooks/useGamification';
import { computeCycleProgress } from '@/hooks/useCycleProgression';
import type { Habit, HabitEntry } from '@/types/habits';
import {
  cycleStanding,
  dayDetail,
  dayTier,
  completedByDate,
  habitsOn,
  isWeekendKey,
  nextTier,
  streaks,
  type EntryRow,
  type HabitRow,
} from './habits';
import { addDays } from './sessions';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

// The API recomputes what the app shows. These tests run the app's own
// functions on the same data and demand the same answers.

const row = (id: string, over: Partial<HabitRow> = {}): HabitRow => ({
  id,
  name: `Habit ${id}`,
  is_active: true,
  active_on_weekdays: true,
  active_on_weekends: true,
  ...over,
});

const toApp = (h: HabitRow): Habit => ({
  id: h.id,
  name: h.name,
  icon: 'check',
  orderIndex: 0,
  isActive: h.is_active,
  valueType: 'boolean',
  activeOnWeekdays: h.active_on_weekdays ?? true,
  activeOnWeekends: h.active_on_weekends ?? true,
});

const toAppEntry = (e: EntryRow, i: number): HabitEntry => ({
  id: String(i),
  habitId: e.habit_id,
  date: e.date,
  completed: e.completed,
});

/** Deterministic pseudo-random history: mulberry32. */
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const HABITS = [
  row('a'),
  row('b'),
  row('c', { active_on_weekends: false }),
  row('d', { active_on_weekdays: false }),
  row('e'),
];

const history = (seed: number, today: string, days: number, rate: number): EntryRow[] => {
  const rand = rng(seed);
  const out: EntryRow[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(today, -i);
    for (const h of HABITS) {
      const r = rand();
      if (r < rate) out.push({ habit_id: h.id, date, completed: true });
      else if (r < rate + 0.05) out.push({ habit_id: h.id, date, completed: false });
    }
  }
  return out;
};

afterEach(() => vi.useRealTimers());

describe('tiers', () => {
  it('matches the app at every count', () => {
    for (let total = 0; total <= 12; total++) {
      for (let done = 0; done <= total; done++) {
        expect(dayTier(done, total)).toBe(getDayTier(done, total));
        const app = getNextTierInfo(done, total);
        const next = nextTier(done, total);
        expect(next?.tier ?? null).toBe(app.nextTier);
        expect(next?.habits_needed ?? 0).toBe(app.habitsToNext);
      }
    }
  });
});

describe('schedule', () => {
  it('knows weekends from the key alone', () => {
    expect(isWeekendKey('2026-09-26')).toBe(true); // Saturday
    expect(isWeekendKey('2026-09-27')).toBe(true); // Sunday
    expect(isWeekendKey('2026-09-28')).toBe(false); // Monday
  });

  it('drops weekday-only habits on weekends and vice versa', () => {
    expect(habitsOn(HABITS, '2026-09-27').map((h) => h.id)).toEqual(['a', 'b', 'd', 'e']);
    expect(habitsOn(HABITS, '2026-09-28').map((h) => h.id)).toEqual(['a', 'b', 'c', 'e']);
  });
});

describe('dayDetail', () => {
  it('splits a day into done and missed against that day\'s schedule', () => {
    const entries: EntryRow[] = [
      { habit_id: 'a', date: '2026-09-27', completed: true },
      { habit_id: 'c', date: '2026-09-27', completed: true }, // weekday-only, done on a Sunday
      { habit_id: 'b', date: '2026-09-27', completed: false },
    ];
    const day = dayDetail('2026-09-27', HABITS, HABITS, completedByDate(entries));
    expect(day.completed).toEqual(['Habit a', 'Habit c']);
    expect(day.missed).toEqual(['Habit b', 'Habit d', 'Habit e']);
    expect(day.completed_count).toBe(1);
    expect(day.total).toBe(4);
    expect(day.tier).toBe('missed');
    expect(day.next_tier).toEqual({ tier: 'partial', habits_needed: 1 });
  });
});

describe('streaks and cycles match the app', () => {
  const TODAY = '2026-09-28';
  // Noon local on TODAY, so the app's `new Date()` and our key agree.
  const NOW = new Date(2026, 8, 28, 12, 0, 0);

  it.each([
    [1, 0.95],
    [2, 0.85],
    [3, 0.7],
    [4, 0.5],
    [5, 0.3],
  ])('seed %i at completion rate %f', (seed, rate) => {
    const entries = history(seed, TODAY, 120, rate);
    const appEntries = entries.map(toAppEntry);
    const appHabits = HABITS.map(toApp);

    const app = getStreakData(appEntries, appHabits, undefined, NOW);
    expect(streaks(entries, HABITS, TODAY)).toEqual({ current: app.current, longest: app.longest });

    for (const h of HABITS) {
      const one = getStreakData(appEntries, appHabits, h.id, NOW);
      expect(streaks(entries, HABITS, TODAY, h.id)).toEqual({ current: one.current, longest: one.longest });
    }

    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    for (const start of ['2026-06-01T08:00:00Z', '2026-09-01T00:00:00Z', '2026-09-28T03:00:00Z']) {
      const appCycle = computeCycleProgress(appEntries, appHabits, start, 12);
      expect(cycleStanding(entries, HABITS, start, TODAY, 12)).toEqual({
        total_points: appCycle.totalPoints,
        level: appCycle.currentLevel,
        level_progress: appCycle.levelProgress,
        points_per_level: appCycle.pointsPerLevel,
        points_to_next_level: appCycle.pointsToNextLevel,
      });
    }
  });

  it('has no streak without history', () => {
    expect(streaks([], HABITS, TODAY)).toEqual({ current: 0, longest: 0 });
  });
});
