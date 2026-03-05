import { describe, it, expect } from 'vitest';
import { getStreakHealth, getMotivation, getWeeklyConsistency, getStreakRingProgress } from '@/lib/streakUtils';
import type { DayProgress } from '@/types/habits';

const makeDay = (date: string, completedCount: number, totalCount = 3): DayProgress => ({
  date,
  entries: [],
  completedCount,
  totalCount,
});

describe('getStreakHealth', () => {
  it('returns "poor" for streaks below 7', () => {
    expect(getStreakHealth(0)).toBe('poor');
    expect(getStreakHealth(1)).toBe('poor');
    expect(getStreakHealth(6)).toBe('poor');
  });

  it('returns "fair" for streaks 7–13', () => {
    expect(getStreakHealth(7)).toBe('fair');
    expect(getStreakHealth(13)).toBe('fair');
  });

  it('returns "good" for streaks 14–20', () => {
    expect(getStreakHealth(14)).toBe('good');
    expect(getStreakHealth(20)).toBe('good');
  });

  it('returns "excellent" for streaks 21+', () => {
    expect(getStreakHealth(21)).toBe('excellent');
    expect(getStreakHealth(100)).toBe('excellent');
  });
});

describe('getMotivation', () => {
  it('returns fresh start message for streak of 0', () => {
    expect(getMotivation(0)).toContain('fresh start');
  });

  it('returns momentum message for streaks 1–6', () => {
    expect(getMotivation(1)).toContain('momentum');
    expect(getMotivation(6)).toContain('momentum');
  });

  it('returns fire message for streaks 7–13', () => {
    expect(getMotivation(7)).toContain('fire');
    expect(getMotivation(13)).toContain('fire');
  });

  it('returns mastery message for streaks 14–20', () => {
    expect(getMotivation(14)).toContain('mastery');
    expect(getMotivation(20)).toContain('mastery');
  });

  it('returns legend message for streaks 21+', () => {
    expect(getMotivation(21)).toContain('legend');
    expect(getMotivation(100)).toContain('legend');
  });
});

describe('getWeeklyConsistency', () => {
  it('returns 1.0 when all 7 days are fully complete', () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(`2024-01-0${i + 1}`, 3, 3)
    );
    expect(getWeeklyConsistency(days, 3)).toBeCloseTo(1.0);
  });

  it('returns 0.0 when no days have completions', () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(`2024-01-0${i + 1}`, 0, 3)
    );
    expect(getWeeklyConsistency(days, 3)).toBeCloseTo(0.0);
  });

  it('returns proportional value for partial completion', () => {
    // 7 days, each with 1 out of 2 habits complete → 0.5
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(`2024-01-0${i + 1}`, 1, 2)
    );
    expect(getWeeklyConsistency(days, 2)).toBeCloseTo(0.5);
  });
});

describe('getStreakRingProgress', () => {
  it('returns 100 when all 14 days are fully complete', () => {
    const days = Array.from({ length: 14 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, 2, 2)
    );
    expect(getStreakRingProgress(days, 2)).toBe(100);
  });

  it('returns 0 when no days are complete', () => {
    const days = Array.from({ length: 14 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, 0, 2)
    );
    expect(getStreakRingProgress(days, 2)).toBe(0);
  });

  it('returns proportional percentage', () => {
    // 7 of 14 days complete → 50%
    const days = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, 2, 2)
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        makeDay(`2024-01-${String(i + 8).padStart(2, '0')}`, 0, 2)
      ),
    ];
    expect(getStreakRingProgress(days, 2)).toBe(50);
  });

  it('only counts days where completedCount equals habitCount (not partial)', () => {
    // 1 out of 2 habits done — should NOT count as a complete day
    const days = Array.from({ length: 14 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, 1, 2)
    );
    expect(getStreakRingProgress(days, 2)).toBe(0);
  });
});
