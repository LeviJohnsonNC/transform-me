// Read-only API for outside assistants, authenticated with a personal API key
// from Settings → API Access (not a Supabase session).
//
//   GET /functions/v1/api/            endpoint list (no key needed)
//   GET /functions/v1/api/<endpoint>  Authorization: Bearer tm_...
//
// See ENDPOINTS below for what each returns. Dates are the user's LOCAL
// calendar day, which the server cannot know, so anything about "today" takes
// `?tz=America/Denver` or `?date=YYYY-MM-DD` and otherwise falls back to UTC.
//
// JWT verification is off for this function in supabase/config.toml because the
// bearer token is an API key, checked below against api_tokens. Keys are
// read-only by construction: this function only ever SELECTs user data.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import {
  addDays,
  dayInZone,
  groupSessions,
  isDayKey,
  weeklySummary,
  type RecordRow,
} from '../_shared/sessions.ts';
import {
  completedByDate,
  cycleStanding,
  dayDetail,
  habitsOn,
  streaks,
  type DayTier,
  type EntryRow,
  type HabitRow,
} from '../_shared/habits.ts';
import { round, shapePlan, summarizeExercises, type ExerciseRow, type LogRow } from '../_shared/plan.ts';
import {
  closestLevelUp,
  overallLevel,
  rankFor,
  rateLoggedSets,
  scoreMuscles,
  scoreRegions,
} from '../_shared/progress.ts';
import { liftFor, scaleFor, type Gender, type RatingStats } from '../_shared/strengthStandards.ts';

const DEFAULT_DAYS = 28;
const MAX_DAYS = 366;
// PostgREST caps a response at 1000 rows, so whole histories are read in pages.
const PAGE = 1000;

const ENDPOINTS: Record<string, { params?: string; returns: string }> = {
  '/today': {
    params: 'tz | date',
    returns: "One day at a glance: habits done and still to do, the day's tier, streak, reward-cycle level, lifts logged that day, and the next plan day in rotation.",
  },
  '/profile': {
    returns: 'Age, bodyweight and gender used for strength ratings, plus how far back the data goes and how much of it there is.',
  },
  '/plan': {
    params: 'day',
    returns: 'The workout plan: every numbered day with its exercises for each tier (minimum, good, max), the prescription, notes, and the last and best set logged for each. `day=N` narrows to one day.',
  },
  '/sessions': {
    params: 'from, to, tz | date',
    returns: 'Lifting sessions, one per day, with each exercise’s top set and whether it was a personal record, plus sessions per Monday–Sunday week.',
  },
  '/records': {
    params: 'exercise',
    returns: 'Personal records for every exercise ever logged: latest and best set per set type, sessions logged, and the 1–10 strength rating. `exercise=Name` narrows to one and adds its full set history.',
  },
  '/progress': {
    returns: 'Strength levels as the Progress screen shows them: per lift, per muscle, per region (push/pull/legs/core), overall level and rank, and the closest level-up.',
  },
  '/habits': {
    params: 'from, to, tz | date, all_days',
    returns: 'Habit definitions and, per day, which habits were completed and missed, the tier and cycle points earned, plus totals and per-habit completion rates for the range. Days with nothing done are left out unless `all_days=true`.',
  },
  '/streaks': {
    params: 'tz | date',
    returns: 'Current and longest streak over the whole history, overall and per habit.',
  },
  '/cycle': {
    params: 'tz | date',
    returns: 'The reward cycle: current level and points, rewards unlocked and whether claimed, the reward pool, and past cycles.',
  },
  '/export': {
    returns: 'Every row of your data from every table, unshaped. Large.',
  },
};

