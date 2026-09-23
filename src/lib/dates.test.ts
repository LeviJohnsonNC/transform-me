import { describe, it, expect, vi, afterEach } from 'vitest';
import { toDateKey, todayKey } from '@/lib/dates';

// These tests only mean anything under a non-UTC zone. vitest.config.ts pins
// TZ to America/Los_Angeles precisely so this divergence is observable.
describe('toDateKey', () => {
  afterEach(() => vi.useRealTimers());

  it('reports the local calendar day, not the UTC one', () => {
    // 01:00 UTC on the 23rd is still 18:00 on the 22nd in Los Angeles.
    const evening = new Date('2026-09-23T01:00:00Z');
    expect(toDateKey(evening)).toBe('2026-09-22');
    // The bug this replaces: toISOString() would have said the 23rd.
    expect(evening.toISOString().split('T')[0]).toBe('2026-09-23');
  });

  it('agrees with UTC during the part of the day where they do not diverge', () => {
    const midday = new Date('2026-09-23T19:00:00Z'); // noon Pacific
    expect(toDateKey(midday)).toBe('2026-09-23');
    expect(midday.toISOString().split('T')[0]).toBe('2026-09-23');
  });

  it('holds across a month boundary, where the off-by-one is most visible', () => {
    expect(toDateKey(new Date('2026-10-01T02:00:00Z'))).toBe('2026-09-30');
  });

  it('formats as a zero-padded YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 11, 31, 12))).toBe('2026-12-31');
  });
});

describe('todayKey', () => {
  afterEach(() => vi.useRealTimers());

  it('is the local day of the current instant', () => {
    vi.useFakeTimers();
    // 00:30 UTC on the 24th — still the evening of the 23rd in Los Angeles,
    // which is exactly when a workout gets logged and misfiled.
    vi.setSystemTime(new Date('2026-09-24T00:30:00Z'));
    expect(todayKey()).toBe('2026-09-23');
  });

  it('matches toDateKey for the same instant', () => {
    vi.useFakeTimers();
    const now = new Date('2026-07-04T05:00:00Z');
    vi.setSystemTime(now);
    expect(todayKey()).toBe(toDateKey(now));
  });
});
