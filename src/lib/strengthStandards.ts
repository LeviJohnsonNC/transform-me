// Strength standards (1-10 scale) for major lifts.
// Level 1 = untrained baseline, Level 5 = reasonably fit, Level 10 = elite-but-attainable (drug-free).
// Weight thresholds represent estimated 1RM in lbs. We use Epley to estimate the user's 1RM from weight x reps.
// Sources: blended from strengthlevel.com / Symmetric Strength / ExRx novice→elite ranges,
// then compressed/expanded so 1 = bare minimum and 10 = hard-but-natural.

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

interface ExerciseStandard {
  unit: Unit;
  // For 'lbs' exercises: thresholds are estimated 1RM in lbs, varies by gender + bodyweight
  // For 'reps' or 'seconds' exercises: thresholds are absolute, varies by gender only (single bracket)
  male: Bracket[];
  female: Bracket[];
}

// === WEIGHT EXERCISES (1RM in lbs) ===
// Each bracket's L1..L10 is the 1RM for a lifter AT that bracket's bodyweight,
// on the classic weight-class ladder (men 132/165/198/242/275, women
// 115/145/180/215). A lifter between two brackets is scored between them; see
// thresholdsFor.

const BENCH_PRESS: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [70, 95, 125, 150, 180, 210, 240, 270, 300, 335] },
    { bodyweightMax: 165, levels: [85, 115, 145, 175, 205, 240, 275, 310, 345, 380] },
    { bodyweightMax: 198, levels: [95, 130, 165, 195, 230, 270, 310, 350, 390, 430] },
    { bodyweightMax: 242, levels: [105, 145, 180, 215, 255, 295, 340, 385, 430, 475] },
    { bodyweightMax: 999, levels: [115, 155, 195, 235, 275, 320, 365, 415, 465, 515] },
  ],
  female: [
    { bodyweightMax: 115, levels: [30, 45, 60, 75, 90, 110, 130, 150, 170, 195] },
    { bodyweightMax: 145, levels: [35, 50, 70, 85, 105, 125, 150, 170, 195, 220] },
    { bodyweightMax: 180, levels: [40, 60, 80, 100, 120, 145, 170, 195, 220, 250] },
    { bodyweightMax: 999, levels: [45, 65, 90, 110, 135, 160, 190, 220, 250, 280] },
  ],
};

const SQUAT: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [85, 120, 160, 200, 240, 285, 330, 375, 420, 465] },
    { bodyweightMax: 165, levels: [105, 145, 190, 235, 285, 335, 385, 435, 485, 535] },
    { bodyweightMax: 198, levels: [120, 165, 215, 265, 320, 375, 430, 490, 545, 600] },
    { bodyweightMax: 242, levels: [135, 185, 240, 295, 350, 410, 470, 535, 595, 655] },
    { bodyweightMax: 999, levels: [145, 200, 260, 320, 380, 445, 510, 580, 645, 710] },
  ],
  female: [
    { bodyweightMax: 115, levels: [40, 65, 90, 115, 140, 170, 200, 230, 265, 300] },
    { bodyweightMax: 145, levels: [50, 75, 105, 135, 165, 200, 235, 270, 310, 350] },
    { bodyweightMax: 180, levels: [55, 85, 120, 155, 190, 230, 270, 315, 360, 405] },
    { bodyweightMax: 999, levels: [65, 95, 135, 175, 215, 260, 305, 355, 405, 455] },
  ],
};

const DEADLIFT: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [110, 155, 205, 255, 305, 360, 415, 470, 525, 580] },
    { bodyweightMax: 165, levels: [135, 185, 240, 295, 355, 415, 480, 540, 605, 670] },
    { bodyweightMax: 198, levels: [155, 210, 270, 335, 400, 470, 540, 610, 685, 755] },
    { bodyweightMax: 242, levels: [170, 230, 300, 370, 440, 515, 590, 670, 750, 830] },
    { bodyweightMax: 999, levels: [185, 250, 325, 400, 475, 555, 640, 725, 810, 895] },
  ],
  female: [
    { bodyweightMax: 115, levels: [55, 85, 115, 150, 185, 220, 260, 300, 345, 390] },
    { bodyweightMax: 145, levels: [65, 100, 135, 175, 215, 260, 305, 350, 400, 455] },
    { bodyweightMax: 180, levels: [75, 115, 155, 200, 245, 295, 345, 400, 455, 515] },
    { bodyweightMax: 999, levels: [85, 125, 175, 225, 275, 330, 390, 450, 515, 580] },
  ],
};

