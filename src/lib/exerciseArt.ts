/**
 * Exercise name -> banner art.
 *
 * The rules below mirror STANDARDS_MAP in `strengthStandards.ts`, in the same
 * order and with the same matchers, so a card's art and its strength rating
 * always agree about which lift it is. Order matters: "close-grip bench" has to
 * be tested before the generic "bench", and "romanian deadlift" before
 * "deadlift".
 *
 * An unmatched name returns null and the card renders without art.
 */

const EXERCISE_ART_DIR = '/art/exercise';

/** Lowercase, strip punctuation to spaces, collapse runs. Mirrors normalize() in strengthStandards. */
const normalize = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const RULES: Array<{ match: (n: string) => boolean; slug: string }> = [
  { match: (n) => n.includes('close-grip bench') || n.includes('close grip bench'), slug: 'close-grip-bench' },
  { match: (n) => n.includes('incline') && (n.includes('db') || n.includes('dumbbell')), slug: 'incline-dumbbell-bench' },
  {
    match: (n) =>
      (n.includes('flat') && (n.includes('db') || n.includes('dumbbell'))) ||
      (n.includes('dumbbell bench') && !n.includes('incline')),
    slug: 'flat-dumbbell-bench',
  },
  // No art for a plain barbell bench press yet; falls through to null.
  { match: (n) => n.includes('romanian deadlift') || n.includes('rdl'), slug: 'romanian-deadlift' },
  { match: (n) => n.includes('deadlift'), slug: 'deadlift' },
  { match: (n) => n.includes('hip thrust'), slug: 'barbell-hip-thrust' },
  { match: (n) => n.includes('goblet'), slug: 'goblet-squat' },
  { match: (n) => n.includes('bulgarian'), slug: 'bulgarian-split-squat' },
  { match: (n) => n.includes('squat'), slug: 'back-squat' },
  {
    match: (n) =>
      (n.includes('db') || n.includes('dumbbell')) &&
      (n.includes('shoulder press') || n.includes('shoulder-press')),
    slug: 'dumbbell-shoulder-press',
  },
  {
    match: (n) =>
      n.includes('overhead press') ||
      n.includes('ohp') ||
      (n.includes('press') && n.includes('shoulder')) ||
      n.includes('military'),
    slug: 'overhead-press',
  },
  { match: (n) => n.includes('lunge'), slug: 'walking-lunges' },
  {
    match: (n) =>
      n.includes('barbell row') ||
      n.includes('bent-over row') ||
      n.includes('bent over row') ||
      n.includes('pendlay'),
    slug: 'barbell-row',
  },
  { match: (n) => n.includes('upright row'), slug: 'upright-row' },
  { match: (n) => n.includes('hammer curl'), slug: 'hammer-curls' },
  { match: (n) => n.includes('curl'), slug: 'barbell-curl' },
  {
    match: (n) =>
      n.includes('skull crusher') ||
      n.includes('skullcrusher') ||
      n.includes('lying tricep') ||
      n.includes('lying triceps'),
    slug: 'skullcrusher',
  },
  { match: (n) => n.includes('lateral raise'), slug: 'lateral-raise' },
  { match: (n) => n.includes('rear delt') || (n.includes('reverse') && n.includes('fly')), slug: 'rear-delt-dumbbell-fly' },
  { match: (n) => n.includes('calf'), slug: 'calf-raises' },
  {
    match: (n) =>
      n.includes('pull-up') ||
      n.includes('pull up') ||
      n.includes('pullup') ||
      n.includes('chin-up') ||
      n.includes('chin up') ||
      n.includes('chinup'),
    slug: 'chin-ups',
  },
  { match: (n) => n.includes('dip'), slug: 'dips' },
  { match: (n) => n.includes('ab wheel') || n.includes('ab roller'), slug: 'ab-wheel' },
  { match: (n) => n.includes('hanging leg raise'), slug: 'hanging-leg-raise' },
  { match: (n) => n.includes('plank'), slug: 'plank' },
];

/** The art slug for an exercise, or null when nothing matches. */
export const getExerciseArtSlug = (exerciseName: string): string | null => {
  const n = normalize(exerciseName);
  if (!n) return null;
  return RULES.find((rule) => rule.match(n))?.slug ?? null;
};

/** Public path to an exercise's banner, or null when it has no art. */
export const getExerciseArt = (exerciseName: string): string | null => {
  const slug = getExerciseArtSlug(exerciseName);
  return slug ? `${EXERCISE_ART_DIR}/${slug}.webp` : null;
};

/**
 * Level-up art, chosen by level so consecutive unlocks do not repeat.
 * Three pieces cycle across the ten levels of a cycle.
 */
const LEVEL_UP_ART = ['/art/levelup-1.webp', '/art/levelup-2.webp', '/art/levelup-3.webp'];

export const getLevelUpArt = (level: number): string => {
  // Levels run 1..10. Clamp rather than wrap, so a level below 1 shows the
  // first piece instead of mirroring into the middle of the set.
  const safe = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  return LEVEL_UP_ART[(safe - 1) % LEVEL_UP_ART.length];
};
