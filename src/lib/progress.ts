// The Progress view's arithmetic: which muscles a lift builds, how a muscle's
// level is blended from its lifts, the rank title, the level colour ramp, and
// what it would take to reach the next level. Pure, so all of it is testable.

import {
  estimate1RM,
  findStandard,
  getRating,
  LIFT_LABELS,
  liftFor,
  MAX_REPS_FOR_ESTIMATE,
  type RatingStats,
  type Unit,
} from '@/lib/strengthStandards';

export type Region = 'push' | 'pull' | 'legs' | 'core';

export interface Muscle {
  id: MuscleId;
  label: string;
  region: Region;
}

export type MuscleId =
  | 'chest' | 'shoulders' | 'triceps'
  | 'lats' | 'traps' | 'rearDelts' | 'biceps' | 'forearms'
  | 'quads' | 'glutes' | 'hamstrings' | 'calves'
  | 'abs' | 'obliques' | 'lowerBack';

export const MUSCLES: readonly Muscle[] = [
  { id: 'chest', label: 'Chest', region: 'push' },
  { id: 'shoulders', label: 'Shoulders', region: 'push' },
  { id: 'triceps', label: 'Triceps', region: 'push' },
  { id: 'lats', label: 'Lats', region: 'pull' },
  { id: 'traps', label: 'Traps', region: 'pull' },
  { id: 'rearDelts', label: 'Rear Delts', region: 'pull' },
  { id: 'biceps', label: 'Biceps', region: 'pull' },
  { id: 'forearms', label: 'Forearms', region: 'pull' },
  { id: 'quads', label: 'Quads', region: 'legs' },
  { id: 'glutes', label: 'Glutes', region: 'legs' },
  { id: 'hamstrings', label: 'Hamstrings', region: 'legs' },
  { id: 'calves', label: 'Calves', region: 'legs' },
  { id: 'abs', label: 'Abs', region: 'core' },
  { id: 'obliques', label: 'Obliques', region: 'core' },
  { id: 'lowerBack', label: 'Lower Back', region: 'core' },
];

export const REGIONS: readonly { id: Region; label: string }[] = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
];

type Work = Partial<Record<MuscleId, number>>;

/**
 * What each lift builds, and how much: 1 for a prime mover, less for a helper.
 * A muscle's level is the weighted mean of its lifts' levels, so a strong bench
 * lifts the chest a lot and the triceps a little.
 */
export const LIFT_MUSCLES: Record<string, Work> = {
  bench: { chest: 1, triceps: 0.5, shoulders: 0.4 },
  inclineBench: { chest: 1, shoulders: 0.6, triceps: 0.4 },
  closeGripBench: { triceps: 1, chest: 0.6, shoulders: 0.3 },
  inclineDbPress: { chest: 1, shoulders: 0.6, triceps: 0.3 },
  flatDbBench: { chest: 1, triceps: 0.4, shoulders: 0.4 },
  ohp: { shoulders: 1, triceps: 0.5, traps: 0.3 },
  dbShoulderPress: { shoulders: 1, triceps: 0.5, traps: 0.3 },
  pushUp: { chest: 1, triceps: 0.5, shoulders: 0.4, abs: 0.2 },
  dip: { triceps: 1, chest: 0.7, shoulders: 0.3 },
  weightedDip: { triceps: 1, chest: 0.7, shoulders: 0.3 },
  squat: { quads: 1, glutes: 0.7, lowerBack: 0.3, hamstrings: 0.2 },
  frontSquat: { quads: 1, glutes: 0.5, abs: 0.3, lowerBack: 0.3 },
  legPress: { quads: 1, glutes: 0.5 },
  gobletSquat: { quads: 1, glutes: 0.5, abs: 0.2 },
  bulgarian: { quads: 1, glutes: 0.8, hamstrings: 0.3 },
  lunge: { quads: 1, glutes: 0.8, hamstrings: 0.3 },
  deadlift: { lowerBack: 1, glutes: 0.8, hamstrings: 0.7, traps: 0.5, forearms: 0.5, quads: 0.3, lats: 0.3 },
  trapBarDeadlift: { glutes: 1, lowerBack: 0.7, quads: 0.7, hamstrings: 0.5, traps: 0.5, forearms: 0.4 },
  rdl: { hamstrings: 1, glutes: 0.7, lowerBack: 0.5, forearms: 0.3 },
  hipThrust: { glutes: 1, hamstrings: 0.3 },
  barbellRow: { lats: 1, rearDelts: 0.5, biceps: 0.5, traps: 0.5, lowerBack: 0.3 },
  dbRow: { lats: 1, biceps: 0.5, rearDelts: 0.4 },
  cableRow: { lats: 1, biceps: 0.5, rearDelts: 0.4, traps: 0.4 },
  latPulldown: { lats: 1, biceps: 0.5 },
  pullUp: { lats: 1, biceps: 0.6, forearms: 0.3, abs: 0.2 },
  weightedPullUp: { lats: 1, biceps: 0.6, forearms: 0.3, abs: 0.2 },
  invertedRow: { lats: 1, rearDelts: 0.6, biceps: 0.5, traps: 0.4 },
  barbellCurl: { biceps: 1, forearms: 0.5 },
  hammerCurl: { forearms: 1, biceps: 0.7 },
  skullCrusher: { triceps: 1 },
  lateralRaise: { shoulders: 1 },
  rearDeltFly: { rearDelts: 1, traps: 0.3 },
  uprightRow: { traps: 1, shoulders: 0.8 },
  calfRaise: { calves: 1 },
  abWheel: { abs: 1, obliques: 0.4, lats: 0.2 },
  hangingLegRaise: { abs: 1, obliques: 0.4, forearms: 0.2 },
  plank: { abs: 1, obliques: 0.5, lowerBack: 0.3 },
  sidePlank: { obliques: 1, abs: 0.4 },
};

