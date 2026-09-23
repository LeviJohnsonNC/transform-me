import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getExerciseArt, getExerciseArtSlug, getLevelUpArt } from '@/lib/exerciseArt';

const PUBLIC_DIR = join(process.cwd(), 'public');
const EXERCISE_DIR = join(PUBLIC_DIR, 'art', 'exercise');

/** Every exercise name that reaches a rule, one per slug the resolver can return. */
const NAMES_BY_SLUG: Record<string, string> = {
  'close-grip-bench': 'Close-Grip Bench Press',
  'bench-press': 'Bench Press',
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

  it('sends a plain barbell bench press to its own art, not a variant', () => {
    // This was a documented gap until the 16:9 set filled it. The rule sits
    // after the three specific bench variants, mirroring STANDARDS_MAP.
    expect(getExerciseArtSlug('Bench Press')).toBe('bench-press');
    expect(getExerciseArtSlug('Barbell Bench Press')).toBe('bench-press');
    expect(getExerciseArtSlug('Close-Grip Bench Press')).toBe('close-grip-bench');
    expect(getExerciseArtSlug('Incline Dumbbell Bench')).toBe('incline-dumbbell-bench');
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

describe('exercise art files', () => {
  /** Minimal WebP header reader — enough for the dimensions of the VP8 variants. */
  const dimensions = (file: string): [number, number] => {
    const b = readFileSync(file);
    const tag = b.toString('ascii', 12, 16);
    if (tag === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
    if (tag === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (tag === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    throw new Error(`Unrecognised WebP header in ${file}`);
  };

  it('ships every exercise banner at 16:9', () => {
    // The banner is a 16:9 box and the art is drawn at 16:9, so nothing is
    // cropped and no per-exercise focal point is needed. A portrait image
    // added later would silently crop instead — this is what catches that.
    for (const file of readdirSync(EXERCISE_DIR).filter((f) => f.endsWith('.webp'))) {
      const [w, h] = dimensions(join(EXERCISE_DIR, file));
      expect(w / h, `${file} is ${w}x${h}`).toBeCloseTo(16 / 9, 2);
    }
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
