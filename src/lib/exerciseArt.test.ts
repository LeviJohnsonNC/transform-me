import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_FOCUS,
  FOCUS_BY_SLUG,
  getExerciseArt,
  getExerciseArtFocus,
  getExerciseArtSlug,
  getLevelUpArt,
} from '@/lib/exerciseArt';

const PUBLIC_DIR = join(process.cwd(), 'public');
const EXERCISE_DIR = join(PUBLIC_DIR, 'art', 'exercise');

/** Every exercise name that reaches a rule, one per slug the resolver can return. */
const NAMES_BY_SLUG: Record<string, string> = {
  'close-grip-bench': 'Close-Grip Bench Press',
  'incline-dumbbell-bench': 'Incline Dumbbell Bench Press',
  'flat-dumbbell-bench': 'Flat Dumbbell Bench Press',
  'romanian-deadlift': 'Romanian Deadlift',
  deadlift: 'Deadlift',
  'barbell-hip-thrust': 'Barbell Hip Thrust',
  'goblet-squat': 'Goblet Squat',
  'bulgarian-split-squat': 'Bulgarian Split Squat',
  'back-squat': 'Back Squat',
  'dumbbell-shoulder-press': 'Dumbbell Shoulder Press',
  'overhead-press': 'Overhead Press',
  'walking-lunges': 'Walking Lunges',
  'barbell-row': 'Barbell Row',
  'upright-row': 'Upright Row',
  'hammer-curls': 'Hammer Curls',
  'barbell-curl': 'Barbell Curl',
  skullcrusher: 'Skull Crushers',
  'lateral-raise': 'Lateral Raise',
  'rear-delt-dumbbell-fly': 'Rear Delt Fly',
  'calf-raises': 'Calf Raises',
  'chin-ups': 'Chin-Ups',
  dips: 'Dips',
  'ab-wheel': 'Ab Wheel',
  'hanging-leg-raise': 'Hanging Leg Raise',
  plank: 'Plank',
};

describe('getExerciseArtSlug', () => {
  it('resolves every exercise in the app to its own slug', () => {
    for (const [slug, name] of Object.entries(NAMES_BY_SLUG)) {
      expect(getExerciseArtSlug(name), name).toBe(slug);
    }
  });

  it('prefers the more specific rule, as strengthStandards does', () => {
    // Each of these would also match a later, broader rule.
    expect(getExerciseArtSlug('Close-Grip Bench Press')).toBe('close-grip-bench');
    expect(getExerciseArtSlug('Romanian Deadlift')).toBe('romanian-deadlift');
    expect(getExerciseArtSlug('Goblet Squat')).toBe('goblet-squat');
    expect(getExerciseArtSlug('Bulgarian Split Squat')).toBe('bulgarian-split-squat');
    expect(getExerciseArtSlug('Hammer Curls')).toBe('hammer-curls');
    expect(getExerciseArtSlug('Upright Row')).toBe('upright-row');
  });

  it('handles the naming variants the app already accepts', () => {
    expect(getExerciseArtSlug('RDL')).toBe('romanian-deadlift');
    expect(getExerciseArtSlug('OHP')).toBe('overhead-press');
    expect(getExerciseArtSlug('Pendlay Row')).toBe('barbell-row');
    expect(getExerciseArtSlug('Pull-Ups')).toBe('chin-ups');
    expect(getExerciseArtSlug('pullups')).toBe('chin-ups');
    expect(getExerciseArtSlug('Incline DB Press')).toBe('incline-dumbbell-bench');
    expect(getExerciseArtSlug('Lying Tricep Extension')).toBe('skullcrusher');
    expect(getExerciseArtSlug('Ab Roller')).toBe('ab-wheel');
  });

  it('is insensitive to case, punctuation and spacing', () => {
    expect(getExerciseArtSlug('  BACK   SQUAT  ')).toBe('back-squat');
    expect(getExerciseArtSlug('Back-Squat')).toBe('back-squat');
    expect(getExerciseArtSlug('back squat (paused)')).toBe('back-squat');
  });

  it('returns null rather than guessing for an unknown lift', () => {
    expect(getExerciseArtSlug('Cable Woodchopper')).toBeNull();
    expect(getExerciseArtSlug('')).toBeNull();
    expect(getExerciseArtSlug('   ')).toBeNull();
  });

  it('returns null for a plain barbell bench press, which has no art yet', () => {
    // Documents a known gap: STANDARDS_MAP rates it, but no image was generated.
    expect(getExerciseArtSlug('Bench Press')).toBeNull();
  });
});

describe('getExerciseArt', () => {
  it('points at a file that actually exists for every resolvable exercise', () => {
    for (const name of Object.values(NAMES_BY_SLUG)) {
      const path = getExerciseArt(name);
      expect(path, name).not.toBeNull();
      expect(existsSync(join(PUBLIC_DIR, path!)), `${name} -> ${path}`).toBe(true);
    }
  });

  it('leaves no shipped exercise image unreachable', () => {
    // A file nobody can resolve is dead weight; a rule with no file is a 404.
    const onDisk = readdirSync(EXERCISE_DIR)
      .filter((f) => f.endsWith('.webp'))
      .map((f) => f.replace(/\.webp$/, ''))
      .sort();
    const reachable = Object.keys(NAMES_BY_SLUG).sort();
    expect(onDisk).toEqual(reachable);
  });
});

describe('getExerciseArtFocus', () => {
  it('has a hand-picked focal point for every exercise with art, and no others', () => {
    // The default exists so nothing crashes, but relying on it means a card
    // crops wherever chance puts it. Checking the map rather than the returned
    // string matters: one real value happens to equal DEFAULT_FOCUS, so the
    // string alone cannot tell a deliberate choice from a fallback.
    expect(Object.keys(FOCUS_BY_SLUG).sort()).toEqual(Object.keys(NAMES_BY_SLUG).sort());
  });

  it('returns a usable object-position for every exercise with art', () => {
    for (const name of Object.values(NAMES_BY_SLUG)) {
      expect(getExerciseArtFocus(name), name).toMatch(/^center \d{1,3}%$/);
    }
  });

  it('keeps every focal point inside the frame', () => {
    for (const name of Object.values(NAMES_BY_SLUG)) {
      const y = Number(getExerciseArtFocus(name).match(/(\d+)%/)![1]);
      expect(y, name).toBeGreaterThanOrEqual(0);
      expect(y, name).toBeLessThanOrEqual(100);
    }
  });

  it('falls back rather than throwing for an exercise with no art', () => {
    expect(getExerciseArtFocus('Cable Woodchopper')).toBe(`center ${DEFAULT_FOCUS}%`);
    expect(getExerciseArtFocus('')).toBe(`center ${DEFAULT_FOCUS}%`);
  });
});

describe('getLevelUpArt', () => {
  it('cycles through the three pieces so consecutive unlocks differ', () => {
    const first = getLevelUpArt(1);
    const second = getLevelUpArt(2);
    const third = getLevelUpArt(3);
    expect(new Set([first, second, third]).size).toBe(3);
    expect(getLevelUpArt(4)).toBe(first);
  });

  it('points at files that exist, for every level of a cycle', () => {
    for (let level = 1; level <= 10; level++) {
      const path = getLevelUpArt(level);
      expect(existsSync(join(PUBLIC_DIR, path)), `level ${level} -> ${path}`).toBe(true);
    }
  });

  it('does not break on an out-of-range level', () => {
    expect(() => getLevelUpArt(0)).not.toThrow();
    expect(() => getLevelUpArt(-3)).not.toThrow();
    expect(getLevelUpArt(0)).toBe(getLevelUpArt(1));
  });
});
