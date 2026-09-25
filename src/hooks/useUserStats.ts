import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Gender, RatingScale } from '@/lib/strengthStandards';

export interface UserStats {
  user_id: string;
  gender: Gender;
  age: number;
  bodyweight_lbs: number;
  rating_scale: RatingScale | null;
}

const asScale = (v: unknown): RatingScale | null => (v === 'male' || v === 'female' ? v : null);

export const useUserStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: async (): Promise<UserStats | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_stats')
        // `*` rather than a column list: rating_scale arrives with a migration,
        // and naming a column the database does not have yet would fail the
        // whole read and take every rating down with it.
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        user_id: data.user_id,
        gender: data.gender as Gender,
        age: data.age,
        bodyweight_lbs: Number(data.bodyweight_lbs),
        rating_scale: asScale(data.rating_scale),
      };
    },
  });
};

export const useUpsertUserStats = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gender: Gender; age: number; bodyweight_lbs: number; rating_scale: RatingScale | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_stats')
        // rating_scale is only sent when it means something, so saving a male
        // or female profile works even before the column's migration is run.
        .upsert(
          {
            user_id: user.id,
            gender: input.gender,
            age: input.age,
            bodyweight_lbs: input.bodyweight_lbs,
            ...(input.gender === 'other' ? { rating_scale: input.rating_scale } : {}),
          },
          { onConflict: 'user_id' },
        )
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