const OHP: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [45, 65, 85, 105, 125, 150, 175, 200, 225, 250] },
    { bodyweightMax: 165, levels: [55, 75, 100, 120, 145, 170, 200, 225, 255, 285] },
    { bodyweightMax: 198, levels: [60, 85, 110, 135, 160, 190, 220, 250, 285, 315] },
    { bodyweightMax: 242, levels: [70, 95, 120, 150, 180, 210, 245, 280, 315, 350] },
    { bodyweightMax: 999, levels: [75, 105, 130, 165, 195, 230, 265, 305, 345, 385] },
  ],
  female: [
    { bodyweightMax: 115, levels: [20, 30, 40, 55, 70, 85, 100, 115, 135, 155] },
    { bodyweightMax: 145, levels: [25, 35, 50, 65, 80, 95, 115, 135, 155, 175] },
    { bodyweightMax: 180, levels: [30, 40, 55, 75, 90, 110, 130, 150, 175, 200] },
    { bodyweightMax: 999, levels: [30, 45, 65, 85, 105, 125, 150, 175, 200, 225] },
  ],
};

// Incline DB Press (per dumbbell weight)
const INCLINE_DB_PRESS: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [20, 30, 40, 50, 60, 75, 90, 100, 115, 130] },
    { bodyweightMax: 165, levels: [25, 35, 45, 60, 70, 85, 100, 115, 130, 145] },
    { bodyweightMax: 198, levels: [30, 40, 55, 65, 80, 95, 110, 125, 140, 155] },
    { bodyweightMax: 242, levels: [35, 45, 60, 75, 90, 105, 120, 135, 150, 170] },
    { bodyweightMax: 999, levels: [35, 50, 65, 80, 95, 110, 130, 145, 165, 180] },
  ],
  female: [
    { bodyweightMax: 115, levels: [8, 12, 17, 22, 30, 37, 45, 55, 65, 75] },
    { bodyweightMax: 145, levels: [10, 15, 20, 27, 35, 42, 52, 62, 72, 85] },
    { bodyweightMax: 180, levels: [12, 17, 25, 32, 40, 50, 60, 70, 82, 95] },
    { bodyweightMax: 999, levels: [15, 20, 27, 35, 45, 55, 65, 78, 90, 105] },
  ],
};

// Walking / stationary lunge (per-hand or barbell, treated as total added load)
const LUNGE: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [0, 20, 40, 60, 85, 110, 140, 170, 200, 235] },
    { bodyweightMax: 198, levels: [0, 25, 50, 75, 100, 130, 160, 195, 230, 265] },
    { bodyweightMax: 999, levels: [0, 30, 55, 85, 115, 145, 180, 215, 255, 295] },
  ],
  female: [
    { bodyweightMax: 145, levels: [0, 10, 20, 35, 50, 70, 90, 110, 135, 160] },
    { bodyweightMax: 999, levels: [0, 15, 25, 45, 65, 85, 110, 135, 160, 190] },
  ],
};

// === BODYWEIGHT REPS ===

const PULL_UP: ExerciseStandard = {
  unit: 'reps',
  male: [{ bodyweightMax: 999, levels: [1, 3, 5, 8, 12, 16, 20, 25, 30, 35] }],
  female: [{ bodyweightMax: 999, levels: [0, 1, 2, 4, 6, 9, 12, 15, 19, 24] }],
};

const DIP: ExerciseStandard = {
  unit: 'reps',
  male: [{ bodyweightMax: 999, levels: [1, 4, 8, 12, 17, 22, 28, 35, 42, 50] }],
  female: [{ bodyweightMax: 999, levels: [0, 1, 3, 6, 9, 13, 17, 22, 28, 35] }],
};

