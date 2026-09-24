/* ===========================================================================
 * Transform Me — Reset Workout Records
 * ===========================================================================
 *
 * Deletes every row in `workout_records` for the SIGNED-IN account — every
 * personal best, every logged weight and rep count, for every exercise. The
 * workout PLAN (exercises, sets/reps prescriptions) is untouched, and so are
 * habits/streaks and your stats in Settings → My Stats. Next time you log a
 * set, it starts from zero with no "previous best" to compare against.
 *
 * SAFETY
 *   - Checks the signed-in email matches EXPECTED_EMAIL below and refuses to
 *     run against any other account.
 *   - Always downloads a full backup of your current workout_records FIRST,
 *     whether or not it goes on to delete anything.
 *   - Defaults to DRY_RUN = true: the first run shows you exactly what would
 *     be deleted (and gets you the backup) without deleting anything. Flip
 *     DRY_RUN to false and re-run to actually do it.
 *   - Asks for one more confirm() before the DELETE fires, showing the count.
 *
 * HOW TO RUN
 *   1. Open the live app in a browser and make sure you are SIGNED IN as
 *      levijohnson@gmail.com.
 *   2. Open DevTools (F12 / Cmd-Opt-I) and click the "Console" tab.
 *   3. Chrome may ask you to type "allow pasting" before it accepts a paste.
 *      That prompt only appears AFTER it blocks a paste — paste first.
 *   4. Paste this whole file, press Enter. Read the output.
 *   5. If it looks right, edit the DRY_RUN line just below to `false`,
 *      paste the whole file again, press Enter, and confirm the dialog.
 * ========================================================================= */

(async () => {
  'use strict';

  const DRY_RUN = true; // <-- flip to false, then re-paste, to actually delete
  const EXPECTED_EMAIL = 'levijohnson@gmail.com';

  // The publishable (anon) key. Not a secret — it already ships inside the
  // app's JS bundle and is committed in .env. RLS is what protects your rows.
  const PUBLISHABLE_KEY = 'sb_publishable_crma2wP0a_F5Sq_YXJRpGA_zr2rDSiX';
  const PAGE_SIZE = 1000;

  // --- Locate the logged-in session --------------------------------------

  let tokenKey = null;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (/^sb-.+-auth-token$/.test(k)) { tokenKey = k; break; }
  }
  if (!tokenKey) {
    console.error('%c✗ No Supabase session found in this tab.', 'color:#ff5f5f;font-weight:bold');
    console.error('Make sure you are signed in to the app, on the same tab, then re-run.');
    return;
  }

  const projectRef = tokenKey.replace(/^sb-/, '').replace(/-auth-token$/, '');
  const BASE = `https://${projectRef}.supabase.co/rest/v1`;

  let accessToken, userId, email;
  try {
    const sess = JSON.parse(localStorage.getItem(tokenKey));
    accessToken = sess.access_token;
    userId = sess.user && sess.user.id;
    email = sess.user && sess.user.email;
  } catch (e) {
    console.error('✗ Could not parse the stored session:', e);
    return;
  }
  if (!accessToken || !userId) {
    console.error('✗ Session found but it holds no user. Sign out and back in, then re-run.');
    return;
  }

  if ((email || '').toLowerCase() !== EXPECTED_EMAIL.toLowerCase()) {
    console.error(
      `%c✗ Signed in as ${email || '(unknown)'}, not ${EXPECTED_EMAIL}. Refusing to run.`,
      'color:#ff5f5f;font-weight:bold',
    );
    console.error('Sign in as the right account, or edit EXPECTED_EMAIL at the top of this script.');
    return;
  }

  console.log('%c▶ Transform Me — reset workout records', 'color:#ff2e97;font-weight:bold;font-size:14px');
  console.log(`  project: ${projectRef}`);
  console.log(`  user:    ${email} (${userId})`);
  console.log(`  mode:    ${DRY_RUN ? 'DRY RUN — nothing will be deleted' : 'LIVE — this WILL delete rows'}`);
  console.log('');

  const headers = {
    apikey: PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  // --- Step 1: fetch every record row, always -----------------------------

  const fetchAll = async () => {
    const rows = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const url =
        `${BASE}/workout_records?select=*&user_id=eq.${userId}` +
        `&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) throw new Error(`GET workout_records → HTTP ${res.status}: ${await res.text()}`);
      const page = await res.json();
      rows.push(...page);
      if (page.length < PAGE_SIZE) return rows;
    }
  };

  let rows;
  try {
    rows = await fetchAll();
  } catch (err) {
    console.error('✗ Could not read workout_records:', err.message);
    return;
  }

  console.log(`  found ${rows.length} record row(s)`);

  // --- Step 2: back it up, unconditionally --------------------------------

  const backup = {
    format: 'transform-me-workout-records-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    user: { id: userId, email },
    rowCount: rows.length,
    rows,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transform-me-workout-records-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('  ✓ backup downloaded — keep it until you are sure you do not want these back');

  if (rows.length === 0) {
    console.log('%c  Nothing to delete — workout_records is already empty for this account.', 'color:#22c55e');
    return;
  }

  // --- Step 3: show what would go ------------------------------------------

  const byExercise = new Map();
  for (const r of rows) byExercise.set(r.exercise_name, (byExercise.get(r.exercise_name) || 0) + 1);
  console.log('\n  Rows per exercise:');
  [...byExercise.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, n]) => console.log(`    ${String(n).padStart(3)}  ${name}`));

  if (DRY_RUN) {
    console.log(
      '\n%c  DRY RUN — nothing was deleted. Edit DRY_RUN to false at the top of this script, ' +
        'paste the whole file again, and confirm the dialog to actually reset.',
      'color:#ffb020;font-weight:bold',
    );
    window.__resetWorkoutRecordsPreview = { rows, byExercise: Object.fromEntries(byExercise) };
    return;
  }

  // --- Step 4: one more confirmation, then delete --------------------------

  const ok = window.confirm(
    `This will permanently delete ${rows.length} workout record row(s) for ${email}.\n\n` +
      'A backup JSON has already been downloaded.\n\nProceed?',
  );
  if (!ok) {
    console.log('  Cancelled. Nothing was deleted.');
    return;
  }

  const del = await fetch(`${BASE}/workout_records?user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=representation' },
  });
  if (!del.ok) {
    console.error(`✗ Delete failed → HTTP ${del.status}: ${await del.text()}`);
    console.error('  Nothing else was touched. Your backup file is still on disk.');
    return;
  }
  const deleted = await del.json();
  console.log(
    `%c  ✓ Deleted ${deleted.length} row(s). Records are reset — your next logged set starts fresh.`,
    'color:#22c55e;font-weight:bold',
  );
})();
