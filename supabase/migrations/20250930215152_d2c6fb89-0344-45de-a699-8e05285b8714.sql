-- Add rep_type column to workout_exercises table
ALTER TABLE public.workout_exercises 
ADD COLUMN rep_type text NOT NULL DEFAULT 'fixed' CHECK (rep_type IN ('fixed', 'amrap'));

-- Add actual_reps column to workout_records table
ALTER TABLE public.workout_records 
ADD COLUMN actual_reps integer;

-- Add comment for documentation
COMMENT ON COLUMN public.workout_exercises.rep_type IS 'Type of rep scheme: fixed (standard sets x reps) or amrap (as many reps as possible)';
COMMENT ON COLUMN public.workout_records.actual_reps IS 'Actual reps achieved for AMRAP exercises';