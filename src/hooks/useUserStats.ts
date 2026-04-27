import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Gender } from '@/lib/strengthStandards';

export interface UserStats {
  user_id: string;
  gender: Gender;
  age: number;
  bodyweight_lbs: number;
}

export const useUserStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: async (): Promise<UserStats | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_stats')
        .select('user_id, gender, age, bodyweight_lbs')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        user_id: data.user_id,
        gender: data.gender as Gender,
        age: data.age,
        bodyweight_lbs: Number(data.bodyweight_lbs),
      };
    },
  });
};

export const useUpsertUserStats = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gender: Gender; age: number; bodyweight_lbs: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_stats')
        .upsert({ user_id: user.id, ...input }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['userStats'] });
    },
  });
};
