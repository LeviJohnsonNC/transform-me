# Transform Me — Roadmap

Working list, roughly in priority order. Tick items off as they land.

_Last updated: 2026-09-23_

---

## Why this order

The app is used on **21% of days** (83 days logged across a 399-day span). Three
jobs matter — keeping the chain, the reward cycle, and the lifting records — but
the same thing blocks all three: **the app has no way to reach you.** No
notifications, no email, not installable to a home screen. It only works for
someone who already remembered to use it, which is supposed to be its job.

Several real bugs have been fixed (see [Shipped](#shipped)). None of them were
why usage lapsed. So this list is mostly about reachability, and a fair amount
of otherwise-tempting work sits [below the line](#below-the-line).

Effort: 🍿 under an hour · 🍽 a few hours · 🏔 a weekend

---

## Experiment in flight

- [x] **0. Daily iOS reminder, set by hand** 🍿 — _done 2026-09-23_
      A repeating Shortcuts automation / calendar event pointing at the app. No
      code. The point is to find out whether a nudge actually changes behaviour
      **before** spending a weekend building notification infrastructure.

**Baseline at the time it was set**, so the result is measurable rather than a
vibe:

| Metric | Value on 2026-09-23 |
| --- | --- |
| `habit_entries` rows | 397 |
| Days with any entry | 83 |
| Span of history | 399 days |
| Logging rate | 21% |
| Rows per logged day | 4.8 |

**Check back around 2026-09-30.** Re-run `scripts/backup-and-audit.js` and
compare — a week of reminders should add ~7 logged days if it is working.

**Decision rule:**
- Rate moves up meaningfully → Tier 1 is validated, the weekend is worth it.
- Rate does not move → reminders are *not* the blocker. Stop, and re-plan before
  building anything in Tier 1.

---

## Tier 1 — Make the app reachable

The only tier that touches the 21%. Gated on the experiment above.

- [ ] **1. Make it a PWA** 🍽
      Manifest, icons, service worker, theme colour. Worth it on its own: one tap
      from the home screen, full screen, no browser chrome. Also a hard
      prerequisite for the next item.
- [ ] **2. Web push on iOS** 🏔
      iOS only allows web push for a PWA **added to the home screen** (16.4+), so
      item 1 must land first. Needs a `push_subscriptions` table, a permission
      prompt triggered by a real tap, and a scheduled sender. Make it smart —
      only fire when today is not already logged; the app already knows.
      **Open question, resolve before committing the weekend:** this needs a
      server-side scheduled job. The project has no edge functions today, and
      what Lovable Cloud exposes for scheduling is unverified.
- [ ] **3. Email reminder as a fallback** 🍽
      Only if item 2 proves painful. Same scheduled job, sent to the inbox.
      Sidesteps every iOS constraint.

---

## Tier 2 — The daily loop

Small, independent, noticeable. Pick one off any evening.

- [ ] **4. `QueryClient` defaults** 🍿
      `src/App.tsx` creates a bare `QueryClient`: no `staleTime`, no `retry`. Every
      navigation refetches everything and one dropped packet is an unretried
      failure. Cheapest perceived-speed win available.
- [ ] **5. Error boundary** 🍿
      A throw anywhere blanks the app with no way to report it.
- [ ] **6. Settings sub-pages as real routes** 🍿
      `src/pages/Settings.tsx` switches eight views with `useState`, so the back
      gesture exits the app instead of going back a level.

---

## Tier 3 — The lifting data

- [x] **7. UTC vs local date mismatch** 🍿 — _done, see [Shipped](#shipped)_
- [x] **8. `getRating` shows the wrong next target** 🍿 — _done_
- [x] **9. Tests for `strengthStandards`** 🍽 — _done_

---

## Tier 4 — Hygiene

No urgency, all low risk.

- [ ] **10. Clear the 6 ESLint errors, then make lint blocking** 🍿
      In `components/ui/command.tsx`, `components/ui/textarea.tsx`,
      `hooks/useHabits.ts`, `integrations/supabase/previewAuthStorage.ts`
      (generated — prefer an ignore over an edit), `pages/Records.tsx`, and
      `tailwind.config.ts`. CI runs lint with `continue-on-error`, which reports
      the step **green** regardless — so it is currently theatre. Removing that
      line once the errors are gone makes it a real gate.
- [ ] **11. Delete dead weight** 🍿
      31 of 47 `components/ui/*` files have no importer outside that directory,
      plus unused deps (`recharts`, `embla-carousel-react`, `next-themes`,
      `vaul`, `cmdk`, `input-otp`, `zod`, `react-hook-form`). Bundle is ~780 KB.
- [ ] **12. `UNIQUE (user_id, habit_id, date)` on `habit_entries`** 🍿
      Purely preventative — the audit found no duplicates. But `useToggleHabit`
      does a read-then-write, and `cycle_progress` already accumulated ~19.5k
      duplicate rows from that same pattern before it was patched.
- [ ] **13. Make Data Management honest** 🍿
      `pages/settings/DataManagement.tsx`: Import parses the file then alerts
      that import "would be implemented here"; Reset warns it cannot be undone,
      then removes a `localStorage` key that has not existed since the Lovable
      Cloud migration, so it does nothing. Export covers 2 of 9 tables. Fix or
      remove — right now the UI lies.

---

## Tier 5 — Has a date, but not soon

- [ ] **14. `habit_entries` 1000-row cap** — ~1.7 years out
      `useHabitEntries` fetches unbounded and PostgREST silently truncates at
      1000 rows. At the observed rate (~363 rows/year) that is roughly 2028.
      Paginate before then, or it will quietly drop the oldest history from every
      streak and tier calculation with no error.
- [ ] **15. Multi-tenancy** — before user #2
      `workout_plans.day_number` is globally `UNIQUE`, not per-user, so a second
      user cannot create a Day 1. `user_id` is also nullable across every table
      while policies read `auth.uid() = user_id`, so a NULL row is invisible to
      everyone yet still holds its `day_number`.

---

## Below the line

Deliberately not doing, and why. Revisit if the reasoning changes.

- **Forgiveness / streak-freeze mechanics.** Restarting after a lapse is already
  easy; forgetting entirely is the problem. This would solve a problem that is
  not there.
- **Hardening the reward cycle.** It is the most fragile code in the app — the
  level-up effect in `pages/Today.tsx` has an incomplete dependency array and
  can fire before rewards load, and there is no `UNIQUE (cycle_id, level)` — but
  whether the cycle actually motivates anyone is unproven. Revisit once
  reminders prove out and a full cycle has been run.
- **`computeCycleProgress` counting rows rather than distinct habits.** Already
  filters by the active set, so it is weekend-correct, and the audit found no
  inflation. Same reasoning as above.
- **End-to-end tests.** A lot of machinery for a single-user habit tracker, and
  less protective than the unit tests already in place.

---

## Shipped

- **Backup and audit** — `scripts/backup-and-audit.js`, a read-only browser
  console script needing no database access. Pulls all 9 tables and reports data
  health. Re-run it any time; it is how the baseline above was measured. (#1)
- **Vitest and CI** — 63 tests, plus `.github/workflows/ci.yml` running
  typecheck, test and build on every PR. (#1, #3)
- **`habitMath` extracted** from the Zustand store into `src/lib/habitMath.ts`,
  where it is testable. (#1)
- **Three streak/tier bugs fixed** — weekends no longer break the streak,
  longest streak scans all history rather than 30 days, and `completedCount` can
  no longer exceed `totalCount`. All three shared one cause: the maths took a
  habit *count* when the set of habits that counts varies by day. (#2)
- **Toggle lockup fixed** — every habit card shared one mutation's `isPending`,
  so a single slow save froze the whole grid. Now gated per habit. (#3)
- **Synthwave visual direction** — Chakra Petch over Sora, magenta against cyan
  on near-black violet, chamfered geometry in place of capsules, an outrun
  horizon drawn in CSS, and habit tiles reworked as neon signs that ignite when
  completed. Replaces the frosted-glass violet theme; `backdrop-filter` is gone
  entirely. Also fixed the Lovable branding left in the page metadata. (#5)
- **Art wired in** — exercise banners on the Records cards (25 lifts, resolved by
  `src/lib/exerciseArt.ts`, which mirrors `STANDARDS_MAP` so the art and the
  strength rating always agree about which lift it is), a full-bleed level-up
  sheet, a History empty state, and the auth hero moved out from behind the form
  to where it can actually be seen. (#6)

- **The lifting data is no longer quietly wrong** — three fixes that had to go
  together. (1) `useWorkoutRecords` keyed the day off `toISOString()`, the UTC
  day, while everything else in the app uses the local one; west of UTC an
  evening lift was filed under tomorrow, splitting the day's row and letting
  its own "previous best" lookup count sets logged an hour earlier.
  `src/lib/dates.ts` is now the single place that answers "what day is it".
  (2) `getRating` scored the lift against *age-adjusted* thresholds but
  reported the **unadjusted** next target: at 50, a bench press showed 310 lbs
  to chase when 279 was the number that actually levels you up. (3) The next
  target had never been rendered at all, so `StrengthRating` now shows it.
  `strengthStandards` went from zero coverage to 21 tests, and `dates` has 6.
  The age-adjustment regression test was confirmed to fail without its fix. (#8)

- **Project is installable again** — `npm install` and `npm ci` work with no
  flags, after dropping `react-day-picker` (which pinned an incompatible
  `date-fns` and was used only by an unimported file). (#3)

---

## Notes for future sessions

- **Audit before assuming.** The first theory about the streak problem was
  duplicate `habit_entries` rows. The data showed zero. Run
  `scripts/backup-and-audit.js` and read the numbers before planning a fix.
- **`bun install` does not work outside Lovable** — `bun.lock` pins packages to a
  private registry that is unreachable externally. Use `npm ci`.
- **Tests pin the timezone** to `America/Los_Angeles` (`vitest.config.ts`),
  because habit dates are `YYYY-MM-DD` strings parsed as *local* midnight.
