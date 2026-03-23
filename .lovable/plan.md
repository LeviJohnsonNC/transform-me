

# Plan: Split Records into Top Set + Backoff Rows with Weight & Reps Tracking

## The Problem

Currently, "Bench Press — 1×5, then 3×8" renders as a single RecordCard with one weight input. You want **two separate rows**: one for tracking the top set (1×5) and one for the backoff sets (3×8), each with its own weight AND reps fields, and its own previous best history.

## Approach

The key insight: exercises with `backoff_sets` should render as **two RecordCards** — one for the "top set" portion and one for the "backoff" portion. Each gets its own record in `workout_records`, differentiated by a new `set_type` column (e.g., `'top'` vs `'backoff'`).

For exercises without backoff sets (e.g., "Incline DB — 3×8-10"), they render as a single card as today, but now with both weight and reps inputs.

## Database Changes

Add two columns to `workout_records`:
- `set_type` (TEXT, NOT NULL, DEFAULT `'standard'`) — values: `'standard'`, `'top'`, `'backoff'`
- `actual_reps` already exists but is unused — we'll start using it

Rename `current_weight` semantically stays the same (it's the value being tracked — could be weight in lbs or reps for bodyweight exercises).

No changes to `workout_exercises` — the backoff info is already there.

## UI Changes

### Records page (`Records.tsx`)
For each exercise that has `backoff_sets`, render **two** RecordCards:
1. Top set card: shows "Bench Press — Top Set" with prescription "1×5", tracks weight + reps
2. Backoff card: shows "Bench Press — Backoff" with prescription "3×8", tracks weight + reps

For exercises without backoff sets, render one card as before but with both weight and reps inputs.

### RecordCard (`RecordCard.tsx`)
- Add a `reps` input field alongside the weight input
- Show "Previous Best" as weight × reps (e.g., "165 lbs × 5 reps")
- Accept a `setType` prop (`'standard' | 'top' | 'backoff'`) to differentiate records
- Accept a `label` prop for the subtitle (e.g., "Top Set · 1×5" or "Backoff · 3×8")

### Hook (`useWorkoutRecords.ts`)
- `UpdateRecordData` gets `set_type` and `actual_reps` fields
- Records are keyed by `exercise_name + set_type` instead of just `exercise_name`
- Query and grouping logic updated to use the composite key
- Previous best logic: track the highest weight for that exercise+set_type combo

## Files

| File | Change |
|------|--------|
| Migration SQL | Add `set_type` column to `workout_records` |
| `src/hooks/useWorkoutRecords.ts` | Key records by exercise_name+set_type, include actual_reps in mutations |
| `src/components/RecordCard.tsx` | Add reps input, accept setType/label props, display "weight × reps" for previous best |
| `src/pages/Records.tsx` | Split exercises with backoff_sets into two RecordCard instances |

