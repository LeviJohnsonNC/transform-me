// Strength standards (1-10 scale) for major lifts.
// Level 1 = untrained baseline, Level 5 = reasonably fit (about Strength Level's "intermediate"),
// Level 7 = about "advanced", Level 10 = about "elite": the top few percent of people who train.
// Weight thresholds represent estimated 1RM in lbs. We use Epley to estimate the user's 1RM from weight x reps.
// Sources: blended from strengthlevel.com / Symmetric Strength / ExRx novice→elite ranges.
//
// L8–L10 were recalibrated: L10 used to sit a level ABOVE elite (a 198 lb
// man's deadlift L10 was 3.8× bodyweight, near national-record territory),
// contradicting "attainable". What was L9 is now L10, and L8/L9 split the gap
// from L7 in thirds. L1–L7 are unchanged.

export type Gender = 'male' | 'female' | 'other';
/** Which table a lifter is scored against. */
export type RatingScale = 'male' | 'female';

export interface RatingStats {
  gender: Gender;
  age: number;
  bodyweight_lbs: number;
  /** The scale chosen by someone who would rather not give their gender. */
  rating_scale?: RatingScale | null;
}

/**
 * The table to score this lifter against, or null when that is theirs to
 * choose and they have not. "Prefer not to say" used to be scored on the male
 * table without a word, which put a 140 lb lifter's 135 bench at 2.7 instead
 * of 6.4.
 */
export function scaleFor(stats: Pick<RatingStats, 'gender' | 'rating_scale'>): RatingScale | null {
  if (stats.gender === 'male' || stats.gender === 'female') return stats.gender;
  return stats.rating_scale ?? null;
}
export type Unit = 'lbs' | 'reps' | 'seconds';

interface Bracket {
  // The bodyweight, in lbs, these levels are written for. 999 marks the
  // open-ended top bracket; see CLASS_LADDER for where it sits.
  bodyweightMax: number;
  levels: [number, number, number, number, number, number, number, number, number, number]; // L1..L10
}

/**
 * What the logged weight of an 'lbs' lift means. The same set logged the other
 * way is off by a factor of two, so the card labels its weight box with this.
 *  - total: the whole bar, stack or single weight (the default)
 *  - perDumbbell: the weight in ONE hand
 *  - bothHands: everything carried, e.g. both dumbbells added together
 *  - added: load added to the body on a belt or vest, for weighted pull-ups
 *    and dips. Levels for these are the added 1RM as a FRACTION of bodyweight.
 */
export type Load = 'total' | 'perDumbbell' | 'bothHands' | 'added';

export interface ExerciseStandard {
  unit: Unit;
  // For 'lbs' exercises: thresholds are estimated 1RM in lbs, varies by gender + bodyweight
  // For 'reps' or 'seconds' exercises: thresholds are absolute, varies by gender only (single bracket)
  male: Bracket[];
  female: Bracket[];
  load?: Load;
  // A bodyweight feat (pull-ups, dips, push-ups, and their weighted forms): the
  // single table is written for a lifter at REFERENCE_BODYWEIGHT and is moved
  // for everyone else. See relativeThresholds.
  bodyweightRelative?: boolean;
}

/** Another lift's table at a fixed ratio, for variants that track a parent lift closely. */
const scaled = (base: ExerciseStandard, ratio: number, load?: Load): ExerciseStandard => {
  const scale = (brackets: Bracket[]) =>
    brackets.map((b) => ({ bodyweightMax: b.bodyweightMax, levels: b.levels.map((l) => Math.round(l * ratio)) as Bracket['levels'] }));
  return { unit: base.unit, male: scale(base.male), female: scale(base.female), load };
};

// === WEIGHT EXERCISES (1RM in lbs) ===
// Each bracket's L1..L10 is the 1RM for a lifter AT that bracket's bodyweight,
// on the classic weight-class ladder (men 132/165/198/242/275, women
// 115/145/180/215). A lifter between two brackets is scored between them; see
// thresholdsFor.

const BENCH_PRESS: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [70, 95, 125, 150, 180, 210, 240, 260, 280, 300] },
    { bodyweightMax: 165, levels: [85, 115, 145, 175, 205, 240, 275, 300, 320, 345] },
    { bodyweightMax: 198, levels: [95, 130, 165, 195, 230, 270, 310, 335, 365, 390] },
    { bodyweightMax: 242, levels: [105, 145, 180, 215, 255, 295, 340, 370, 400, 430] },
    { bodyweightMax: 999, levels: [115, 155, 195, 235, 275, 320, 365, 400, 430, 465] },
  ],
  female: [
    { bodyweightMax: 115, levels: [30, 45, 60, 75, 90, 110, 130, 145, 155, 170] },
    { bodyweightMax: 145, levels: [35, 50, 70, 85, 105, 125, 150, 165, 180, 195] },
    { bodyweightMax: 180, levels: [40, 60, 80, 100, 120, 145, 170, 185, 205, 220] },
    { bodyweightMax: 999, levels: [45, 65, 90, 110, 135, 160, 190, 210, 230, 250] },
  ],
};

const SQUAT: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [85, 120, 160, 200, 240, 285, 330, 360, 390, 420] },
    { bodyweightMax: 165, levels: [105, 145, 190, 235, 285, 335, 385, 420, 450, 485] },
    { bodyweightMax: 198, levels: [120, 165, 215, 265, 320, 375, 430, 470, 505, 545] },
    { bodyweightMax: 242, levels: [135, 185, 240, 295, 350, 410, 470, 510, 555, 595] },
    { bodyweightMax: 999, levels: [145, 200, 260, 320, 380, 445, 510, 555, 600, 645] },
  ],
  female: [
    { bodyweightMax: 115, levels: [40, 65, 90, 115, 140, 170, 200, 220, 245, 265] },
    { bodyweightMax: 145, levels: [50, 75, 105, 135, 165, 200, 235, 260, 285, 310] },
    { bodyweightMax: 180, levels: [55, 85, 120, 155, 190, 230, 270, 300, 330, 360] },
    { bodyweightMax: 999, levels: [65, 95, 135, 175, 215, 260, 305, 340, 370, 405] },
  ],
};