const PARAMS = {
  tz: 'IANA timezone used to decide what "today" is, e.g. America/Denver. Defaults to UTC.',
  date: 'YYYY-MM-DD to treat as today. Overrides tz.',
  from: `Start of the range, YYYY-MM-DD. Defaults to ${DEFAULT_DAYS} days before \`to\`.`,
  to: 'End of the range, inclusive. Defaults to today when tz or date is given, otherwise tomorrow in UTC (which is today somewhere).',
  day: 'A plan day number.',
  exercise: 'An exercise name, case-insensitive.',
  all_days: 'true to include days with no habit completed.',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

class BadRequest extends Error {
  constructor(message: string, readonly status = 400, readonly extra: Record<string, unknown> = {}) {
    super(message);
  }
}

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

/** The user a bearer API key belongs to, or null. */
const authenticate = async (req: Request): Promise<string | null> => {
  const match = /^Bearer\s+(tm_[A-Za-z0-9_-]+)$/.exec(req.headers.get('Authorization') ?? '');
  if (!match) return null;
  const { data, error } = await admin
    .from('api_tokens')
    .select('id, user_id')
    .eq('token_hash', await sha256Hex(match[1]))
    .maybeSingle();
  if (error || !data) return null;
  await admin.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return data.user_id;
};

// --- Reading ---------------------------------------------------------------

/** Any ordered select, which can be asked for one page of its rows. */
interface Query {
  range(from: number, to: number): PromiseLike<{ data: unknown[] | null; error: unknown }>;
}

/** Every row a query returns, read in pages. The query must be fully ordered. */
const readAll = async <T>(query: () => Query): Promise<T[]> => {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
};

const readHabits = (userId: string) =>
  readAll<HabitRow & Record<string, unknown>>(() =>
    admin.from('habits').select('*').eq('user_id', userId).order('order_index').order('id'),
  );

const readEntries = (userId: string, from?: string, to?: string) =>
  readAll<EntryRow & { notes: string | null }>(() => {
    let q = admin.from('habit_entries').select('habit_id, date, completed, notes').eq('user_id', userId);
    if (from) q = q.gte('date', from);
    if (to) q = q.lte('date', to);
    return q.order('date').order('id');
  });

const LOG_COLUMNS =
  'date_recorded, workout_plan_id, exercise_name, set_type, current_weight, actual_reps, previous_best, previous_best_reps';

/** Every set ever logged, oldest first. */
const readLogs = (userId: string, from?: string, to?: string) =>
  readAll<RecordRow & LogRow>(() => {
    let q = admin.from('workout_records').select(LOG_COLUMNS).eq('user_id', userId);
    if (from) q = q.gte('date_recorded', from);
    if (to) q = q.lte('date_recorded', to);
    return q.order('date_recorded').order('created_at').order('id');
  });

const readPlans = async (userId: string) => {
  const { data, error } = await admin
    .from('workout_plans')
    .select('id, day_number, day_name')
    .eq('user_id', userId)
    .order('day_number');
  if (error) throw error;
  return data ?? [];
};

/** workout_exercises has no user_id; it belongs to the user through its plan. */
const readExercises = async (planIds: string[]) =>
  planIds.length === 0
    ? []
    : readAll<ExerciseRow & Record<string, unknown>>(() =>
        admin.from('workout_exercises').select('*').in('workout_plan_id', planIds).order('order_index').order('id'),
      );

const readStats = async (userId: string): Promise<RatingStats | null> => {
  const { data, error } = await admin.from('user_stats').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    gender: data.gender as Gender,
    age: data.age,
    bodyweight_lbs: Number(data.bodyweight_lbs),
    rating_scale: data.rating_scale === 'male' || data.rating_scale === 'female' ? data.rating_scale : null,
  };
};

// --- Parameters ------------------------------------------------------------

interface Today {
  date: string;
  /** How `date` was decided, so a caller can tell a guess from an answer. */
  source: 'date' | 'tz' | 'utc';
}

const resolveToday = (url: URL): Today => {
  const date = url.searchParams.get('date');
  if (date) {
    if (!isDayKey(date)) throw new BadRequest('`date` must be a YYYY-MM-DD date');
    return { date, source: 'date' };
  }
  const tz = url.searchParams.get('tz');
  if (tz) {
    const day = dayInZone(tz);
    if (!day) throw new BadRequest('`tz` must be an IANA timezone such as America/Denver');
    return { date: day, source: 'tz' };
  }
  return { date: new Date().toISOString().slice(0, 10), source: 'utc' };
};

const resolveRange = (url: URL, today: Today): { from: string; to: string } => {
  // Without a timezone, tomorrow in UTC is the latest "today" anywhere.
  const defaultTo = today.source === 'utc' ? addDays(today.date, 1) : today.date;
  const to = url.searchParams.get('to') ?? defaultTo;
  if (!isDayKey(to)) throw new BadRequest('`to` must be a YYYY-MM-DD date');
  const from = url.searchParams.get('from') ?? addDays(to, -DEFAULT_DAYS);
  if (!isDayKey(from)) throw new BadRequest('`from` must be a YYYY-MM-DD date');
  if (from > to) throw new BadRequest('`from` must not be after `to`');
  if (from < addDays(to, -MAX_DAYS)) throw new BadRequest(`range must be at most ${MAX_DAYS} days`);
  return { from, to };
};

