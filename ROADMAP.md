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

- [x] **1. Make it a PWA** 🍽 — _home-screen app done; offline cache still open_
      Installs full screen with its own icon and resumes from the app switcher.
      A cold launch within an hour of leaving reopens the same tab, date and
      Records day/tier. **Still to do:** a service worker plus persisted query
      cache, so a cold start shows data instantly and works offline. Re-add the
      home-screen icon after deploying — iOS reads the tags when it is added.
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

- [x] **4. `QueryClient` defaults** 🍿 — _done_
- [x] **5. Error boundary** 🍿 — _done_
- [ ] **6. Settings sub-pages as real routes** 🍿
      `src/pages/Settings.tsx` switches eight views with `useState`, so the back
      gesture exits the app instead of going back a level.

---

## Tier 3 — The lifting data

- [x] **7. UTC vs local date mismatch** 🍿 — _done, see [Shipped](#shipped)_
- [x] **8. `getRating` shows the wrong next target** 🍿 — _done_
- [x] **9. Tests for `strengthStandards`** 🍽 — _done_
- [x] **Strength rating: lifts graded on the wrong standard** 🍽 — _done_
- [x] **Strength rating: read from the wrong set** 🍿 — _done_
- [x] **Strength rating: bodyweight brackets are cliffs** 🍽 — _done_
- [x] **Strength rating: "Prefer not to say" silently gets the male scale** 🍿 — _done_
- [x] **Strength rating: age curve** 🍿 — _done_
- [x] **Strength rating: L8–L10 sit above "elite"** 🍽 — _done_
- [x] **Strength rating: coverage** 🍽 — _done_
- [x] **Strength rating: label per-dumbbell inputs; cap reps for Epley** 🍿 — _done_
- [x] **Strength rating: pull-up, dip and push-up counts ignore bodyweight** 🍽 — _done_
- [x] **Strength rating: only the heaviest earlier set is kept** 🍿 — _done_

---

## Tier 4 — Hygiene

- [x] **10. Clear the ESLint errors, then make lint blocking** 🍿 — _done_
- [x] **11. Delete dead weight** 🍿 — _done_
- [x] **12. `UNIQUE (user_id, habit_id, date)` on `habit_entries`** 🍿 — _done_
- [x] **13. Make Data Management honest** 🍿 — _done_

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
- **A smaller JS bundle from deleting components.** Tested, and it is not
  there: removing 34 files and 25 dependencies moved the JS bundle by under
  2 KB, because Vite was already tree-shaking every unused component. The CSS
  dropped 77.6 KB to 55.2 KB, and install size and audit surface fell, but
  anyone expecting the ~780 KB JS figure to move should not bother.
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
  on near-black violet, tight geometry in place of capsules, an outrun
  horizon drawn in CSS, and habit tiles reworked as neon signs that ignite when
  completed. Replaces the frosted-glass violet theme; `backdrop-filter` is gone
  entirely. Also fixed the Lovable branding left in the page metadata. (#5)
- **Home-screen app** — the app had no manifest, no Apple web-app tags and no
  touch icon, so iOS treated the home-screen shortcut as a Safari bookmark and
  every tap reloaded it from scratch. It now launches standalone with a neon
  slash-over-horizon icon, and a cold launch (after iOS unloads it) reopens the
  tab, selected date and Records day/tier you left, if you left within the
  hour and the day has not rolled over. (#16)

- **Query defaults and an error boundary** — `staleTime` was 0, so every mount
  refetched; it is now 60s with a 30-minute `gcTime`, and query retries skip
  statuses a retry cannot fix (401, 403, 404 and friends) instead of making the
  user wait out ~7s of backoff for the same refusal. The roadmap's claim that
  there was "no retry" was only half right and is corrected below. Mutations
  stay un-retried on purpose. `ErrorBoundary` wraps the whole tree, so a render
  throw shows the message and a reload instead of a black screen, and a failed
  habit toggle now raises a toast — previously its only sign was the tile
  reverting, which is indistinguishable from a bug and was reported as one. (#13)

- **Corners squared off, auth panel veiled** — the clipped ("chamfered")
  corners are gone from every surface and button; panels now sit on the
  design system's 3px radius, and the `--chamfer*` tokens and clip-path
  classes are deleted rather than left unused. The sign-in panel uses a new
  `.surface-veiled` at 45% so the hero art reads through it. The figure in
  that art sits at a fixed height — the portrait image fills the viewport
  exactly, so `object-position` has no vertical effect — so the hero is
  scaled from its bottom edge to lift him behind the form. (#11)

- **Exercise art re-shot at 16:9** — the original set was 3:4 portrait, which
  forced a hard crop and a hand-tuned focal point per exercise. A replacement
  set drawn at 16:9 (1672×941) means the banner shows each frame whole, so
  `FOCUS_BY_SLUG` and `getExerciseArtFocus` are gone entirely. It also filled
  the one missing image: a plain barbell bench press, which `strengthStandards`
  rated but had no art for. A test now reads the dimensions of every shipped
  file, so a portrait image added later fails the suite rather than silently
  cropping. (#10)

- **Art wired in** — exercise banners on the Records cards (25 lifts, resolved by
  `src/lib/exerciseArt.ts`, which follows `STANDARDS_MAP`'s order), a full-bleed level-up
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

- **Tier 4 hygiene** — lint is a real CI gate now: the 6 errors are cleared
  (two vanished with the dead files, two `any`s took real types, the Tailwind
  config moved off `require()`, and the generated `previewAuthStorage.ts` is
  ignored rather than edited) and `continue-on-error` is gone. Deleted 34
  unreachable files and 25 unused dependencies — reachability computed from
  `main.tsx` and the tests, not by grepping importers, which is what caught
  `useStreaks` (a second, divergent streak implementation whose own comment
  claimed it was in use) and `useCoach` (speculative, never wired up).
  `habit_entries` gained a unique index on `(user_id, habit_id, date)`, and the
  toggle's insert became an upsert against it, so a double-tap race updates
  rather than duplicating or failing. Data Management no longer lies: export
  covers all 9 tables and pages past the 1000-row cap, and Import (which only
  ever alerted "would be implemented here") and Reset (which cleared a
  `localStorage` key that has not existed since the Lovable Cloud migration,
  so it silently did nothing behind a "cannot be undone" warning) are gone
  rather than faked. (#9)

- **Project is installable again** — `npm install` and `npm ci` work with no
  flags, after dropping `react-day-picker` (which pinned an incompatible
  `date-fns` and was used only by an unimported file). (#3)

- **Strength ratings graded the right lift, from the right set** — name
  matching was substring-based and first-match-wins, so "Bench Dips" was
  graded as a bench press (20 dips scored 0.2), dumbbell and leg curls on the
  barbell-curl table, front/hack/Smith squats as back squats, side planks as
  planks, and "Pullups" typed into a weight box was read as a rep count (+25
  lbs graded as 25 pull-ups). Rules now match whole words and each lists the
  variants it refuses; an unknown variant goes unrated instead of guessed.
  `unitFor` takes its unit from the standard, so the card and the rating can
  no longer disagree. The rating is now read from the highest estimated 1RM
  across every stored set on the card, not the heaviest weight of the first
  set, and a weighted set with no reps is not rated at all (it was read as a
  single, halving the level of a blank-reps 100×10).

- **Bodyweight no longer moves a strength rating in steps** — each bracket
  scored everyone up to its limit as if they weighed the limit, so a 166 lb
  lifter faced 198 lb numbers and one pound across a boundary moved a bench of
  300 from 6.75 to 6.11. Brackets are now points on the weight-class ladder and
  a lifter between two is scored between them. The open-ended top bracket was
  documented as 308 lbs, but scaling it back against the bracket below at the
  tables' own bodyweight exponent (median 0.59) puts it on the next class up —
  275 for men, 215 for women — so that is where it sits. Below the lightest
  bracket thresholds keep scaling down at 0.6; above the heaviest they hold.
  No rating goes down: the old steps always used the heavier end.

- **"Prefer not to say" chooses its own scale; age uses published tables** —
  "prefer not to say" was scored on the male table without a word (a 140 lb
  lifter's 135 bench: 2.7, against 6.4 on the female table). My Stats now asks
  which standards to score against and will not save without an answer, and a
  card without one says so rather than guessing. The answer lives in a new
  nullable `user_stats.rating_scale` (migration `20260925170000`); the read is
  `select('*')` and the column is only written for "other", so nothing breaks
  for anyone else before the migration runs. Age swapped a flat 0.5%/yr from
  30 for the McCulloch masters (40–90) and Foster teen (14–22) coefficients,
  with the teen trend extended below 14 because the app accepts ages from 10.
  A 315 squat at 198 lbs: 6.34 → 8.51 at 70, 4.91 → 5.37 at 17; 31–39 now
  score as open lifters, so 35 dips from 5.06 to 4.91.

- **Strength ratings: an honest top end, more lifts, clearer inputs** — (1) L10
  sat a level above "elite" (a 198 lb man's deadlift L10 was 3.8× bodyweight),
  so every table's old L9 became L10 and L8/L9 split the gap from L7; L1–L7 are
  unchanged and no rating goes down for it. (2) Standards for front squat,
  incline barbell bench, trap bar deadlift, leg press, lat pulldown, cable row
  and dumbbell row (derived from their parents at stated ratios), push-ups,
  inverted rows, side plank, and weighted pull-ups and dips, which are scored
  on bodyweight-plus-load and log the added weight; stiff-leg deadlifts are
  graded as RDLs. (3) The weight box says what to type: per dumbbell, both
  hands, or added. (4) Reps past 12 count as 12 in the 1RM estimate — Epley at
  30 reps doubled the weight — so very high-rep sets rate lower than before.

- **Bodyweight feats scale with bodyweight; the rating sees every set** —
  (1) Pull-ups, dips, push-ups and inverted rows asked the same count of a 150
  and a 250 lb lifter. Their tables now stand for a 180 lb man / 145 lb woman
  and move by the weight tables' own rule: strength ∝ bodyweight^0.6, so
  relative strength ∝ bodyweight^-0.4, applied to each count through Epley.
  Weighted pull-ups and dips use the same rule in place of a straight fraction
  of bodyweight, which had charged heavy lifters for the body they were
  already moving (+45×5 at 250 lbs: 4.82 → 6.70). Core endurance is left
  alone. (2) `previous_best` keeps only the heaviest earlier set and a card
  only sees its plan day, so the rating now reads `useLiftHistory`: every set
  of the exercise ever logged, and takes the strongest by estimated 1RM.

---

## Notes for future sessions

- **`retry` was never the missing default.** query-core resolves
  `config.retry ?? (isServer() ? 0 : 3)`, so queries in a browser already
  retried three times; `mutation.js` passes `retry: this.options.retry ?? 0`, so
  mutations never did. Only the mutation half of the original claim was true.
  Do not "fix" that by enabling mutation retry: `useToggleHabit` flips a habit
  rather than setting it, so retrying after a lost response flips it back off.
- **Audit before assuming.** The first theory about the streak problem was
  duplicate `habit_entries` rows. The data showed zero. Run
  `scripts/backup-and-audit.js` and read the numbers before planning a fix.
- **`bun install` does not work outside Lovable** — `bun.lock` pins packages to a
  private registry that is unreachable externally. Use `npm ci`.
- **Tests pin the timezone** to `America/Los_Angeles` (`vitest.config.ts`),
  because habit dates are `YYYY-MM-DD` strings parsed as *local* midnight.
