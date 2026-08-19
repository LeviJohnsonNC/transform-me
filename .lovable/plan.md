# Plan: Move from external Supabase to Lovable Cloud

## Short answer

Yes, this is doable — but not entirely by me alone. Swapping which backend the project is connected to is a platform action you trigger from the Lovable UI; I can't disconnect the external Supabase project myself. Everything else — recreating the schema, functions, triggers, policies, and copying the data across — I can do.

The safest sequencing is: I snapshot first, you flip the connection, then I rebuild and reload into the new backend.

## Scope: only what Transform Me uses

The external database is shared with other projects. Only these 9 tables move:

| Table | Rows |
|---|---|---|
| `habits` | 10 |
| `habit_entries` | 384 |
| `workout_plans` | 5 |
| `workout_exercises` | 92 |
| `workout_records` | 112 |
| `reward_settings` | 11 |
| `cycle_progress` | 19,550 (only 1 active — rest is dead duplicate data from an old bug) |
| `cycle_level_unlocks` | 4 |
| `user_stats` | 1 |

**Left behind entirely:** `magic_items`, `player_characters`, `suggestions`, `votes`, `matches`, `sample_salespeople`, `sample_salesperson_profiles`, `profiles`, `client_profiles`, `salesperson_profiles`, `client_quiz_answers`, the `user_role` enum, the `magic-item-images-v2` storage bucket and its 202 files, and the sales/suggestion database functions and triggers. None of these are referenced anywhere in this codebase.

**Also not needed:** no edge functions exist. Storage is unused by this app, so no bucket gets created.

## Auth users

Only your account matters here — every Transform Me table is keyed by `user_id` and all live rows belong to one user. Password hashes can't be exported from Supabase via the API, so the clean path is: you sign up fresh on the new backend, and I re-point every migrated row from the old UUID to your new one. The other 17 accounts in the external project belong to the other apps and stay behind.

## Steps

**Step 1 — Snapshot (me).** Dump the 9 tables to JSON outside the app source. Purely a backup; nothing in the app changes.

**Step 2 — Prune (me).** Delete the ~19,549 inactive `cycle_progress` duplicates so we migrate clean data instead of the old bug's debris. Active cycle and all unlocks preserved.

**Step 3 — You enable Lovable Cloud.**

This is the part I can't do for you. The connection lives in the project's Connectors/Integrations area, not in the app code itself.

- **Desktop:** click the **project name/logo at the top-left** → **Settings** → **Customization** → **Connectors**. Or open the command palette with **Cmd+K** (Mac) / **Ctrl+K** (Windows/Linux) and type **"Connectors"** or **"Supabase"**. Look for the active Supabase connection, disconnect it, then enable **Lovable Cloud** (or add the Lovable Cloud Supabase connector).
- **Mobile:** make sure you're in **Chat mode** (not Preview mode), tap the **... menu at the bottom-right** → **Settings** → **Customization** → **Connectors**. Look for the active Supabase connection, disconnect it, then enable **Lovable Cloud**.

After you switch, the app will briefly be up but empty — that's expected. The platform will regenerate `.env` and the Supabase client. Once it shows the new connection is active, tell me and I'll proceed.

**Step 4 — Rebuild schema (me).** One consolidated migration: the 9 tables, their grants, RLS policies, the `updated_at` trigger function, and the single-active-cycle unique index. No historical migration replay — the new project starts clean.

**Step 5 — Reload data (me).** Insert the snapshot in dependency order (habits → entries, plans → exercises → records, reward settings → cycles → unlocks, stats), preserving IDs and timestamps.

**Step 6 — Re-point your user (me).** After you sign up, remap `user_id` on every migrated row to your new UUID.

**Step 7 — Verify (me).** Row-count comparison per table, a headless run through Today / History / Records / Settings, and a security linter pass. Confirm the reward cycle level, streaks, and strength ratings all still render the same numbers as today.

## Risk and rollback

The external Supabase project is never deleted and stays untouched as a rollback target — the other apps sharing it are unaffected since we only read from it. If anything goes wrong, reconnect it and nothing is lost.

## What I need from you

1. Confirm the ~19.5k dead `cycle_progress` rows can be dropped rather than migrated.
2. Follow the Step 3 instructions above to disconnect the external Supabase and enable Lovable Cloud, then tell me when it's done.
3. Be ready to sign up on the new backend at Step 6.
