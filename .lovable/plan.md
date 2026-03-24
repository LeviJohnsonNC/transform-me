
The issue is now clear: the level UI is not missing from the component — it is being hidden because `hasCycle` never becomes true in practice.

What I found:
- `DayClearStatus` already renders `Level X · Cycle Y` and the progress bar, but only when `hasCycle` is true.
- `Today.tsx` auto-initializes a cycle whenever `!cycle.hasCycle`.
- `useCycleProgress()` fetches the active cycle with `.eq('is_active', true).maybeSingle()`.
- Your logs show the app repeatedly saying “No active cycle found, initializing...” and “Cycle initialized successfully”.
- The database confirms the real bug: one user now has about 19,447 active rows in `cycle_progress`.

So the core problem is:
1. The query expects exactly one active cycle.
2. The app keeps creating new active cycles.
3. Once duplicates exist, `maybeSingle()` is the wrong fetch strategy and the hook can no longer resolve a valid cycle.
4. That leaves `hasCycle = false`, so the level/progress section never renders.

Best build plan

1. Make active-cycle fetching resilient
- Update `useCycleProgress()` to fetch the latest active cycle deterministically instead of using `maybeSingle()`.
- Use ordering (newest first) and limit to 1 so the UI can still work even if duplicate rows exist.
- Treat this as a defensive client fix, not the full data fix.

2. Stop the infinite auto-create loop
- Tighten the auto-init effect in `Today.tsx` so it only runs when we truly know there is no cycle, not while the query is in an ambiguous/error state.
- Add a guard so initialization only happens once per mount/session.
- Do not keep retrying just because the query failed to return a single row.

3. Surface cycle query failures explicitly
- Extend `useCycleProgress()` to expose query error state.
- In `Today.tsx`, avoid “no cycle” behavior when the real state is “cycle query failed”.
- Optionally show a subtle fallback message/toast in error cases instead of silently initializing again.

4. Repair the test database state
- Add a migration or SQL cleanup step that marks older duplicate active cycles inactive, keeping only the newest active cycle per user.
- This is important because even after the client fix, the current polluted data will keep causing weird behavior elsewhere.
- Since this is destructive data cleanup, I would preserve the newest row and deactivate the rest rather than delete them.

5. Add a DB-level safety net
- Add a partial unique index on `cycle_progress` so each user can only have one active cycle:
  `unique (user_id) where is_active = true`
- This prevents the bug from ever returning, even if the client retries.

6. Verify all cycle transitions against the new constraint
- Review:
  - initial cycle creation
  - level 10 rollover
  - cycle completion + new cycle creation
- Ensure the old cycle is deactivated before the new active one is inserted.
- If needed, do both operations in a safer order to avoid temporary duplicate-active states.

Files / areas to update
- `src/hooks/useCycleProgression.ts`
  - replace `maybeSingle()` active-cycle lookup
  - expose query error state if needed
- `src/pages/Today.tsx`
  - fix auto-init guards so it does not repeatedly create cycles
- `supabase/migrations/*`
  - data cleanup for duplicate active cycles
  - unique partial index for one active cycle per user

Expected result
- The Today card will finally show:
  - current day tier status
  - `Level N · Cycle M`
  - progress like `3 / 12`
  - progress bar toward the next level
- Refreshing or opening a new tab will no longer create duplicate cycles.
- Future users will be protected from the same bug.

Technical note
This is not an RLS problem. Your inserts are succeeding. The problem is duplicate active-cycle creation combined with a fetch strategy (`maybeSingle`) that breaks once duplicates exist.