const DEADLIFT: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [110, 155, 205, 255, 305, 360, 415, 450, 490, 525] },
    { bodyweightMax: 165, levels: [135, 185, 240, 295, 355, 415, 480, 520, 565, 605] },
    { bodyweightMax: 198, levels: [155, 210, 270, 335, 400, 470, 540, 590, 635, 685] },
    { bodyweightMax: 242, levels: [170, 230, 300, 370, 440, 515, 590, 645, 695, 750] },
    { bodyweightMax: 999, levels: [185, 250, 325, 400, 475, 555, 640, 695, 755, 810] },
  ],
  female: [
    { bodyweightMax: 115, levels: [55, 85, 115, 150, 185, 220, 260, 290, 315, 345] },
    { bodyweightMax: 145, levels: [65, 100, 135, 175, 215, 260, 305, 335, 370, 400] },
    { bodyweightMax: 180, levels: [75, 115, 155, 200, 245, 295, 345, 380, 420, 455] },
    { bodyweightMax: 999, levels: [85, 125, 175, 225, 275, 330, 390, 430, 475, 515] },
  ],
};

const OHP: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [45, 65, 85, 105, 125, 150, 175, 190, 210, 225] },
    { bodyweightMax: 165, levels: [55, 75, 100, 120, 145, 170, 200, 220, 235, 255] },
    { bodyweightMax: 198, levels: [60, 85, 110, 135, 160, 190, 220, 240, 265, 285] },
    { bodyweightMax: 242, levels: [70, 95, 120, 150, 180, 210, 245, 270, 290, 315] },
    { bodyweightMax: 999, levels: [75, 105, 130, 165, 195, 230, 265, 290, 320, 345] },
  ],
  female: [
    { bodyweightMax: 115, levels: [20, 30, 40, 55, 70, 85, 100, 110, 125, 135] },
    { bodyweightMax: 145, levels: [25, 35, 50, 65, 80, 95, 115, 130, 140, 155] },
    { bodyweightMax: 180, levels: [30, 40, 55, 75, 90, 110, 130, 145, 160, 175] },
    { bodyweightMax: 999, levels: [30, 45, 65, 85, 105, 125, 150, 165, 185, 200] },
  ],
};

// Incline DB Press (per dumbbell weight)
const INCLINE_DB_PRESS: ExerciseStandard = {
  unit: 'lbs',
  load: 'perDumbbell',
  male: [
    { bodyweightMax: 132, levels: [20, 30, 40, 50, 60, 75, 90, 100, 105, 115] },
    { bodyweightMax: 165, levels: [25, 35, 45, 60, 70, 85, 100, 110, 120, 130] },
    { bodyweightMax: 198, levels: [30, 40, 55, 65, 80, 95, 110, 120, 130, 140] },
    { bodyweightMax: 242, levels: [35, 45, 60, 75, 90, 105, 120, 130, 140, 150] },
    { bodyweightMax: 999, levels: [35, 50, 65, 80, 95, 110, 130, 140, 155, 165] },
  ],
  female: [
    { bodyweightMax: 115, levels: [8, 12, 17, 22, 30, 37, 45, 50, 60, 65] },
    { bodyweightMax: 145, levels: [10, 15, 20, 27, 35, 42, 52, 60, 65, 70] },
    { bodyweightMax: 180, levels: [12, 17, 25, 32, 40, 50, 60, 65, 75, 80] },
    { bodyweightMax: 999, levels: [15, 20, 27, 35, 45, 55, 65, 75, 80, 90] },
  ],
};

// Walking / stationary lunge: everything carried — a barbell, or both dumbbells added together
const LUNGE: ExerciseStandard = {
  unit: 'lbs',
  load: 'bothHands',
  male: [
    { bodyweightMax: 165, levels: [0, 20, 40, 60, 85, 110, 140, 160, 180, 200] },
    { bodyweightMax: 198, levels: [0, 25, 50, 75, 100, 130, 160, 185, 205, 230] },
    { bodyweightMax: 999, levels: [0, 30, 55, 85, 115, 145, 180, 205, 230, 255] },
  ],
  female: [
    { bodyweightMax: 145, levels: [0, 10, 20, 35, 50, 70, 90, 105, 120, 135] },
    { bodyweightMax: 999, levels: [0, 15, 25, 45, 65, 85, 110, 125, 145, 160] },
  ],
};

// === BODYWEIGHT REPS ===

const PULL_UP: ExerciseStandard = {
  unit: 'reps',
  bodyweightRelative: true,
  male: [{ bodyweightMax: 999, levels: [1, 3, 5, 8, 12, 16, 20, 23, 27, 30] }],
  female: [{ bodyweightMax: 999, levels: [0, 1, 2, 4, 6, 9, 12, 14, 17, 19] }],
};

const DIP: ExerciseStandard = {
  unit: 'reps',
  bodyweightRelative: true,
  male: [{ bodyweightMax: 999, levels: [1, 4, 8, 12, 17, 22, 28, 33, 37, 42] }],
  female: [{ bodyweightMax: 999, levels: [0, 1, 3, 6, 9, 13, 17, 21, 24, 28] }],
};

const AB_WHEEL: ExerciseStandard = {
  unit: 'reps',
  male: [{ bodyweightMax: 999, levels: [1, 3, 5, 8, 12, 16, 20, 23, 27, 30] }],
  female: [{ bodyweightMax: 999, levels: [1, 2, 4, 6, 9, 12, 16, 19, 22, 25] }],
};

const HANGING_LEG_RAISE: ExerciseStandard = {
  unit: 'reps',
  male: [{ bodyweightMax: 999, levels: [1, 3, 5, 8, 12, 16, 20, 23, 27, 30] }],
  female: [{ bodyweightMax: 999, levels: [1, 2, 4, 6, 9, 12, 16, 19, 22, 25] }],
};

const PLANK: ExerciseStandard = {
  unit: 'seconds',
  male: [{ bodyweightMax: 999, levels: [20, 40, 60, 90, 120, 150, 180, 200, 220, 240] }],
  female: [{ bodyweightMax: 999, levels: [20, 40, 60, 90, 120, 150, 180, 200, 220, 240] }],
};

