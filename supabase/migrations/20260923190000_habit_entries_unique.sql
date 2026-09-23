-- One habit_entries row per (user, habit, day).
--
-- `useToggleHabit` reads the day's row and then writes it. Two taps in quick
-- succession can both read "no row yet" and both insert, leaving two rows for
-- the same day. The audit found none in the current data, but `cycle_progress`
-- accumulated roughly 19,500 duplicate rows from exactly this pattern before it
-- was patched, so this is the guard that stops it recurring here.
--
-- The toggle's insert becomes an upsert against this index in the same change,
-- so the second writer updates the row rather than failing.

-- Defensive dedupe so the index below can be created on any existing data.
-- Expected to delete nothing. Ordering is deliberate: a completed day outranks
-- an incomplete one, so a race can never cost the user a completion; newest
-- update breaks the remaining ties, and id makes it fully deterministic.
DELETE FROM public.habit_entries a
USING public.habit_entries b
WHERE a.habit_id = b.habit_id
  AND a.date = b.date
  AND a.user_id IS NOT DISTINCT FROM b.user_id
  AND (
    (b.completed, b.updated_at, b.id) > (a.completed, a.updated_at, a.id)
  );

-- Deliberately NOT partial. PostgREST's `on_conflict=user_id,habit_id,date`
-- emits `ON CONFLICT (user_id, habit_id, date)` with no WHERE clause, and
-- Postgres can only infer a *non-partial* index from that form — a
-- `WHERE user_id IS NOT NULL` variant would make the upsert below fail with
-- "no unique or exclusion constraint matching the ON CONFLICT specification".
CREATE UNIQUE INDEX IF NOT EXISTS habit_entries_user_habit_date_key
  ON public.habit_entries (user_id, habit_id, date);

-- SQL treats NULLs as distinct, so the index above does not constrain rows with
-- no owner. The app cannot create those (it always writes the session user),
-- but pre-migration data can hold them, so they get their own guard. Different
-- columns, so this does not interfere with the inference above.
-- (`UNIQUE NULLS NOT DISTINCT` would cover both, but only on Postgres 15+.)
CREATE UNIQUE INDEX IF NOT EXISTS habit_entries_orphan_habit_date_key
  ON public.habit_entries (habit_id, date)
  WHERE user_id IS NULL;

-- idx_habit_entries_habit_date (habit_id, date) is now redundant with the
-- indexes above for lookup purposes, but it is left in place: dropping it is a
-- separate decision from adding a correctness guard.