const AB_WHEEL: ExerciseStandard = {
  unit: 'reps',
  male: [{ bodyweightMax: 999, levels: [1, 3, 5, 8, 12, 16, 20, 25, 30, 40] }],
  female: [{ bodyweightMax: 999, levels: [1, 2, 4, 6, 9, 12, 16, 20, 25, 32] }],
};

const HANGING_LEG_RAISE: ExerciseStandard = {
  unit: 'reps',
  male: [{ bodyweightMax: 999, levels: [1, 3, 5, 8, 12, 16, 20, 25, 30, 38] }],
  female: [{ bodyweightMax: 999, levels: [1, 2, 4, 6, 9, 12, 16, 20, 25, 32] }],
};

const PLANK: ExerciseStandard = {
  unit: 'seconds',
  male: [{ bodyweightMax: 999, levels: [20, 40, 60, 90, 120, 150, 180, 210, 240, 300] }],
  female: [{ bodyweightMax: 999, levels: [20, 40, 60, 90, 120, 150, 180, 210, 240, 300] }],
};

// === Additional lifts (1RM in lbs unless noted) ===

// Close-Grip Bench (~85% of bench)
const CLOSE_GRIP_BENCH: ExerciseStandard = {
  unit: 'lbs',
  male: BENCH_PRESS.male.map((b) => ({ bodyweightMax: b.bodyweightMax, levels: b.levels.map((l) => Math.round(l * 0.85)) as Bracket['levels'] })),
  female: BENCH_PRESS.female.map((b) => ({ bodyweightMax: b.bodyweightMax, levels: b.levels.map((l) => Math.round(l * 0.85)) as Bracket['levels'] })),
};

// Flat Dumbbell Bench (per dumbbell, ~ slightly lighter than incline)
const FLAT_DB_BENCH: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [25, 35, 45, 55, 70, 85, 100, 115, 130, 145] },
    { bodyweightMax: 165, levels: [30, 40, 55, 65, 80, 95, 110, 125, 140, 160] },
    { bodyweightMax: 198, levels: [35, 45, 60, 75, 90, 105, 120, 140, 155, 175] },
    { bodyweightMax: 242, levels: [40, 55, 70, 85, 100, 115, 135, 150, 170, 190] },
    { bodyweightMax: 999, levels: [45, 60, 75, 90, 105, 125, 145, 165, 185, 200] },
  ],
  female: [
    { bodyweightMax: 115, levels: [10, 15, 20, 27, 35, 45, 55, 65, 75, 90] },
    { bodyweightMax: 145, levels: [12, 17, 25, 32, 40, 50, 60, 72, 85, 100] },
    { bodyweightMax: 180, levels: [15, 20, 27, 35, 45, 55, 67, 80, 95, 110] },
    { bodyweightMax: 999, levels: [17, 22, 30, 40, 50, 62, 75, 90, 105, 120] },
  ],
};

// DB Shoulder Press (per dumbbell)
const DB_SHOULDER_PRESS: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [15, 20, 30, 40, 50, 60, 70, 85, 100, 115] },
    { bodyweightMax: 165, levels: [17, 25, 35, 45, 55, 70, 85, 100, 115, 130] },
    { bodyweightMax: 198, levels: [20, 30, 40, 50, 65, 80, 95, 110, 125, 140] },
    { bodyweightMax: 242, levels: [25, 35, 45, 60, 75, 90, 105, 120, 135, 150] },
    { bodyweightMax: 999, levels: [25, 35, 50, 65, 80, 95, 115, 130, 145, 165] },
  ],
  female: [
    { bodyweightMax: 115, levels: [5, 8, 12, 17, 22, 30, 37, 45, 55, 65] },
    { bodyweightMax: 145, levels: [7, 10, 15, 20, 27, 35, 45, 55, 65, 75] },
    { bodyweightMax: 180, levels: [8, 12, 17, 25, 32, 42, 52, 62, 75, 87] },
    { bodyweightMax: 999, levels: [10, 15, 20, 27, 37, 47, 60, 72, 85, 100] },
  ],
};

