import { describe, it, expect } from 'vitest';
import { LIFT_LABELS, getRating, liftFor } from '@/lib/strengthStandards';
import {
  byLift,
  closestLevelUp,
  LEVEL_HEX,
  LIFT_MUSCLES,
  levelColor,
  MUSCLES,
  nextStepFor,
  overallLevel,
  rankFor,
  RANKS,
  scoreMuscles,
  scoreRegions,
  type RatedLift,
} from '@/lib/progress';
import { rateLoggedSets } from '@/hooks/useProgress';

const stats = { gender: 'male' as const, age: 30, bodyweight_lbs: 180 };
const lift = (key: string, level: number, over: Partial<RatedLift> = {}): RatedLift => ({
  key, label: LIFT_LABELS[key], name: LIFT_LABELS[key], level, unit: 'lbs', weight: 100, reps: 5,
  metric: 0, nextLevel: null, nextThreshold: null, ...over,
});

describe('lift and muscle maps', () => {
  it('maps every lift with a standard to the muscles it works', () => {
    for (const key of Object.keys(LIFT_LABELS)) {
      expect(LIFT_MUSCLES[key], key).toBeDefined();
      expect(Object.values(LIFT_MUSCLES[key]).some((w) => w === 1), `${key} has a prime mover`).toBe(true);
    }
  });

  it('gives every muscle at least one lift that primarily builds it', () => {
    for (const m of MUSCLES) {
      expect(Object.values(LIFT_MUSCLES).some((work) => work[m.id] === 1), m.id).toBe(true);
    }
  });

  it('names lifts consistently however they were typed', () => {
    expect(liftFor('Paused Bench')).toEqual({ key: 'bench', label: 'Bench Press' });
    expect(liftFor('pull ups')?.key).toBe('pullUp');
    expect(liftFor('Cable Woodchopper')).toBeNull();
  });
});

describe('scoreMuscles', () => {
  it("blends a muscle's lifts by how much each works it", () => {
    // Chest: bench (1) at 6, dips (0.7) at 8 → (6 + 5.6) / 1.7.
    const chest = scoreMuscles([lift('bench', 6), lift('dip', 8)]).find((m) => m.muscle.id === 'chest')!;
    expect(chest.level).toBeCloseTo((6 + 0.7 * 8) / 1.7, 6);
    expect(chest.lifts.map((c) => c.lift.key)).toEqual(['bench', 'dip']);
  });

  it('leaves a muscle untrained when no rated lift works it, and says what would', () => {
    const calves = scoreMuscles([lift('bench', 6)]).find((m) => m.muscle.id === 'calves')!;
    expect(calves.level).toBeNull();
    expect(calves.wouldCount).toContain('Calf Raise');
  });

  it('averages regions over their rated muscles only', () => {
    const regions = scoreRegions(scoreMuscles([lift('calfRaise', 4)]));
    expect(regions.find((r) => r.id === 'legs')!.level).toBe(4);
    expect(regions.find((r) => r.id === 'push')!.level).toBeNull();
  });
});

describe('rank and colour', () => {
  it('has a title for every whole level and clamps outside 0–10', () => {
    expect(RANKS).toHaveLength(11);
    expect(rankFor(0.4)).toBe('BOOTING UP');
    expect(rankFor(4.99)).toBe('CONTENDER');
    expect(rankFor(10)).toBe('MYTHIC');
    expect(rankFor(12)).toBe('MYTHIC');
    expect(rankFor(NaN)).toBe('BOOTING UP');
  });

  it("uses the lift cards' colour for the level reached", () => {
    expect(levelColor(1)).toBe(LEVEL_HEX[0]);
    expect(levelColor(5.9)).toBe(LEVEL_HEX[4]);
    expect(levelColor(10)).toBe(LEVEL_HEX[9]);
    expect(levelColor(0.3)).toBe(LEVEL_HEX[0]);
  });

  it('takes the overall level as the mean of rated lifts', () => {
    expect(overallLevel([lift('bench', 6), lift('squat', 4)])).toBe(5);
    expect(overallLevel([])).toBeNull();
  });
});

