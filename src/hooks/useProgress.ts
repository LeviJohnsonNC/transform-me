import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStats } from '@/hooks/useUserStats';
import { bestForRating, unitFor } from '@/lib/recordMath';
import { getRating, liftFor, scaleFor, type RatingStats } from '@/lib/strengthStandards';
import {
  byLift,
  closestLevelUp,
  overallLevel,
  scoreMuscles,
  scoreRegions,
  type RatedLift,
} from '@/lib/progress';

export interface LoggedRow {
  exercise_name: string;
  current_weight: number;
  actual_reps: number | null;
}

// PostgREST caps a response at 1000 rows, so a long history is read in pages.
const PAGE = 1000;

/** Every set the user has logged, of any exercise. */
export const useAllLoggedSets = () =>
  useQuery({
    queryKey: ['allLoggedSets'],
    queryFn: async (): Promise<LoggedRow[]> => {
      const rows: LoggedRow[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from('workout_records')
          .select('exercise_name, current_weight, actual_reps')
          .order('id')
          .range(from, from + PAGE - 1);
        if (error) throw error;
        rows.push(...(data || []).map((r) => ({ ...r, current_weight: Number(r.current_weight) })));
        if (!data || data.length < PAGE) return rows;
      }
    },
  });

/** Rate every exercise the user has logged, the way its lift card would. */
export const rateLoggedSets = (rows: readonly LoggedRow[], stats: RatingStats) => {
  const byName = new Map<string, Array<{ weight: number; reps: number | null }>>();
  for (const r of rows) {
    if (!liftFor(r.exercise_name)) continue;
    const list = byName.get(r.exercise_name) ?? [];
    list.push({ weight: r.current_weight, reps: r.actual_reps });
    byName.set(r.exercise_name, list);
  }
  const rated: Array<Omit<RatedLift, 'key' | 'label'>> = [];
  for (const [name, history] of byName) {
    const unit = unitFor(name);
    const source = bestForRating([], unit, {
      history,
      score: (w, reps) => getRating(name, w, reps, stats)?.metric ?? -Infinity,
    });
    if (!source) continue;
    const rating = getRating(name, source.weight, source.reps, stats);
    if (!rating) continue;
    rated.push({
      name,
      unit,
      level: rating.level,
      weight: source.weight,
      reps: source.reps,
      metric: rating.metric,
      nextLevel: rating.nextLevel,
      nextThreshold: rating.nextThreshold,
    });
  }
  return byLift(rated);
};

/**
 * Everything the Progress view shows. `planned` names exercises on the plan,
 * so lifts you have set up but never logged show as untrained.
 */
export const useProgress = (planned: readonly string[] = []) => {
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: rows, isLoading: rowsLoading } = useAllLoggedSets();

  const summary = useMemo(() => {
    if (!stats || !rows || !scaleFor(stats)) return null;
    const lifts = rateLoggedSets(rows, stats);
    const ratedKeys = new Set(lifts.map((l) => l.key));
    const untrained = new Map<string, string>();
    for (const name of planned) {
      const lift = liftFor(name);
      if (lift && !ratedKeys.has(lift.key)) untrained.set(lift.key, lift.label);
    }
    const muscles = scoreMuscles(lifts);
    return {
      lifts,
      untrained: [...untrained.values()],
      muscles,
      regions: scoreRegions(muscles),
      overall: overallLevel(lifts),
      next: closestLevelUp(lifts, stats),
    };
  }, [stats, rows, planned]);

  return {
    summary,
    isLoading: statsLoading || rowsLoading,
    /** Why there is nothing to show, when there isn't. */
    missing: !statsLoading && !stats ? ('stats' as const) : stats && !scaleFor(stats) ? ('scale' as const) : null,
  };
};
