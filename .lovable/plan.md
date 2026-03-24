

# Critique

1. **Progress points should NOT be stored separately.** The instruction suggests deriving tiers from habit data (correct) but then wants to store `cycle_progress` with `current_level_progress`. This creates a sync problem: if a user retroactively toggles a habit from a past day, the stored progress diverges from reality. Instead, progress should be **computed** by scanning all `habit_entries` since the cycle start date, computing each day's tier, and summing points. The only things that need persistence are: cycle boundaries (start date), reward settings, and level unlock events.

2. **"12 points per level" is too rigid as a constant.** It works now but should be a column on `cycle_progress` so it can be tuned later without a migration.

3. **The randomization logic is overcomplicated.** "Avoid immediate repetition" with a small pool creates edge cases. Simpler: random selection from active pool, excluding the most recently assigned reward ID if pool size > 1. Done.

4. **No new navigation tab needed.** The instruction mentions a "Progress / Stats / Rewards screen" but the app has 4 tabs (Today, History, Records, Settings). The cycle progress card belongs on Today, and the rewards config + cycle history belong in Settings. No new route needed.

5. **Level-up detection timing matters.** Progress is derived, so we need to detect level-ups by comparing current computed level against the latest `cycle_level_unlocks` entry. If computed level > max unlocked level, trigger the unlock flow. This happens on page load / habit toggle, not via a backend trigger.

6. **Cycle completion detection.** When level 10 is unlocked + claimed, we mark the cycle complete and create a new one. But "claimed" is optional — the user might not claim immediately. Better: cycle completes when level 10 is *unlocked* (not claimed). Claiming is just a UI acknowledgment.

---

# Plan: 10-Level Reward Cycles

## Database (3 new tables)

### `reward_settings`
```
id, user_id, type ('standard'|'boss'), title, description,
is_active, sort_order, created_at, updated_at
```
RLS: user_id = auth.uid()

### `cycle_progress`
```
id, user_id, cycle_number, started_at, completed_at (nullable),
is_active, points_per_level (default 12)
```
RLS: user_id = auth.uid(). Only one row with `is_active = true` per user.

### `cycle_level_unlocks`
```
id, user_id, cycle_id (FK cycle_progress),
level (1-10), reward_type ('standard'|'boss'),
reward_setting_id (nullable), reward_title_snapshot,
reward_description_snapshot (nullable),
is_claimed, claimed_at (nullable), unlocked_at
```
RLS: user_id = auth.uid()

## Core Logic — `src/hooks/useCycleProgression.ts` (new)

**Pure functions:**
- `tierToPoints(tier)` — gold=3, silver=2, bronze=1, else 0
- `computeCycleProgress(entries, totalHabits, cycleStartDate)` — scans each day from cycle start to today, computes tier, sums points. Returns `{ totalPoints, currentLevel, levelProgress, pointsToNextLevel }`
- `selectRandomReward(activeRewards, lastAssignedId)` — picks from pool excluding last if pool > 1

**Hook: `useCycleProgress()`**
- Reads active cycle from `cycle_progress`
- Reads unlocks from `cycle_level_unlocks`
- Computes current level from habit entries
- Detects pending unlocks (computed level > max unlocked level)
- Returns: `{ cycleNumber, level, levelProgress, pointsToNextLevel, pendingUnlock, unlocks, bossReward }`

**Mutations:**
- `useCreateUnlock()` — inserts into `cycle_level_unlocks`, assigns random reward (or boss for level 10)
- `useClaimReward()` — sets `is_claimed = true, claimed_at = now()`
- `useCompleteCycle()` — marks cycle inactive, creates new cycle at cycle_number + 1

## Rewards Settings — `src/hooks/useRewardSettings.ts` (new)

CRUD hooks for `reward_settings` table:
- `useRewardSettings()` — fetch all for user
- `useAddReward()`, `useUpdateReward()`, `useDeleteReward()`, `useReorderRewards()`

## Settings UI — `src/pages/settings/ManageRewards.tsx` (new)

Same pattern as ManageHabits:
- Sticky header with back arrow
- **Standard Rewards** section: list with add/edit/delete/reorder, active toggle
- **Boss Reward** section: single item, edit title + description
- Brief explanation text

Add `'rewards'` to `SettingsView` in Settings.tsx with a Gift icon button.

## Today Page — Cycle Progress Card

Add a small card below `DayClearStatus` showing:
```
Level 3  ·  Cycle 1
████████░░░░  7 / 12
Next: Random standard reward
Boss: [boss reward title]
```

When a pending unlock is detected (user loads page or toggles habit that causes level-up):
- Show a Sheet/Dialog with the unlock reveal
- For levels 1-9: "Level X unlocked" + revealed reward
- For level 10: "Cycle complete" + boss reward
- Actions: "Claim" / "Claim later"

## Auto-initialization

First time `useCycleProgress` runs with no active cycle, auto-create cycle 1 starting today.

## Files Summary

| File | Action |
|------|--------|
| Migration SQL | Create 3 tables + RLS |
| `src/hooks/useCycleProgression.ts` | New — core progression logic + hook |
| `src/hooks/useRewardSettings.ts` | New — CRUD for reward settings |
| `src/pages/settings/ManageRewards.tsx` | New — rewards config UI |
| `src/pages/Settings.tsx` | Add 'rewards' view + menu button |
| `src/pages/Today.tsx` | Add cycle progress card + level-up sheet |

