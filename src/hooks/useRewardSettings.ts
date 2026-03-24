import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RewardSetting {
  id: string;
  type: 'standard' | 'boss';
  title: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export const useRewardSettings = () => {
  return useQuery({
    queryKey: ['reward-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_settings')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as RewardSetting[];
    },
  });
};

export const useAddReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reward: { type: 'standard' | 'boss'; title: string; description?: string; sort_order: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reward_settings')
        .insert({ ...reward, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-settings'] });
      queryClient.invalidateQueries({ queryKey: ['boss-reward-setting'] });
    },
  });
};

export const useUpdateReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ title: string; description: string; is_active: boolean; sort_order: number }> }) => {
      const { data, error } = await supabase
        .from('reward_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-settings'] });
      queryClient.invalidateQueries({ queryKey: ['boss-reward-setting'] });
    },
  });
};

export const useDeleteReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reward_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-settings'] });
      queryClient.invalidateQueries({ queryKey: ['boss-reward-setting'] });
    },
  });
};
