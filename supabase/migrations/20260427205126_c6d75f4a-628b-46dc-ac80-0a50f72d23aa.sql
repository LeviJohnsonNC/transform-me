CREATE TABLE public.user_stats (
  user_id UUID NOT NULL PRIMARY KEY,
  gender TEXT NOT NULL DEFAULT 'male',
  age INTEGER NOT NULL,
  bodyweight_lbs NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_stats_gender_check CHECK (gender IN ('male','female','other')),
  CONSTRAINT user_stats_age_check CHECK (age >= 10 AND age <= 100),
  CONSTRAINT user_stats_bw_check CHECK (bodyweight_lbs >= 50 AND bodyweight_lbs <= 600)
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stats"
ON public.user_stats
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();