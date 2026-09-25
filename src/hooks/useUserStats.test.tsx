// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Records what the hooks send to PostgREST. Only the calls these hooks make.
const calls = vi.hoisted(() => ({
  select: [] as string[],
  upsert: [] as Array<Record<string, unknown>>,
  row: null as Record<string, unknown> | null,
}));

vi.mock('@/integrations/supabase/client', () => {
  const chain = {
    select(cols: string) {
      calls.select.push(cols);
      return chain;
    },
    eq: () => chain,
    maybeSingle: async () => ({ data: calls.row, error: null }),
    single: async () => ({ data: {}, error: null }),
    upsert(row: Record<string, unknown>) {
      calls.upsert.push(row);
      return chain;
    },
  };
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => chain,
    },
  };
});

import { useUpsertUserStats, useUserStats } from '@/hooks/useUserStats';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useUserStats', () => {
  beforeEach(() => {
    calls.select = [];
    calls.upsert = [];
    calls.row = null;
  });

  it('reads every column, so a database without rating_scale still loads', async () => {
    // Before its migration runs the column is simply absent from the row.
    calls.row = { user_id: 'u1', gender: 'male', age: 30, bodyweight_lbs: '180' };
    const { result } = renderHook(() => useUserStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calls.select).toEqual(['*']);
    expect(result.current.data).toMatchObject({ gender: 'male', bodyweight_lbs: 180, rating_scale: null });
  });

  it('ignores a scale value it does not recognise', async () => {
    calls.row = { user_id: 'u1', gender: 'other', age: 30, bodyweight_lbs: 150, rating_scale: 'both' };
    const { result } = renderHook(() => useUserStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.rating_scale).toBeNull();
  });

  it('sends rating_scale only for "prefer not to say"', async () => {
    const { result } = renderHook(() => useUpsertUserStats(), { wrapper });
    await act(() => result.current.mutateAsync({ gender: 'male', age: 30, bodyweight_lbs: 180, rating_scale: null }));
    await act(() => result.current.mutateAsync({ gender: 'other', age: 30, bodyweight_lbs: 150, rating_scale: 'female' }));
    expect(calls.upsert[0]).not.toHaveProperty('rating_scale');
    expect(calls.upsert[1]).toMatchObject({ gender: 'other', rating_scale: 'female' });
  });
});