// === Rank ===

/** One title per whole overall level, 0 through 10. */
export const RANKS = [
  'BOOTING UP', 'ROOKIE', 'RUNNER', 'BRAWLER', 'CONTENDER', 'VANGUARD',
  'ENFORCER', 'TITAN', 'APEX', 'LEGEND', 'MYTHIC',
] as const;

export const rankFor = (level: number): string =>
  RANKS[Math.max(0, Math.min(10, Math.floor(Number.isFinite(level) ? level : 0)))];

// === Colour ===

/**
 * The lift cards' ramp, one colour per whole level L1..L10: magenta, violet,
 * then blue into cyan. The Progress view uses the same so a level looks the
 * same everywhere.
 */
export const LEVEL_HEX = [
  '#FF2E97', '#FF2E97', '#FF2E97',
  '#A855F7', '#A855F7', '#A855F7',
  '#6D82F9', '#4F99FA',
  '#2BE8FF', '#2BE8FF',
] as const;

/** The colour for a (fractional) level: the card's colour for the level reached. */
export const levelColor = (level: number): string =>
  LEVEL_HEX[Math.max(0, Math.min(9, Math.floor(level) - 1))];

// === Scoring ===

export interface RatedLift {
  key: string;
  label: string;
  /** The exercise name the best set was logged under. */
  name: string;
  level: number;
  unit: Unit;
  /** The set it was read from. */
  weight: number;
  reps: number | null;
  nextLevel: number | null;
  nextThreshold: number | null;
  metric: number;
}

export interface MuscleScore {
  muscle: Muscle;
  /** Null when no rated lift works this muscle. */
  level: number | null;
  /** Rated lifts that built it, biggest contribution first. */
  lifts: Array<{ lift: RatedLift; weight: number }>;
  /** Lifts with a standard that would also count, for the untrained. */
  wouldCount: string[];
}

/** Each muscle's level, blended across the rated lifts that work it. */
export const scoreMuscles = (lifts: readonly RatedLift[]): MuscleScore[] =>
  MUSCLES.map((muscle) => {
    const contributing = lifts
      .map((lift) => ({ lift, weight: LIFT_MUSCLES[lift.key]?.[muscle.id] ?? 0 }))
      .filter((c) => c.weight > 0)
      .sort((a, b) => b.weight - a.weight || b.lift.level - a.lift.level);
    const total = contributing.reduce((sum, c) => sum + c.weight, 0);
    const level = total > 0 ? contributing.reduce((sum, c) => sum + c.lift.level * c.weight, 0) / total : null;
    const rated = new Set(lifts.map((l) => l.key));
    const wouldCount = Object.entries(LIFT_MUSCLES)
      .filter(([key, work]) => (work[muscle.id] ?? 0) >= 1 && !rated.has(key))
      .map(([key]) => LIFT_LABELS[key] ?? key);
    return { muscle, level, lifts: contributing, wouldCount };
  });