// Barbell Row (Pendlay/bent-over)
const BARBELL_ROW: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [55, 80, 105, 130, 160, 190, 220, 250, 280, 315] },
    { bodyweightMax: 165, levels: [65, 95, 125, 155, 185, 220, 255, 290, 325, 360] },
    { bodyweightMax: 198, levels: [75, 105, 140, 175, 210, 250, 290, 330, 370, 410] },
    { bodyweightMax: 242, levels: [85, 120, 155, 195, 235, 275, 320, 365, 410, 455] },
    { bodyweightMax: 999, levels: [95, 130, 170, 210, 255, 300, 350, 400, 450, 500] },
  ],
  female: [
    { bodyweightMax: 115, levels: [25, 40, 55, 70, 85, 105, 125, 145, 165, 190] },
    { bodyweightMax: 145, levels: [30, 45, 65, 80, 100, 120, 145, 165, 190, 215] },
    { bodyweightMax: 180, levels: [35, 55, 75, 95, 115, 140, 165, 190, 220, 245] },
    { bodyweightMax: 999, levels: [40, 60, 85, 105, 130, 155, 185, 215, 245, 275] },
  ],
};

// Romanian Deadlift (~85% of conventional deadlift)
const RDL: ExerciseStandard = {
  unit: 'lbs',
  male: DEADLIFT.male.map((b) => ({ bodyweightMax: b.bodyweightMax, levels: b.levels.map((l) => Math.round(l * 0.85)) as Bracket['levels'] })),
  female: DEADLIFT.female.map((b) => ({ bodyweightMax: b.bodyweightMax, levels: b.levels.map((l) => Math.round(l * 0.85)) as Bracket['levels'] })),
};

// Barbell Hip Thrust
const HIP_THRUST: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [95, 135, 185, 235, 290, 345, 405, 465, 525, 585] },
    { bodyweightMax: 198, levels: [115, 160, 215, 270, 330, 395, 460, 525, 590, 655] },
    { bodyweightMax: 999, levels: [135, 185, 245, 305, 370, 440, 510, 585, 655, 730] },
  ],
  female: [
    { bodyweightMax: 145, levels: [55, 90, 130, 175, 220, 270, 320, 375, 430, 490] },
    { bodyweightMax: 999, levels: [70, 110, 155, 205, 260, 315, 375, 435, 500, 565] },
  ],
};

// Goblet Squat (single dumbbell/kettlebell weight)
const GOBLET_SQUAT: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [15, 25, 40, 55, 70, 85, 100, 115, 130, 145] },
    { bodyweightMax: 999, levels: [20, 30, 45, 60, 80, 95, 110, 125, 140, 160] },
  ],
  female: [
    { bodyweightMax: 145, levels: [8, 15, 25, 35, 45, 55, 67, 80, 95, 110] },
    { bodyweightMax: 999, levels: [12, 20, 30, 42, 55, 67, 80, 95, 110, 125] },
  ],
};

// Bulgarian Split Squat (per dumbbell, or barbell on back)
const BULGARIAN_SPLIT_SQUAT: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [0, 15, 25, 40, 55, 70, 85, 105, 125, 145] },
    { bodyweightMax: 198, levels: [0, 20, 30, 45, 60, 80, 100, 120, 140, 160] },
    { bodyweightMax: 999, levels: [0, 20, 35, 55, 75, 95, 115, 135, 160, 180] },
  ],
  female: [
    { bodyweightMax: 145, levels: [0, 8, 15, 22, 32, 45, 57, 70, 85, 100] },
    { bodyweightMax: 999, levels: [0, 10, 20, 30, 42, 55, 70, 85, 100, 117] },
  ],
};

