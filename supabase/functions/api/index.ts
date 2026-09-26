// Read-only API for outside assistants, authenticated with a personal API key
// from Settings → API Access (not a Supabase session).
//
//   GET /functions/v1/api/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD
//   GET /functions/v1/api/habits?from=YYYY-MM-DD&to=YYYY-MM-DD
//   Authorization: Bearer tm_...
//
// `from` defaults to 28 days ago and `to` to tomorrow (UTC), which covers
// "today" in every timezone: dates are the user's LOCAL calendar day. Ranges are
// capped at a year.
//
// JWT verification is off for this function in supabase/config.toml because the
// bearer token is an API key, checked below against api_tokens.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import {
  addDays,
  groupSessions,
  isDayKey,
  weeklySummary,
  type RecordRow,
} from '../_shared/sessions.ts';

const DEFAULT_DAYS = 28;
const MAX_DAYS = 366;

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

const parseRange = (url: URL): { from: string; to: string } | string => {
  const tomorrow = addDays(new Date().toISOString().slice(0, 10), 1);
  const to = url.searchParams.get('to') ?? tomorrow;
  if (!isDayKey(to)) return '`to` must be a YYYY-MM-DD date';
  const from = url.searchParams.get('from') ?? addDays(to, -DEFAULT_DAYS);
  if (!isDayKey(from)) return '`from` must be a YYYY-MM-DD date';
  if (from > to) return '`from` must not be after `to`';
  if (from < addDays(to, -MAX_DAYS)) return `range must be at most ${MAX_DAYS} days`;
  return { from, to };
};

const getSessions = async (userId: string, from: string, to: string) => {
  const [records, plans] = await Promise.all([
    admin
      .from('workout_records')
      .select(
        'date_recorded, workout_plan_id, exercise_name, set_type, current_weight, actual_reps, previous_best, previous_best_reps',
      )
      .eq('user_id', userId)
      .gte('date_recorded', from)
      .lte('date_recorded', to)
      .order('date_recorded')
      .order('created_at'),
    admin.from('workout_plans').select('id, day_name').eq('user_id', userId),
  ]);
  if (records.error) throw records.error;
  if (plans.error) throw plans.error;

  const planNames = Object.fromEntries((plans.data ?? []).map((p) => [p.id, p.day_name]));
  const sessions = groupSessions((records.data ?? []) as RecordRow[], planNames);
  return {
    from,
    to,
    notes:
      'One session per local calendar day. Each exercise is the top set logged that day; ' +
      'for reps- or time-based exercises the value is in `weight`. Weeks run Monday to Sunday.',
    weekly: weeklySummary(sessions, from, to),
    sessions,
  };
};

const getHabits = async (userId: string, from: string, to: string) => {
  const [entries, habits] = await Promise.all([
    admin
      .from('habit_entries')
      .select('date, habit_id, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', from)
      .lte('date', to)
      .order('date'),
    admin.from('habits').select('id, name, is_active').eq('user_id', userId),
  ]);
  if (entries.error) throw entries.error;
  if (habits.error) throw habits.error;

  const names = Object.fromEntries((habits.data ?? []).map((h) => [h.id, h.name]));
  const byDate = new Map<string, string[]>();
  for (const e of entries.data ?? []) {
    const list = byDate.get(e.date) ?? [];
    list.push(names[e.habit_id] ?? e.habit_id);
    byDate.set(e.date, list);
  }
  return {
    from,
    to,
    active_habits: (habits.data ?? []).filter((h) => h.is_active).map((h) => h.name),
    days: [...byDate].map(([date, completed]) => ({ date, completed })),
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405);

  const userId = await authenticate(req);
  if (!userId) return json({ error: 'missing or invalid API key' }, 401);

  const url = new URL(req.url);
  const range = parseRange(url);
  if (typeof range === 'string') return json({ error: range }, 400);

  try {
    if (url.pathname.endsWith('/sessions')) return json(await getSessions(userId, range.from, range.to));
    if (url.pathname.endsWith('/habits')) return json(await getHabits(userId, range.from, range.to));
    return json({ error: 'not found', endpoints: ['/api/sessions', '/api/habits'] }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: 'internal error' }, 500);
  }
});
