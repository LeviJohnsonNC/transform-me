import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStats } from '@/hooks/useUserStats';
import { liftFor, scaleFor } from '@/lib/strengthStandards';
import {
  closestLevelUp,
  overallLevel,
  rateLoggedSets,
  scoreMuscles,
  scoreRegions,
  type LoggedRow,
} from '@/lib/progress';

export { rateLoggedSets, type LoggedRow };

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
