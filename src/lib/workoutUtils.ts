interface WorkoutRecord {
  id: string;
  workout_plan_id: string;
  exercise_name: string;
  current_weight: number;
  previous_best: number | null;
  actual_reps: number | null;
  date_recorded: string;
  created_at: string;
  updated_at: string;
}

/**
 * Given a list of workout records (sorted by exercise_name, created_at DESC),
 * returns only the most recent record per exercise, sorted alphabetically.
 */
export const deduplicateByExercise = (records: WorkoutRecord[]): WorkoutRecord[] => {
  const recordsByExercise = new Map<string, WorkoutRecord>();
  records.forEach(record => {
    if (!recordsByExercise.has(record.exercise_name)) {
      recordsByExercise.set(record.exercise_name, record);
    }
  });
  return Array.from(recordsByExercise.values()).sort((a, b) =>
    a.exercise_name.localeCompare(b.exercise_name)
  );
};
