

# Critique

1. **The instruction is well-scoped and clean.** The percentage-based tier logic already exists and will work naturally with variable habit counts per day. No tier logic changes needed.

2. **The `useUserHabits` hook filters `is_active = true` but doesn't know the day type.** It needs a date-aware variant or the filtering must happen after fetch. Since habits don't change often, fetching all active habits and filtering client-side by day type is simpler and avoids cache invalidation issues when navigating between days.

3. **`computeCycleProgress` in `useCycleProgression.ts` uses `habits.length` as a fixed total for every day.** This is the biggest fix — each day in the cycle scan needs its own active habit count based on whether it's a weekday or weekend. The habits list must be passed in so the function can filter per-day.

4. **Streak logic in `habitStore.ts` uses `totalHabits` as a fixed number.** Same issue — streak computation needs day-aware habit counts.

5. **History page uses `habits.length` for tier calculation per day.** Needs the same per-day filtering.

6. **The instruction's suggestion of two boolean columns is correct and clean.** `active_on_weekdays` and `active_on_weekends`, defaulting to `true`.

---

# Plan: Weekend Mode with Per-Habit Day-Type Toggles

## Database

Add two columns to `habits`:

```sql
ALTER TABLE habits
  ADD COLUMN active_on_weekdays boolean NOT NULL DEFAULT true,
  ADD COLUMN active_on_weekends boolean NOT NULL DEFAULT true;
```

All existing habits default to active on both. No data migration needed.

## Core Utility

Add to `src/types/habits.ts`:
- `activeOnWeekdays?: boolean` and `activeOnWeekends?: boolean` fields on `Habit`

Create a shared utility function (in `useGamification.ts` or a new `src/utils/dayType.ts`):

```ts
const isWeekend = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.getDay() === 0 || d.getDay() === 6;
};

const getActiveHabitsForDate = (habits: Habit[], date: string | Date): Habit[] => {
  const weekend = isWeekend(date);
  return habits.filter(h => weekend ? h.activeOnWeekends !== false : h.activeOnWeekdays !== false);
};
```

## Hook Changes

### `useHabits.ts`
- Update `mapHabitRow` to include `activeOnWeekdays` and `activeOnWeekends`
- Update `useAddHabit` and `useUpdateHabit` to support the new fields

### `useGamification.ts`
- `useDayTier()`: filter habits by selected date's day type before computing total
- `computeDayTier()`: accept habits array instead of `totalHabits` number, filter internally

### `useCycleProgression.ts`
- `computeCycleProgress()`: for each day in the interval, compute active habit count for that specific day (weekday vs weekend), then derive the tier from that count. This is the critical fix.

### `useStreaks.ts`
- Pass habits array to streak computation; for each day, determine active count based on day type instead of using fixed `habitCount`

### `habitStore.ts`
- `getStreakData` and `getDayProgress` need to accept habits array (not just count) so callers can filter. Or: keep the store simple and move day-type filtering to the call sites.

## UI Changes

### `ManageHabits.tsx`
Add two compact toggles per habit in the edit/view row:

```
[Icon] Habit Name          Weekdays [✓]  Weekends [✓]  [Active toggle]
```

Use `Checkbox` components labeled "Weekdays" and "Weekends". Show in both the inline edit panel and the habit row itself (as small labels/badges when not editing).

### `Today.tsx`
- Filter `habits` by day type before rendering: `const activeHabits = getActiveHabitsForDate(habits, selectedDate)`
- Use `activeHabits.length` as total instead of `habits.length`
- Show subtle "Weekend routine" badge when viewing a weekend date

### `History.tsx`
- `getDayTierForDate()`: filter habits by that date's day type to get correct total
- Display remains the same, just with correct per-day totals

## Files Summary

| File | Change |
|------|--------|
| Migration SQL | Add `active_on_weekdays`, `active_on_weekends` to `habits` |
| `src/types/habits.ts` | Add two optional boolean fields to `Habit` |
| `src/utils/dayType.ts` | New — `isWeekend()`, `getActiveHabitsForDate()` |
| `src/hooks/useHabits.ts` | Map new columns, update mutations |
| `src/hooks/useGamification.ts` | Day-type-aware tier computation |
| `src/hooks/useCycleProgression.ts` | Per-day active habit count in cycle scan |
| `src/hooks/useStreaks.ts` | Day-type-aware streak counting |
| `src/pages/Today.tsx` | Filter habits by day type, weekend indicator |
| `src/pages/History.tsx` | Per-day habit count for tier dots |
| `src/pages/settings/ManageHabits.tsx` | Weekday/Weekend toggles per habit |

