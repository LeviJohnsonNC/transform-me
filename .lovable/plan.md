

## Plan: Add Streak, Level, and XP Progress Bar to Today Page

### Changes to `src/pages/Today.tsx` only

**1. Import `useGamification`** from `@/hooks/useGamification`

**2. Header subtitle (line 70-72)** — change from:
```
{completedCount} of {habits.length} habits
```
to:
```
Lv {level} · {completedCount} of {habits.length} habits
```

**3. Replace "Daily Progress" bar (lines 105-117)** — change label row to:
```
Daily Progress          Lv {level} → {level+1}  |  {xpInCurrentLevel}/{totalXpForNextLevel} XP
```
Bar fill based on `xpInCurrentLevel / totalXpForNextLevel * 100` instead of habit completion ratio.

**4. StreakRing already shows current streak** in the top-right corner (displays `streakData.current` days inside a ring). This already requires ALL habits completed per day (line 26 of StreakRing: `day.count === habitCount`). No changes needed here — the streak display is already present and correct.

### Files

| File | Change |
|------|--------|
| `src/pages/Today.tsx` | Import useGamification, update header subtitle, replace progress bar with XP bar |

Single file edit. No new components needed.

