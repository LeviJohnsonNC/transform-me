import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { apiKeyPrefix, generateApiKey, hashApiKey } from '@/lib/apiTokens';

export interface ApiToken {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export const useApiTokens = () =>
  useQuery({
    queryKey: ['apiTokens'],
    queryFn: async (): Promise<ApiToken[]> => {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('id, name, token_prefix, created_at, last_used_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

/** Creates a key and resolves to the full key, which is never readable again. */
export const useCreateApiToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      const key = generateApiKey();
      const { error } = await supabase.from('api_tokens').insert({
        user_id: user.id,
        name,
        token_hash: await hashApiKey(key),
        token_prefix: apiKeyPrefix(key),
      });
      if (error) throw error;
      return key;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apiTokens'] }),
  });
};

export const useRevokeApiToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_tokens').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apiTokens'] }),
  });
};
