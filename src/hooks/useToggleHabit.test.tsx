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

// A small stand-in for PostgREST rather than a chain of no-ops. It holds rows,
// applies `eq` filters, and — crucially — is *thenable*, so `await builder` runs
// the query the way supabase-js does. The previous version returned the chain
// from every method with no `then`, so awaiting it yielded the builder itself
// and every destructured `{ data, error }` was undefined: the tests passed
// without the query ever running.
const db = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  insertError: null as { code: string; message: string } | null,
  // Row the losing writer finds once its insert is rejected. Added AT insert
  // time, not seeded up front, because the whole point of the race is that the
  // winner commits after our read has already come back empty.
  conflictRow: null as Record<string, unknown> | null,
  nextId: 1,
  reset() {
    this.rows = [];
    this.insertError = null;
    this.conflictRow = null;
    this.nextId = 1;
  },
}));

vi.mock('@/integrations/supabase/client', () => {
  const builder = () => {
    let op: 'select' | 'insert' | 'update' = 'select';
    let payload: Record<string, unknown> | null = null;
    let limitN: number | null = null;
    const filters: Array<[string, unknown]> = [];

    const match = () => db.rows.filter((r) => filters.every(([c, v]) => r[c] === v));

    const run = () => {
      if (op === 'insert') {
        if (db.insertError) {
          if (db.conflictRow) db.rows.push(db.conflictRow);
          return { data: [], error: db.insertError };
        }
        const row = { id: `row-${db.nextId++}`, notes: null, created_at: new Date().toISOString(), ...payload };
        db.rows.push(row);
        return { data: [row], error: null };
      }
      if (op === 'update') {
        const hit = match();
        hit.forEach((r) => Object.assign(r, payload));
        return { data: hit, error: null };
      }
      const rows = match();
      return { data: limitN === null ? rows : rows.slice(0, limitN), error: null };
    };

    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.order = () => b;
    b.eq = (col: string, val: unknown) => { filters.push([col, val]); return b; };
    b.limit = (n: number) => { limitN = n; return b; };
    b.insert = (row: Record<string, unknown>) => { op = 'insert'; payload = row; return b; };
    b.update = (patch: Record<string, unknown>) => { op = 'update'; payload = patch; return b; };
    // Thenable: this is what makes `await supabase.from(...).select()...` work.
    b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve(run()).then(res, rej);
    b.single = async () => {
      const { data, error } = run();
      if (error) return { data: null, error };
      if (data.length !== 1) return { data: null, error: { code: 'PGRST116', message: 'multiple (or no) rows returned' } };
      return { data: data[0], error: null };
    };
    // Mirrors PostgREST: fine with zero or one row, an ERROR on more than one.
    b.maybeSingle = async () => {
      const { data, error } = run();
      if (error) return { data: null, error };
      if (data.length > 1) return { data: null, error: { code: 'PGRST116', message: 'multiple rows returned' } };
      return { data: data[0] ?? null, error: null };
    };
    return b;
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
    db.reset();
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

describe('useToggleHabit write path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gate.reset();
    db.reset();
  });

  it('completes the save and returns the new entry', async () => {
    // The three tests above only assert the pending gate, which settles whether
    // the mutation resolves OR rejects — so they stayed green when the write
    // called a builder method the mock did not stub. This one fails in that
    // case, which is what makes the mock's method list meaningful.
    const { result } = setup();

    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });
    await waitFor(() => expect(result.current.pending.size).toBe(1));

    gate.release();

    await waitFor(() => expect(result.current.toggle.isSuccess).toBe(true));
    expect(result.current.toggle.isError).toBe(false);
    expect(result.current.toggle.data).toMatchObject({
      habitId: 'a',
      date: DATE,
      completed: true,
    });
  });
});

describe('useToggleHabit with duplicate rows for one day', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gate.reset();
    db.reset();
  });

  const seedDuplicates = () => {
    // The shape that broke "Conditioning" and "Supplements": two rows for the
    // same habit and day, disagreeing with each other.
    db.rows.push(
      { id: 'dup-1', habit_id: 'a', date: DATE, user_id: 'user-1', completed: false, completed_at: null, notes: null, created_at: '2026-09-21T01:00:00Z' },
      { id: 'dup-2', habit_id: 'a', date: DATE, user_id: 'user-1', completed: true, completed_at: '2026-09-21T02:00:00Z', notes: null, created_at: '2026-09-21T02:00:00Z' },
    );
  };

  it('toggles instead of failing, where maybeSingle() would have errored', () => {
    // The regression. Reading the day with `.maybeSingle()` errors on two rows,
    // which threw, rolled the optimistic update back, and made the tile switch
    // straight off again.
    seedDuplicates();
    const { result } = setup();

    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });
    gate.release();

    return waitFor(() => {
      expect(result.current.toggle.isError).toBe(false);
      expect(result.current.toggle.isSuccess).toBe(true);
    });
  });

  it('writes the new state to every duplicate, so none is left contradicting', async () => {
    seedDuplicates();
    const { result } = setup();

    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });
    gate.release();
    await waitFor(() => expect(result.current.toggle.isSuccess).toBe(true));

    // One row said done, so the day counted as done and the toggle turns it off
    // — and both rows have to follow, or the stale one keeps the tile lit.
    expect(db.rows.map((r) => r.completed)).toEqual([false, false]);
  });

  it('does not add another row when duplicates already exist', async () => {
    seedDuplicates();
    const { result } = setup();

    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });
    gate.release();
    await waitFor(() => expect(result.current.toggle.isSuccess).toBe(true));

    expect(db.rows).toHaveLength(2);
  });
});

describe('useToggleHabit losing an insert race', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gate.reset();
    db.reset();
  });

  it('adopts the winning row rather than surfacing the unique violation', async () => {
    // Both taps saw no row; the other one inserted first. 23505 comes back, and
    // its row is already the state this tap wanted.
    db.insertError = { code: '23505', message: 'duplicate key value violates unique constraint' };
    db.conflictRow = {
      id: 'winner', habit_id: 'a', date: DATE, user_id: 'user-1',
      completed: true, completed_at: '2026-09-21T02:00:00Z', notes: null,
      created_at: '2026-09-21T02:00:00Z',
    };

    const { result } = setup();
    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });
    gate.release();

    await waitFor(() => expect(result.current.toggle.isSuccess).toBe(true));
    expect(result.current.toggle.data).toMatchObject({ id: 'winner', completed: true });
  });

  it('still surfaces an insert failure that is not a race', async () => {
    db.insertError = { code: '42P10', message: 'no unique or exclusion constraint matching the ON CONFLICT specification' };
    const { result } = setup();

    act(() => {
      result.current.toggle.mutate({ habitId: 'a', date: DATE });
    });
    gate.release();

    await waitFor(() => expect(result.current.toggle.isError).toBe(true));
  });
});
