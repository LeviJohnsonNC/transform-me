

# Diagnosis: Level/Cycle Progress Not Showing

## What's Happening

The DayClearStatus component already has the Level/Cycle progress section built in — it renders below the tier progress segments. But it's gated behind `hasCycle`, which is `false` in your screenshot because no active `cycle_progress` row exists for your user.

The auto-initialization code in Today.tsx (lines 60-64) should create one automatically, but it's likely failing silently — the mutation error isn't caught or displayed.

## Fix

1. **Add error handling to the auto-init effect** in `Today.tsx` so we can see why it fails
2. **Add a console log or toast** when cycle init fails
3. **Check if the issue is auth-related** — the RLS policy requires `auth.uid() = user_id`, so if the user isn't authenticated, the insert will fail silently

The fix is small — add `.onError` handling to the `initCycle.mutate()` call and potentially add a manual "Initialize" fallback button if the auto-init keeps failing.

## Files

| File | Change |
|------|--------|
| `src/pages/Today.tsx` | Add error callback to `initCycle.mutate()` for debugging, and ensure the effect dependencies are correct |