const activeOf = <H extends HabitRow>(habits: readonly H[]) => habits.filter((h) => h.is_active);

// --- Endpoints -------------------------------------------------------------

interface Context {
  userId: string;
  url: URL;
  today: Today;
}

const getSessions = async ({ userId, url, today }: Context) => {
  const { from, to } = resolveRange(url, today);
  const [records, plans] = await Promise.all([readLogs(userId, from, to), readPlans(userId)]);

  const planNames = Object.fromEntries(plans.map((p) => [p.id, p.day_name]));
  const sessions = groupSessions(records, planNames);
  return {
    from,
    to,
    notes:
      'One session per local calendar day. Each exercise is the top set logged that day; ' +
      'for reps- or time-based exercises the value is in `weight` and `unit` says which. Weeks run Monday to Sunday.',
    weekly: weeklySummary(sessions, from, to),
    sessions,
  };
};

const getHabits = async ({ userId, url, today }: Context) => {
  const { from, to } = resolveRange(url, today);
  const allDays = url.searchParams.get('all_days') === 'true';
  const [habits, entries] = await Promise.all([readHabits(userId), readEntries(userId, from, to)]);
  const active = activeOf(habits);
  const done = completedByDate(entries);
  const names = new Map(habits.map((h) => [h.id, h.name]));

  const notesByDate = new Map<string, Record<string, string>>();
  for (const e of entries) {
    if (!e.notes) continue;
    const notes = notesByDate.get(e.date) ?? {};
    notes[names.get(e.habit_id) ?? e.habit_id] = e.notes;
    notesByDate.set(e.date, notes);
  }

  // Totals stop at today: a day that has not happened yet is not a missed one.
  const last = to < today.date ? to : today.date;
  const tiers: Record<DayTier, number> = { gold: 0, silver: 0, bronze: 0, partial: 0, missed: 0 };
  const perHabit = new Map(active.map((h) => [h.id, { habit: h.name, completed: 0, scheduled: 0 }]));
  let points = 0;
  let daysCounted = 0;
  let daysLogged = 0;
  const days = [];

  for (let key = from; key <= to; key = addDays(key, 1)) {
    const day = dayDetail(key, active, habits, done);
    const notes = notesByDate.get(key);
    if (done.has(key) || allDays) days.push(notes ? { ...day, notes } : day);
    if (key > last) continue;
    daysCounted++;
    if (done.has(key)) daysLogged++;
    tiers[day.tier]++;
    points += day.points;
    for (const h of habitsOn(active, key)) {
      const stat = perHabit.get(h.id)!;
      stat.scheduled++;
      if (done.get(key)?.has(h.id)) stat.completed++;
    }
  }

  return {
    from,
    to,
    today: today.date,
    notes:
      'Tiers: gold = every scheduled habit, silver ≥ 90%, bronze ≥ 70% (keeps the streak), partial ≥ 50%. ' +
      'Gold earns 3 cycle points, silver 2, bronze 1. `completed` lists every habit done that day; ' +
      '`completed_count` counts only the ones scheduled that day, which is what the tier reads.',
    active_habits: active.map((h) => h.name),
    habits: habits.map((h) => ({
      name: h.name,
      description: h.description ?? null,
      icon: h.icon,
      active: h.is_active,
      schedule: { weekdays: h.active_on_weekdays !== false, weekends: h.active_on_weekends !== false },
    })),
    summary: {
      days: daysCounted,
      days_logged: daysLogged,
      tiers,
      points,
      habits: [...perHabit.values()].map((s) => ({
        ...s,
        rate: s.scheduled ? round(s.completed / s.scheduled) : null,
      })),
    },
    days,
  };
};

const getStreaks = async ({ userId, today }: Context) => {
  const [habits, entries] = await Promise.all([readHabits(userId), readEntries(userId)]);
  const active = activeOf(habits);
  return {
    today: today.date,
    notes:
      'A day counts towards the overall streak at bronze or better (70% of the habits scheduled that day). ' +
      'Days with nothing scheduled are skipped, and an unfinished today never breaks a streak.',
    overall: streaks(entries, active, today.date),
    habits: active.map((h) => ({ habit: h.name, ...streaks(entries, active, today.date, h.id) })),
  };
};

