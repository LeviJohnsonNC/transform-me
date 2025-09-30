import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutRecord {
  id: string;
  workout_plan_id: string;
  exercise_name: string;
  current_weight: number;
  previous_best: number | null;
  actual_reps: number | null;
  date_recorded: string;
  created_at: string;
  updated_at: string;
}

interface UpdateRecordData {
  workout_plan_id: string;
  exercise_name: string;
  current_weight: number;
}

export const useWorkoutRecords = (workoutPlanId: string) => {
  return useQuery({
    queryKey: ['workoutRecords', workoutPlanId],
    queryFn: async (): Promise<WorkoutRecord[]> => {
      // Get the most recent record for each exercise
      const { data, error } = await supabase
        .from('workout_records')
        .select('*')
        .eq('workout_plan_id', workoutPlanId)
        .order('exercise_name, created_at', { ascending: false });

      if (error) throw error;
      
      // Group by exercise and keep only the most recent record for each
      const recordsByExercise = new Map<string, WorkoutRecord>();
      (data || []).forEach(record => {
        if (!recordsByExercise.has(record.exercise_name)) {
          recordsByExercise.set(record.exercise_name, record);
        }
      });
      
      return Array.from(recordsByExercise.values()).sort((a, b) => 
        a.exercise_name.localeCompare(b.exercise_name)
      );
    },
    enabled: !!workoutPlanId
  });
};

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordData: UpdateRecordData) => {
      const today = new Date().toISOString().split('T')[0];
      
      // For the previous_best, we'll use the current value being entered
      // This allows users to reset their best when changing weight/equipment
      const newBest = recordData.current_weight;

      // Check if record exists for today
      const { data: todayRecord } = await supabase
        .from('workout_records')
        .select('id')
        .eq('workout_plan_id', recordData.workout_plan_id)
        .eq('exercise_name', recordData.exercise_name)
        .eq('date_recorded', today)
        .single();

      if (todayRecord) {
        // Update existing record
        const { data, error } = await supabase
          .from('workout_records')
          .update({
            current_weight: recordData.current_weight,
            previous_best: newBest,
          })
          .eq('id', todayRecord.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new record
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
          .from('workout_records')
          .insert({
            workout_plan_id: recordData.workout_plan_id,
            exercise_name: recordData.exercise_name,
            current_weight: recordData.current_weight,
            previous_best: newBest,
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