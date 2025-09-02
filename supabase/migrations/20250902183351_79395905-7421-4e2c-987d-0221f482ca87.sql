-- Create workout_records table for tracking weightlifting performance
CREATE TABLE public.workout_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_plan_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  current_weight DECIMAL(6,2) NOT NULL,
  previous_best DECIMAL(6,2),
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_records ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (matching existing workout tables pattern)
CREATE POLICY "Allow all operations on workout_records" 
ON public.workout_records 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_workout_records_plan_exercise ON public.workout_records(workout_plan_id, exercise_name);
CREATE INDEX idx_workout_records_date ON public.workout_records(date_recorded);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workout_records_updated_at
BEFORE UPDATE ON public.workout_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();