
-- reward_settings table
CREATE TABLE public.reward_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'boss')),
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reward settings" ON public.reward_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- cycle_progress table
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

ALTER TABLE public.cycle_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cycle progress" ON public.cycle_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- cycle_level_unlocks table
CREATE TABLE public.cycle_level_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cycle_id uuid NOT NULL REFERENCES public.cycle_progress(id) ON DELETE CASCADE,
  level integer NOT NULL CHECK (level >= 1 AND level <= 10),
  reward_type text NOT NULL CHECK (reward_type IN ('standard', 'boss')),
  reward_setting_id uuid REFERENCES public.reward_settings(id) ON DELETE SET NULL,
  reward_title_snapshot text NOT NULL,
  reward_description_snapshot text,
  is_claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cycle_level_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cycle level unlocks" ON public.cycle_level_unlocks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER handle_reward_settings_updated_at
  BEFORE UPDATE ON public.reward_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_cycle_progress_updated_at
  BEFORE UPDATE ON public.cycle_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
