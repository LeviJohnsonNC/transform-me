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

// Composite key for grouping records
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
      
      // Group by exercise_name + set_type and keep only the most recent record for each
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

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordData: UpdateRecordData) => {
      const today = new Date().toISOString().split('T')[0];
      const setType = recordData.set_type || 'standard';
      
      // The new best is the current value being entered
      const newBest = recordData.current_weight;

      // Check if record exists for today with this exercise + set_type
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
            previous_best: newBest,
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
            previous_best: newBest,
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
