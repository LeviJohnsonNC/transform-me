// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// A gate that holds the first await inside the toggle's mutationFn, so a save
// can be observed mid-flight. Hoisted because vi.mock is hoisted above imports.
// `reset` re-arms it, since each test needs its own un-released gate.
const gate = vi.hoisted(() => {
  const g: { held: Promise<void>; release: () => void; reset: () => void } = {
    held: Promise.resolve(),
    release: () => {},
    reset: () => {},
  };
  g.reset = () => {
    g.held = new Promise<void>((resolve) => {
      g.release = resolve;
    });
  };
  g.reset();
  return g;
});

vi.mock('@/integrations/supabase/client', () => {
  // Minimal chainable stand-in for the query builder. Every filter method
  // returns the same object; the terminal methods resolve.
  const builder = () => {
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'insert', 'update', 'order', 'limit']) {
      chain[method] = () => chain;
    }
    chain.maybeSingle = async () => ({ data: null, error: null }); // no existing row
    chain.single = async () => ({
      data: {
        id: 'new-row',
        habit_id: 'a',
        date: '2026-09-21',
        completed: true,
        completed_at: null,
        notes: null,
      },
      error: null,
    });
    return chain;
  };

  return {
    supabase: {
      auth: {
        getUser: async () => {
          await gate.held; // hold the mutation here
          return { data: { user: { id: 'user-1' } } };
        },
      },
      from: () => builder(),
    },
  };
});

// Imported after the mock so the hooks pick up the stubbed client.
const { useToggleHabit, usePendingHabitToggles, toggleKey } = await import('@/hooks/useHabits');

const DATE = '2026-09-21';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const setup = () =>
  renderHook(
    () => ({ toggle: useToggleHabit(), pending: usePendingHabitToggles() }),
    { wrapper },
  );

describe('usePendingHabitToggles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gate.reset();
  });

  it('starts with nothing pending', () => {
    const { result } = setup();
    expect(result.current.pending.size).toBe(0);
  });

  it('reports only the habit actually being saved', async () => {
    const { result } = setup();

    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });

    await waitFor(() => expect(result.current.pending.size).toBe(1));

    // This is the regression: habit 'a' is mid-save, so it is gated...
    expect(result.current.pending.has(toggleKey('a', DATE))).toBe(true);
    // ...but every other habit on the screen stays tappable.
    expect(result.current.pending.has(toggleKey('b', DATE))).toBe(false);
    expect(result.current.pending.has(toggleKey('c', DATE))).toBe(false);

    gate.release();
    await waitFor(() => expect(result.current.pending.size).toBe(0));
  });

  it('tracks the same habit on different dates separately', async () => {
    const { result } = setup();

    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });
    await waitFor(() => expect(result.current.pending.size).toBe(1));

    // Yesterday's cell for the same habit is a different save.
    expect(result.current.pending.has(toggleKey('a', '2026-09-20'))).toBe(false);

    gate.release();
    await waitFor(() => expect(result.current.pending.size).toBe(0));
  });

  it('clears once the save settles', async () => {
    const { result } = setup();

    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });
    await waitFor(() => expect(result.current.pending.has(toggleKey('a', DATE))).toBe(true));

    gate.release();

    await waitFor(() => expect(result.current.pending.has(toggleKey('a', DATE))).toBe(false));
  });
});
