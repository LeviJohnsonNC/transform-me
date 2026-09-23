/* ===========================================================================
 * Transform Me — Toggle Diagnostic
 * ===========================================================================
 *
 * READ-ONLY. GET requests only. Nothing is inserted, updated or deleted.
 *
 * WHY THIS EXISTS
 *   Some habits (Conditioning, Supplements & vitamins) flicked straight back
 *   off when tapped. Two different faults produce that exact symptom, and this
 *   tells you which one you actually have:
 *
 *     A. Duplicate rows. Two habit_entries rows for the same habit and day.
 *        The toggle read them with `.maybeSingle()`, which ERRORS on more than
 *        one row, so the save failed and the optimistic update rolled back.
 *
 *     B. The unique index never got applied. If Lovable Cloud did not run
 *        supabase/migrations/20260923190000_habit_entries_unique.sql, the
 *        toggle's upsert had no constraint to resolve ON CONFLICT against and
 *        failed — but only for habits with no row yet that day.
 *
 *   The app no longer depends on either, so the tapping is fixed regardless.
 *   This report says whether duplicate rows are still sitting in your data and
 *   want cleaning up.
 *
 * HOW TO RUN
 *   1. Open your live app in a browser and make sure you are SIGNED IN.
 *   2. Open DevTools (F12 / Cmd-Opt-I) and click the "Console" tab.
 *   3. Chrome may ask you to type "allow pasting" before it accepts a paste.
 *      That prompt only appears AFTER it blocks a paste — paste first.
 *   4. Paste this whole file, press Enter.
 * ========================================================================= */

(async () => {
  'use strict';

  // The publishable (anon) key. Not a secret — it already ships in the app's JS
  // bundle and is committed in .env. RLS is what protects your rows.
  const PUBLISHABLE_KEY = 'sb_publishable_crma2wP0a_F5Sq_YXJRpGA_zr2rDSiX';
  const PAGE = 1000;

  let tokenKey = null;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (/^sb-.+-auth-token$/.test(k)) { tokenKey = k; break; }
  }
  if (!tokenKey) {
    console.error('%c✗ No Supabase session in this tab. Sign in, then re-run.', 'color:#ff5f5f;font-weight:bold');
    return;
  }

  const projectRef = tokenKey.replace(/^sb-/, '').replace(/-auth-token$/, '');
  const BASE = `https://${projectRef}.supabase.co/rest/v1`;

  let accessToken;
  try {
    accessToken = JSON.parse(localStorage.getItem(tokenKey)).access_token;
  } catch (e) {
    console.error('✗ Could not parse the stored session:', e);
    return;
  }
  if (!accessToken) {
    console.error('✗ Session found but it holds no access token. Sign out and back in, then re-run.');
    return;
  }

  const get = async (path) => {
    const res = await fetch(`${BASE}/${path}`, {
      headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
    return res.json();
  };

  const fetchAll = async (table, orderCol) => {
    const out = [];
    for (let from = 0; ; from += PAGE) {
      const page = await get(`${table}?select=*&order=${orderCol}.asc&offset=${from}&limit=${PAGE}`);
      out.push(...page);
      if (page.length < PAGE) return out;
    }
  };

  console.log('%cToggle diagnostic', 'font-weight:bold;font-size:14px');

  const habits = await fetchAll('habits', 'id');
  const entries = await fetchAll('habit_entries', 'id');
  const nameById = new Map(habits.map((h) => [h.id, h.name]));

  // Group by habit + day. More than one row in a group is a duplicate.
  const groups = new Map();
  for (const e of entries) {
    const key = `${e.habit_id}::${e.date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  const dupGroups = [...groups.entries()].filter(([, rows]) => rows.length > 1);

  console.log(`  habits             ${habits.length}`);
  console.log(`  habit_entries      ${entries.length}`);
  console.log(`  duplicated days    ${dupGroups.length}`);

  if (dupGroups.length === 0) {
    console.log('%c  → No duplicate rows. Cause A is ruled out.', 'color:#22c55e');
    console.log('    If tapping was broken before today, it was cause B (the missing unique');
    console.log('    index), and the app no longer relies on it.');
  } else {
    console.log('%c  → Duplicate rows found. This is cause A.', 'color:#ffb020;font-weight:bold');

    const perHabit = new Map();
    let contradicting = 0;
    for (const [key, rows] of dupGroups) {
      const habitId = key.split('::')[0];
      const name = nameById.get(habitId) || `(unknown habit ${habitId})`;
      perHabit.set(name, (perHabit.get(name) || 0) + 1);
      if (new Set(rows.map((r) => r.completed)).size > 1) contradicting++;
    }

    console.log('\n  Duplicated days per habit:');
    [...perHabit.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, n]) => console.log(`    ${String(n).padStart(4)}  ${name}`));

    console.log(`\n  Of those, ${contradicting} have rows that DISAGREE about whether the day was done.`);
    console.log('  Those are the ones that showed a completed habit as incomplete.');
    console.log('\n  The app now heals these as you tap: toggling a day writes the new state');
    console.log('  to every row for it. Nothing here needs deleting by hand.');
    console.log('\n  It also means migration 20260923190000_habit_entries_unique.sql has NOT');
    console.log('  been applied — it would have removed these. Worth applying so new');
    console.log('  duplicates cannot be created.');
  }

  window.__toggleDiagnostic = { habits, entries, dupGroups };
  console.log('\n  Full detail left on window.__toggleDiagnostic');
})();
