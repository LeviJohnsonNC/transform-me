

# Critique

The instruction is detailed and well-thought-out, but has some issues:

1. **Hardcoded thresholds won't scale.** The tiers are defined for exactly 10 habits (7-8 = Bronze, 9 = Silver, 10 = Gold). But the user can add/remove habits. The thresholds should be percentage-based: Gold = 100%, Silver = 90%+, Bronze = 70%+, Partial = 50%+, Missed = below 50%. This preserves the intent while working with any habit count.

2. **No new database table needed.** The instruction suggests storing tier data per day, but tiers are a pure function of `completed_count / total_habits`. We already have `habit_entries` — the tier is derived, not stored. Adding a table would create sync issues when habits are toggled retroactively.

3. **The "Perfect Day" block at the bottom of Today.tsx already exists** — it needs to be replaced, not just ignored.

4. **StreakRing in the header should stay.** It shows streak days (all habits completed). This aligns perfectly with the Gold Day concept — a streak is consecutive Gold days. No change needed there.

5. **History page change is significant.** Adding a daily tier row below the habit grid (or above it) requires a summary row per day. The current grid is habits × days. Adding per-day tier indicators means either a summary row at the bottom or colored column headers.

6. **The useGamificationEnabled export** returns `false` — likely dead code. Can remove.

---

# Plan: Replace XP with Bronze/Silver/Gold Day-Clear System

## 1. Core Logic — Rewrite `useGamification.ts`

Replace XP/level logic with tier computation. Export pure functions and a hook:

```ts
type DayTier = 'gold' | 'silver' | 'bronze' | 'partial' | 'missed';

function getDayTier(completed: number, total: number): DayTier
// Gold = 100%, Silver >= 90%, Bronze >= 70%, Partial >= 50%, Missed < 50%

function getNextTierInfo(completed: number, total: number):
  { currentTier, nextTier, habitsToNext, isMaxTier }
```

The hook `useDayTier(date)` returns: `{ completed, total, tier, nextTier, habitsToNext, isMaxTier }`.

Also export `useDayTierForDate(entries, habits, date)` as a pure computation for use in History without extra queries.

Remove all XP/level exports (`calculateDayXP`, `getLevelFromXP`, `GamificationData`, `useGamificationEnabled`).

## 2. TierBadge Component — New `src/components/TierBadge.tsx`

Reusable pill/badge showing tier with distinct colors:
- **Gold**: amber/yellow gradient, warm glow
- **Silver**: cool gray/slate with slight shine
- **Bronze**: warm brown/copper tone
- **Partial**: muted, subdued
- **Missed**: very dim, low contrast

Props: `tier: DayTier`, `size?: 'sm' | 'md'`. Used in Today page, History page, and future views.

## 3. DayClearStatus Component — New `src/components/DayClearStatus.tsx`

Replaces the XP progress bar (lines 107-119) and the "Perfect Day" celebration block (lines 129-137) on Today.tsx.

Card layout:
- Completion count: "8 / 10 complete"
- Current tier badge (TierBadge)
- Main label: "Bronze Day secured" / "Gold Day complete"
- Secondary label: "2 more for Silver" (or "Full clear. Day closed." for Gold)
- Subtle progress segments showing threshold markers for Bronze/Silver/Gold

Props: `completed: number`, `total: number`.

## 4. Update Today.tsx

- Remove `useGamification` import
- Import `useDayTier` and `DayClearStatus`
- Header subtitle: replace `Lv {level} · {completedCount} of {habits.length} habits` with `{completedCount} of {habits.length} · {tierLabel}`
- Replace XP progress bar with `<DayClearStatus />`
- Remove the "Perfect Day" celebration block (DayClearStatus handles Gold state)

## 5. Update History.tsx

Add a summary row at the bottom of the calendar grid showing the day tier for each column (date). Each cell gets a small colored dot or TierBadge based on the day's tier. Update the legend to show Gold/Silver/Bronze/Partial/Missed colors instead of just Completed/Not completed.

## Files Summary

| File | Change |
|------|--------|
| `src/hooks/useGamification.ts` | Full rewrite: tier logic replaces XP/levels |
| `src/components/TierBadge.tsx` | New — reusable tier badge |
| `src/components/DayClearStatus.tsx` | New — day-clear status card |
| `src/pages/Today.tsx` | Use tier system, remove XP bar, remove Perfect Day block |
| `src/pages/History.tsx` | Add daily tier summary row and update legend |

No database changes. No migration needed. Pure client-side computation from existing data.

