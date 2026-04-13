

# Plan: Fix Weightlifting Records Issues

## Problems Identified

1. **Auto-selects Day 1 + Good** — state initializes with `selectedDay=1` and `selectedTier='good'`, immediately showing exercises
2. **Auto-save on blur is flaky** — `onBlur` triggers saves mid-editing (e.g. tapping between weight/reps fields), causing partial saves and double-fires
3. **Previous best logic is broken** — `previous_best` is always set to `current_weight` on save, never actually tracking the historical best. Reps are ignored in the comparison entirely.
4. **Toast says "New Personal Best! 🎉"** — needs removal per request

## Changes

### 1. Progressive selection flow (`Records.tsx`)

- Initialize `selectedDay` as `null` and `selectedTier` as `null`
- Show day selector buttons; no tier buttons or exercise cards until a day is picked
- Once day is picked, show tier buttons; no exercise cards until tier is picked
- Remove the `useEffect` that auto-selects the first day

### 2. Explicit save button (`RecordCard.tsx`)

- Remove `onBlur={handleBlur}` from both inputs
- Keep `onKeyPress` Enter handler for convenience
- Add a "Save" button below the input row — full width, compact, styled with the app's primary button style
- Show loading state on the button during save (`updateRecord.isPending`)

### 3. Fix previous best logic (`useWorkoutRecords.ts`)

The current mutation sets `previous_best = current_weight` every time — it never compares against the actual historical best.

Fix:
- Before inserting/updating, fetch the **all-time best** record for this exercise+set_type (not just today's)
- For `lbs` exercises: best is determined by weight first, then reps as tiebreaker (higher weight wins; if same weight, higher reps wins)
- For `reps`/`seconds` exercises (where weight column stores the value): higher value wins
- Set `previous_best` to the **previous** all-time best value (the best *before* this save), so the card can display what the user beat
- On insert (new day): `previous_best` = the historical best from prior records
- On update (same day): `previous_best` = the best from records *excluding* today

### 4. Remove congratulations toast (`RecordCard.tsx`)

- Remove the `isNewBest` check and the "New Personal Best! 🎉" title
- Replace with a simple "Record Saved" toast for all saves

## Files

| File | Change |
|------|--------|
| `src/pages/Records.tsx` | Nullable day/tier state, progressive reveal |
| `src/components/RecordCard.tsx` | Remove onBlur saves, add Save button, simplify toast |
| `src/hooks/useWorkoutRecords.ts` | Fix previous_best to track actual historical best |

