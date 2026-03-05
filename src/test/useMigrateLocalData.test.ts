import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------
const mockInsert = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: (...args: any[]) => mockGetUser(...args),
    },
    from: () => ({
      insert: (data: any) => {
        mockInsert(data);
        return {
          select: () => ({
            data: Array.isArray(data) ? data.map((d: any, i: number) => ({ ...d, id: `server-${i}` })) : [],
            error: null,
          }),
        };
      },
    }),
  },
}));

// ---------------------------------------------------------------------------
// Helper: render hook inside a QueryClientProvider
// ---------------------------------------------------------------------------
const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const fakeUser = { id: 'user-123' };

const LOCAL_STORAGE_KEY = 'transform-habits';

const makeLocalEntries = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `local-${i}`,
    habitId: `habit-${i}`,
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    completed: true,
    completedAt: `2024-01-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`,
    notes: null,
  }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockGetUser.mockResolvedValue({ data: { user: fakeUser } });
});

afterEach(() => {
  localStorage.clear();
});

describe('useMigrateLocalData', () => {
  // Lazy import to avoid hoisting issues with vi.mock
  const getHook = async () => {
    const { useMigrateLocalData } = await import('@/hooks/useHabits');
    return useMigrateLocalData;
  };

  it('returns { migrated: 0 } when localStorage key is absent', async () => {
    const useMigrateLocalData = await getHook();
    const { result } = renderHook(() => useMigrateLocalData(), { wrapper: createWrapper() });

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.mutateAsync();
    });

    expect(returnValue).toEqual({ migrated: 0 });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns { migrated: 0 } when entries array is empty', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ state: { entries: [] } }));
    const useMigrateLocalData = await getHook();
    const { result } = renderHook(() => useMigrateLocalData(), { wrapper: createWrapper() });

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.mutateAsync();
    });

    expect(returnValue).toEqual({ migrated: 0 });
  });

  it('maps local HabitEntry fields to Supabase insert shape with user_id', async () => {
    const entries = makeLocalEntries(2);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ state: { entries } }));

    const useMigrateLocalData = await getHook();
    const { result } = renderHook(() => useMigrateLocalData(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync();
    });

    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted[0]).toMatchObject({
      habit_id: 'habit-0',
      date: '2024-01-01',
      completed: true,
      user_id: 'user-123',
    });
    expect(inserted[0]).not.toHaveProperty('habitId');
  });

  it('removes the localStorage key after successful migration', async () => {
    const entries = makeLocalEntries(1);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ state: { entries } }));

    const useMigrateLocalData = await getHook();
    const { result } = renderHook(() => useMigrateLocalData(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
  });

  it('throws (and does not remove localStorage) when JSON is corrupted', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'NOT_VALID_JSON');

    const useMigrateLocalData = await getHook();
    const { result } = renderHook(() => useMigrateLocalData(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync();
      } catch {
        // expected
      }
    });

    // localStorage should NOT have been cleared — the migration failed
    // NOTE: This test documents a bug: JSON.parse is unguarded and the error
    // is not caught, so the mutation throws instead of returning gracefully.
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe('NOT_VALID_JSON');
  });
});