// === Additional lifts (1RM in lbs unless noted) ===

// Close-Grip Bench (~85% of bench)
const CLOSE_GRIP_BENCH = scaled(BENCH_PRESS, 0.85);

// Flat Dumbbell Bench (per dumbbell, ~ slightly lighter than incline)
const FLAT_DB_BENCH: ExerciseStandard = {
  unit: 'lbs',
  load: 'perDumbbell',
  male: [
    { bodyweightMax: 132, levels: [25, 35, 45, 55, 70, 85, 100, 110, 120, 130] },
    { bodyweightMax: 165, levels: [30, 40, 55, 65, 80, 95, 110, 120, 130, 140] },
    { bodyweightMax: 198, levels: [35, 45, 60, 75, 90, 105, 120, 130, 145, 155] },
    { bodyweightMax: 242, levels: [40, 55, 70, 85, 100, 115, 135, 145, 160, 170] },
    { bodyweightMax: 999, levels: [45, 60, 75, 90, 105, 125, 145, 160, 170, 185] },
  ],
  female: [
    { bodyweightMax: 115, levels: [10, 15, 20, 27, 35, 45, 55, 60, 70, 75] },
    { bodyweightMax: 145, levels: [12, 17, 25, 32, 40, 50, 60, 70, 75, 85] },
    { bodyweightMax: 180, levels: [15, 20, 27, 35, 45, 55, 67, 75, 85, 95] },
    { bodyweightMax: 999, levels: [17, 22, 30, 40, 50, 62, 75, 85, 95, 105] },
  ],
};

// DB Shoulder Press (per dumbbell)
const DB_SHOULDER_PRESS: ExerciseStandard = {
  unit: 'lbs',
  load: 'perDumbbell',
  male: [
    { bodyweightMax: 132, levels: [15, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
    { bodyweightMax: 165, levels: [17, 25, 35, 45, 55, 70, 85, 95, 105, 115] },
    { bodyweightMax: 198, levels: [20, 30, 40, 50, 65, 80, 95, 105, 115, 125] },
    { bodyweightMax: 242, levels: [25, 35, 45, 60, 75, 90, 105, 115, 125, 135] },
    { bodyweightMax: 999, levels: [25, 35, 50, 65, 80, 95, 115, 125, 135, 145] },
  ],
  female: [
    { bodyweightMax: 115, levels: [5, 8, 12, 17, 22, 30, 37, 43, 49, 55] },
    { bodyweightMax: 145, levels: [7, 10, 15, 20, 27, 35, 45, 50, 60, 65] },
    { bodyweightMax: 180, levels: [8, 12, 17, 25, 32, 42, 52, 60, 65, 75] },
    { bodyweightMax: 999, levels: [10, 15, 20, 27, 37, 47, 60, 70, 75, 85] },
  ],
};

// Barbell Row (Pendlay/bent-over)
const BARBELL_ROW: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [55, 80, 105, 130, 160, 190, 220, 240, 260, 280] },
    { bodyweightMax: 165, levels: [65, 95, 125, 155, 185, 220, 255, 280, 300, 325] },
    { bodyweightMax: 198, levels: [75, 105, 140, 175, 210, 250, 290, 315, 345, 370] },
    { bodyweightMax: 242, levels: [85, 120, 155, 195, 235, 275, 320, 350, 380, 410] },
    { bodyweightMax: 999, levels: [95, 130, 170, 210, 255, 300, 350, 385, 415, 450] },
  ],
  female: [
    { bodyweightMax: 115, levels: [25, 40, 55, 70, 85, 105, 125, 140, 150, 165] },
    { bodyweightMax: 145, levels: [30, 45, 65, 80, 100, 120, 145, 160, 175, 190] },
    { bodyweightMax: 180, levels: [35, 55, 75, 95, 115, 140, 165, 185, 200, 220] },
    { bodyweightMax: 999, levels: [40, 60, 85, 105, 130, 155, 185, 205, 225, 245] },
  ],
};

// Romanian Deadlift (~85% of conventional deadlift)
const RDL = scaled(DEADLIFT, 0.85);

// Barbell Hip Thrust
const HIP_THRUST: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [95, 135, 185, 235, 290, 345, 405, 445, 485, 525] },
    { bodyweightMax: 198, levels: [115, 160, 215, 270, 330, 395, 460, 505, 545, 590] },
    { bodyweightMax: 999, levels: [135, 185, 245, 305, 370, 440, 510, 560, 605, 655] },
  ],
  female: [
    { bodyweightMax: 145, levels: [55, 90, 130, 175, 220, 270, 320, 355, 395, 430] },
    { bodyweightMax: 999, levels: [70, 110, 155, 205, 260, 315, 375, 415, 460, 500] },
  ],
};

// Goblet Squat (single dumbbell/kettlebell weight)
const GOBLET_SQUAT: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [15, 25, 40, 55, 70, 85, 100, 110, 120, 130] },
    { bodyweightMax: 999, levels: [20, 30, 45, 60, 80, 95, 110, 120, 130, 140] },
  ],
  female: [
    { bodyweightMax: 145, levels: [8, 15, 25, 35, 45, 55, 67, 75, 85, 95] },
    { bodyweightMax: 999, levels: [12, 20, 30, 42, 55, 67, 80, 90, 100, 110] },
  ],
};

// Bulgarian Split Squat, per dumbbell. The L10s are about half a back squat per
// leg split across two hands, which only reads as per-dumbbell.
const BULGARIAN_SPLIT_SQUAT: ExerciseStandard = {
  unit: 'lbs',
  load: 'perDumbbell',
  male: [
    { bodyweightMax: 165, levels: [0, 15, 25, 40, 55, 70, 85, 100, 110, 125] },
    { bodyweightMax: 198, levels: [0, 20, 30, 45, 60, 80, 100, 115, 125, 140] },
    { bodyweightMax: 999, levels: [0, 20, 35, 55, 75, 95, 115, 130, 145, 160] },
  ],
  female: [
    { bodyweightMax: 145, levels: [0, 8, 15, 22, 32, 45, 57, 65, 75, 85] },
    { bodyweightMax: 999, levels: [0, 10, 20, 30, 42, 55, 70, 80, 90, 100] },
  ],
};