describe('next level-up', () => {
  const rated = (name: string, weight: number, reps: number | null, unit: RatedLift['unit'] = 'lbs') => {
    const r = getRating(name, weight, reps, stats)!;
    return { ...liftFor(name)!, name, unit, weight, reps, level: r.level, metric: r.metric, nextLevel: r.nextLevel, nextThreshold: r.nextThreshold };
  };

  it('asks for a load that really reaches the next level', () => {
    const bench = rated('Bench Press', 185, 5);
    const step = nextStepFor(bench, stats)!;
    const more = Number(step.ask.match(/\+([\d.]+) lbs/)![1]);
    expect(step.ask).toMatch(/at 5 reps$/);
    expect(getRating('Bench Press', 185 + more, 5, stats)!.level).toBeGreaterThanOrEqual(bench.nextLevel!);
    expect(getRating('Bench Press', 185 + more - 5, 5, stats)!.level).toBeLessThan(bench.nextLevel!);
  });

  it('counts reps for counted lifts, and handles weighted calisthenics', () => {
    expect(nextStepFor(rated('Pull-Ups', 9, null, 'reps'), stats)!.ask).toMatch(/^\+\d+ reps?$/);
    const weighted = rated('Weighted Pull-ups', 25, 5);
    const more = Number(nextStepFor(weighted, stats)!.ask.match(/\+([\d.]+) lbs/)![1]);
    expect(getRating('Weighted Pull-ups', 25 + more, 5, stats)!.level).toBeGreaterThanOrEqual(weighted.nextLevel!);
  });

  it('picks the lift closest to its next level, and none at the top', () => {
    // One pound under the bench's next threshold, against a squat mid-level.
    const threshold = getRating('Bench Press', 150, 1, stats)!.nextThreshold!;
    const near = rated('Bench Press', threshold - 1, 1);
    const squatNext = getRating('Back Squat', 200, 1, stats)!;
    const far = rated('Back Squat', Math.round(squatNext.metric), 1);
    expect(closestLevelUp([far, near], stats)!.lift.key).toBe('bench');
    expect(nextStepFor(rated('Bench Press', 600, 1), stats)).toBeNull();
  });
});

describe('rateLoggedSets', () => {
  it('rates each exercise from its strongest set and folds spellings into one lift', () => {
    const rows = [
      { exercise_name: 'Bench Press', current_weight: 185, actual_reps: 5 },
      { exercise_name: 'Bench Press', current_weight: 165, actual_reps: 12 },
      { exercise_name: 'Paused Bench', current_weight: 225, actual_reps: 1 },
      { exercise_name: 'Pull-Ups', current_weight: 10, actual_reps: null },
      { exercise_name: 'Cable Woodchopper', current_weight: 50, actual_reps: 10 },
      { exercise_name: 'Back Squat', current_weight: 225, actual_reps: null }, // no reps: not rated
    ];
    const lifts = rateLoggedSets(rows, stats);
    expect(lifts.map((l) => l.key).sort()).toEqual(['bench', 'pullUp']);
    // 165×12 (≈231 estimated) beats both 185×5 (≈216) and the paused 225×1.
    const bench = lifts.find((l) => l.key === 'bench')!;
    expect(bench.name).toBe('Bench Press');
    expect(bench.level).toBeCloseTo(getRating('Bench Press', 165, 12, stats)!.level, 6);
    expect(bench.weight).toBe(165);
  });

  it('sorts strongest first', () => {
    const lifts = byLift([
      { name: 'Back Squat', level: 3, unit: 'lbs', weight: 1, reps: 1, metric: 1, nextLevel: 4, nextThreshold: 2 },
      { name: 'Bench Press', level: 6, unit: 'lbs', weight: 1, reps: 1, metric: 1, nextLevel: 7, nextThreshold: 2 },
    ]);
    expect(lifts.map((l) => l.key)).toEqual(['bench', 'squat']);
  });
});
