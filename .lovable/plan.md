# Plan: Move from external Supabase to Lovable Cloud

## Short answer

Yes, this is doable — but not entirely by me alone. Swapping which backend the project is connected to is a platform action you trigger from the Lovable UI; I can't disconnect the external Supabase project myself. Everything else — recreating the schema, functions, triggers, policies, storage bucket, and copying the data across — I can do.

The safest sequencing is: I prepare everything first, you flip the connection, then I rebuild and reload into the new backend.

## What has to move

| Thing | Size / notes |
|---|---|
| Tables | 19 tables in `public` |
| Auth users | 18 users |
| Habit data | 10 habits, 384 entries |
| Workout data | 5 plans, 92 exercises, 112 records |
| Rewards / cycles | 11 reward settings, 4 unlocks, 19,550 `cycle_progress` rows (only 1 active — the rest is dead duplicate data from an old bug) |
| Other datasets | 454 magic items, 25 sample salespeople + profiles, 18 profiles, matches, quiz answers, 5 player characters |
| Storage | `magic-item-images-v2` bucket, 202 files |
| Edge functions | none — nothing to port |
| DB functions / triggers | 6 functions, 16 triggers |

## The one real caveat: auth users

Passwords cannot be exported from a Supabase project through the API — the hashes live in `auth.users`, which is not readable or writable via the normal client. Two options:

- **A. Fresh sign-ups (recommended for this app).** Data rows are keyed by `user_id`. I keep the same UUIDs on all the data, and each person signs up again on the new backend with the same email; I then re-point their rows to the new UUID. With 18 users — and realistically one active user (you) — this is trivial. Zero risk of a broken auth state.
- **B. Ask Supabase support for a hash export** and re-import. Slower, involves a support ticket, and is only worth it if all 18 accounts are real people who must not be disturbed.

The plan below assumes A unless you say otherwise.

## Steps

**Step 1 — Snapshot the current data (me).**
I dump every table to JSON files kept outside the app source, plus a manifest of the 202 storage objects with their public URLs. Nothing in the app changes; this is purely a backup.

**Step 2 — Prune the junk first (me).**
Delete the ~19,549 inactive `cycle_progress` duplicate rows so we migrate a clean dataset instead of carrying the old bug's debris. This is safe — the active cycle and all unlocks are preserved.

**Step 3 — You enable Lovable Cloud.**
You disconnect the external Supabase and enable Lovable Cloud in project settings. This regenerates `.env` and the generated Supabase client to point at the new project. The app will be temporarily empty of data — expected.

**Step 4 — Rebuild the schema (me).**
One consolidated migration recreating all 19 tables, the `user_role` enum, the 6 database functions, the 16 triggers, all grants, and all RLS policies exactly as they are today. Consolidated rather than replaying 19 historical migrations, so the new project starts clean.

**Step 5 — Recreate storage (me).**
Create the `magic-item-images-v2` public bucket with matching policies and re-upload the 202 images from the snapshot, preserving the same paths so `image_path` values in `magic_items` keep working.

**Step 6 — Reload the data (me).**
Insert the snapshot back in dependency order (profiles → habits → entries, plans → exercises → records, cycles → unlocks, etc.), preserving all IDs and timestamps.

**Step 7 — Re-point your user (me, after you sign up).**
You create your account on the new backend; I remap the `user_id` on your habits, entries, workout data, stats, rewards and cycles to the new UUID.

**Step 8 — Verify (me).**
Row-count comparison table for every table, a run through Today / History / Records / Settings in a headless browser, security linter pass, and a check that the reward cycle and strength ratings still render.

## Risk and rollback

The external Supabase project is never deleted during this — it stays live and untouched as a rollback target. If anything goes wrong we reconnect it and lose nothing. Expect a short window between Steps 3 and 6 where the app is up but empty.

## What I need from you

1. Confirm option **A** (fresh sign-ups) for the 18 auth users, or ask for the hash-export route.
2. Confirm the ~19.5k dead `cycle_progress` rows can be deleted rather than migrated.
3. Be ready to flip the connection at Step 3 and sign up at Step 7.
