-- Create habits table for the 5 core habits
CREATE TABLE public.habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT
);

-- Create habit_entries table to store completions
CREATE TABLE public.habit_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES public.habits(id),
  date TEXT NOT NULL, -- YYYY-MM-DD format
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (but allow all operations since it's single user)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (single user app)
CREATE POLICY "Allow all operations on habits" 
ON public.habits 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on habit_entries" 
ON public.habit_entries 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_habit_entries_date ON public.habit_entries(date);
CREATE INDEX idx_habit_entries_habit_date ON public.habit_entries(habit_id, date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_habit_entries_updated_at
BEFORE UPDATE ON public.habit_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 5 core habits
INSERT INTO public.habits (id, name, icon, description) VALUES
('strength', 'Strength training', 'Dumbbell', 'Complete your strength workout'),
('conditioning', 'Conditioning', 'Activity', 'Cardio or conditioning work'),
('calories', 'Under calorie budget', 'Flame', 'Stay within daily calorie target'),
('protein', 'Hit protein target', 'Beef', 'Meet daily protein goal'),
('supplements', 'Supplements & vitamins', 'Pill', 'Take daily supplements');