// Barbell Curl
const BARBELL_CURL: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [25, 35, 50, 65, 80, 95, 110, 120, 130, 140] },
    { bodyweightMax: 165, levels: [30, 40, 55, 70, 90, 105, 120, 130, 145, 155] },
    { bodyweightMax: 198, levels: [35, 50, 65, 80, 100, 115, 135, 150, 160, 175] },
    { bodyweightMax: 999, levels: [40, 55, 70, 90, 110, 130, 150, 165, 180, 195] },
  ],
  female: [
    { bodyweightMax: 145, levels: [10, 15, 25, 35, 45, 55, 67, 75, 85, 90] },
    { bodyweightMax: 999, levels: [12, 20, 30, 40, 52, 65, 78, 90, 95, 105] },
  ],
};

// Hammer Curl (per dumbbell)
const HAMMER_CURL: ExerciseStandard = {
  unit: 'lbs',
  load: 'perDumbbell',
  male: [
    { bodyweightMax: 165, levels: [10, 15, 22, 30, 40, 50, 60, 70, 75, 85] },
    { bodyweightMax: 999, levels: [12, 20, 27, 37, 47, 57, 70, 80, 90, 95] },
  ],
  female: [
    { bodyweightMax: 145, levels: [5, 8, 12, 17, 22, 30, 37, 43, 49, 55] },
    { bodyweightMax: 999, levels: [7, 10, 15, 20, 27, 35, 45, 50, 60, 65] },
  ],
};

// Skull Crushers (EZ bar)
const SKULL_CRUSHERS: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [25, 35, 50, 65, 80, 95, 110, 125, 135, 150] },
    { bodyweightMax: 999, levels: [30, 45, 60, 75, 95, 115, 135, 150, 160, 175] },
  ],
  female: [
    { bodyweightMax: 145, levels: [10, 15, 22, 30, 40, 50, 62, 70, 80, 90] },
    { bodyweightMax: 999, levels: [12, 20, 27, 37, 47, 60, 72, 80, 90, 100] },
  ],
};

// Lateral Raise (per dumbbell)
const LATERAL_RAISE: ExerciseStandard = {
  unit: 'lbs',
  load: 'perDumbbell',
  male: [
    { bodyweightMax: 165, levels: [5, 8, 12, 17, 22, 30, 37, 43, 49, 55] },
    { bodyweightMax: 999, levels: [7, 10, 15, 20, 27, 35, 45, 50, 55, 60] },
  ],
  female: [
    { bodyweightMax: 999, levels: [3, 5, 8, 12, 17, 22, 27, 32, 37, 42] },
  ],
};

// Rear Delt DB Fly (per dumbbell)
const REAR_DELT_FLY: ExerciseStandard = {
  unit: 'lbs',
  load: 'perDumbbell',
  male: [
    { bodyweightMax: 165, levels: [5, 8, 12, 17, 22, 27, 35, 40, 45, 50] },
    { bodyweightMax: 999, levels: [7, 10, 15, 20, 27, 32, 40, 47, 55, 60] },
  ],
  female: [
    { bodyweightMax: 999, levels: [3, 5, 8, 12, 15, 20, 25, 30, 35, 40] },
  ],
};

// Upright Row (barbell)
const UPRIGHT_ROW: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [25, 40, 55, 70, 90, 110, 130, 145, 155, 170] },
    { bodyweightMax: 999, levels: [35, 50, 65, 85, 105, 125, 150, 165, 180, 195] },
  ],
  female: [
    { bodyweightMax: 999, levels: [12, 20, 30, 40, 52, 65, 80, 90, 100, 110] },
  ],
};

// Standing Calf Raise (machine or barbell, total load)
const CALF_RAISE: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [60, 95, 135, 175, 220, 270, 320, 355, 395, 430] },
    { bodyweightMax: 999, levels: [80, 120, 165, 215, 270, 325, 385, 430, 470, 515] },
  ],
  female: [
    { bodyweightMax: 999, levels: [35, 60, 90, 120, 155, 195, 235, 265, 295, 325] },
  ],
};

// === Variants of the lifts above, at commonly cited ratios ===
// Estimates, not separate data: they are only as good as the parent table and
// the ratio. Machine loads (leg press, pulldown, cable row) also vary from
// machine to machine far more than a barbell does.

const FRONT_SQUAT = scaled(SQUAT, 0.8);
const INCLINE_BENCH = scaled(BENCH_PRESS, 0.8);
const TRAP_BAR_DEADLIFT = scaled(DEADLIFT, 1.05);
const LEG_PRESS = scaled(SQUAT, 1.75);
const LAT_PULLDOWN = scaled(BARBELL_ROW, 0.95);
const CABLE_ROW = scaled(BARBELL_ROW, 0.95);
const DB_ROW = scaled(BARBELL_ROW, 0.45, 'perDumbbell');

// === More bodyweight ===

// Full push-ups, strict, to failure. L5 is about the ACSM "good" band for 20s.
const PUSH_UP: ExerciseStandard = {
  unit: 'reps',
  bodyweightRelative: true,
  male: [{ bodyweightMax: 999, levels: [5, 10, 15, 20, 27, 33, 40, 46, 53, 60] }],
  female: [{ bodyweightMax: 999, levels: [1, 3, 6, 10, 14, 18, 23, 28, 34, 40] }],
};

// Inverted (Australian) row, body straight, feet on the floor.
const INVERTED_ROW: ExerciseStandard = {
  unit: 'reps',
  bodyweightRelative: true,
  male: [{ bodyweightMax: 999, levels: [3, 6, 9, 12, 15, 18, 21, 25, 28, 32] }],
  female: [{ bodyweightMax: 999, levels: [1, 3, 5, 8, 10, 13, 16, 19, 22, 25] }],
};

