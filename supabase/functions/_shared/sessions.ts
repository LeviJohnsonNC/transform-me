// Pure shaping for the `api` edge function: workout_records rows in, training
// sessions out. Kept free of Deno and Supabase imports so vitest can run it.
//
// A workout_records row is one exercise (and set type) on one day, holding the
// top set: `current_weight` × `actual_reps`. For reps- or seconds-based
// exercises the value lives in `current_weight` too. A "session" here is every
// row sharing a `date_recorded`, which is the user's LOCAL calendar day.

export interface RecordRow {
  date_recorded: string;
  workout_plan_id: string;
  exercise_name: string;
  set_type: string | null;
  current_weight: number;
  actual_reps: number | null;
  previous_best: number | null;
  previous_best_reps: number | null;
}

export interface SessionExercise {
  exercise: string;
  set_type: string;
  weight: number;
  reps: number | null;
  previous_best: { weight: number; reps: number | null } | null;
  is_pr: boolean;
}

export interface Session {
  date: string;
  plan_days: string[];
  exercises: SessionExercise[];
}

export interface WeekSummary {
  /** Monday of the week, `YYYY-MM-DD`. */
  week_start: string;
  sessions: number;
  dates: string[];
}

/**
 * Whether this set beat the best logged on earlier days. Mirrors `isBetter` in
 * useWorkoutRecords: heavier wins, equal weight goes to more reps. A first-ever
 * set has nothing to beat, so it is not a PR.
 */
export const isPersonalRecord = (row: RecordRow): boolean => {
  if (row.previous_best === null) return false;
  const weight = Number(row.current_weight);
  const best = Number(row.previous_best);
  if (weight > best) return true;
  return weight === best && (row.actual_reps ?? 0) > (row.previous_best_reps ?? 0);
};

/** Rows grouped into one session per day, oldest first. */
export const groupSessions = (rows: RecordRow[], planNames: Record<string, string>): Session[] => {
  const byDate = new Map<string, RecordRow[]>();
  for (const row of rows) {
    const list = byDate.get(row.date_recorded) ?? [];
    list.push(row);
    byDate.set(row.date_recorded, list);
  }

  return [...byDate.keys()].sort().map((date) => {
    const dayRows = byDate.get(date)!;
    const planDays = [...new Set(dayRows.map((r) => planNames[r.workout_plan_id] ?? 'Unknown'))];
    return {
      date,
      plan_days: planDays,
      exercises: dayRows.map((r) => ({
        exercise: r.exercise_name,
        set_type: r.set_type || 'standard',
        weight: Number(r.current_weight),
        reps: r.actual_reps,
        previous_best:
          r.previous_best === null
            ? null
            : { weight: Number(r.previous_best), reps: r.previous_best_reps },
        is_pr: isPersonalRecord(r),
      })),
    };
  });
};

const parseDay = (key: string): Date => new Date(`${key}T00:00:00Z`);
const formatDay = (d: Date): string => d.toISOString().slice(0, 10);

/** The Monday on or before `key`, both as `YYYY-MM-DD`. */
export const weekStart = (key: string): string => {
  const d = parseDay(key);
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - sinceMonday);
  return formatDay(d);
};

/**
 * Sessions per Monday-to-Sunday week, for every week touching `from`..`to`,
 * including weeks with none — a zero week is exactly what a check-in needs to
 * see.
 */
export const weeklySummary = (sessions: Session[], from: string, to: string): WeekSummary[] => {
  const weeks: WeekSummary[] = [];
  const end = parseDay(to);
  for (let d = parseDay(weekStart(from)); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
    weeks.push({ week_start: formatDay(d), sessions: 0, dates: [] });
  }
  const index = new Map(weeks.map((w) => [w.week_start, w]));
  for (const s of sessions) {
    const week = index.get(weekStart(s.date));
    if (!week) continue;
    week.sessions += 1;
    week.dates.push(s.date);
  }
  return weeks;
};

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** A valid `YYYY-MM-DD` that is a real calendar day. */
export const isDayKey = (value: string): boolean =>
  DAY_KEY.test(value) && formatDay(parseDay(value)) === value;

/** `key` shifted by `days`, as `YYYY-MM-DD`. */
export const addDays = (key: string, days: number): string => {
  const d = parseDay(key);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDay(d);
};
