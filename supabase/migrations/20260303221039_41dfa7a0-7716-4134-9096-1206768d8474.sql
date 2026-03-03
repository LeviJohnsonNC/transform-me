
-- Step 1: Add new columns
ALTER TABLE public.habits
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN value_type TEXT NOT NULL DEFAULT 'boolean',
  ADD COLUMN color TEXT;

-- Step 2: Drop FK constraint on habit_entries so we can remap IDs
ALTER TABLE public.habit_entries DROP CONSTRAINT IF EXISTS habit_entries_habit_id_fkey;

-- Step 3: Seed habits and remap entries
DO $$
DECLARE
  existing_user_id UUID;
  new_id_strength TEXT := gen_random_uuid()::text;
  new_id_conditioning TEXT := gen_random_uuid()::text;
  new_id_supplements TEXT := gen_random_uuid()::text;
  new_id_protein TEXT := gen_random_uuid()::text;
  new_id_calories TEXT := gen_random_uuid()::text;
  new_id_flossing TEXT := gen_random_uuid()::text;
  new_id_journal TEXT := gen_random_uuid()::text;
  new_id_coldshower TEXT := gen_random_uuid()::text;
  new_id_learning TEXT := gen_random_uuid()::text;
BEGIN
  SELECT DISTINCT user_id INTO existing_user_id FROM public.habit_entries WHERE user_id IS NOT NULL LIMIT 1;
  
  IF existing_user_id IS NULL THEN
    RAISE NOTICE 'No existing user found, skipping seed';
    RETURN;
  END IF;

  -- Remap existing entries FIRST (before deleting old habits)
  -- Insert new habits
  INSERT INTO public.habits (id, name, icon, description, user_id, order_index, is_active, value_type) VALUES
    (new_id_strength, 'Strength training', 'Dumbbell', 'Complete your strength workout', existing_user_id, 0, true, 'tiered'),
    (new_id_conditioning, 'Conditioning', 'Activity', 'Cardio or conditioning work', existing_user_id, 1, true, 'boolean'),
    (new_id_supplements, 'Supplements & vitamins', 'Pill', 'Take daily supplements', existing_user_id, 2, true, 'boolean'),
    (new_id_protein, 'Hit protein target', 'Beef', 'Meet daily protein goal', existing_user_id, 3, true, 'boolean'),
    (new_id_calories, 'Under calorie budget', 'Flame', 'Stay within daily calorie target', existing_user_id, 4, true, 'boolean'),
    (new_id_flossing, 'Flossing', 'Sparkles', 'Floss your teeth', existing_user_id, 5, true, 'boolean'),
    (new_id_journal, 'Daily journal', 'BookOpen', 'Write in your journal', existing_user_id, 6, true, 'boolean'),
    (new_id_coldshower, 'Cold shower', 'Snowflake', 'Take a cold shower', existing_user_id, 7, true, 'boolean'),
    (new_id_learning, '1 hour of learning', 'GraduationCap', 'Spend 1 hour learning something new', existing_user_id, 8, true, 'boolean');

  -- Update habit_entries to new UUIDs
  UPDATE public.habit_entries SET habit_id = new_id_strength WHERE habit_id = 'strength';
  UPDATE public.habit_entries SET habit_id = new_id_conditioning WHERE habit_id = 'conditioning';
  UPDATE public.habit_entries SET habit_id = new_id_supplements WHERE habit_id = 'supplements';
  UPDATE public.habit_entries SET habit_id = new_id_protein WHERE habit_id = 'protein';
  UPDATE public.habit_entries SET habit_id = new_id_calories WHERE habit_id = 'calories';

  -- Now safe to delete old habits
  DELETE FROM public.habits WHERE user_id IS NULL;
END $$;

-- Step 4: Update RLS policies
DROP POLICY IF EXISTS "Allow all operations on habits" ON public.habits;

CREATE POLICY "Users can view their own habits"
  ON public.habits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON public.habits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
