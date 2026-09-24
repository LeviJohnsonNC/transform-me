import { QueryClient } from '@tanstack/react-query';

/**
 * HTTP statuses where retrying cannot help: the request was understood and
 * refused. 408 (timeout) and 429 (rate limit) are deliberately absent — those
 * are worth another go.
 */
const TERMINAL_STATUSES = new Set([400, 401, 403, 404, 405, 409, 422]);

/** Pull a status off whatever shape the error arrived in. */
const statusOf = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') return null;
  const e = error as { status?: unknown; code?: unknown };
  if (typeof e.status === 'number') return e.status;
  // PostgREST puts its HTTP status in `code` as a string on some error shapes.
  if (typeof e.code === 'string' && /^\d{3}$/.test(e.code)) return Number(e.code);
  return null;
};

/**
 * Retry transient failures only.
 *
 * The library already retries queries three times (`retry ?? (isServer() ? 0 : 3)`
 * in query-core's retryer), so this does not add retries — it removes the
 * pointless ones. A 401 or a row-level-security refusal is not going to succeed
 * on the third attempt; it just makes the user wait ~7s for the same error.
 */
export const retryTransientOnly = (failureCount: number, error: unknown): boolean => {
  const status = statusOf(error);
  if (status !== null && TERMINAL_STATUSES.has(status)) return false;
  return failureCount < 3;
};

export const createAppQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // The default is 0, which makes every mount refetch. Nothing here
        // changes without this app changing it, and every mutation invalidates
        // what it touched, so a minute of trust costs nothing and stops a tab
        // switch re-fetching a year of habit entries.
        staleTime: 60_000,
        // Keep a backgrounded tab's data around long enough that coming back to
        // the app is instant rather than a spinner. Default is 5 minutes.
        gcTime: 30 * 60_000,
        retry: retryTransientOnly,
        // Left on deliberately: this is a phone app that gets resumed from the
        // background, often the next day. staleTime still gates it, so a quick
        // switch away and back does not refetch.
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Deliberately NOT retried, and this is the one default worth leaving
        // alone. `useToggleHabit` FLIPS a habit rather than setting it: if the
        // write lands but the response is lost, a retry reads the new state and
        // flips it straight back off. A failed save surfaces as a toast and a
        // reverted tile instead, which is recoverable by tapping again.
        retry: 0,
      },
    },
  });
