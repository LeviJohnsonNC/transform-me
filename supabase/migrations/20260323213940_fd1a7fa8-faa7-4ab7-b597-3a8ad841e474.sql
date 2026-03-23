
-- Add tier columns to workout_exercises
ALTER TABLE workout_exercises
  ADD COLUMN sets_minimum integer,
  ADD COLUMN reps_minimum integer,
  ADD COLUMN sets_good integer,
  ADD COLUMN reps_good integer,
  ADD COLUMN sets_max integer,
  ADD COLUMN reps_max integer;

-- Migrate existing data: current values become defaults for all tiers
UPDATE workout_exercises
  SET sets_minimum = sets, reps_minimum = reps,
      sets_good = sets, reps_good = reps,
      sets_max = sets, reps_max = reps;

-- Add user_id to workout_plans
ALTER TABLE workout_plans ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Assign existing plans to the current user (from habit_entries)
UPDATE workout_plans SET user_id = (SELECT DISTINCT user_id FROM habit_entries WHERE user_id IS NOT NULL LIMIT 1);

-- Update RLS on workout_plans: drop allow-all, add user-scoped
DROP POLICY IF EXISTS "Allow all operations on workout_plans" ON workout_plans;

CREATE POLICY "Users can view their own workout plans"
  ON workout_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout plans"
  ON workout_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans"
  ON workout_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans"
  ON workout_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Update RLS on workout_exercises: drop allow-all, add user-scoped via join
DROP POLICY IF EXISTS "Allow all operations on workout_exercises" ON workout_exercises;

CREATE POLICY "Users can view their own workout exercises"
  ON workout_exercises FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_plans wp WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own workout exercises"
  ON workout_exercises FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_plans wp WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own workout exercises"
  ON workout_exercises FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_plans wp WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own workout exercises"
  ON workout_exercises FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_plans wp WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
  ));
