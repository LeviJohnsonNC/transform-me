// Where you were, so a cold launch can put you back there.
//
// Installed to the home screen, the app resumes from the iOS app switcher with
// everything intact — until iOS unloads it in the background, which it does
// freely. The next tap then starts from nothing: Today tab, today's date,
// Records day and tier unselected. Mid-workout, that means re-picking the day
// and tier every time you come back from the music app.
//
// So the few pieces of "where" are kept in localStorage and restored on launch,
// but only while they are fresh: come back the next morning and you should land
// on Today, not wherever you stopped last night.

import { todayKey } from '@/lib/dates';

const KEY = 'transform-me:resume';

/** How long after leaving the app a cold launch still restores where you were. */
export const RESUME_WINDOW_MS = 60 * 60 * 1000;

/** Routes worth returning to. Auth and password reset are deliberately absent. */
export const RESUMABLE_PATHS = ['/', '/history', '/records', '/settings'] as const;

export interface ResumeState {
  path?: string;
  selectedDate?: string;
  recordsDay?: number | null;
  recordsTier?: string | null;
  /** Records tab: logging sets, or the progress overview. */
  recordsView?: 'log' | 'progress';
  /** Last time the app was in use (updated on change and on going to background). */
  savedAt: number;
  /** The local day that was "today" when saved. */
  savedOnDay: string;
}

const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // private mode or blocked storage
  }
};

const readRaw = (): ResumeState | null => {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResumeState;
    return typeof parsed?.savedAt === 'number' ? parsed : null;
  } catch {
    return null;
  }
};

/** The saved state if it is recent enough to restore, else null. */
export const readResume = (now: number = Date.now()): ResumeState | null => {
  const state = readRaw();
  if (!state) return null;
  if (now - state.savedAt > RESUME_WINDOW_MS || now < state.savedAt) return null;
  return state;
};

/** Merge in a change and stamp it as the latest moment of use. */
export const writeResume = (patch: Partial<Omit<ResumeState, 'savedAt' | 'savedOnDay'>>): void => {
  const store = storage();
  if (!store) return;
  try {
    const next: ResumeState = { ...(readRaw() ?? {}), ...patch, savedAt: Date.now(), savedOnDay: todayKey() };
    store.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or blocked storage: resuming is a convenience, never worth an error.
  }
};

/** The route to reopen on a cold launch, or null to stay put. */
export const resumePath = (launchPath: string, now: number = Date.now()): string | null => {
  // Only a launch at the start URL is a "fresh open". A deep link means the
  // user asked for somewhere specific.
  if (launchPath !== '/') return null;
  const path = readResume(now)?.path;
  if (!path || path === '/') return null;
  return (RESUMABLE_PATHS as readonly string[]).includes(path) ? path : null;
};

/**
 * The date to show on launch. A saved date only survives if the day has not
 * rolled over since: leave at 11:50pm, come back at 12:10am, and "today" should
 * mean the new day rather than the one you were looking at.
 */
export const resumeSelectedDate = (now: number = Date.now()): string | null => {
  const state = readResume(now);
  if (!state?.selectedDate || state.savedOnDay !== todayKey()) return null;
  return state.selectedDate;
};

/**
 * Keep `savedAt` pointing at the moment you actually left. Without this it
 * would only move when something changed, and an hour spent on one screen
 * before switching away would already count as stale.
 */
export const installResumeHeartbeat = (): void => {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeResume({});
  });
};
