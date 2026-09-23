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
 * Where each banner is cropped, as an `object-position` Y percentage.
 *
 * The art is 3:4 portrait and the banner is a wide strip, so only about 44% of
 * each frame survives the crop. Where that band sits decides whether the card
 * shows the lift or a disembodied torso, and it differs by exercise: an
 * overhead press puts the bar near the top of the frame, a bench press puts the
 * athlete near the bottom. One global value cannot serve both, so each slug
 * carries its own, picked by eye against the real crop.
 *
 * Rule of thumb when adding one: aim the band at the midpoint between the face
 * and the working weight. The face carries the energy, the weight names the
 * lift, and the band is wide enough to hold both for most of these.
 */
export const FOCUS_BY_SLUG: Record<string, number> = {
  'ab-wheel': 59,
  'back-squat': 40,
  'barbell-curl': 32,
  'barbell-hip-thrust': 54,
  'barbell-row': 40,
  'bulgarian-split-squat': 45,
  'calf-raises': 78,
  'chin-ups': 29,
  'close-grip-bench': 64,
  'deadlift': 42,
  'dips': 40,
  'dumbbell-shoulder-press': 36,
  'flat-dumbbell-bench': 64,
  'goblet-squat': 54,
  'hammer-curls': 32,
  'hanging-leg-raise': 36,
  'incline-dumbbell-bench': 59,
  'lateral-raise': 36,
  'overhead-press': 32,
  'plank': 68,
  'rear-delt-dumbbell-fly': 44,
  'romanian-deadlift': 42,
  'skullcrusher': 71,
  'upright-row': 32,
  'walking-lunges': 62,
};

/** Fallback for a slug with no entry. The tests make sure there are none. */
export const DEFAULT_FOCUS = 45;

/** `object-position` value for an exercise's banner, e.g. `center 42%`. */
export const getExerciseArtFocus = (exerciseName: string): string => {
  const slug = getExerciseArtSlug(exerciseName);
  const y = (slug && FOCUS_BY_SLUG[slug]) ?? DEFAULT_FOCUS;
  return 'center ' + y + '%';
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
