// Strength standards (1-10 scale) for major lifts.
// Level 1 = untrained baseline, Level 5 = reasonably fit, Level 10 = elite-but-attainable (drug-free).
// Weight thresholds represent estimated 1RM in lbs. We use Epley to estimate the user's 1RM from weight x reps.
// Sources: blended from strengthlevel.com / Symmetric Strength / ExRx novice→elite ranges,
// then compressed/expanded so 1 = bare minimum and 10 = hard-but-natural.

export type Gender = 'male' | 'female' | 'other';
export type Unit = 'lbs' | 'reps' | 'seconds';

interface Bracket {
  bodyweightMax: number; // upper bound (inclusive) for this bracket, in lbs
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
// Brackets cover bodyweights up to 132, 165, 198, 242, 308 lbs.
// Within each bracket, the L1..L10 array represents the 1RM at the upper end of typical for that bracket.

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
// Keys are normalized (lowercase, no punctuation) substrings of exercise names.
// First match wins, so list more specific keys first.
const STANDARDS_MAP: Array<{ match: (n: string) => boolean; standard: ExerciseStandard }> = [
  { match: (n) => n.includes('close-grip bench') || n.includes('close grip bench'), standard: CLOSE_GRIP_BENCH },
  { match: (n) => n.includes('incline') && (n.includes('db') || n.includes('dumbbell')), standard: INCLINE_DB_PRESS },
  { match: (n) => (n.includes('flat') && (n.includes('db') || n.includes('dumbbell'))) || (n.includes('dumbbell bench') && !n.includes('incline')), standard: FLAT_DB_BENCH },
  { match: (n) => n.includes('bench'), standard: BENCH_PRESS },
  { match: (n) => n.includes('romanian deadlift') || n.includes('rdl'), standard: RDL },
  { match: (n) => n.includes('deadlift'), standard: DEADLIFT },
  { match: (n) => n.includes('hip thrust'), standard: HIP_THRUST },
  { match: (n) => n.includes('goblet'), standard: GOBLET_SQUAT },
  { match: (n) => n.includes('bulgarian'), standard: BULGARIAN_SPLIT_SQUAT },
  { match: (n) => n.includes('squat'), standard: SQUAT },
  { match: (n) => (n.includes('db') || n.includes('dumbbell')) && (n.includes('shoulder press') || n.includes('shoulder-press')), standard: DB_SHOULDER_PRESS },
  { match: (n) => n.includes('overhead press') || n.includes('ohp') || (n.includes('press') && n.includes('shoulder')) || n.includes('military'), standard: OHP },
  { match: (n) => n.includes('lunge'), standard: LUNGE },
  { match: (n) => n.includes('barbell row') || n.includes('bent-over row') || n.includes('bent over row') || n.includes('pendlay'), standard: BARBELL_ROW },
  { match: (n) => n.includes('upright row'), standard: UPRIGHT_ROW },
  { match: (n) => n.includes('hammer curl'), standard: HAMMER_CURL },
  { match: (n) => n.includes('curl'), standard: BARBELL_CURL },
  { match: (n) => n.includes('skull crusher') || n.includes('lying tricep') || n.includes('lying triceps'), standard: SKULL_CRUSHERS },
  { match: (n) => n.includes('lateral raise'), standard: LATERAL_RAISE },
  { match: (n) => n.includes('rear delt') || (n.includes('reverse') && n.includes('fly')), standard: REAR_DELT_FLY },
  { match: (n) => n.includes('calf'), standard: CALF_RAISE },
  { match: (n) => n.includes('pull-up') || n.includes('pull up') || n.includes('pullup') || n.includes('chin-up') || n.includes('chin up') || n.includes('chinup'), standard: PULL_UP },
  { match: (n) => n.includes('dip'), standard: DIP },
  { match: (n) => n.includes('ab wheel') || n.includes('ab roller'), standard: AB_WHEEL },
  { match: (n) => n.includes('hanging leg raise'), standard: HANGING_LEG_RAISE },
  { match: (n) => n.includes('plank'), standard: PLANK },
];


function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function findStandard(exerciseName: string): ExerciseStandard | null {
  const n = normalize(exerciseName);
  for (const entry of STANDARDS_MAP) {
    if (entry.match(n)) return entry.standard;
  }
  return null;
}

function pickBracket(brackets: Bracket[], bodyweightLbs: number): Bracket {
  for (const b of brackets) {
    if (bodyweightLbs <= b.bodyweightMax) return b;
  }
  return brackets[brackets.length - 1];
}

// Epley 1RM estimate. Reps=1 (or null) returns weight as-is.
export function estimate1RM(weight: number, reps: number | null): number {
  const r = reps && reps > 1 ? reps : 1;
  if (r === 1) return weight;
  return weight * (1 + r / 30);
}

// Age multiplier: full strength up to 30, then ~0.5%/yr decline.
function ageFactor(age: number): number {
  if (age <= 30) return 1;
  return Math.max(0.6, 1 - (age - 30) * 0.005);
}

export interface RatingResult {
  level: number; // fractional 0..10
  unit: Unit;
  metric: number; // the comparable value (estimated 1RM lbs, reps, or seconds)
  nextThreshold: number | null; // raw threshold value to reach next whole level (null if at L10)
  nextLevel: number | null;
}

export function getRating(
  exerciseName: string,
  weight: number,
  reps: number | null,
  stats: { gender: Gender; age: number; bodyweight_lbs: number }
): RatingResult | null {
  const standard = findStandard(exerciseName);
  if (!standard) return null;
  if (!weight || weight <= 0) return null;

  const genderKey: 'male' | 'female' = stats.gender === 'female' ? 'female' : 'male';
  const brackets = standard[genderKey];
  const bracket = pickBracket(brackets, stats.bodyweight_lbs);
  const factor = ageFactor(stats.age);
  // Adjust thresholds by age (older = lower thresholds = higher relative score)
  const adjusted = bracket.levels.map((l) => l * factor) as Bracket['levels'];

  let metric: number;
  if (standard.unit === 'lbs') {
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
      nextThreshold: bracket.levels[0],
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
        nextThreshold: bracket.levels[i + 1],
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
