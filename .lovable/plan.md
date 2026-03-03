

## Critique

The instruction is solid but has a few issues:

1. **DataManagement.tsx already fixed** — it already imports `useUserHabits`, not `CORE_HABITS`. This step is done.

2. **`useUserHabits` only fetches active habits** — it has `.eq('is_active', true)`. The Manage Habits page needs ALL habits. We need a separate `useAllHabits()` query or a parameter to control filtering.

3. **Drag-and-drop is risky** — the instruction wisely suggests up/down arrow buttons as a fallback. Given no DnD library is installed, up/down buttons are the right call.

4. **Icon picker scope creep** — 20 icons is fine, but the `iconMap` in `habitIcons.ts` currently only has 9. We need to expand it for both the picker AND the rendering side, otherwise selecting a new icon like `Heart` would render as the fallback `Circle`.

5. **`gen_random_uuid()::text` for new habit IDs** — the `habits.id` column is TEXT with no default. We should let Supabase handle this or generate client-side. Simplest: omit `id` from the insert and rely on a DB default, but the table has no default on `id`. We need to generate the UUID client-side with `crypto.randomUUID()`.

6. **Inline edit vs sub-view** — inline expand is simpler and matches the app's mobile-first feel. No need for another navigation level.

---

## Plan

### 1. Expand the shared icon map (`src/utils/habitIcons.ts`)

Add all 20 icons from the picker list (Heart, Droplets, Moon, Sun, Brain, Footprints, Apple, Clock, Eye, Music, Smile) alongside the existing 9. Export the full map for use by both the icon picker and icon rendering.

### 2. Create `IconPicker` component (`src/components/IconPicker.tsx`)

- Uses Popover (already in project) anchored to a button showing the current icon
- 4-column grid of all icons from the expanded icon map
- Each icon shows a tooltip with its name
- Selected icon gets highlighted border
- Props: `selectedIcon: string`, `onSelect: (iconName: string) => void`

### 3. Add habit management mutations to `src/hooks/useHabits.ts`

- `useAllHabits()` — same as `useUserHabits` but without the `.eq('is_active', true)` filter. Query key: `['all-habits']`
- `useUpdateHabit()` — updates name, description, icon, is_active, order_index
- `useAddHabit()` — inserts with `id: crypto.randomUUID()`, user_id from auth
- `useDeleteHabit()` — deletes by id (preserves habit_entries)
- `useReorderHabits()` — batch updates order_index for affected rows
- All invalidate both `['habits']` and `['all-habits']` on success

### 4. Create `ManageHabits` component (`src/pages/settings/ManageHabits.tsx`)

Layout matches WeightliftingPlan pattern:
- Sticky header with back arrow, title "Manage Habits", subtitle "X habits · Y active"
- Habit list: each row shows icon, name, description, active Switch, up/down reorder buttons
- Tapping a row expands it inline to show edit fields (name, description, icon picker, value_type read-only, save/cancel/delete buttons)
- Delete uses AlertDialog with confirmation
- "Add Habit" button at bottom opens same inline form but empty
- Toast notifications on all operations

### 5. Update `src/pages/Settings.tsx`

- Add `'habits'` to `SettingsView` union
- Import `ManageHabits`, add view handler
- Add menu button with `ListChecks` icon

### Files

| File | Action |
|------|--------|
| `src/utils/habitIcons.ts` | Expand with 11 new icons |
| `src/components/IconPicker.tsx` | New |
| `src/hooks/useHabits.ts` | Add `useAllHabits`, `useUpdateHabit`, `useAddHabit`, `useDeleteHabit`, `useReorderHabits` |
| `src/pages/settings/ManageHabits.tsx` | New |
| `src/pages/Settings.tsx` | Add habits view + menu button |

No database migration needed — the schema already supports all operations.

