// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const calls = vi.hoisted(() => ({
  select: [] as string[],
  eq: [] as Array<[string, unknown]>,
  rows: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/integrations/supabase/client', () => {
  const chain = {
    select(cols: string) {
      calls.select.push(cols);
      return chain;
    },
    eq(col: string, value: unknown) {
      calls.eq.push([col, value]);
      return Promise.resolve({ data: calls.rows, error: null });
    },
  };
  return { supabase: { from: () => chain } };
});

import { useLiftHistory } from '@/hooks/useWorkoutRecords';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useLiftHistory', () => {
  beforeEach(() => {
    calls.select = [];
    calls.eq = [];
    calls.rows = [];
  });

  it('reads every logged set of the exercise, on any plan day', async () => {
    calls.rows = [
      { current_weight: '225', actual_reps: 1 },
      { current_weight: 205, actual_reps: 10 },
    ];
    const { result } = renderHook(() => useLiftHistory('Bench Press'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Filtered by exercise only: not by plan, set type or date.
    expect(calls.eq).toEqual([['exercise_name', 'Bench Press']]);
    expect(calls.select).toEqual(['current_weight, actual_reps']);
    expect(result.current.data).toEqual([
      { weight: 225, reps: 1 },
      { weight: 205, reps: 10 },
    ]);
  });

  it('makes no request without a name', () => {
    renderHook(() => useLiftHistory(''), { wrapper });
    expect(calls.select).toEqual([]);
  });
});
