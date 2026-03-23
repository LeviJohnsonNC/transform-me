
-- Add new columns for tier-based exercise rows, backoff sets, rep ranges, and notes
ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'good',
  ADD COLUMN IF NOT EXISTS reps_high integer,
  ADD COLUMN IF NOT EXISTS backoff_sets integer,
  ADD COLUMN IF NOT EXISTS backoff_reps integer,
  ADD COLUMN IF NOT EXISTS backoff_reps_high integer,
  ADD COLUMN IF NOT EXISTS notes text;

-- Migrate existing exercises: duplicate each row into 3 tier rows
-- First, create minimum tier rows from existing data
INSERT INTO workout_exercises (workout_plan_id, exercise_name, sets, reps, rep_type, order_index, tier, created_at, updated_at)
SELECT workout_plan_id, exercise_name, 
  COALESCE(sets_minimum, sets), COALESCE(reps_minimum, reps), 
  rep_type, order_index, 'minimum', now(), now()
FROM workout_exercises WHERE tier = 'good';

-- Create max tier rows from existing data
INSERT INTO workout_exercises (workout_plan_id, exercise_name, sets, reps, rep_type, order_index, tier, created_at, updated_at)
SELECT workout_plan_id, exercise_name, 
  COALESCE(sets_max, sets), COALESCE(reps_max, reps), 
  rep_type, order_index, 'max', now(), now()
FROM workout_exercises WHERE tier = 'good';

-- Update existing rows to use good tier values
UPDATE workout_exercises 
SET sets = COALESCE(sets_good, sets), reps = COALESCE(reps_good, reps)
WHERE tier = 'good';

-- Drop old tier columns
ALTER TABLE workout_exercises 
  DROP COLUMN IF EXISTS sets_minimum,
  DROP COLUMN IF EXISTS reps_minimum,
  DROP COLUMN IF EXISTS sets_good,
  DROP COLUMN IF EXISTS reps_good,
  DROP COLUMN IF EXISTS sets_max,
  DROP COLUMN IF EXISTS reps_max;
