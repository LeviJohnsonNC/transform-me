import { describe, it, expect, beforeEach } from 'vitest';
import { format, subDays } from 'date-fns';
import { useHabitStore } from '@/stores/habitStore';
import type { HabitEntry } from '@/types/habits';

// Helpers
const today = format(new Date(), 'yyyy-MM-dd');
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');
const threeDaysAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd');

const makeEntry = (habitId: string, date: string, completed = true): HabitEntry => ({
  id: `${habitId}-${date}`,
  habitId,
  date,
  completed,
});

describe('habitStore', () => {
  let store: ReturnType<typeof useHabitStore.getState>;

  beforeEach(() => {
    store = useHabitStore.getState();
  });

  // ---------------------------------------------------------------------------
  // getEntriesForDate
  // ---------------------------------------------------------------------------
  describe('getEntriesForDate', () => {
    it('returns only entries matching the given date', () => {
      const entries = [
        makeEntry('h1', today),
        makeEntry('h2', today),
        makeEntry('h1', yesterday),
      ];
      const result = store.getEntriesForDate(entries, today);
      expect(result).toHaveLength(2);
      expect(result.every(e => e.date === today)).toBe(true);
    });

    it('returns empty array when no entries match', () => {
      const entries = [makeEntry('h1', yesterday)];
      expect(store.getEntriesForDate(entries, today)).toHaveLength(0);
    });

    it('handles non-array input gracefully', () => {
      expect(store.getEntriesForDate(null as any, today)).toHaveLength(0);
      expect(store.getEntriesForDate(undefined as any, today)).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getDayProgress
  // ---------------------------------------------------------------------------
  describe('getDayProgress', () => {
    it('returns completedCount of 0 when no entries exist', () => {
      const result = store.getDayProgress([], today, 3);
      expect(result.completedCount).toBe(0);
      expect(result.totalCount).toBe(3);
    });

    it('counts only completed entries', () => {
      const entries = [
        makeEntry('h1', today, true),
        makeEntry('h2', today, false),
        makeEntry('h3', today, true),
      ];
      const result = store.getDayProgress(entries, today, 3);
      expect(result.completedCount).toBe(2);
    });

    it('ignores entries from other dates', () => {
      const entries = [
        makeEntry('h1', today, true),
        makeEntry('h1', yesterday, true),
      ];
      const result = store.getDayProgress(entries, today, 2);
      expect(result.completedCount).toBe(1);
    });

    it('returns the correct date and totalCount', () => {
      const result = store.getDayProgress([], today, 5);
      expect(result.date).toBe(today);
      expect(result.totalCount).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // getStreakData
  // ---------------------------------------------------------------------------
  describe('getStreakData', () => {
    it('returns streak of 0 when no entries exist', () => {
      const result = store.getStreakData([], 2);
      expect(result.current).toBe(0);
      expect(result.longest).toBe(0);
    });

    it('counts consecutive complete days for current streak', () => {
      // 2 habits; yesterday and two days ago both fully complete
      // today is incomplete — should not break yesterday's streak
      const entries = [
        makeEntry('h1', yesterday),
        makeEntry('h2', yesterday),
        makeEntry('h1', twoDaysAgo),
        makeEntry('h2', twoDaysAgo),
      ];
      const result = store.getStreakData(entries, 2);
      expect(result.current).toBe(2);
    });

    it('resets streak when a day is missed', () => {
      // yesterday complete, two days ago NOT complete, three days ago complete
      const entries = [
        makeEntry('h1', yesterday),
        makeEntry('h2', yesterday),
        // twoDaysAgo is missing
        makeEntry('h1', threeDaysAgo),
        makeEntry('h2', threeDaysAgo),
      ];
      const result = store.getStreakData(entries, 2);
      expect(result.current).toBe(1);
    });

    it('today being incomplete does not break the streak from yesterday', () => {
      // Today has no entries, but yesterday was fully complete
      const entries = [
        makeEntry('h1', yesterday),
        makeEntry('h2', yesterday),
      ];
      const result = store.getStreakData(entries, 2);
      // The store skips today if incomplete and counts back from yesterday
      expect(result.current).toBe(1);
    });

    it('today being complete is counted in the streak', () => {
      const entries = [
        makeEntry('h1', today),
        makeEntry('h2', today),
        makeEntry('h1', yesterday),
        makeEntry('h2', yesterday),
      ];
      const result = store.getStreakData(entries, 2);
      expect(result.current).toBe(2);
    });

    it('per-habit streak uses count > 0 threshold (not totalHabits)', () => {
      // Only h1 has an entry yesterday — per-habit streak for h1 should be 1
      const entries = [makeEntry('h1', yesterday)];
      const perHabitResult = store.getStreakData(entries, 2, 'h1');
      expect(perHabitResult.current).toBe(1);

      // Overall streak with 2 habits requires both — should be 0
      const overallResult = store.getStreakData(entries, 2);
      expect(overallResult.current).toBe(0);
    });

    it('tracks longest streak independently from current streak', () => {
      // Build a 3-day old streak that is now broken
      const fourDaysAgo = format(subDays(new Date(), 4), 'yyyy-MM-dd');
      const fiveDaysAgo = format(subDays(new Date(), 5), 'yyyy-MM-dd');
      const sixDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      const entries = [
        // Old streak of 3 (6, 5, 4 days ago)
        makeEntry('h1', sixDaysAgo),
        makeEntry('h1', fiveDaysAgo),
        makeEntry('h1', fourDaysAgo),
        // Gap at threeDaysAgo and twoDaysAgo
        // Current streak of 1 (yesterday only)
        makeEntry('h1', yesterday),
      ];
      const result = store.getStreakData(entries, 1, 'h1');
      expect(result.current).toBe(1);
      expect(result.longest).toBe(3);
    });

    it('returns 30 data points', () => {
      const result = store.getStreakData([], 1);
      expect(result.data).toHaveLength(30);
    });

    it('data is in ascending date order (oldest first)', () => {
      const result = store.getStreakData([], 1);
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].date >= result.data[i - 1].date).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getRecentDays
  // ---------------------------------------------------------------------------
  describe('getRecentDays', () => {
    it('returns exactly the requested number of days', () => {
      expect(store.getRecentDays([], 7, 1)).toHaveLength(7);
      expect(store.getRecentDays([], 14, 1)).toHaveLength(14);
    });

    it('returns items in ascending date order', () => {
      const days = store.getRecentDays([], 7, 1);
      for (let i = 1; i < days.length; i++) {
        expect(days[i].date >= days[i - 1].date).toBe(true);
      }
    });

    it('computes correct completedCount for each day', () => {
      const entries = [
        makeEntry('h1', today, true),
        makeEntry('h1', yesterday, false),
      ];
      const days = store.getRecentDays(entries, 7, 1);
      const todayEntry = days.find(d => d.date === today);
      const yesterdayEntry = days.find(d => d.date === yesterday);
      expect(todayEntry?.completedCount).toBe(1);
      expect(yesterdayEntry?.completedCount).toBe(0);
    });
  });
});
