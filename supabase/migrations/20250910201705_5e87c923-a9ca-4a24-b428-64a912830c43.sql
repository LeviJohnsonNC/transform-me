-- Clean up duplicate habit entries, keeping only the most recent one for each habit/date/user combination
WITH ranked_entries AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY habit_id, date, user_id 
      ORDER BY created_at DESC
    ) as rn
  FROM habit_entries
),
duplicates_to_delete AS (
  SELECT id 
  FROM ranked_entries 
  WHERE rn > 1
)
DELETE FROM habit_entries 
WHERE id IN (SELECT id FROM duplicates_to_delete);