// Side plank, seconds per side: about half the front plank.
const SIDE_PLANK: ExerciseStandard = {
  unit: 'seconds',
  male: PLANK.male.map((b) => ({ bodyweightMax: b.bodyweightMax, levels: b.levels.map((l) => Math.round(l / 2)) as Bracket['levels'] })),
  female: PLANK.female.map((b) => ({ bodyweightMax: b.bodyweightMax, levels: b.levels.map((l) => Math.round(l / 2)) as Bracket['levels'] })),
};

// Weighted pull-ups and dips: added 1RM as a fraction of bodyweight. The low
// end follows the plain tables: 12 strict pull-ups (L5) is, by Epley, a 1RM of
// about 1.4× bodyweight, i.e. +0.4. L10 is about the elite added load.
const WEIGHTED_PULL_UP: ExerciseStandard = {
  unit: 'lbs',
  load: 'added',
  bodyweightRelative: true,
  male: [{ bodyweightMax: 999, levels: [0.03, 0.1, 0.17, 0.27, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] }],
  female: [{ bodyweightMax: 999, levels: [0.01, 0.03, 0.07, 0.13, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55] }],
};

const WEIGHTED_DIP: ExerciseStandard = {
  unit: 'lbs',
  load: 'added',
  bodyweightRelative: true,
  male: [{ bodyweightMax: 999, levels: [0.05, 0.15, 0.27, 0.4, 0.55, 0.7, 0.85, 0.95, 1.05, 1.15] }],
  female: [{ bodyweightMax: 999, levels: [0.02, 0.05, 0.1, 0.18, 0.27, 0.37, 0.47, 0.55, 0.62, 0.7] }],
};

// === Lookup map ===
// Each rule names the lift it grades. A name matches when every `all` group has
// at least one phrase in it and no `unless` phrase appears. Phrases match whole
// words (an "s"/"es" plural is allowed), so "dip" does not match "hip" and
// "bench" matches "Bench Press" but is refused for "Bench Dips".
//
// `unless` is what keeps a variant off its parent's scale. A front squat is not
// a back squat, a dumbbell curl is weighed per hand not per bar, and an assisted
// pull-up is not a pull-up; grading any of them against the parent's table puts
// a confident, wrong number on the card. With no standard of its own the
// variant returns null and goes unrated, which is honest.
//
// First match wins, so list more specific lifts first.

interface MatchRule {
  all: string[][];
  unless?: string[];
  standard: ExerciseStandard;
}

const DUMBBELL = ['db', 'dumbbell'];
const KETTLEBELL = ['kettlebell', 'kb'];
const ONE_SIDE = ['single arm', 'one arm', 'single leg', 'one leg', 'sl'];
const ASSISTED = ['machine', 'smith', 'cable', 'band', 'banded', 'assisted'];

