// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The exercise list and its saves come from Supabase; stand it in with a
// table of rows and record what gets written.
const { rows, updates } = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{ id: string; patch: Record<string, unknown> }>,
}));

vi.mock('@/integrations/supabase/client', () => {
  const select = () => {
    const chain: Record<string, unknown> = {};
    chain.eq = () => chain;
    chain.order = () => Promise.resolve({ data: rows, error: null });
    return chain;
  };
  return {
    supabase: {
      from: () => ({
        select,
        update: (patch: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => ({
            select: () => ({
              single: () => {
                updates.push({ id, patch });
                return Promise.resolve({ data: { id, workout_plan_id: 'p1', ...patch }, error: null });
              },
            }),
          }),
        }),
      }),
    },
  };
});

import { ExerciseSelector } from '@/components/ExerciseSelector';

const plan = { id: 'p1', day_number: 1, day_name: 'Chest + Arms', created_at: '', updated_at: '' };

const renderSelector = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ExerciseSelector workoutPlan={plan} onBack={() => {}} />
    </QueryClientProvider>,
  );

describe('editing an exercise', () => {
  beforeEach(() => {
    rows.length = 0;
    updates.length = 0;
    rows.push({
      id: 'x1', workout_plan_id: 'p1', exercise_name: 'Bench Press', tier: 'good', order_index: 0,
      sets: 1, reps: 5, reps_high: null, rep_type: 'fixed',
      backoff_sets: 3, backoff_reps: 8, backoff_reps_high: null, notes: null,
    });
  });
  afterEach(cleanup);

  it('widens a backoff to a rep range and saves it', async () => {
    renderSelector();
    expect(await screen.findByText('1×5, then 3×8')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Bench Press' }));
    const backoffHigh = screen.getAllByRole('spinbutton')[5] as HTMLInputElement;
    expect(backoffHigh.value).toBe('');
    fireEvent.change(backoffHigh, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0].id).toBe('x1');
    expect(updates[0].patch).toMatchObject({ sets: 1, reps: 5, backoff_sets: 3, backoff_reps: 8, backoff_reps_high: 10 });
  });

  it('starts from the saved values and discards them on cancel', async () => {
    renderSelector();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Bench Press' }));
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs.map((i) => i.value)).toEqual(['1', '5', '', '3', '8', '']);

    fireEvent.change(inputs[4], { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(updates).toHaveLength(0);
    expect(screen.getByText('1×5, then 3×8')).toBeTruthy();
  });
});
