import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WorkoutPlan } from '@/components/DayPlanCard';

interface WorkoutExercise {
  id: string;
  workout_plan_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface AddExerciseData {
  workout_plan_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  order_index: number;
}

interface UpdateExerciseData {
  id: string;
  sets?: number;
  reps?: number;
}

export const useWorkoutPlans = () => {
  return useQuery({
    queryKey: ['workoutPlans'],
    queryFn: async (): Promise<WorkoutPlan[]> => {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .order('day_number');

      if (error) throw error;
      return data || [];
    }
  });
};

export const useWorkoutExercises = (workoutPlanId: string) => {
  return useQuery({
    queryKey: ['workoutExercises', workoutPlanId],
    queryFn: async (): Promise<WorkoutExercise[]> => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_plan_id', workoutPlanId)
        .order('order_index');

      if (error) throw error;
      return data || [];
    },
    enabled: !!workoutPlanId
  });
};

export const useAddExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exerciseData: AddExerciseData) => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert(exerciseData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workoutExercises', data.workout_plan_id] });
    }
  });
};

export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateExerciseData) => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workoutExercises', data.workout_plan_id] });
    }
  });
};

export const useRemoveExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exerciseId: string) => {
      // First get the workout_plan_id before deleting
      const { data: exercise } = await supabase
        .from('workout_exercises')
        .select('workout_plan_id')
        .eq('id', exerciseId)
        .single();

      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;
      return exercise?.workout_plan_id;
    },
    onSuccess: (workoutPlanId) => {
      if (workoutPlanId) {
        queryClient.invalidateQueries({ queryKey: ['workoutExercises', workoutPlanId] });
      }
    }
  });
};