const STANDARDS_MAP: MatchRule[] = [
  {
    all: [['close grip bench', 'cgbp']],
    unless: [...DUMBBELL, 'incline', 'decline', ...ASSISTED],
    standard: CLOSE_GRIP_BENCH,
  },
  {
    all: [['incline'], DUMBBELL, ['bench', 'press']],
    unless: ['fly', 'row', 'close grip', ...ONE_SIDE, ...ASSISTED],
    standard: INCLINE_DB_PRESS,
  },
  {
    all: [['incline'], ['bench', 'press']],
    unless: [...DUMBBELL, ...KETTLEBELL, 'fly', 'row', 'curl', 'close grip', ...ONE_SIDE, ...ASSISTED],
    standard: INCLINE_BENCH,
  },
  {
    all: [DUMBBELL, ['bench', 'flat']],
    unless: ['incline', 'decline', 'fly', 'row', 'pullover', 'squeeze', 'close grip', 'floor', 'dip', 'step', ...ONE_SIDE, ...ASSISTED],
    standard: FLAT_DB_BENCH,
  },
  {
    all: [['bench']],
    unless: [
      ...DUMBBELL, ...KETTLEBELL, 'incline', 'decline', 'close grip', 'floor', 'reverse grip',
      'dip', 'row', 'pull', 'step', 'step up', 'jump', 'hop', 'thrust', 'crunch', 'sit up', 'raise', 'squat', 'fly',
      ...ONE_SIDE, ...ASSISTED,
    ],
    standard: BENCH_PRESS,
  },
  {
    // A stiff-leg deadlift loads like an RDL, not a conventional pull.
    all: [['romanian deadlift', 'romanian dl', 'rdl', 'stiff leg deadlift', 'stiff legged deadlift', 'straight leg deadlift', 'sldl']],
    unless: [...DUMBBELL, ...KETTLEBELL, ...ONE_SIDE, 'b stance', 'kickstand', ...ASSISTED],
    standard: RDL,
  },
  {
    all: [['trap bar', 'hex bar'], ['deadlift', 'dl']],
    unless: ['jump', ...ONE_SIDE],
    standard: TRAP_BAR_DEADLIFT,
  },
  {
    all: [['deadlift']],
    unless: [
      'stiff leg', 'stiff legged', 'straight leg', 'sldl', 'trap bar', 'hex bar', 'block', 'rack', 'suitcase', 'jefferson',
      ...DUMBBELL, ...KETTLEBELL, ...ONE_SIDE, ...ASSISTED,
    ],
    standard: DEADLIFT,
  },
  {
    all: [['hip thrust']],
    unless: [...DUMBBELL, ...KETTLEBELL, ...ONE_SIDE, 'bodyweight', 'bw', 'frog', ...ASSISTED],
    standard: HIP_THRUST,
  },
  {
    all: [['goblet']],
    unless: ['lunge', 'split', 'bulgarian', 'carry', 'step'],
    standard: GOBLET_SQUAT,
  },
  {
    all: [['bulgarian', 'rear foot elevated', 'rfess']],
    unless: ['goblet', 'jump', 'jumping', ...ASSISTED],
    standard: BULGARIAN_SPLIT_SQUAT,
  },
  {
    all: [['front squat']],
    unless: [...DUMBBELL, ...KETTLEBELL, 'goblet', ...ONE_SIDE, ...ASSISTED],
    standard: FRONT_SQUAT,
  },
  {
    all: [['leg press']],
    unless: ['calf', ...ONE_SIDE],
    standard: LEG_PRESS,
  },
  {
    all: [['squat']],
    unless: [
      'front', 'hack', 'pistol', 'jump', 'jumping', 'split', 'overhead', 'zercher', 'safety bar', 'ssb', 'belt', 'sissy',
      'air', 'bodyweight', 'bw', 'cossack', 'landmine', 'pendulum', 'wall', 'sumo', 'half', 'quarter', 'hold',
      ...DUMBBELL, ...KETTLEBELL, ...ONE_SIDE, ...ASSISTED,
    ],
    standard: SQUAT,
  },
  {
    all: [DUMBBELL, ['shoulder press', 'overhead press', 'ohp', 'military press', 'seated dumbbell press', 'seated db press']],
    unless: ['arnold', 'landmine', ...ONE_SIDE, ...ASSISTED],
    standard: DB_SHOULDER_PRESS,
  },
  {
    all: [['overhead press', 'ohp', 'military press', 'shoulder press', 'strict press']],
    unless: [...DUMBBELL, ...KETTLEBELL, 'landmine', 'arnold', 'push press', ...ONE_SIDE, ...ASSISTED],
    standard: OHP,
  },
  {
    all: [['lunge']],
    unless: ['jump', 'jumping', ...ASSISTED],
    standard: LUNGE,
  },
  {
    all: [DUMBBELL, ['row']],
    unless: ['upright', 'renegade', 'band', 'banded'],
    standard: DB_ROW,
  },
  {
    all: [['inverted row', 'australian pull up', 'australian row', 'body row', 'bodyweight row']],
    unless: ['feet elevated', 'weighted'],
    standard: INVERTED_ROW,
  },
  {
    all: [['lat pulldown', 'lat pull down', 'pulldown', 'pull down']],
    unless: ['straight arm', 'band', 'banded', ...ONE_SIDE],
    standard: LAT_PULLDOWN,
  },
  {
    all: [['cable row', 'seated row', 'low row']],
    unless: ['upright', 'band', 'banded', ...ONE_SIDE],
    standard: CABLE_ROW,
  },
  {
    all: [['barbell row', 'bb row', 'bent over row', 'bent row', 'pendlay', 'yates row']],
    unless: [...DUMBBELL, ...KETTLEBELL, 't bar', 'seal', 'chest supported', 'landmine', 'inverted', ...ONE_SIDE, ...ASSISTED],
    standard: BARBELL_ROW,
  },
  {
    all: [['upright row']],
    unless: [...DUMBBELL, ...KETTLEBELL, ...ONE_SIDE, ...ASSISTED],
    standard: UPRIGHT_ROW,
  },
  {
    all: [['hammer curl']],
    unless: ['rope', 'preacher', ...ASSISTED],
    standard: HAMMER_CURL,
  },
  {
    // The barbell table is for the whole bar. Dumbbell, cable and leg curls are
    // different lifts that happen to share the word.
    all: [['curl']],
    unless: [
      'leg', 'hamstring', 'nordic', 'glute', 'ham', 'lying', 'seated', 'prone', 'wrist', 'reverse', 'reverse grip',
      'incline', 'concentration', 'preacher', 'spider', 'drag', 'zottman', 'bayesian', 'rope', 'cross body',
      'curl up', 'ab', 'hammer', ...DUMBBELL, ...KETTLEBELL, ...ONE_SIDE, ...ASSISTED,
    ],
    standard: BARBELL_CURL,
  },
  {
    all: [['skull crusher', 'skullcrusher', 'lying tricep', 'lying triceps']],
    unless: [...DUMBBELL, ...KETTLEBELL, ...ONE_SIDE, ...ASSISTED],
    standard: SKULL_CRUSHERS,
  },
  {
    // Before lateral raise, so "rear lateral raise" lands here.
    all: [['rear delt', 'reverse fly', 'rear lateral', 'bent over lateral', 'bent over raise']],
    unless: ['row', 'face pull', 'pec deck', ...ASSISTED],
    standard: REAR_DELT_FLY,
  },
  {
    all: [['lateral raise', 'side raise', 'side lateral']],
    unless: ['front', 'leaning', 'lying', ...ASSISTED],
    standard: LATERAL_RAISE,
  },
  {
    // The table is standing, loaded, both legs. "machine" is fine here.
    all: [['calf', 'calves']],
    unless: ['seated', 'donkey', 'leg press', 'bodyweight', 'bw', 'stretch', 'single', ...ONE_SIDE],
    standard: CALF_RAISE,
  },
  {
    all: [['weighted'], ['pull up', 'pullup', 'chin up', 'chinup']],
    unless: ['assisted', 'negative', 'eccentric', 'band', 'banded', 'machine', 'lat'],
    standard: WEIGHTED_PULL_UP,
  },
  {
    all: [['weighted'], ['dip']],
    unless: ['bench', 'chair', 'assisted', 'negative', 'eccentric', 'band', 'banded', 'machine', 'ring'],
    standard: WEIGHTED_DIP,
  },
  {
    all: [['push up', 'pushup', 'press up']],
    unless: [
      'knee', 'kneeling', 'incline', 'decline', 'weighted', 'diamond', 'clap', 'plyo', 'plyometric', 'handstand', 'pike',
      'wall', 'archer', 'band', 'banded', ...ONE_SIDE,
    ],
    standard: PUSH_UP,
  },
  {
    all: [['pull up', 'pullup', 'chin up', 'chinup']],
    unless: ['assisted', 'negative', 'eccentric', 'weighted', 'band', 'banded', 'jumping', 'jump', 'australian', 'inverted', 'machine', 'lat'],
    standard: PULL_UP,
  },
  {
    all: [['dip']],
    unless: ['bench', 'chair', 'assisted', 'negative', 'eccentric', 'weighted', 'band', 'banded', 'machine', 'ring'],
    standard: DIP,
  },
  {
    all: [['ab wheel', 'ab roller', 'ab rollout', 'wheel rollout']],
    unless: ['weighted'],
    standard: AB_WHEEL,
  },
  {
    all: [['hanging leg raise']],
    unless: ['weighted', 'knee', 'bent knee'],
    standard: HANGING_LEG_RAISE,
  },
  {
    all: [['side plank']],
    unless: ['copenhagen', 'weighted', 'star', 'dip', 'reach', 'rotation', 'raise', 'knee', 'kneeling'],
    standard: SIDE_PLANK,
  },
  {
    all: [['plank']],
    unless: ['side', 'copenhagen', 'reverse', 'jack', 'walk', 'tap', 'up down', 'weighted', 'rkc', 'ball', 'dynamic'],
    standard: PLANK,
  },
];

