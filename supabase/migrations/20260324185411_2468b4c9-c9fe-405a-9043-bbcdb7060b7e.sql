-- Deactivate all duplicate active cycles, keeping only the newest per user
WITH ranked AS (
  SELECT id, user_id, row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM cycle_progress
  WHERE is_active = true
)
UPDATE cycle_progress
SET is_active = false, completed_at = now()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Add partial unique index to prevent future duplicates
CREATE UNIQUE INDEX one_active_cycle_per_user ON cycle_progress (user_id) WHERE (is_active = true);