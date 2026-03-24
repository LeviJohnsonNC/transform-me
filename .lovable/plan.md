

# Critique

1. **Most of this already exists.** The `DayClearStatus` component already shows current tier, completion count, next tier target, and "N more for X" messaging. The instruction is largely describing what's already built — with two meaningful additions: (a) listing remaining habits by name, and (b) time-of-day messaging variants.

2. **The "Close the Day" framing is misleading.** There's no actual "close" action — the day just ends at midnight. This is purely a display enhancement to the existing `DayClearStatus` card, not a new system.

3. **Time-of-day messaging adds minimal value for significant complexity.** Four time bands with different copy variants means maintaining a matrix of tier × time messages. The ROI is low — the user checks the app when they check it. A simpler approach: just show the remaining habits list and the "N more for X" message. The message itself already creates the right tension.

4. **"Best next move" logic is unnecessary.** Since all remaining habits are equal (count-based, not weighted), "any 2 remaining habits" is always the answer. No prioritization logic needed.

5. **The remaining habits list is the only genuinely new feature.** Everything else is refinement of existing `DayClearStatus`.

---

# Plan: Enhance DayClearStatus with Remaining Habits

## What Changes

Enhance the existing `DayClearStatus` component to show remaining (incomplete) habits by name, with expand/collapse when the list is long. No new component — just extend what's there.

## Changes to `DayClearStatus.tsx`

- Accept new props: `remainingHabits: { name: string; icon: string }[]`
- Below the existing tier/progress UI, add a collapsible remaining habits list
- When Gold: hide the list, show "Full clear. Day closed."
- When not Gold and ≤4 remaining: show all inline
- When not Gold and >4 remaining: show first 3 with "Show N more" toggle
- Each habit rendered as a small row with icon + name
- Subtle styling — not a separate card, just an extension of the existing one

## Changes to `Today.tsx`

- Compute remaining habits: filter `activeHabits` to those without a completed entry
- Pass `remainingHabits` to `DayClearStatus`

## Files

| File | Change |
|------|--------|
| `src/components/DayClearStatus.tsx` | Add remaining habits list with collapse logic |
| `src/pages/Today.tsx` | Compute and pass remaining habits |

No database changes. No new hooks. No new components.

