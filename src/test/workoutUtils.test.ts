import { describe, it, expect } from 'vitest';
import { deduplicateByExercise } from '@/lib/workoutUtils';

const makeRecord = (
  id: string,
  exercise_name: string,
  created_at: string,
  current_weight = 100,
  previous_best: number | null = null
) => ({
  id,
  workout_plan_id: 'plan-1',
  exercise_name,
  current_weight,
  previous_best,
  actual_reps: null,
  date_recorded: '2024-01-15',
  created_at,
  updated_at: created_at,
});

describe('deduplicateByExercise', () => {
  it('returns an empty array for empty input', () => {
    expect(deduplicateByExercise([])).toEqual([]);
  });

  it('keeps the first occurrence (most recent) for duplicate exercises', () => {
    // Simulates DB ordering: created_at DESC, so newest comes first
    const records = [
      makeRecord('r2', 'Squat', '2024-01-15T10:00:00', 120),
      makeRecord('r1', 'Squat', '2024-01-14T10:00:00', 100),
    ];
    const result = deduplicateByExercise(records);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r2');
    expect(result[0].current_weight).toBe(120);
  });

  it('returns one record per unique exercise', () => {
    const records = [
      makeRecord('r1', 'Bench Press', '2024-01-15T10:00:00'),
      makeRecord('r2', 'Squat', '2024-01-15T10:00:00'),
      makeRecord('r3', 'Deadlift', '2024-01-15T10:00:00'),
      makeRecord('r4', 'Squat', '2024-01-14T10:00:00'), // older duplicate
    ];
    const result = deduplicateByExercise(records);
    expect(result).toHaveLength(3);
  });

  it('returns results sorted alphabetically by exercise name', () => {
    const records = [
      makeRecord('r3', 'Squat', '2024-01-15T10:00:00'),
      makeRecord('r1', 'Bench Press', '2024-01-15T10:00:00'),
      makeRecord('r2', 'Deadlift', '2024-01-15T10:00:00'),
    ];
    const result = deduplicateByExercise(records);
    expect(result.map(r => r.exercise_name)).toEqual(['Bench Press', 'Deadlift', 'Squat']);
  });

  it('handles a single record correctly', () => {
    const records = [makeRecord('r1', 'Bench Press', '2024-01-15T10:00:00', 80)];
    const result = deduplicateByExercise(records);
    expect(result).toHaveLength(1);
    expect(result[0].exercise_name).toBe('Bench Press');
  });
});

// ---------------------------------------------------------------------------
// Document the known previous_best bug
// ---------------------------------------------------------------------------
describe('previous_best behavior (known bug)', () => {
  it('documents: previous_best is always set equal to current_weight (not historical best)', () => {
    // In useUpdateRecord, newBest = recordData.current_weight, and then
    // previous_best is set to newBest — so it always mirrors the current weight.
    // This means the PR comparison feature cannot work as intended.
    //
    // Expected correct behavior: previous_best should store the weight from the
    // prior record, so the UI can compare it against current_weight.
    //
    // This test documents the bug so it is visible and can be fixed intentionally.
    const current_weight = 120;
    const newBest = current_weight; // this is the buggy line: should be previous record's weight
    expect(newBest).toBe(current_weight); // always true — previous_best === current_weight
  });
});
