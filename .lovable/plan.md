

# Plan: Restructure Workout Plan for Per-Tier Exercise Lists + Backoff Sets

## The Problem

The current schema stores one exercise row per day with tier-specific sets/reps columns (`sets_minimum`, `reps_minimum`, etc.). Your workout has **different exercises per tier** — e.g., Day 1 MED has 4 exercises, Good has 6, Max has 8. The current design can't represent this.

## Architecture Change

**Add a `tier` column to `workout_exercises`** so each row belongs to one tier. "Bench Press" on Day 1 appears as 3 separate rows (one per tier), each with its own sets/reps. "Flat Dumbbell Bench" only appears in the Max row.

**Add backoff set support.** Many compound lifts follow a "1 top set of 5, then N backoff sets of 8" pattern. New columns: `backoff_sets`, `backoff_reps`, `backoff_reps_high`.

**Add rep ranges.** New column `reps_high` for "8-10" ranges (reps=8, reps_high=10).

**Add exercise notes.** New `notes` TEXT column for per-exercise tips.

## Database Migration

```sql
ALTER TABLE workout_exercises
  ADD COLUMN tier text NOT NULL DEFAULT 'good',
  ADD COLUMN reps_high integer,
  ADD COLUMN backoff_sets integer,
  ADD COLUMN backoff_reps integer,
  ADD COLUMN backoff_reps_high integer,
  ADD COLUMN notes text;
```

Migrate existing exercises: duplicate each current row into 3 tier rows using the old tier columns, then drop `sets_minimum`, `reps_minimum`, `sets_good`, `reps_good`, `sets_max`, `reps_max`.

## Data Seeding

Delete existing workout plans/exercises for the user, then insert 5 days with the full exercise data you provided. Each day gets 3 tiers of exercises. Roughly 80+ exercise rows total across all days/tiers.

The `EXERCISES` list in ExerciseSelector needs expanding with the new exercise names (Romanian Deadlift, Skull Crushers, Barbell Curl, Hammer Curl, Close-Grip Bench, Lateral Raise, Barbell Row, etc.).

## UI Changes

### Records Page (`Records.tsx`)
Already has a tier selector — it stays. The change: instead of showing the same exercises with different sets/reps per tier, it now shows **different exercises** per tier. The query filters by tier.

### ExerciseSelector (`ExerciseSelector.tsx`)
- Remove the 3-column tier grid (MED/Good/Max side-by-side)
- Add a tier selector at the top (like Records page) — you edit one tier's exercises at a time
- Each exercise card shows: sets, reps (with optional reps_high for ranges), backoff sets/reps if applicable, notes
- Add backoff set fields to the add/edit form
- Add rep range support (reps_high field)
- Allow typing custom exercise names (not just dropdown)

### RecordCard (`RecordCard.tsx`)
- Display backoff set info: "1×5, then 3×8" instead of "3 sets × 8 reps"
- Display rep ranges: "3 sets × 8-10 reps"

### Hooks (`useWorkoutPlans.ts`)
- `useWorkoutExercises` accepts `tier` parameter, filters by it
- Remove `getTierValues` helper (no longer needed)
- Update add/update mutations for new columns
- Remove old tier column types

## Files Summary

| File | Change |
|------|--------|
| Migration SQL | Add tier, reps_high, backoff columns; drop old tier columns; migrate existing data |
| Data insert | Seed 5 days × 3 tiers of exercises |
| `src/hooks/useWorkoutPlans.ts` | Filter by tier, new column types, remove getTierValues |
| `src/components/ExerciseSelector.tsx` | Tier selector, backoff/range fields, expanded exercise list, custom names |
| `src/components/RecordCard.tsx` | Display backoff sets and rep ranges |
| `src/pages/Records.tsx` | Pass tier to exercise query |

## Risk Assessment

- **Existing workout_records are keyed by exercise_name** — they'll still work since the names don't change. Records are per-exercise, not per-tier.
- **The old tier columns get dropped** — clean break, no stale data.
- **~80 exercise rows to insert** — done via data insert tool, not migration.