/** Push / pull / legs / core: the mean of each region's rated muscles. */
export const scoreRegions = (muscles: readonly MuscleScore[]) =>
  REGIONS.map((region) => {
    const levels = muscles.filter((m) => m.muscle.region === region.id && m.level !== null).map((m) => m.level!);
    return { ...region, level: levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : null };
  });

/** The mean level across every rated lift. */
export const overallLevel = (lifts: readonly RatedLift[]): number | null =>
  lifts.length ? lifts.reduce((sum, l) => sum + l.level, 0) / lifts.length : null;

// === Next level ===

export interface NextStep {
  lift: RatedLift;
  /** How far off, as a share of the target: what ranks "closest". */
  gap: number;
  /** e.g. "+10 lbs at 5 reps", "+2 reps", "+15 s". */
  ask: string;
}

/** The weight step a lift is loaded in: 5 lbs, or 2.5 under 50 lbs. */
const plateStep = (weight: number) => (weight >= 50 ? 5 : 2.5);

/**
 * What it takes to reach the next whole level on this lift, holding the reps
 * and adding load (or adding reps / seconds for counted lifts). Checked
 * against the real rating, so the number shown actually levels you up.
 */
export const nextStepFor = (lift: RatedLift, stats: RatingStats): NextStep | null => {
  if (lift.nextThreshold === null || lift.nextLevel === null) return null;
  const gap = (lift.nextThreshold - lift.metric) / lift.nextThreshold;

  if (lift.unit !== 'lbs') {
    const more = Math.max(1, Math.ceil(lift.nextThreshold - lift.metric));
    return { lift, gap, ask: lift.unit === 'seconds' ? `+${more} s` : `+${more} rep${more === 1 ? '' : 's'}` };
  }

  const reps = lift.reps ?? 1;
  const perRep = estimate1RM(1, Math.min(reps, MAX_REPS_FOR_ESTIMATE));
  // Weighted pull-ups and dips are scored on bodyweight plus the added load.
  const added = findStandard(lift.name)?.load === 'added';
  const raw = added
    ? (lift.nextThreshold + stats.bodyweight_lbs) / perRep - stats.bodyweight_lbs
    : lift.nextThreshold / perRep;
  const step = plateStep(raw);
  let weight = Math.max(lift.weight + step, Math.ceil(raw / step) * step);
  // Rounding and the age adjustment can leave it a hair short; step until it isn't.
  for (let i = 0; i < 20; i++) {
    const r = getRating(lift.name, weight, reps, stats);
    if (!r || r.level >= lift.nextLevel) break;
    weight += step;
  }
  const more = +(weight - lift.weight).toFixed(1);
  return { lift, gap, ask: `+${more} lbs at ${reps} rep${reps === 1 ? '' : 's'}` };
};

/** The rated lift closest to its next whole level. */
export const closestLevelUp = (lifts: readonly RatedLift[], stats: RatingStats): NextStep | null =>
  lifts
    .map((l) => nextStepFor(l, stats))
    .filter((s): s is NextStep => s !== null)
    .sort((a, b) => a.gap - b.gap)[0] ?? null;

/** Group rated exercise names into lifts, keeping each lift's strongest. */
export const byLift = (
  rated: ReadonlyArray<Omit<RatedLift, 'key' | 'label'>>,
): RatedLift[] => {
  const best = new Map<string, RatedLift>();
  for (const r of rated) {
    const lift = liftFor(r.name);
    if (!lift) continue;
    const prev = best.get(lift.key);
    if (!prev || r.level > prev.level) best.set(lift.key, { ...r, ...lift });
  }
  return [...best.values()].sort((a, b) => b.level - a.level);
};