/**
 * Lowercase, every run of punctuation or space to one space, and "flies"/"flyes"
 * to "fly". "Pull-Ups (Weighted)" becomes "pull ups weighted".
 */
export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\bfl(?:ies|yes)\b/g, 'fly');
}

/** Whether `phrase` appears in a normalized name as whole words, plural allowed. */
export function nameHas(normalized: string, phrase: string): boolean {
  return new RegExp(`(?:^| )${phrase}(?:s|es)?(?= |$)`).test(normalized);
}

export function findStandard(exerciseName: string): ExerciseStandard | null {
  const n = normalizeExerciseName(exerciseName);
  if (!n) return null;
  const rule = STANDARDS_MAP.find(
    (r) =>
      r.all.every((group) => group.some((p) => nameHas(n, p))) &&
      !(r.unless ?? []).some((p) => nameHas(n, p)),
  );
  return rule?.standard ?? null;
}

// The next rung of the weight-class ladder, which is where each table's
// open-ended (999) bracket sits. Not guessed: scaling each open bracket back
// against the one before it, at the exponent the closed brackets themselves
// follow, lands on these rungs: ~272 after 242 for men, ~215 after 180 for
// women, ~200 after 165, and so on.
const CLASS_LADDER: Record<'male' | 'female', number[]> = {
  male: [132, 165, 198, 242, 275],
  female: [115, 145, 180, 215],
};

// How thresholds scale with bodyweight below the lightest bracket: the median
// exponent between adjacent brackets across these tables is 0.59.
const BODYWEIGHT_EXPONENT = 0.6;

type Levels = Bracket['levels'];

// The bodyweight the single-table bodyweight feats are written for: the middle
// of the weight tables' brackets.
export const REFERENCE_BODYWEIGHT: Record<'male' | 'female', number> = { male: 180, female: 145 };

/**
 * Thresholds for a bodyweight feat, moved to this lifter's bodyweight.
 *
 * Twenty pull-ups used to ask the same of a 150 lb and a 250 lb lifter. The
 * weight tables say strength grows with bodyweight^0.6, so strength relative
 * to bodyweight, which is what a pull-up tests, falls off as bodyweight^-0.4.
 * Each threshold is turned into that ratio (a rep count through Epley, 1RM ≈
 * bodyweight × (1 + reps/30); an added load as 1 + fraction), scaled, and
 * turned back. At the reference bodyweight nothing moves. Epley is used here
 * only to put a table's own counts on a ratio scale, so the 12-rep cap on set
 * estimates does not apply.
 */
function relativeThresholds(
  table: Levels,
  load: Load | undefined,
  gender: 'male' | 'female',
  bodyweightLbs: number,
): Levels {
  const k = Number.isFinite(bodyweightLbs) && bodyweightLbs > 0
    ? (bodyweightLbs / REFERENCE_BODYWEIGHT[gender]) ** (BODYWEIGHT_EXPONENT - 1)
    : 1;
  if (load === 'added') {
    // Fractions of bodyweight in, lbs of added load out.
    // (1 + f)·k − 1, arranged so it is exact at k = 1: 0.6 stays 0.6, not 0.6000000000000001.
    return table.map((f) => Math.max(0, f * k + (k - 1)) * bodyweightLbs) as Levels;
  }
  // 30·((1 + n/30)·k − 1), arranged the same way.
  return table.map((n) => Math.max(0, n * k + 30 * (k - 1))) as Levels;
}

/**
 * The L1..L10 thresholds for a lifter of this bodyweight.
 *
 * Brackets used to be steps: everyone up to 198 lbs was scored as a 198 lb
 * lifter, so a 166 lb lifter faced a 198 lb lifter's numbers, and one pound
 * across a boundary moved a bench of 300 from 6.75 to 6.11. Now each bracket
 * is a point, and a lifter between two points is scored between them.
 *
 * Below the lightest bracket the thresholds keep scaling down at the tables'
 * own rate. Above the heaviest they hold, because extra bodyweight past the
 * top class should not raise the bar. A table with one bracket has no
 * bodyweight in it at all and is used as is.
 */
function thresholdsFor(brackets: Bracket[], gender: 'male' | 'female', bodyweightLbs: number): Levels {
  if (brackets.length === 1) return brackets[0].levels;

  const points = brackets.map((b, i) => {
    if (b.bodyweightMax < 999) return { bw: b.bodyweightMax, levels: b.levels };
    const below = brackets[i - 1].bodyweightMax;
    const rung = CLASS_LADDER[gender].find((c) => c > below);
    return { bw: rung ?? below, levels: b.levels };
  });

  const first = points[0];
  const last = points[points.length - 1];
  // Unreachable through user_stats (its CHECK is 50–600), but a NaN would
  // otherwise fall through every comparison below.
  if (!Number.isFinite(bodyweightLbs)) return last.levels;
  if (bodyweightLbs <= first.bw) {
    const k = (Math.max(bodyweightLbs, 1) / first.bw) ** BODYWEIGHT_EXPONENT;
    return first.levels.map((l) => l * k) as Levels;
  }
  if (bodyweightLbs >= last.bw) return last.levels;

  const hi = points.findIndex((p) => p.bw >= bodyweightLbs);
  const a = points[hi - 1];
  const b = points[hi];
  const t = (bodyweightLbs - a.bw) / (b.bw - a.bw);
  return a.levels.map((l, i) => l + (b.levels[i] - l) * t) as Levels;
}

