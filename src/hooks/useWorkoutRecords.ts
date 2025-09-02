import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutRecord {
  id: string;
  workout_plan_id: string;
  exercise_name: string;
  current_weight: number;
  previous_best: number | null;
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
      const { data, error } = await supabase
        .from('workout_records')
        .select('*')
        .eq('workout_plan_id', workoutPlanId)
        .eq('date_recorded', new Date().toISOString().split('T')[0])
        .order('exercise_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!workoutPlanId
  });
};

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordData: UpdateRecordData) => {
      const today = new Date().toISOString().split('T')[0];
      
      // First, get the current best for this exercise
      const { data: existingRecords } = await supabase
        .from('workout_records')
        .select('previous_best')
        .eq('workout_plan_id', recordData.workout_plan_id)
        .eq('exercise_name', recordData.exercise_name)
        .order('created_at', { ascending: false })
        .limit(1);

      const currentBest = existingRecords?.[0]?.previous_best || null;
      
      // Determine if this is a new personal best
      const isNewBest = !currentBest || recordData.current_weight > currentBest;
      const newBest = isNewBest ? recordData.current_weight : currentBest;

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
        const { data, error } = await supabase
          .from('workout_records')
          .insert({
            workout_plan_id: recordData.workout_plan_id,
            exercise_name: recordData.exercise_name,
            current_weight: recordData.current_weight,
            previous_best: newBest,
            date_recorded: today,
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