const getPlan = async ({ userId, url }: Context) => {
  const plans = await readPlans(userId);
  const [exercises, logs] = await Promise.all([readExercises(plans.map((p) => p.id)), readLogs(userId)]);
  const { days, next_in_rotation } = shapePlan(plans, exercises, logs);

  const dayParam = url.searchParams.get('day');
  let shown = days;
  if (dayParam !== null) {
    shown = days.filter((d) => String(d.day_number) === dayParam);
    if (shown.length === 0) {
      throw new BadRequest(`no plan day ${dayParam}`, 404, { days: days.map((d) => d.day_number) });
    }
  }

  return {
    notes:
      'Each day has three versions by tier: minimum (a short day), good (the usual), max (the full session). ' +
      '`logged` is keyed by set type (standard, top, backoff); `best` is the heaviest set, more reps breaking a tie. ' +
      '`next_in_rotation` is the day after the one trained most recently.',
    next_in_rotation,
    days: shown,
  };
};

const getRecords = async ({ userId, url }: Context) => {
  const [logs, plans, stats] = await Promise.all([readLogs(userId), readPlans(userId), readStats(userId)]);
  const planNames = Object.fromEntries(plans.map((p) => [p.id, p.day_name]));
  const rating = stats && scaleFor(stats) ? stats : null;

  const wanted = url.searchParams.get('exercise');
  if (wanted) {
    const mine = logs.filter((r) => r.exercise_name.toLowerCase() === wanted.trim().toLowerCase());
    if (mine.length === 0) {
      const names = [...new Set(logs.map((r) => r.exercise_name))].sort();
      throw new BadRequest(`nothing logged for "${wanted}"`, 404, { exercises: names });
    }
    return { exercise: summarizeExercises(mine, planNames, rating, true)[0] };
  }

  return {
    notes:
      'One entry per exercise name, most recently trained first. `best` is the heaviest set, more reps breaking a tie; ' +
      '`rating` is the 1–10 strength level from the strongest set by estimated 1RM, and is null for exercises ' +
      'without a strength standard or when age, bodyweight and gender are not set.',
    ratings_available: rating !== null,
    exercises: summarizeExercises(logs, planNames, rating),
  };
};

const getProgress = async ({ userId }: Context) => {
  const stats = await readStats(userId);
  if (!stats) return { available: false, reason: 'Age, bodyweight and gender are not set (Settings → My Stats).' };
  if (!scaleFor(stats)) return { available: false, reason: 'No rating scale chosen (Settings → My Stats).' };

  const plans = await readPlans(userId);
  const [logs, exercises] = await Promise.all([readLogs(userId), readExercises(plans.map((p) => p.id))]);
  const lifts = rateLoggedSets(
    logs.map((r) => ({ exercise_name: r.exercise_name, current_weight: Number(r.current_weight), actual_reps: r.actual_reps })),
    stats,
  );
  const muscles = scoreMuscles(lifts);
  const overall = overallLevel(lifts);
  const next = closestLevelUp(lifts, stats);

  const rated = new Set(lifts.map((l) => l.key));
  const untrained = new Map<string, string>();
  for (const e of exercises) {
    const lift = liftFor(e.exercise_name);
    if (lift && !rated.has(lift.key)) untrained.set(lift.key, lift.label);
  }
  const level = (n: number | null) => (n === null ? null : round(n));

  return {
    available: true,
    notes:
      'Levels run 0–10: 5 is about intermediate, 7 advanced, 10 elite. A muscle is the weighted mean of the lifts ' +
      'that work it; a region is the mean of its muscles; overall is the mean of every rated lift.',
    overall: { level: level(overall), rank: overall === null ? null : rankFor(overall) },
    regions: scoreRegions(muscles).map((r) => ({ region: r.label, level: level(r.level) })),
    muscles: muscles.map((m) => ({
      muscle: m.muscle.label,
      region: m.muscle.region,
      level: level(m.level),
      from_lifts: m.lifts.map((c) => c.lift.label),
      would_count: m.wouldCount,
    })),
    lifts: lifts.map((l) => ({
      lift: l.label,
      exercise: l.name,
      level: round(l.level),
      unit: l.unit,
      from: { weight: l.weight, reps: l.reps },
      next_level: l.nextLevel,
      next_threshold: l.nextThreshold,
    })),
    untrained: [...untrained.values()],
    closest_level_up: next ? { lift: next.lift.label, exercise: next.lift.name, to_level: next.lift.nextLevel, ask: next.ask } : null,
  };
};

