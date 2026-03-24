

# Plan: Replace Remaining Habits with Cycle Progress in DayClearStatus

## Recommendation

You're right — the "Remaining" habits list is redundant since unchecked habits are already visible below. Meanwhile, the cycle progress card (Level/Cycle with the progress bar) is a separate, easy-to-miss element.

**Merge the cycle progress info into the DayClearStatus card and remove the remaining habits list.** This puts the most important info — tier status AND level progress — in one card, and eliminates the separate cycle progress card.

## Changes

### `DayClearStatus.tsx`
- Remove `remainingHabits` prop and the entire remaining habits section (list, expand/collapse logic, imports for `ChevronDown`/`ChevronUp`/`getHabitIcon`)
- Add new props: `level`, `cycleNumber`, `levelProgress`, `pointsPerLevel`, `bossRewardTitle?`, `hasCycle`
- Below the existing tier progress segments, add a compact cycle progress row:
  - "Level 3 · Cycle 1" on the left, "7 / 12" on the right
  - Small progress bar underneath
  - Info popover icon retained for reward details

### `Today.tsx`
- Remove the standalone cycle progress card (lines 218-249)
- Pass cycle props to `DayClearStatus`: `level`, `cycleNumber`, `levelProgress`, `pointsPerLevel`, `bossRewardTitle`, `hasCycle`
- Remove `remainingHabits` prop from `DayClearStatus`

## Result

One unified card showing:
1. Current tier + "N more for X" messaging
2. Progress segments
3. Level/Cycle progress bar

No separate cards competing for attention. No redundant remaining habits list.

## Files

| File | Change |
|------|--------|
| `src/components/DayClearStatus.tsx` | Remove remaining habits, add cycle progress section |
| `src/pages/Today.tsx` | Remove standalone cycle card, pass cycle props to DayClearStatus |

