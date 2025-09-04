-- Add user_id column to existing tables and set up RLS policies

-- Add user_id to habit_entries table
ALTER TABLE public.habit_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to workout_records table  
ALTER TABLE public.workout_records ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for habit_entries
DROP POLICY IF EXISTS "Allow all operations on habit_entries" ON public.habit_entries;

CREATE POLICY "Users can view their own habit entries" 
ON public.habit_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit entries" 
ON public.habit_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit entries" 
ON public.habit_entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit entries" 
ON public.habit_entries FOR DELETE 
USING (auth.uid() = user_id);

-- Update RLS policies for workout_records
DROP POLICY IF EXISTS "Allow all operations on workout_records" ON public.workout_records;

CREATE POLICY "Users can view their own workout records" 
ON public.workout_records FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout records" 
ON public.workout_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout records" 
ON public.workout_records FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout records" 
ON public.workout_records FOR DELETE 
USING (auth.uid() = user_id);