-- Migrate existing data to authenticated user account
-- Associate all existing habit entries with levijohnson@gmail.com user account
UPDATE public.habit_entries 
SET user_id = 'a7b45a2c-7a71-4bf4-94ea-3f549910c560' 
WHERE user_id IS NULL;

-- Associate all existing workout records with levijohnson@gmail.com user account  
UPDATE public.workout_records 
SET user_id = 'a7b45a2c-7a71-4bf4-94ea-3f549910c560' 
WHERE user_id IS NULL;