const readCycles = async (userId: string) => {
  const [cycles, unlocks, rewards] = await Promise.all([
    admin.from('cycle_progress').select('*').eq('user_id', userId).order('cycle_number'),
    admin.from('cycle_level_unlocks').select('*').eq('user_id', userId).order('unlocked_at'),
    admin.from('reward_settings').select('*').eq('user_id', userId).order('sort_order'),
  ]);
  for (const r of [cycles, unlocks, rewards]) if (r.error) throw r.error;
  return { cycles: cycles.data ?? [], unlocks: unlocks.data ?? [], rewards: rewards.data ?? [] };
};

const shapeUnlock = (u: Record<string, unknown>) => ({
  level: u.level,
  type: u.reward_type,
  reward: u.reward_title_snapshot,
  description: u.reward_description_snapshot,
  unlocked_at: u.unlocked_at,
  claimed: u.is_claimed,
  claimed_at: u.claimed_at,
});

/** The active cycle's standing, or null when the user has not started one. */
const currentCycle = (
  data: Awaited<ReturnType<typeof readCycles>>,
  active: HabitRow[],
  entries: EntryRow[],
  today: string,
) => {
  const cycle = data.cycles.find((c) => c.is_active);
  if (!cycle) return null;
  const standing = cycleStanding(entries, active, cycle.started_at, today, cycle.points_per_level);
  const unlocks = data.unlocks.filter((u) => u.cycle_id === cycle.id).sort((a, b) => a.level - b.level);
  const maxUnlocked = unlocks.length ? Math.max(...unlocks.map((u) => u.level)) : 1;
  return {
    number: cycle.cycle_number,
    started_at: cycle.started_at,
    ...standing,
    max_level: 10,
    // A level reached whose reward the app has not handed out yet; it does so next time it opens.
    pending_unlock_level: standing.level > maxUnlocked ? maxUnlocked + 1 : null,
    unlocks: unlocks.map(shapeUnlock),
  };
};

const getCycle = async ({ userId, today }: Context) => {
  const [data, habits, entries] = await Promise.all([readCycles(userId), readHabits(userId), readEntries(userId)]);
  const current = currentCycle(data, activeOf(habits), entries, today.date);
  return {
    today: today.date,
    notes:
      'Every day since the cycle started earns points by tier (gold 3, silver 2, bronze 1). Each level takes ' +
      '`points_per_level`; every level reached unlocks a reward from the pool, and level 10 unlocks the boss reward ' +
      'and starts the next cycle.',
    current,
    unclaimed_rewards: data.unlocks.filter((u) => !u.is_claimed).map(shapeUnlock),
    reward_pool: data.rewards.map((r) => ({ type: r.type, title: r.title, description: r.description, active: r.is_active })),
    past_cycles: data.cycles
      .filter((c) => !c.is_active)
      .map((c) => ({
        number: c.cycle_number,
        started_at: c.started_at,
        completed_at: c.completed_at,
        unlocks: data.unlocks.filter((u) => u.cycle_id === c.id).sort((a, b) => a.level - b.level).map(shapeUnlock),
      })),
  };
};

const getToday = async ({ userId, today }: Context) => {
  const plans = await readPlans(userId);
  const [habits, entries, logs, exercises, cycles] = await Promise.all([
    readHabits(userId),
    readEntries(userId),
    readLogs(userId),
    readExercises(plans.map((p) => p.id)),
    readCycles(userId),
  ]);
  const active = activeOf(habits);
  const planNames = Object.fromEntries(plans.map((p) => [p.id, p.day_name]));
  const todays = logs.filter((r) => r.date_recorded === today.date);
  const { days, next_in_rotation } = shapePlan(plans, exercises, logs);
  const next = days.find((d) => d.day_number === next_in_rotation);
  const cycle = currentCycle(cycles, active, entries, today.date);

  return {
    date: today.date,
    date_source: today.source,
    ...(today.source === 'utc' ? { warning: 'No tz or date given, so "today" is the UTC day. Pass ?tz=Your/Zone.' } : {}),
    habits: dayDetail(today.date, active, habits, completedByDate(entries)),
    streak: streaks(entries, active, today.date),
    cycle: cycle && {
      number: cycle.number,
      level: cycle.level,
      level_progress: cycle.level_progress,
      points_per_level: cycle.points_per_level,
      points_to_next_level: cycle.points_to_next_level,
      pending_unlock_level: cycle.pending_unlock_level,
    },
    workout: todays.length ? groupSessions(todays, planNames)[0] : null,
    next_workout: next ? { day_number: next.day_number, day_name: next.day_name, last_trained: next.last_trained } : null,
  };
};

