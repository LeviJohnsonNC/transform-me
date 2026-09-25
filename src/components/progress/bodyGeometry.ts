// Geometry for the hologram figure, in a 200 × 470 box with the midline at
// x = 100. Every shape is drawn for the figure's left half only (x < 100) and
// mirrored, so the two sides always match.

import type { MuscleId } from '@/lib/progress';

export interface BodyPart {
  muscle: MuscleId;
  d: string;
}

/** Half the body's outline, from the neck round to the crotch. */
export const SILHOUETTE_HALF = `
  M 100 58 L 92 58 Q 91 64 90 69
  Q 76 70 64 73 Q 50 77 45 91 Q 42 104 44 118
  Q 40 134 39 152 Q 35 176 32 198 Q 30 210 32 218 Q 36 224 42 222 Q 45 216 45 208
  Q 50 186 55 164 Q 60 146 62 128 L 66 132
  Q 66 156 71 176 Q 72 192 70 206
  Q 64 232 64 262 Q 65 288 73 306
  Q 70 330 71 356 Q 73 384 78 404 Q 74 412 74 418 Q 84 422 94 418 L 93 404
  Q 94 372 96 342 Q 97 322 96 306 L 100 300 Z`;

/**
 * The outer edge only, for stroking. Each half's outline closes along the
 * midline, and stroking both halves drew a seam down the middle of the body.
 */
export const EDGE_HALF = SILHOUETTE_HALF.replace(/^\s*M 100 58 L/, 'M').replace(/L 100 300 Z\s*$/, '');

/**
 * Which way each muscle's fibres run, in degrees, for the striations drawn
 * inside it: across the chest, fanned over the shoulder, down the limbs.
 */
export const FIBRE_ANGLE: Record<MuscleId, number> = {
  chest: -15, shoulders: 60, triceps: 82, lats: -55, traps: 30, rearDelts: 60, biceps: 82, forearms: 75,
  quads: 84, glutes: 25, hamstrings: 86, calves: 86, abs: 0, obliques: 45, lowerBack: 90,
};

export const FRONT: BodyPart[] = [
  // Traps, the slope from neck to shoulder.
  { muscle: 'traps', d: 'M 91 66 Q 80 70 67 74 Q 78 78 90 76 Z' },
  // Delts: a cap over the shoulder, front and side heads.
  { muscle: 'shoulders', d: 'M 66 76 Q 52 79 47 93 Q 45 106 49 116 Q 56 108 60 98 Q 64 88 73 81 Z' },
  // Pecs: upper and lower.
  { muscle: 'chest', d: 'M 98 79 L 76 79 Q 68 84 64 94 Q 80 92 98 94 Z' },
  { muscle: 'chest', d: 'M 98 96 Q 80 94 63 97 Q 64 110 74 117 Q 86 121 98 117 Z' },
  { muscle: 'biceps', d: 'M 50 118 Q 44 132 44 148 Q 48 157 54 155 Q 60 140 61 124 Q 57 118 50 118 Z' },
  { muscle: 'forearms', d: 'M 44 159 Q 38 176 35 198 Q 38 204 43 204 Q 50 184 55 162 Q 50 158 44 159 Z' },
  // Serratus and obliques down the side of the trunk.
  { muscle: 'obliques', d: 'M 74 120 Q 70 132 72 146 L 82 138 Q 80 128 86 122 Z' },
  { muscle: 'obliques', d: 'M 72 149 Q 72 168 76 180 Q 80 190 87 194 L 87 146 L 82 142 Z' },
  // Abs: six blocks and the lower V.
  { muscle: 'abs', d: 'M 99 121 L 90 121 L 89 138 L 99 139 Z' },
  { muscle: 'abs', d: 'M 99 141 L 89 140 L 89 158 L 99 159 Z' },
  { muscle: 'abs', d: 'M 99 161 L 89 160 L 89 179 L 99 180 Z' },
  { muscle: 'abs', d: 'M 99 182 L 89 181 Q 91 196 99 205 Z' },
  // Quads: the outer sweep and the teardrop.
  { muscle: 'quads', d: 'M 84 209 Q 72 222 68 246 Q 66 272 72 294 Q 76 296 78 292 Q 78 250 86 212 Z' },
  { muscle: 'quads', d: 'M 97 212 L 88 212 Q 80 250 80 294 Q 86 302 93 298 Q 98 272 97 212 Z' },
  // Shins and the front of the calf.
  { muscle: 'calves', d: 'M 91 316 L 78 314 Q 72 336 73 360 Q 76 384 81 402 L 89 402 Q 90 372 93 344 Z' },
];

export const BACK: BodyPart[] = [
  // Traps: the kite from the skull to mid-back.
  { muscle: 'traps', d: 'M 100 58 L 92 61 Q 82 69 67 74 Q 80 82 88 94 Q 94 110 100 128 Z' },
  { muscle: 'rearDelts', d: 'M 66 76 Q 52 79 47 93 Q 45 106 49 116 Q 56 108 60 98 Q 64 88 73 81 Z' },
  // Lats: the wing, from the armpit sweeping to the lower back.
  { muscle: 'lats', d: 'M 74 86 Q 64 98 65 118 Q 68 142 80 160 L 91 150 Q 94 128 90 108 Q 84 94 74 86 Z' },
  { muscle: 'triceps', d: 'M 50 118 Q 44 132 44 148 Q 48 157 54 155 Q 60 140 61 124 Q 57 118 50 118 Z' },
  { muscle: 'forearms', d: 'M 44 159 Q 38 176 35 198 Q 38 204 43 204 Q 50 184 55 162 Q 50 158 44 159 Z' },
  // Erectors: the two columns either side of the spine.
  { muscle: 'lowerBack', d: 'M 99 132 L 93 132 Q 90 152 84 170 Q 84 186 87 200 L 99 202 Z' },
  { muscle: 'glutes', d: 'M 99 205 L 86 203 Q 72 212 71 232 Q 74 252 90 256 Q 98 254 99 248 Z' },
  { muscle: 'hamstrings', d: 'M 88 259 Q 74 260 70 276 Q 69 294 76 304 L 84 300 Q 84 276 88 259 Z' },
  { muscle: 'hamstrings', d: 'M 97 259 L 91 259 Q 86 280 87 302 Q 92 304 95 300 Q 98 282 97 259 Z' },
  // Calves: both heads of the gastrocnemius, then the lower leg.
  { muscle: 'calves', d: 'M 86 316 Q 76 318 73 336 Q 72 352 78 362 Q 84 344 86 316 Z' },
  { muscle: 'calves', d: 'M 94 316 L 89 316 Q 86 344 80 364 Q 86 370 92 360 Q 96 338 94 316 Z' },
  { muscle: 'calves', d: 'M 91 368 Q 85 374 80 370 Q 79 388 81 402 L 89 402 Q 89 384 91 368 Z' },
];

/** Where a callout's leader line meets each muscle (left half), per view. */
export const ANCHORS: Record<'front' | 'back', Partial<Record<MuscleId, [number, number]>>> = {
  front: {
    traps: [82, 73], shoulders: [55, 94], chest: [82, 100], biceps: [52, 136], forearms: [44, 180],
    obliques: [79, 160], abs: [94, 150], quads: [79, 252], calves: [83, 356],
  },
  back: {
    traps: [92, 90], rearDelts: [55, 94], lats: [77, 118], triceps: [52, 136], forearms: [44, 180],
    lowerBack: [92, 170], glutes: [85, 230], hamstrings: [80, 280], calves: [80, 340],
  },
};
