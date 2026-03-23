

# Plan: Workout Plan Tiers + Dynamic Days

## What We're Building

Two features:
1. **Three workout tiers per day** — each exercise gets sets/reps for "Minimum Effective Dose", "Good Day", and "Max Effort" instead of a single configuration
2. **Dynamic day management** — add/remove/rename workout days (currently hardcoded to 7 in the DB)

---

## Database Changes

### 1. Add tier columns to `workout_exercises`

Instead of a single `sets`/`reps`, add columns for each tier:

```sql
ALTER TABLE workout_exercises
  ADD COLUMN sets_minimum integer,
  ADD COLUMN reps_minimum integer,
  ADD COLUMN sets_good integer,
  ADD COLUMN reps_good integer,
  ADD COLUMN sets_max integer,
  ADD COLUMN reps_max integer;

-- Migrate existing data: current values become "Good Day" defaults
UPDATE workout_exercises
  SET sets_minimum = sets, reps_minimum = reps,
      sets_good = sets, reps_good = reps,
      sets_max = sets, reps_max = reps;
```

The original `sets`/`reps` columns stay for backward compatibility (or we can drop them later). The six new columns are nullable initially, filled by migration.

### 2. Add user_id to `workout_plans` and allow dynamic day management

Currently `workout_plans` has 7 static rows with no `user_id`. We need:

```sql
ALTER TABLE workout_plans ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Assign existing plans to the current user
UPDATE workout_plans SET user_id = (SELECT DISTINCT user_id FROM habit_entries LIMIT 1);
```

Update RLS on `workout_plans` and `workout_exercises` to be user-scoped (drop the "allow all" policies, add `auth.uid() = user_id` policies). For `workout_exercises`, join through `workout_plans` to check ownership.

---

## UI Changes

### 3. `ExerciseSelector` — tier-aware editing

When editing an exercise, show three columns (or three expandable sections) for the three tiers:

```text
┌──────────────────────────────────────────┐
│ Bench Press                    [Delete]  │
│ Fixed / AMRAP toggle                     │
│                                          │
│  MED         Good        Max             │
│  Sets: 2     Sets: 3     Sets: 4         │
│  Reps: 8     Reps: 10    Reps: 10        │
└──────────────────────────────────────────┘
```

Same layout for the "Add Exercise" form.

### 4. `WeightliftingPlan` — day management

Add buttons to:
- **Add Day** — inserts a new `workout_plans` row with `day_number = max + 1`, default name "Day N"
- **Rename Day** — inline text input on each `DayPlanCard`, saves to DB on blur/enter
- **Delete Day** — with confirmation dialog; cascades to delete associated `workout_exercises`

### 5. `DayPlanCard` — show rename/delete controls

Add an edit icon and delete icon to each card row.

### 6. Records page — tier selector

On the Records page, add a 3-button tier selector (MED / Good / Max) above the exercise cards. The selected tier determines which sets/reps values are shown on each `RecordCard`. Default to "Good Day".

---

## Hook Changes

### `useWorkoutPlans.ts`

- `useAddWorkoutDay()` — inserts new plan row with user_id
- `useRenameWorkoutDay()` — updates `day_name`
- `useDeleteWorkoutDay()` — deletes plan (exercises cascade)
- Update `useAddExercise` / `useUpdateExercise` to handle the 6 tier columns
- Update `useWorkoutExercises` return type to include tier data

---

## Files Summary

| File | Change |
|------|--------|
| Migration SQL | Add 6 tier columns to `workout_exercises`, add `user_id` to `workout_plans`, update RLS |
| `src/hooks/useWorkoutPlans.ts` | Add day CRUD mutations, update exercise mutations for tiers |
| `src/components/ExerciseSelector.tsx` | 3-column tier editing UI |
| `src/components/DayPlanCard.tsx` | Add rename/delete controls |
| `src/pages/settings/WeightliftingPlan.tsx` | Add "Add Day" button, pass rename/delete handlers |
| `src/pages/Records.tsx` | Add tier selector, pass selected tier to RecordCard |
| `src/components/RecordCard.tsx` | Accept tier prop, display tier-specific sets/reps |

