import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WorkoutPlan } from '@/components/DayPlanCard';

export type WorkoutTier = 'minimum' | 'good' | 'max';

interface WorkoutExercise {
  id: string;
  workout_plan_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  rep_type: 'fixed' | 'amrap';
  order_index: number;
  tier: WorkoutTier;
  reps_high: number | null;
  backoff_sets: number | null;
  backoff_reps: number | null;
  backoff_reps_high: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AddExerciseData {
  workout_plan_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  rep_type: 'fixed' | 'amrap';
  order_index: number;
  tier: WorkoutTier;
  reps_high?: number;
  backoff_sets?: number;
  backoff_reps?: number;
  backoff_reps_high?: number;
  notes?: string;
}

interface UpdateExerciseData {
  id: string;
  sets?: number;
  reps?: number;
  rep_type?: 'fixed' | 'amrap';
  reps_high?: number | null;
  backoff_sets?: number | null;
  backoff_reps?: number | null;
  backoff_reps_high?: number | null;
  notes?: string | null;
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

export const useWorkoutExercises = (workoutPlanId: string, tier: WorkoutTier = 'good') => {
  return useQuery({
    queryKey: ['workoutExercises', workoutPlanId, tier],
    queryFn: async (): Promise<WorkoutExercise[]> => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_plan_id', workoutPlanId)
        .eq('tier', tier)
        .order('order_index');

      if (error) throw error;
      return (data || []).map(exercise => ({
        ...exercise,
        rep_type: exercise.rep_type as 'fixed' | 'amrap',
        tier: exercise.tier as WorkoutTier,
      }));
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

export const useAddWorkoutDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dayName, dayNumber }: { dayName: string; dayNumber: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workout_plans')
        .insert({
          day_name: dayName,
          day_number: dayNumber,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
    }
  });
};

export const useRenameWorkoutDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dayName }: { id: string; dayName: string }) => {
      const { data, error } = await supabase
        .from('workout_plans')
        .update({ day_name: dayName })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
    }
  });
};

export const useDeleteWorkoutDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_plan_id', id);

      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['workoutExercises'] });
    }
  });
};

// Helper to format exercise prescription for display
export const formatExercisePrescription = (exercise: {
  sets: number;
  reps: number;
  rep_type: 'fixed' | 'amrap';
  reps_high?: number | null;
  backoff_sets?: number | null;
  backoff_reps?: number | null;
  backoff_reps_high?: number | null;
}): string => {
  const repsStr = exercise.reps_high
    ? `${exercise.reps}–${exercise.reps_high}`
    : `${exercise.reps}`;

  if (exercise.rep_type === 'amrap') {
    return `${exercise.sets} sets × AMRAP`;
  }

  if (exercise.backoff_sets && exercise.backoff_reps) {
    const backoffRepsStr = exercise.backoff_reps_high
      ? `${exercise.backoff_reps}–${exercise.backoff_reps_high}`
      : `${exercise.backoff_reps}`;
    return `1×${exercise.reps}, then ${exercise.backoff_sets}×${backoffRepsStr}`;
  }

  return `${exercise.sets} sets × ${repsStr} reps`;
};
