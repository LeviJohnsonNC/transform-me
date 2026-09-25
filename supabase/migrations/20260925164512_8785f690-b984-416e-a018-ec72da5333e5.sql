-- The strength table to score a lifter against when they chose "Prefer not to
-- say" for gender. Until now that choice was silently scored on the male
-- table; the app now asks instead, and stores the answer here.
--
-- Nullable: male and female profiles never read it, and an "other" profile
-- with no answer shows a prompt rather than a rating.
ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS rating_scale text;

ALTER TABLE public.user_stats
  DROP CONSTRAINT IF EXISTS user_stats_rating_scale_check;
ALTER TABLE public.user_stats
  ADD CONSTRAINT user_stats_rating_scale_check CHECK (rating_scale IN ('male', 'female'));