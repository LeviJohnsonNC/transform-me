/* ===========================================================================
 * Transform Me — Backup & Data Audit
 * ===========================================================================
 *
 * READ-ONLY. This script issues GET requests only. It never inserts, updates
 * or deletes anything. You can run it as many times as you like.
 *
 * WHAT IT DOES
 *   1. Downloads every row you own from all 9 tables as a single JSON backup.
 *   2. Prints a damage report for the known duplicate-row bug: how many
 *      duplicate habit entries exist, which days they inflate, and how much
 *      your streak / cycle level are overstated as a result.
 *
 * HOW TO RUN
 *   1. Open your live app in a browser and make sure you are SIGNED IN.
 *   2. Open DevTools (F12 / Cmd-Opt-I) and click the "Console" tab.
 *   3. Chrome may ask you to type "allow pasting" before it accepts a paste.
 *   4. Paste this whole file, press Enter, and wait a few seconds.
 *
 * OUTPUT
 *   - A file `transform-me-backup-YYYY-MM-DD.json` downloads automatically.
 *   - The audit prints to the console. Copy it out and send it over.
 *   - Both are also left on `window.__transformAudit` for re-inspection.
 * ========================================================================= */

(async () => {
  'use strict';

  // The publishable (anon) key. Not a secret — it already ships inside the
  // app's JS bundle and is committed in .env. RLS is what protects your rows.
  const PUBLISHABLE_KEY = 'sb_publishable_crma2wP0a_F5Sq_YXJRpGA_zr2rDSiX';

  // Each table's stable sort column, used to paginate past the 1000-row cap.
  // Note user_stats is keyed on user_id — it has no `id` column.
  const TABLES = {
    habits: 'id',
    habit_entries: 'id',
    workout_plans: 'id',
    workout_exercises: 'id',
    workout_records: 'id',
    reward_settings: 'id',
    cycle_progress: 'id',
    cycle_level_unlocks: 'id',
    user_stats: 'user_id',
  };

  const PAGE_SIZE = 1000;

  // --- Locate the logged-in session --------------------------------------

  let tokenKey = null;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (/^sb-.+-auth-token$/.test(k)) { tokenKey = k; break; }
  }
  if (!tokenKey) {
    console.error(
      '%c✗ No Supabase session found in this tab.',
      'color:#ff5f5f;font-weight:bold'
    );
    console.error('Make sure you are signed in to the app, on the same tab, then re-run.');
    return;
  }

  const projectRef = tokenKey.replace(/^sb-/, '').replace(/-auth-token$/, '');
  const BASE = `https://${projectRef}.supabase.co/rest/v1`;

  let accessToken, userId;
  try {
    const sess = JSON.parse(localStorage.getItem(tokenKey));
    accessToken = sess.access_token;
    userId = sess.user && sess.user.id;
  } catch (e) {
    console.error('✗ Could not parse the stored session:', e);
    return;
  }
  if (!accessToken) {
    console.error('✗ Session found but it holds no access token. Sign out and back in, then re-run.');
    return;
  }

  console.log(`%c▶ Transform Me — backup & audit`, 'color:#9b7dff;font-weight:bold;font-size:14px');
  console.log(`  project: ${projectRef}`);
  console.log(`  user:    ${userId || '(unknown)'}`);
  console.log('');

  // --- Fetch helper: GET only, paginated ---------------------------------

  async function fetchAll(table, orderCol) {
    const rows = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const url =
        `${BASE}/${table}?select=*&order=${orderCol}.asc` +
        `&limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url, {
        method: 'GET', // read-only, always
        headers: {
          apikey: PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`${table} → HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
      }
      const page = await res.json();
      rows.push(...page);
      if (page.length < PAGE_SIZE) return rows;
    }
  }

  // --- Step 1: pull everything -------------------------------------------

  const data = {};
  const counts = {};
  for (const [table, orderCol] of Object.entries(TABLES)) {
    try {
      data[table] = await fetchAll(table, orderCol);
      counts[table] = data[table].length;
      console.log(`  ✓ ${table.padEnd(21)} ${String(counts[table]).padStart(6)} rows`);
    } catch (err) {
      data[table] = [];
      counts[table] = 'ERROR';
      console.error(`  ✗ ${table.padEnd(21)} ${err.message}`);
    }
  }

  const backup = {
    format: 'transform-me-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    projectRef,
    userId: userId || null,
    counts,
    tables: data,
  };

  // Trigger the download.
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transform-me-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('');
  console.log(`%c✓ Backup downloaded: transform-me-backup-${stamp}.json`, 'color:#4ade80;font-weight:bold');
  console.log('');

  // --- Step 2: audit ------------------------------------------------------

  // Mirrors of the app's own logic, so the report matches what you see on screen.
  const isWeekendDate = (d) => {
    const [y, m, day] = d.split('-').map(Number);
    const wd = new Date(y, m - 1, day).getDay(); // local, same as date-fns parseISO
    return wd === 0 || wd === 6;
  };
  const getDayTier = (completed, total) => {
    if (total === 0) return 'missed';
    const r = completed / total;
    if (r >= 1) return 'gold';
    if (r >= 0.9) return 'silver';
    if (r >= 0.7) return 'bronze';
    if (r >= 0.5) return 'partial';
    return 'missed';
  };
  const tierToPoints = (t) => ({ gold: 3, silver: 2, bronze: 1 }[t] || 0);

  const habits = data.habits || [];
  const entries = data.habit_entries || [];
  const activeHabits = habits.filter((h) => h.is_active);
  const habitById = new Map(habits.map((h) => [h.id, h]));
  const habitName = (id) => (habitById.get(id) || {}).name || `⟨deleted habit ${id}⟩`;

  const activeHabitsOn = (date) =>
    activeHabits.filter((h) =>
      isWeekendDate(date) ? h.active_on_weekends !== false : h.active_on_weekdays !== false
    );

  const report = [];
  const say = (s = '') => { report.push(s); console.log(s); };

  say('══════════════════════════════════════════════════════════════');
  say(' DAMAGE REPORT');
  say('══════════════════════════════════════════════════════════════');
  say('');

  // 2a. Row-cap proximity (the app fetches habit_entries unbounded; PostgREST
  //     silently truncates at 1000).
  say('── Row volume ────────────────────────────────────────────────');
  for (const [t, n] of Object.entries(counts)) {
    if (typeof n !== 'number') continue;
    const flag = n >= 1000 ? '  ⚠️  AT OR OVER THE 1000-ROW CAP — data is being silently truncated'
      : n >= 800 ? '  ⚠️  approaching the 1000-row cap'
      : '';
    if (flag) say(`  ${t}: ${n}${flag}`);
  }
  say(`  habit_entries: ${entries.length} (cap risk at 1000)`);
  say('');

  // 2b. Duplicate habit entries — the root cause.
  const groups = new Map();
  for (const e of entries) {
    const key = `${e.habit_id}|${e.date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  const dupGroups = [...groups.entries()].filter(([, rows]) => rows.length > 1);
  const extraRows = dupGroups.reduce((s, [, rows]) => s + rows.length - 1, 0);
  const dupCompleted = dupGroups.filter(
    ([, rows]) => rows.filter((r) => r.completed).length > 1
  );

  say('── Duplicate habit entries (root cause) ──────────────────────');
  say(`  duplicate (habit, date) pairs:        ${dupGroups.length}`);
  say(`  redundant rows to remove:             ${extraRows}`);
  say(`  pairs with >1 row marked completed:   ${dupCompleted.length}   ← these inflate your counts`);
  say('');
  if (dupGroups.length) {
    say('  Every pair below will CRASH the app when you tap that habit on that date');
    say('  (maybeSingle() throws on multiple rows), and cannot be untoggled until fixed:');
    for (const [key, rows] of dupGroups.slice(0, 40)) {
      const [hid, date] = key.split('|');
      const nDone = rows.filter((r) => r.completed).length;
      say(`    ${date}  ${habitName(hid).padEnd(24)} ${rows.length} rows (${nDone} completed)`);
    }
    if (dupGroups.length > 40) say(`    … and ${dupGroups.length - 40} more`);
    say('');
  }

  // 2c. Orphan + inactive entries (counted by the app's day-tier math).
  const orphans = entries.filter((e) => !habitById.has(e.habit_id));
  const inactive = entries.filter((e) => {
    const h = habitById.get(e.habit_id);
    return h && !h.is_active;
  });
  say('── Entries pointing at habits that no longer count ───────────');
  say(`  orphaned (habit deleted entirely):    ${orphans.length}`);
  say(`  belonging to deactivated habits:      ${inactive.length}`);
  say('  Both are still counted by the header / daily-status math, but excluded');
  say('  from the total — which is how completed can exceed total.');
  say('');

  // 2d. Day-by-day: what the app shows vs. what is true.
  const allDates = [...new Set(entries.map((e) => e.date))].sort();
  const dayRows = allDates.map((date) => {
    const onDate = entries.filter((e) => e.date === date);
    const total = activeHabitsOn(date).length;
    const activeIds = new Set(activeHabitsOn(date).map((h) => h.id));

    // What the app computes today (getDayProgress: rows, filtered by date only).
    const appCompleted = onDate.filter((e) => e.completed).length;

    // What is actually true (distinct currently-active habits completed).
    const trueCompleted = new Set(
      onDate.filter((e) => e.completed && activeIds.has(e.habit_id)).map((e) => e.habit_id)
    ).size;

    return {
      date,
      total,
      appCompleted,
      trueCompleted,
      appTier: getDayTier(appCompleted, total),
      trueTier: getDayTier(trueCompleted, total),
    };
  });

  const overCounted = dayRows.filter((d) => d.appCompleted > d.total);
  const wrongTier = dayRows.filter((d) => d.appTier !== d.trueTier);
  const phantomGold = wrongTier.filter((d) => d.appTier === 'gold' && d.trueTier !== 'gold');

  say('── Day-tier accuracy ─────────────────────────────────────────');
  say(`  days with any entries:                ${dayRows.length}`);
  say(`  days where completed > total:         ${overCounted.length}   ← impossible, proves inflation`);
  say(`  days showing the wrong tier:          ${wrongTier.length}`);
  say(`  phantom GOLD days:                    ${phantomGold.length}`);
  say('');
  if (wrongTier.length) {
    say('  date         shown          actual');
    for (const d of wrongTier.slice(0, 40)) {
      say(
        `    ${d.date}  ${(d.appCompleted + '/' + d.total).padEnd(6)} ${d.appTier.padEnd(8)} ` +
        `→  ${(d.trueCompleted + '/' + d.total).padEnd(6)} ${d.trueTier}`
      );
    }
    if (wrongTier.length > 40) say(`    … and ${wrongTier.length - 40} more`);
    say('');
  }

  // 2e. Cycle level inflation.
  const activeCycle = (data.cycle_progress || []).find((c) => c.is_active);
  say('── Cycle level ───────────────────────────────────────────────');
  if (!activeCycle) {
    say('  No active cycle found.');
  } else {
    const start = activeCycle.started_at.split('T')[0];
    const ppl = activeCycle.points_per_level || 12;
    const todayStr = (() => {
      const n = new Date();
      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    })();

    // computeCycleProgress counts ROWS (duplicates included) among active habits.
    let appPoints = 0, truePoints = 0;
    for (const d of dayRows) {
      if (d.date < start || d.date > todayStr) continue;
      if (d.total === 0) continue;
      const activeIds = new Set(activeHabitsOn(d.date).map((h) => h.id));
      const rowCount = entries.filter(
        (e) => e.date === d.date && e.completed && activeIds.has(e.habit_id)
      ).length;
      appPoints += tierToPoints(getDayTier(rowCount, d.total));
      truePoints += tierToPoints(getDayTier(d.trueCompleted, d.total));
    }
    const lvl = (p) => Math.min(Math.floor(Math.min(p, 10 * ppl) / ppl) + 1, 10);
    say(`  cycle #${activeCycle.cycle_number}, started ${start}, ${ppl} points/level`);
    say(`  points shown by the app:              ${appPoints}  → level ${lvl(appPoints)}`);
    say(`  points actually earned:               ${truePoints}  → level ${lvl(truePoints)}`);
    say(
      appPoints === truePoints
        ? '  ✓ no level inflation'
        : `  ⚠️  overstated by ${appPoints - truePoints} points (${lvl(appPoints) - lvl(truePoints)} level(s))`
    );
    const unlocks = data.cycle_level_unlocks || [];
    const placeholder = unlocks.filter((u) =>
      /no standard rewards configured/i.test(u.reward_title_snapshot || '')
    );
    if (placeholder.length) {
      say(`  ⚠️  ${placeholder.length} unlock(s) saved with the placeholder reward title`);
    }
  }
  say('');

  // 2f. Streak check — the app's 30-day window and its weekend blind spot.
  say('── Streak sanity ─────────────────────────────────────────────');
  const weekendOff = activeHabits.filter((h) => h.active_on_weekends === false);
  if (weekendOff.length) {
    say(`  ⚠️  ${weekendOff.length} habit(s) are off on weekends:`);
    for (const h of weekendOff) say(`       ${h.name}`);
    say('      useStreaks compares against habits.length (all habits), not the');
    say('      weekend-active subset — so every weekend breaks your streak.');
  } else {
    say('  ✓ no weekend-off habits, so the weekend streak bug is not biting you');
  }
  const oldest = allDates[0];
  if (oldest) {
    const daysOfHistory = Math.round((Date.now() - new Date(oldest).getTime()) / 86400000);
    say(`  history spans ${daysOfHistory} days, but "longest streak" only scans the last 30.`);
  }
  say('');

  say('══════════════════════════════════════════════════════════════');
  say(' Backup saved. Nothing was modified. Send the block above over.');
  say('══════════════════════════════════════════════════════════════');

  window.__transformAudit = { backup, dayRows, dupGroups, orphans, inactive, report };
  console.log('');
  console.log('%cAlso available as window.__transformAudit', 'color:#888');
  console.log('%cTip: right-click the console → "Save as…" to capture the full output.', 'color:#888');
})();
