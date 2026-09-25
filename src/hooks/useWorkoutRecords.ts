import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { todayKey } from '@/lib/dates';

interface WorkoutRecord {
  id: string;
  workout_plan_id: string;
  exercise_name: string;
  current_weight: number;
  previous_best: number | null;
  previous_best_reps: number | null;
  actual_reps: number | null;
  set_type: string;
  date_recorded: string;
  created_at: string;
  updated_at: string;
}

interface UpdateRecordData {
  workout_plan_id: string;
  exercise_name: string;
  current_weight: number;
  actual_reps: number | null;
  set_type: string;
}

const recordKey = (exerciseName: string, setType: string) => `${exerciseName}::${setType}`;

export const useWorkoutRecords = (workoutPlanId: string) => {
  return useQuery({
    queryKey: ['workoutRecords', workoutPlanId],
    queryFn: async (): Promise<WorkoutRecord[]> => {
      const { data, error } = await supabase
        .from('workout_records')
        .select('*')
        .eq('workout_plan_id', workoutPlanId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const recordsByKey = new Map<string, WorkoutRecord>();
      (data || []).forEach(record => {
        const key = recordKey(record.exercise_name, record.set_type || 'standard');
        if (!recordsByKey.has(key)) {
          recordsByKey.set(key, record);
        }
      });
      
      return Array.from(recordsByKey.values());
    },
    enabled: !!workoutPlanId
  });
};

/** One logged set, as far as the strength rating is concerned. */
export interface LoggedSet {
  weight: number;
  reps: number | null;
}

/**
 * Every set of this exercise the user has logged, on any day of any plan.
 *
 * The 1–10 rating wants the strongest set ever, which the records alone cannot
 * give: `previous_best` keeps only the heaviest earlier set, so 205×10 on an
 * earlier day lost to 225×1 for good, and a card only sees its own plan day.
 * Row-level security scopes this to the user.
 */
export const useLiftHistory = (exerciseName: string) => {
  return useQuery({
    queryKey: ['liftHistory', exerciseName],
    queryFn: async (): Promise<LoggedSet[]> => {
      const { data, error } = await supabase
        .from('workout_records')
        .select('current_weight, actual_reps')
        .eq('exercise_name', exerciseName);
      if (error) throw error;
      return (data || []).map((r) => ({ weight: Number(r.current_weight), reps: r.actual_reps }));
    },
    enabled: !!exerciseName,
  });
};

/**
 * The plan days with a set logged today, as a set of workout_plan ids, for the
 * dot under each day in the day selector. "Today" is the local day, the same
 * key the records are filed under.
 */
export const useLoggedToday = () => {
  const today = todayKey();
  return useQuery({
    queryKey: ['loggedToday', today],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('workout_records')
        .select('workout_plan_id')
        .eq('date_recorded', today);
      if (error) throw error;
      return new Set((data || []).map((r) => r.workout_plan_id));
    },
  });
};

// Determine if candidate is better than current best
// For lbs exercises: higher weight wins, then higher reps as tiebreaker
// For reps/seconds exercises (stored in current_weight): higher value wins
function isBetter(
  candidateWeight: number,
  candidateReps: number | null,
  bestWeight: number,
  bestReps: number | null
): boolean {
  if (candidateWeight > bestWeight) return true;
  if (candidateWeight === bestWeight && (candidateReps || 0) > (bestReps || 0)) return true;
  return false;
}

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordData: UpdateRecordData) => {
      // Local day, not UTC. `toISOString()` here filed an evening lift under
      // tomorrow west of UTC, which both split the day's row in two and let the
      // "previous best" query below count sets logged earlier the same evening.
      const today = todayKey();
      const setType = recordData.set_type || 'standard';

      // Fetch all historical records for this exercise+set_type (excluding today)
      const { data: historicalRecords } = await supabase
        .from('workout_records')
        .select('current_weight, actual_reps')
        .eq('workout_plan_id', recordData.workout_plan_id)
        .eq('exercise_name', recordData.exercise_name)
        .eq('set_type', setType)
        .neq('date_recorded', today)
        .order('created_at', { ascending: false });

      // Find the all-time best from historical records
      let bestWeight: number | null = null;
      let bestReps: number | null = null;
      
      if (historicalRecords && historicalRecords.length > 0) {
        bestWeight = historicalRecords[0].current_weight;
        bestReps = historicalRecords[0].actual_reps;
        
        for (const rec of historicalRecords) {
          if (isBetter(rec.current_weight, rec.actual_reps, bestWeight!, bestReps)) {
            bestWeight = rec.current_weight;
            bestReps = rec.actual_reps;
          }
        }
      }

      const previousBest = bestWeight;
      const previousBestReps = bestReps;

      // Check if record exists for today
      const { data: todayRecord } = await supabase
        .from('workout_records')
        .select('id')
        .eq('workout_plan_id', recordData.workout_plan_id)
        .eq('exercise_name', recordData.exercise_name)
        .eq('set_type', setType)
        .eq('date_recorded', today)
        // 0-or-1 is the expected shape, so `single()` (which errors on zero rows)
        // was relying on the error being swallowed. Taking the newest row also
        // means a day that already holds duplicates gets updated rather than
        // growing another one.
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (todayRecord) {
        const { data, error } = await supabase
          .from('workout_records')
          .update({
            current_weight: recordData.current_weight,
            previous_best: previousBest,
            previous_best_reps: previousBestReps,
            actual_reps: recordData.actual_reps,
          })
          .eq('id', todayRecord.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
          .from('workout_records')
          .insert({
            workout_plan_id: recordData.workout_plan_id,
            exercise_name: recordData.exercise_name,
            current_weight: recordData.current_weight,
            previous_best: previousBest,
            previous_best_reps: previousBestReps,
            actual_reps: recordData.actual_reps,
            set_type: setType,
            date_recorded: today,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workoutRecords', data.workout_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['liftHistory', data.exercise_name] });
      queryClient.invalidateQueries({ queryKey: ['loggedToday'] });
      queryClient.invalidateQueries({ queryKey: ['allLoggedSets'] });
    }
  });
};