const getProfile = async ({ userId }: Context) => {
  const plans = await readPlans(userId);
  const [stats, habits, entries, logs] = await Promise.all([
    readStats(userId),
    readHabits(userId),
    readEntries(userId),
    readLogs(userId),
  ]);
  const doneDays = [...completedByDate(entries).keys()].sort();
  const liftDays = [...new Set(logs.map((r) => r.date_recorded))];
  return {
    stats: stats && {
      age: stats.age,
      bodyweight_lbs: stats.bodyweight_lbs,
      gender: stats.gender,
      rating_scale: scaleFor(stats),
    },
    habits: {
      active: activeOf(habits).length,
      archived: habits.length - activeOf(habits).length,
      days_logged: doneDays.length,
      first_day: doneDays[0] ?? null,
      last_day: doneDays[doneDays.length - 1] ?? null,
    },
    training: {
      plan_days: plans.length,
      sessions: liftDays.length,
      exercises_logged: new Set(logs.map((r) => r.exercise_name)).size,
      first_session: liftDays[0] ?? null,
      last_session: liftDays[liftDays.length - 1] ?? null,
    },
  };
};

const getExport = async ({ userId }: Context) => {
  const plans = await readPlans(userId);
  const byUser = (table: string, order: string) =>
    readAll<Record<string, unknown>>(() => admin.from(table).select('*').eq('user_id', userId).order(order).order('id'));
  const [habits, habit_entries, workout_plans, workout_exercises, workout_records, cycle_progress, cycle_level_unlocks, reward_settings, user_stats] =
    await Promise.all([
      byUser('habits', 'order_index'),
      byUser('habit_entries', 'date'),
      byUser('workout_plans', 'day_number'),
      readExercises(plans.map((p) => p.id)),
      byUser('workout_records', 'date_recorded'),
      byUser('cycle_progress', 'cycle_number'),
      byUser('cycle_level_unlocks', 'unlocked_at'),
      byUser('reward_settings', 'sort_order'),
      admin.from('user_stats').select('*').eq('user_id', userId).then(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    ]);
  return {
    exported_at: new Date().toISOString(),
    tables: {
      habits,
      habit_entries,
      workout_plans,
      workout_exercises,
      workout_records,
      user_stats,
      cycle_progress,
      cycle_level_unlocks,
      reward_settings,
    },
  };
};

const ROUTES: Record<string, (ctx: Context) => Promise<unknown>> = {
  '/today': getToday,
  '/profile': getProfile,
  '/plan': getPlan,
  '/sessions': getSessions,
  '/records': getRecords,
  '/progress': getProgress,
  '/habits': getHabits,
  '/streaks': getStreaks,
  '/cycle': getCycle,
  '/export': getExport,
};

const index = () => ({
  name: 'Transform Me read-only API',
  auth: 'Authorization: Bearer <key from Settings → API Access>',
  dates: 'Dates are the user’s local calendar day, YYYY-MM-DD. Pass tz (or date) so "today" means the user’s today.',
  endpoints: ENDPOINTS,
  params: PARAMS,
});

/**
 * The path after the function name: `/functions/v1/api/plan`, `/api/plan` and
 * a bare `/plan` are all `/plan`.
 */
const routeOf = (pathname: string): string => {
  const match = /\/api(\/.*)?$/.exec(pathname);
  const route = (match ? match[1] ?? '' : pathname).replace(/\/+$/, '');
  return route || '/';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405);

  const url = new URL(req.url);
  const route = routeOf(url.pathname);
  if (route === '/') return json(index());

  const handler = ROUTES[route];
  if (!handler) return json({ error: 'not found', endpoints: Object.keys(ENDPOINTS) }, 404);

  const userId = await authenticate(req);
  if (!userId) return json({ error: 'missing or invalid API key' }, 401);

  try {
    return json(await handler({ userId, url, today: resolveToday(url) }));
  } catch (error) {
    if (error instanceof BadRequest) return json({ error: error.message, ...error.extra }, error.status);
    console.error(error);
    return json({ error: 'internal error' }, 500);
  }
});
