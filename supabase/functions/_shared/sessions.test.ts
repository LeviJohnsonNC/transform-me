import { describe, expect, it } from 'vitest';
import {
  addDays,
  groupSessions,
  isDayKey,
  isPersonalRecord,
  weekStart,
  weeklySummary,
  type RecordRow,
} from './sessions';

const row = (overrides: Partial<RecordRow>): RecordRow => ({
  date_recorded: '2026-09-21',
  workout_plan_id: 'plan-a',
  exercise_name: 'Back Squat',
  set_type: 'standard',
  current_weight: 225,
  actual_reps: 5,
  previous_best: null,
  previous_best_reps: null,
  ...overrides,
});

describe('isPersonalRecord', () => {
  it('is false for a first-ever set', () => {
    expect(isPersonalRecord(row({}))).toBe(false);
  });

  it('counts heavier weight, or equal weight with more reps', () => {
    expect(isPersonalRecord(row({ previous_best: 215, previous_best_reps: 8 }))).toBe(true);
    expect(isPersonalRecord(row({ previous_best: 225, previous_best_reps: 4 }))).toBe(true);
    expect(isPersonalRecord(row({ previous_best: 225, previous_best_reps: 5 }))).toBe(false);
    expect(isPersonalRecord(row({ previous_best: 235, previous_best_reps: 1 }))).toBe(false);
  });
});

describe('groupSessions', () => {
  it('makes one session per day, oldest first, with plan day names', () => {
    const sessions = groupSessions(
      [
        row({ date_recorded: '2026-09-23', exercise_name: 'Bench Press', workout_plan_id: 'plan-b' }),
        row({ date_recorded: '2026-09-21' }),
        row({ date_recorded: '2026-09-21', exercise_name: 'Deadlift', set_type: null }),
      ],
      { 'plan-a': 'Legs', 'plan-b': 'Push' },
    );
    expect(sessions.map((s) => s.date)).toEqual(['2026-09-21', '2026-09-23']);
    expect(sessions[0].plan_days).toEqual(['Legs']);
    expect(sessions[0].exercises.map((e) => e.exercise)).toEqual(['Back Squat', 'Deadlift']);
    expect(sessions[0].exercises[1].set_type).toBe('standard');
    expect(sessions[1].plan_days).toEqual(['Push']);
  });
});

describe('weeks', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-09-21')).toBe('2026-09-21'); // Monday
    expect(weekStart('2026-09-27')).toBe('2026-09-21'); // Sunday
    expect(weekStart('2026-09-28')).toBe('2026-09-28');
  });

  it('counts sessions per week and keeps empty weeks', () => {
    const sessions = groupSessions(
      [row({ date_recorded: '2026-09-08' }), row({ date_recorded: '2026-09-22' }), row({ date_recorded: '2026-09-24' })],
      {},
    );
    expect(weeklySummary(sessions, '2026-09-03', '2026-09-26')).toEqual([
      { week_start: '2026-08-31', sessions: 0, dates: [] },
      { week_start: '2026-09-07', sessions: 1, dates: ['2026-09-08'] },
      { week_start: '2026-09-14', sessions: 0, dates: [] },
      { week_start: '2026-09-21', sessions: 2, dates: ['2026-09-22', '2026-09-24'] },
    ]);
  });
});

describe('day keys', () => {
  it('validates real calendar days only', () => {
    expect(isDayKey('2026-02-28')).toBe(true);
    expect(isDayKey('2026-02-30')).toBe(false);
    expect(isDayKey('2026-9-1')).toBe(false);
  });

  it('shifts across month ends', () => {
    expect(addDays('2026-09-26', -27)).toBe('2026-08-30');
  });
});
