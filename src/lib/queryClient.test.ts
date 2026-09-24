import { describe, it, expect } from 'vitest';
import { createAppQueryClient, retryTransientOnly } from '@/lib/queryClient';

describe('retryTransientOnly', () => {
  it('gives up immediately on errors a retry cannot fix', () => {
    // A row-level-security refusal or an expired token will refuse the fourth
    // attempt exactly as it refused the first — retrying only makes the user
    // wait ~7s of backoff for the same failure.
    for (const status of [400, 401, 403, 404, 405, 409, 422]) {
      expect(retryTransientOnly(0, { status }), `status ${status}`).toBe(false);
    }
  });

  it('retries the ones that plausibly succeed next time', () => {
    for (const status of [408, 429, 500, 502, 503, 504]) {
      expect(retryTransientOnly(0, { status }), `status ${status}`).toBe(true);
    }
  });

  it('retries an error carrying no status, which is what a dropped connection looks like', () => {
    expect(retryTransientOnly(0, new Error('Failed to fetch'))).toBe(true);
    expect(retryTransientOnly(0, undefined)).toBe(true);
    expect(retryTransientOnly(0, null)).toBe(true);
    expect(retryTransientOnly(0, 'weird')).toBe(true);
  });

  it('reads a status that PostgREST put in `code` as a string', () => {
    expect(retryTransientOnly(0, { code: '401' })).toBe(false);
    expect(retryTransientOnly(0, { code: '503' })).toBe(true);
  });

  it('ignores a non-numeric `code`, rather than reading it as a status', () => {
    // Postgres error codes look like '23505' and '42P10'. Neither is an HTTP
    // status and neither should be treated as one.
    expect(retryTransientOnly(0, { code: '23505' })).toBe(true);
    expect(retryTransientOnly(0, { code: '42P10' })).toBe(true);
  });

  it('stops after three attempts', () => {
    expect(retryTransientOnly(2, new Error('boom'))).toBe(true);
    expect(retryTransientOnly(3, new Error('boom'))).toBe(false);
    expect(retryTransientOnly(9, new Error('boom'))).toBe(false);
  });
});

describe('createAppQueryClient', () => {
  const defaults = () => createAppQueryClient().getDefaultOptions();

  it('does not refetch everything on every mount', () => {
    expect(defaults().queries?.staleTime).toBeGreaterThan(0);
  });

  it('never retries mutations', () => {
    // Load-bearing. `useToggleHabit` flips a habit rather than setting it, so a
    // retry after a lost response would read the new state and flip it back.
    expect(defaults().mutations?.retry).toBe(0);
  });

  it('keeps backgrounded data longer than it keeps it fresh', () => {
    const { gcTime, staleTime } = defaults().queries as { gcTime: number; staleTime: number };
    expect(gcTime).toBeGreaterThan(staleTime);
  });
});
