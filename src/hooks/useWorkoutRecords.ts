import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutRecord {
  id: string;
  workout_plan_id: string;
  exercise_name: string;
  current_weight: number;
  previous_best: number | null;
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
      const today = new Date().toISOString().split('T')[0];
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

      // previous_best stores the historical best (before today's entry)
      const previousBest = bestWeight;

      // Check if record exists for today
      const { data: todayRecord } = await supabase
        .from('workout_records')
        .select('id')
        .eq('workout_plan_id', recordData.workout_plan_id)
        .eq('exercise_name', recordData.exercise_name)
        .eq('set_type', setType)
        .eq('date_recorded', today)
        .single();

      if (todayRecord) {
        const { data, error } = await supabase
          .from('workout_records')
          .update({
            current_weight: recordData.current_weight,
            previous_best: previousBest,
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
    }
  });
};
