// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RESUME_WINDOW_MS,
  readResume,
  resumePath,
  resumeSelectedDate,
  writeResume,
} from '@/lib/resumeState';

const MINUTE = 60 * 1000;

describe('resumeState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    // Mid-afternoon Pacific (vitest pins TZ to America/Los_Angeles).
    vi.setSystemTime(new Date('2026-09-24T21:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  describe('resumePath', () => {
    it('reopens the tab you left recently', () => {
      writeResume({ path: '/records' });
      vi.advanceTimersByTime(20 * MINUTE);
      expect(resumePath('/')).toBe('/records');
    });

    it('starts on Today once you have been away past the window', () => {
      writeResume({ path: '/records' });
      vi.advanceTimersByTime(RESUME_WINDOW_MS + MINUTE);
      expect(resumePath('/')).toBeNull();
    });

    it('respects a deep link rather than overriding it', () => {
      writeResume({ path: '/records' });
      expect(resumePath('/history')).toBeNull();
    });

    it('never reopens a path that is not a main tab', () => {
      writeResume({ path: '/reset-password' });
      expect(resumePath('/')).toBeNull();
      writeResume({ path: '/auth' });
      expect(resumePath('/')).toBeNull();
    });

    it('does nothing when there is nothing saved', () => {
      expect(resumePath('/')).toBeNull();
    });
  });

  describe('resumeSelectedDate', () => {
    it('reopens the date you were looking at', () => {
      writeResume({ selectedDate: '2026-09-22' });
      vi.advanceTimersByTime(10 * MINUTE);
      expect(resumeSelectedDate()).toBe('2026-09-22');
    });

    it('lets "today" win once the day has rolled over, even inside the window', () => {
      // Saved at 11:50pm Pacific, reopened at 12:10am: the new day should show,
      // not the one that was "today" twenty minutes ago.
      vi.setSystemTime(new Date('2026-09-25T06:50:00Z')); // 11:50pm on the 24th, Pacific
      writeResume({ selectedDate: '2026-09-24' });
      vi.advanceTimersByTime(20 * MINUTE); // 12:10am on the 25th
      expect(readResume()).not.toBeNull(); // still inside the window...
      expect(resumeSelectedDate()).toBeNull(); // ...but the day changed
    });
  });

  describe('writeResume', () => {
    it('merges rather than replaces, so one screen does not erase another', () => {
      writeResume({ path: '/records' });
      writeResume({ recordsDay: 2, recordsTier: 'good' });
      expect(readResume()).toMatchObject({ path: '/records', recordsDay: 2, recordsTier: 'good' });
    });

    it('refreshes the timestamp on every write, which is what the heartbeat relies on', () => {
      writeResume({ path: '/records' });
      vi.advanceTimersByTime(RESUME_WINDOW_MS - MINUTE);
      writeResume({}); // what going to the background does
      vi.advanceTimersByTime(30 * MINUTE);
      expect(resumePath('/')).toBe('/records');
    });
  });

  describe('robustness', () => {
    it('ignores a corrupted entry instead of throwing', () => {
      localStorage.setItem('transform-me:resume', '{not json');
      expect(readResume()).toBeNull();
      expect(resumePath('/')).toBeNull();
    });

    it('ignores a timestamp from the future, e.g. after the clock moved back', () => {
      writeResume({ path: '/records' });
      vi.setSystemTime(new Date('2026-09-24T20:00:00Z')); // an hour earlier
      expect(resumePath('/')).toBeNull();
    });
  });
});
