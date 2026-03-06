

## Critique

The XP system design is clean. A few considerations:

1. **The existing `useGamification.ts` uses a flat `completedEntries.length * 10` formula** — this needs a complete rewrite, not a patch. The new system is per-day, tiered based on completion percentage, not per-entry.

2. **XP calculation must be derived from existing `habit_entries` data** — no new DB table needed. We group entries by date, count completed habits per day, and compute XP for each day. This is a pure computation over data already fetched by `useHabitEntries()`.

3. **"Uncomplete" handling is automatic** — since we recalculate XP from the current state of all entries every time, toggling a habit off just changes the day's completion count, which changes the XP. No need to track deltas.

4. **The XP-per-day calculation depends on knowing `n` (total habits) at that point in time** — but habits can be added/deleted over time. Using the *current* active habit count for all historical days is the simplest approach and matches user expectations (they can't retroactively earn more XP by reducing habits). This is a reasonable trade-off.

5. **Level calculation requires cumulative XP thresholds** — Level 1 needs 100, Level 2 needs 225 total (100+125), Level 3 needs 375 total (100+125+150), etc. The formula for total XP needed to reach level L is: `sum from i=1 to L of (100 + (i-1)*25)` = `L*100 + 25*L*(L-1)/2`.

---

## Plan

### Rewrite `src/hooks/useGamification.ts`

**Core XP calculation function** `calculateDayXP(completedCount: number, totalHabits: number) → number`:
- If `completedCount === 0` → 0 XP
- Start with `+10` (at least 1 habit)
- If `completedCount / totalHabits >= 0.33` → `+15`
- If `completedCount / totalHabits >= 0.67` → `+25`
- If `completedCount / totalHabits >= 1.0` → `+50`
- These are cumulative bonuses, so a perfect day = 10 + 15 + 25 + 50 = **100 XP**

**Total XP**: Group all `habit_entries` by date, count completed per day, sum `calculateDayXP()` across all days.

**Level from XP**: Iterate levels starting at 1, subtracting each level's XP requirement `(100 + (level-1)*25)` until remaining XP is insufficient. Return current level, XP progress within that level, and XP needed for next level.

**Hook return shape** (keep compatible with existing interface):
```ts
{ level, xp (total), xpInCurrentLevel, xpToNextLevel, totalXpForNextLevel }
```

Strip out the placeholder achievements/rewards/badges for now — keep the interface lean. Export `calculateDayXP` and `getLevelFromXP` as pure functions for testability.

### Files

| File | Change |
|------|--------|
| `src/hooks/useGamification.ts` | Full rewrite with new XP/level formulas |

No DB changes. No UI changes. Single file edit.