// Past about a dozen reps a set measures endurance more than strength, and
// Epley runs away with it: 30 reps doubled the weight. Reps beyond this count
// as this many, so a high-rep set never rates above the same weight for 12.
export const MAX_REPS_FOR_ESTIMATE = 12;

// Epley 1RM estimate. Reps=1 (or null) returns weight as-is.
export function estimate1RM(weight: number, reps: number | null): number {
  const r = reps && reps > 1 ? Math.min(reps, MAX_REPS_FOR_ESTIMATE) : 1;
  if (r === 1) return weight;
  return weight * (1 + r / 30);
}

// === Age ===
// Published age coefficients from masters and teen powerlifting, where a
// coefficient of 1.13 means a lift counts as 13% more. Thresholds are divided
// by it: a 50-year-old is scored against thresholds 1/1.13 of the open ones.
//
// The old curve (0.5%/yr from 30) was far too gentle past 60 (a 70-year-old
// got 0.80 where the tables give 0.61) and gave teenagers no allowance at all.

// Foster, ages 14–22. Open (1.0) from 23.
const TEEN_COEFFICIENTS: Record<number, number> = {
  14: 1.23, 15: 1.18, 16: 1.13, 17: 1.08, 18: 1.06, 19: 1.04, 20: 1.03, 21: 1.02, 22: 1.01,
};
// Foster rises about 0.05 a year from 17 down to 14. user_stats accepts ages
// from 10, so that trend is extended below 14; no published table covers it.
const TEEN_EXTRAPOLATION_PER_YEAR = 0.05;

// McCulloch, ages 40–90. Open (1.0) through 39; held at the 90 value past it.
const MASTERS_COEFFICIENTS = [
  1.0, 1.01, 1.02, 1.031, 1.043, 1.055, 1.068, 1.082, 1.097, 1.113, // 40–49
  1.13, 1.147, 1.165, 1.184, 1.204, 1.225, 1.246, 1.268, 1.291, 1.315, // 50–59
  1.34, 1.366, 1.393, 1.421, 1.45, 1.48, 1.511, 1.543, 1.576, 1.61, // 60–69
  1.645, 1.681, 1.718, 1.756, 1.795, 1.835, 1.876, 1.918, 1.961, 2.005, // 70–79
  2.05, 2.096, 2.143, 2.191, 2.24, 2.29, 2.341, 2.393, 2.446, 2.5, 2.555, // 80–90
];

export function ageCoefficient(age: number): number {
  const a = Math.round(age);
  if (!Number.isFinite(a)) return 1;
  if (a < 14) return TEEN_COEFFICIENTS[14] + (14 - a) * TEEN_EXTRAPOLATION_PER_YEAR;
  if (a <= 22) return TEEN_COEFFICIENTS[a];
  if (a < 40) return 1;
  return MASTERS_COEFFICIENTS[Math.min(a, 90) - 40];
}

/** The share of the open thresholds a lifter of this age is scored against. */
export function ageFactor(age: number): number {
  return 1 / ageCoefficient(age);
}

export interface RatingResult {
  level: number; // fractional 0..10
  unit: Unit;
  metric: number; // the comparable value (estimated 1RM lbs, reps, or seconds)
  // The value to reach for the next whole level, in the same terms as `metric`
  // and on the SAME age-adjusted scale the level was computed against. Null at
  // L10. Rounded up, so the number shown is never one the user has already
  // passed without the level ticking over.
  nextThreshold: number | null;
  nextLevel: number | null;
}

export function getRating(
  exerciseName: string,
  weight: number,
  reps: number | null,
  stats: RatingStats
): RatingResult | null {
  const standard = findStandard(exerciseName);
  if (!standard) return null;
  if (!weight || weight <= 0) return null;

  const genderKey = scaleFor(stats);
  if (!genderKey) return null;
  const brackets = standard[genderKey];
  const table = thresholdsFor(brackets, genderKey, stats.bodyweight_lbs);
  const thresholds = standard.bodyweightRelative
    ? relativeThresholds(table, standard.load, genderKey, stats.bodyweight_lbs)
    : table;
  const factor = ageFactor(stats.age);
  // Adjust thresholds by age (teens and masters get lower thresholds).
  // Every comparison AND every reported target below must use `adjusted`:
  // reading the level off the adjusted scale but reporting the next target off
  // the raw one told anyone over 30 to chase a number higher than the one that
  // would actually level them up.
  const adjusted = thresholds.map((l) => l * factor) as Levels;

  let metric: number;
  if (standard.unit === 'lbs') {
    // Without a rep count there is no telling a single from a set of ten, and
    // reading it as a single under-rated every rep-range set logged without reps.
    if (!reps || reps < 1) return null;
    // A weighted pull-up moves the body as well as the belt, so the estimate is
    // made on the total and the body taken back off: 45×8 at 180 lbs is a 1RM
    // of about +105, not the +57 the belt alone would suggest.
    metric =
      standard.load === 'added'
        ? estimate1RM(stats.bodyweight_lbs + weight, reps) - stats.bodyweight_lbs
        : estimate1RM(weight, reps);
  } else {
    // reps or seconds: use weight field as the count (matches RecordCard convention)
    metric = weight;
  }

  // Compute fractional level
  if (metric <= adjusted[0]) {
    // Below L1: scale 0..1 linearly from 0 to L1
    const level = adjusted[0] > 0 ? Math.max(0, metric / adjusted[0]) : 0;
    return {
      level: Math.min(level, 1),
      unit: standard.unit,
      metric,
      nextThreshold: Math.ceil(adjusted[0]),
      nextLevel: 1,
    };
  }
  for (let i = 0; i < adjusted.length - 1; i++) {
    const lo = adjusted[i];
    const hi = adjusted[i + 1];
    if (metric >= lo && metric < hi) {
      const frac = (metric - lo) / (hi - lo);
      return {
        level: i + 1 + frac,
        unit: standard.unit,
        metric,
        nextThreshold: Math.ceil(adjusted[i + 1]),
        nextLevel: i + 2,
      };
    }
  }
  // At or beyond L10
  return {
    level: 10,
    unit: standard.unit,
    metric,
    nextThreshold: null,
    nextLevel: null,
  };
}
