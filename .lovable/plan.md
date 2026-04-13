

# Plan: Reward History & Redemption Page

## Problem
Unlocked rewards are stored in `cycle_level_unlocks` but there's no UI to browse them or mark them as claimed/redeemed after the initial popup is dismissed.

## Solution
Add a "My Rewards" settings subpage that lists all unlocked rewards across cycles, grouped by cycle, with the ability to mark unclaimed ones as redeemed.

## Changes

### 1. New file: `src/pages/settings/MyRewards.tsx`

- Query `cycle_level_unlocks` ordered by `unlocked_at DESC`
- Query `cycle_progress` to get cycle numbers for grouping
- Display rewards grouped by cycle (e.g. "Cycle 1"), most recent first
- Each reward card shows:
  - Level number + reward type badge (standard/boss)
  - `reward_title_snapshot` and `reward_description_snapshot`
  - Unlock date
  - Status: "Claimed" (green check) or a "Mark as Redeemed" button
- "Mark as Redeemed" calls `useClaimReward` mutation (already exists)
- Empty state if no unlocks yet

### 2. Update `src/pages/Settings.tsx`

- Add a "My Rewards" menu item (with a Trophy icon) above or below "Manage Rewards"
- Route to the new `MyRewards` component

### 3. No database changes needed
`cycle_level_unlocks` already has `is_claimed`, `claimed_at`, and all snapshot fields.

## Files

| File | Change |
|------|--------|
| `src/pages/settings/MyRewards.tsx` | New — reward history list with claim buttons |
| `src/pages/Settings.tsx` | Add "My Rewards" menu entry |

