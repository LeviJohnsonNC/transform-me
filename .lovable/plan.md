

# Critique and Plan: Migrate to Database-Driven Habits

## Critique of the Build Instruction

The instruction is well-structured but has several issues:

### 1. Primary Key Change is Unnecessarily Risky
Changing `habits.id` from TEXT to UUID is a destructive migration that requires updating all `habit_entries.habit_id` references. This is the riskiest part of the plan. However, it's worth doing since the current TEXT IDs (`strength`, `conditioning`) won't scale for user-created habits. The migration must be done carefully in a single transaction.

### 2. Missing Foreign Key on `habit_entries.habit_id`
Currently `habit_entries.habit_id` is just a TEXT column with no foreign key to `habits`. After the migration, we should **not** add a FK constraint because:
- Old entries use text IDs, new ones use UUIDs
- Adding a FK would require updating ALL existing rows first
- The migration SQL must handle this mapping atomically

### 3. `useStreaks.ts` and `StreakRing.tsx` Have Hardcoded `5`
The instruction mentions StreakRing but misses that both `useStreaks.ts` (lines 37, 55) and `StreakRing.tsx` (line 26) hardcode `count === 5`. These need to use dynamic habit count.

### 4. `habitStore.ts` Uses `CORE_HABITS.length` in Multiple Places
The store's `getDayProgress`, `getStreakData` functions use `CORE_HABITS.length` to determine "fully completed day." The instruction mentions this but the fix approach needs clarity: these functions should accept a `totalHabits` parameter.

### 5. The `useHabits` Hook Name Conflicts
`src/hooks/useHabits.ts` already exists and exports `useHabitEntries`, `useToggleHabit`, etc. Adding a `useHabits()` hook to the same file is fine but should be named clearly (e.g., `useUserHabits` to distinguish from the file name).

### 6. Seeding for "Existing User" is Fragile
The instruction says "query the user from `habit_entries`." A better approach: use a Supabase trigger or seed via the app on first login. Since there's only one user, a migration that queries `SELECT DISTINCT user_id FROM habit_entries` works but should be noted as a one-time migration.

### 7. Step 7 (Update Supabase Types) is Not Manually Possible
The instruction says to "regenerate or manually update" `src/integrations/supabase/types.ts`. This file is auto-generated and cannot be manually edited. The types will update automatically after migration.

---

## Refined Plan

### Phase 1: Database Migration

Single SQL migration that:

1. Adds columns to `habits`: `user_id` (UUID, references auth.users, ON DELETE CASCADE), `order_index` (INT, NOT NULL, DEFAULT 0), `is_active` (BOOL, NOT NULL, DEFAULT true), `value_type` (TEXT, NOT NULL, DEFAULT 'boolean'), `color` (TEXT, nullable)
2. Creates a temporary mapping: inserts the 9 habits for the existing user (queried from `habit_entries`), generating new UUIDs
3. Updates all `habit_entries.habit_id` values from old text IDs to new UUIDs using the mapping
4. Drops old habit rows that have no user_id (the original seed data)
5. Changes `habits.id` column type — actually, since rows are being replaced, we can just drop and recreate, or add new rows with UUID IDs alongside. Simplest: keep `id` as TEXT but store UUID strings in it going forward. This avoids column type change complexity.
6. Updates RLS: drop the "allow all" policy, add user-scoped SELECT/INSERT/UPDATE/DELETE policies

**Revised approach on ID type**: Keep `id` as TEXT column but store UUID-formatted strings. This avoids the ALTER COLUMN complexity while still supporting dynamic IDs. New habits will use `gen_random_uuid()::text`.

### Phase 2: Shared Icon Map Utility

Create `src/utils/habitIcons.ts`:
- Maps icon name strings to lucide-react components
- Includes all 9 icons: Dumbbell, Activity, Pill, Beef, Flame, Sparkles, BookOpen, Snowflake, GraduationCap
- Fallback to a default icon (Circle or Calendar)

### Phase 3: Update Types and Hook

**`src/types/habits.ts`**:
- Update `Habit` interface with new fields (orderIndex, isActive, valueType, color)
- Remove `CORE_HABITS` constant
- Remove `HABIT_COLORS` constant

**`src/hooks/useHabits.ts`**:
- Add `useUserHabits()` query that fetches from `habits` table where `user_id = auth.uid()`, `is_active = true`, ordered by `order_index`
- Maps snake_case DB columns to camelCase Habit interface

### Phase 4: Update habitStore

Modify `getDayProgress`, `getStreakData` to accept a `totalHabits: number` parameter instead of using `CORE_HABITS.length`.

### Phase 5: Update All Consumers

| File | Change |
|------|--------|
| `Today.tsx` | Use `useUserHabits()`, pass `habits.length` to store functions |
| `History.tsx` | Use `useUserHabits()`, use shared icon map, dynamic habit list |
| `HabitCard.tsx` | Use shared icon map from utility |
| `StreakRing.tsx` | Accept `habitCount` prop or use `useUserHabits()`, replace hardcoded `5` |
| `useStreaks.ts` | Use `useUserHabits()` for habit count, replace hardcoded `5` |
| `useCoach.ts` | Use `useUserHabits()` instead of `CORE_HABITS` |
| `About.tsx` | Use `useUserHabits()` for count |

### Files Summary

**New**: migration SQL, `src/utils/habitIcons.ts`

**Modified**: `src/types/habits.ts`, `src/hooks/useHabits.ts`, `src/stores/habitStore.ts`, `src/pages/Today.tsx`, `src/pages/History.tsx`, `src/components/HabitCard.tsx`, `src/components/StreakRing.tsx`, `src/hooks/useStreaks.ts`, `src/hooks/useCoach.ts`, `src/pages/settings/About.tsx`