// Barbell Curl
const BARBELL_CURL: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 132, levels: [25, 35, 50, 65, 80, 95, 110, 125, 140, 155] },
    { bodyweightMax: 165, levels: [30, 40, 55, 70, 90, 105, 120, 140, 155, 175] },
    { bodyweightMax: 198, levels: [35, 50, 65, 80, 100, 115, 135, 155, 175, 195] },
    { bodyweightMax: 999, levels: [40, 55, 70, 90, 110, 130, 150, 170, 195, 215] },
  ],
  female: [
    { bodyweightMax: 145, levels: [10, 15, 25, 35, 45, 55, 67, 80, 92, 107] },
    { bodyweightMax: 999, levels: [12, 20, 30, 40, 52, 65, 78, 92, 107, 125] },
  ],
};

// Hammer Curl (per dumbbell)
const HAMMER_CURL: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [10, 15, 22, 30, 40, 50, 60, 72, 85, 100] },
    { bodyweightMax: 999, levels: [12, 20, 27, 37, 47, 57, 70, 82, 97, 112] },
  ],
  female: [
    { bodyweightMax: 145, levels: [5, 8, 12, 17, 22, 30, 37, 45, 55, 67] },
    { bodyweightMax: 999, levels: [7, 10, 15, 20, 27, 35, 45, 55, 65, 77] },
  ],
};

// Skull Crushers (EZ bar)
const SKULL_CRUSHERS: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [25, 35, 50, 65, 80, 95, 110, 130, 150, 170] },
    { bodyweightMax: 999, levels: [30, 45, 60, 75, 95, 115, 135, 155, 175, 200] },
  ],
  female: [
    { bodyweightMax: 145, levels: [10, 15, 22, 30, 40, 50, 62, 75, 90, 105] },
    { bodyweightMax: 999, levels: [12, 20, 27, 37, 47, 60, 72, 87, 102, 120] },
  ],
};

// Lateral Raise (per dumbbell)
const LATERAL_RAISE: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [5, 8, 12, 17, 22, 30, 37, 45, 55, 65] },
    { bodyweightMax: 999, levels: [7, 10, 15, 20, 27, 35, 45, 52, 62, 75] },
  ],
  female: [
    { bodyweightMax: 999, levels: [3, 5, 8, 12, 17, 22, 27, 35, 42, 50] },
  ],
};

// Rear Delt DB Fly (per dumbbell)
const REAR_DELT_FLY: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [5, 8, 12, 17, 22, 27, 35, 42, 50, 60] },
    { bodyweightMax: 999, levels: [7, 10, 15, 20, 27, 32, 40, 50, 60, 70] },
  ],
  female: [
    { bodyweightMax: 999, levels: [3, 5, 8, 12, 15, 20, 25, 32, 40, 47] },
  ],
};

// Upright Row (barbell)
const UPRIGHT_ROW: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [25, 40, 55, 70, 90, 110, 130, 150, 170, 195] },
    { bodyweightMax: 999, levels: [35, 50, 65, 85, 105, 125, 150, 170, 195, 220] },
  ],
  female: [
    { bodyweightMax: 999, levels: [12, 20, 30, 40, 52, 65, 80, 95, 110, 130] },
  ],
};

// Standing Calf Raise (machine or barbell, total load)
const CALF_RAISE: ExerciseStandard = {
  unit: 'lbs',
  male: [
    { bodyweightMax: 165, levels: [60, 95, 135, 175, 220, 270, 320, 375, 430, 495] },
    { bodyweightMax: 999, levels: [80, 120, 165, 215, 270, 325, 385, 450, 515, 585] },
  ],
  female: [
    { bodyweightMax: 999, levels: [35, 60, 90, 120, 155, 195, 235, 280, 325, 375] },
  ],
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
    all: [['romanian deadlift', 'romanian dl', 'rdl']],
    unless: [...DUMBBELL, ...KETTLEBELL, ...ONE_SIDE, 'b stance', 'kickstand', ...ASSISTED],
    standard: RDL,
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

// Epley 1RM estimate. Reps=1 (or null) returns weight as-is.
export function estimate1RM(weight: number, reps: number | null): number {
  const r = reps && reps > 1 ? reps : 1;
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
  const thresholds = thresholdsFor(brackets, genderKey, stats.bodyweight_lbs);
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
    metric = estimate1RM(weight, reps);
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
