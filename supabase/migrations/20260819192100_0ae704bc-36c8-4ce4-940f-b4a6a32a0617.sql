CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.habits (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  description text,
  user_id uuid,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  value_type text NOT NULL DEFAULT 'boolean',
  color text,
  active_on_weekdays boolean NOT NULL DEFAULT true,
  active_on_weekends boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits" ON public.habits FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.habit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id text NOT NULL,
  date text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_entries TO authenticated;
GRANT ALL ON public.habit_entries TO service_role;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habit entries" ON public.habit_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_habit_entries_date ON public.habit_entries (date);
CREATE INDEX idx_habit_entries_habit_date ON public.habit_entries (habit_id, date);
CREATE TRIGGER update_habit_entries_updated_at BEFORE UPDATE ON public.habit_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number integer NOT NULL UNIQUE,
  day_name text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO authenticated;
GRANT ALL ON public.workout_plans TO service_role;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workout plans" ON public.workout_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets integer NOT NULL,
  reps integer NOT NULL,
  reps_high integer,
  order_index integer NOT NULL DEFAULT 0,
  rep_type text NOT NULL DEFAULT 'fixed',
  tier text NOT NULL DEFAULT 'good',
  backoff_sets integer,
  backoff_reps integer,
  backoff_reps_high integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT ALL ON public.workout_exercises TO service_role;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workout exercises" ON public.workout_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_plans p WHERE p.id = workout_plan_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plans p WHERE p.id = workout_plan_id AND p.user_id = auth.uid()));
CREATE TRIGGER update_workout_exercises_updated_at BEFORE UPDATE ON public.workout_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workout_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  current_weight numeric NOT NULL,
  previous_best numeric,
  previous_best_reps integer,
  actual_reps integer,
  set_type text NOT NULL DEFAULT 'standard',
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_records TO authenticated;
GRANT ALL ON public.workout_records TO service_role;
ALTER TABLE public.workout_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workout records" ON public.workout_records FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_workout_records_plan_exercise ON public.workout_records (workout_plan_id, exercise_name);
CREATE INDEX idx_workout_records_date ON public.workout_records (date_recorded);
CREATE TRIGGER update_workout_records_updated_at BEFORE UPDATE ON public.workout_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reward_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'standard',
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reward_settings TO authenticated;
GRANT ALL ON public.reward_settings TO service_role;
ALTER TABLE public.reward_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reward settings" ON public.reward_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_reward_settings_updated_at BEFORE UPDATE ON public.reward_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cycle_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cycle_number integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  points_per_level integer NOT NULL DEFAULT 12,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_progress TO authenticated;
GRANT ALL ON public.cycle_progress TO service_role;
ALTER TABLE public.cycle_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cycle progress" ON public.cycle_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX one_active_cycle_per_user ON public.cycle_progress (user_id) WHERE (is_active = true);
CREATE TRIGGER update_cycle_progress_updated_at BEFORE UPDATE ON public.cycle_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cycle_level_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cycle_id uuid NOT NULL REFERENCES public.cycle_progress(id) ON DELETE CASCADE,
  level integer NOT NULL,
  reward_type text NOT NULL,
  reward_setting_id uuid REFERENCES public.reward_settings(id) ON DELETE SET NULL,
  reward_title_snapshot text NOT NULL,
  reward_description_snapshot text,
  is_claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_level_unlocks TO authenticated;
GRANT ALL ON public.cycle_level_unlocks TO service_role;
ALTER TABLE public.cycle_level_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cycle unlocks" ON public.cycle_level_unlocks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY,
  gender text NOT NULL DEFAULT 'male',
  age integer NOT NULL,
  bodyweight_lbs numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user stats" ON public.user_stats FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();