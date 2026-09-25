import React, { useId, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { levelColor, type MuscleId, type MuscleScore } from '@/lib/progress';
import { ANCHORS, BACK, EDGE_HALF, FIBRE_ANGLE, FRONT, SILHOUETTE_HALF, type BodyPart } from '@/components/progress/bodyGeometry';

interface HoloBodyProps {
  muscles: readonly MuscleScore[];
  selected: MuscleId | null;
  onSelect: (muscle: MuscleId) => void;
}

const MIRROR = 'translate(200 0) scale(-1 1)';

// Fixed, not random, so the figure renders the same every time.
const PARTICLES = [
  { x: 62, r: 0.9, c: '#2BE8FF', delay: 0, dur: 5.5 },
  { x: 78, r: 0.6, c: '#FF2E97', delay: 1.4, dur: 6.5 },
  { x: 96, r: 1.1, c: '#A855F7', delay: 2.9, dur: 5 },
  { x: 112, r: 0.7, c: '#2BE8FF', delay: 0.7, dur: 7 },
  { x: 128, r: 0.9, c: '#FF2E97', delay: 3.6, dur: 6 },
  { x: 140, r: 0.6, c: '#2BE8FF', delay: 2.1, dur: 5.8 },
  { x: 88, r: 0.5, c: '#7BF0FF', delay: 4.4, dur: 6.8 },
];

const UNTRAINED = '#6B5C96';

/** 0..1 for a level, so line weight and glow can climb with it. */
const strength = (level: number) => Math.max(0, Math.min(level, 10)) / 10;

/**
 * The body as a hologram, drawn in light rather than paint: every muscle is a
 * neon outline filled with striations along its fibres, in the lift cards'
 * colour for its level, thicker and brighter the stronger it is. A bold
 * magenta-to-cyan rim traces the body over a perspective floor, and a scan
 * sweeps it top to bottom. Front and back are the faces of a card that turns
 * in 3D; tap the button or swipe.
 */
export const HoloBody: React.FC<HoloBodyProps> = ({ muscles, selected, onSelect }) => {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const touchX = useRef<number | null>(null);
  const flip = () => setSide((s) => (s === 'front' ? 'back' : 'front'));

  return (
    <div className="relative select-none">
      <div
        className="holo-stage relative mx-auto w-full max-w-[360px] aspect-[280/440]"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const start = touchX.current;
          touchX.current = null;
          if (start !== null && Math.abs(e.changedTouches[0].clientX - start) > 40) flip();
        }}
      >
        <div className={cn('holo-card absolute inset-0', side === 'back' && 'is-back')}>
          <div className="holo-face absolute inset-0" aria-hidden={side !== 'front'}>
            <Figure parts={FRONT} view="front" muscles={muscles} selected={selected} onSelect={onSelect} active={side === 'front'} />
          </div>
          <div className="holo-face holo-face-back absolute inset-0" aria-hidden={side !== 'back'}>
            <Figure parts={BACK} view="back" muscles={muscles} selected={selected} onSelect={onSelect} active={side === 'back'} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={flip}
        className="absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-[3px] border border-cyan/30 bg-surface-sunken/80 px-2.5 py-1.5 font-display text-[10px] tracking-[0.2em] text-cyan hover:border-cyan/60"
        aria-label={side === 'front' ? 'Turn to the back' : 'Turn to the front'}
      >
        <RotateCw size={12} aria-hidden />
        {side === 'front' ? 'FRONT' : 'BACK'}
      </button>
    </div>
  );
};

interface FigureProps {
  parts: BodyPart[];
  view: 'front' | 'back';
  muscles: readonly MuscleScore[];
  selected: MuscleId | null;
  onSelect: (muscle: MuscleId) => void;
  /** Only the face turned toward you takes taps and focus. */
  active: boolean;
}

const Figure: React.FC<FigureProps> = ({ parts, view, muscles, selected, onSelect, active }) => {
  const id = useId().replace(/:/g, '');
  const levelOf = (m: MuscleId) => muscles.find((s) => s.muscle.id === m)?.level ?? null;
  const labelOf = (m: MuscleId) => muscles.find((s) => s.muscle.id === m)?.muscle.label ?? m;
  const ids = [...new Set(parts.map((p) => p.muscle))];

  // Each part drawn twice, once mirrored. `key` keeps the halves apart.
  const halves = (render: (p: BodyPart, i: number, mirrored: boolean) => React.ReactNode) =>
    parts.flatMap((p, i) => [render(p, i, false), render(p, i, true)]);
  const Body = (props: React.SVGProps<SVGPathElement>) => (
    <>
      <path d={SILHOUETTE_HALF} {...props} />
      <path d={SILHOUETTE_HALF} transform={MIRROR} {...props} />
    </>
  );
  const Edge = (props: React.SVGProps<SVGPathElement>) => (
    <>
      <path d={EDGE_HALF} fill="none" {...props} />
      <path d={EDGE_HALF} transform={MIRROR} fill="none" {...props} />
    </>
  );

  return (
    <svg viewBox="-40 40 280 440" className="h-full w-full overflow-visible" role="group" aria-label={`Muscles, ${view}`}>
      <defs>
        <clipPath id={`${id}-body`}>
          <Body />
        </clipPath>
        {/* No head: the neck fades out instead of ending in a stump. */}
        <linearGradient id={`${id}-neck`} x1="0" y1="40" x2="0" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0.04" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.085" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`${id}-fade`} maskUnits="userSpaceOnUse" x="-60" y="30" width="320" height="460">
          <rect x="-60" y="30" width="320" height="460" fill={`url(#${id}-neck)`} />
        </mask>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.2" stopColor="#FF2E97" />
          <stop offset="0.5" stopColor="#C084FC" />
          <stop offset="0.8" stopColor="#2BE8FF" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2BE8FF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#B8F7FF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#2BE8FF" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="wide" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="tight" />
          <feMerge>
            <feMergeNode in="wide" />
            <feMergeNode in="tight" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Striations along each muscle's fibres: denser, heavier, brighter with level. */}
        {ids.map((m) => {
          const level = levelOf(m);
          const t = level === null ? 0 : strength(level);
          return (
            <pattern
              key={m}
              id={`${id}-fibre-${m}`}
              width="3.2"
              height="3.2"
              patternUnits="userSpaceOnUse"
              patternTransform={`rotate(${FIBRE_ANGLE[m]})`}
            >
              <line
                x1="0" y1="0" x2="0" y2="3.2"
                stroke={level === null ? UNTRAINED : levelColor(level)}
                strokeWidth={level === null ? 0.35 : 0.5 + t * 0.7}
                strokeOpacity={level === null ? 0.35 : 0.35 + t * 0.6}
              />
            </pattern>
          );
        })}
      </defs>

      {/* Perspective floor, and motes of light drifting up from it. */}
      <g stroke="#2BE8FF" strokeWidth="0.5" fill="none" pointerEvents="none">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1="-40" x2="240" y1={432 + i * i * 1.6} y2={432 + i * i * 1.6} strokeOpacity={0.5 - i * 0.07} />
        ))}
        {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((k) => (
          <line key={k} x1={100 + k * 12} y1="432" x2={100 + k * 60} y2="480" strokeOpacity="0.26" />
        ))}
      </g>
      <g pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy="430"
            r={p.r}
            fill={p.c}
            className="holo-mote"
            style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}
          />
        ))}
      </g>

      <g className="holo-figure" mask={`url(#${id}-fade)`}>
        <Body fill="rgba(43,232,255,0.03)" />

        {/* The muscles: fibres inside, a neon outline around. */}
        {halves((p, i, mirrored) => {
          const level = levelOf(p.muscle);
          const lit = level !== null;
          const isSelected = selected === p.muscle;
          const t = lit ? strength(level!) : 0;
          return (
            <path
              key={`m${i}${mirrored}`}
              d={p.d}
              transform={mirrored ? MIRROR : undefined}
              fill={`url(#${id}-fibre-${p.muscle})`}
              stroke={isSelected ? '#FFFFFF' : lit ? levelColor(level!) : UNTRAINED}
              strokeWidth={isSelected ? 1.8 : lit ? 1 + t * 0.6 : 0.6}
              strokeDasharray={lit ? undefined : '2 2'}
              strokeLinejoin="round"
              filter={lit && level! >= 3 ? `url(#${id}-glow)` : undefined}
              className={cn('cursor-pointer outline-none', lit && level! >= 7 && 'holo-pulse')}
              role="button"
              tabIndex={active && !mirrored ? 0 : -1}
              aria-label={`${labelOf(p.muscle)}, ${lit ? `level ${level!.toFixed(1)}` : 'untrained'}`}
              onClick={() => onSelect(p.muscle)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(p.muscle);
                }
              }}
            />
          );
        })}

        {/* The bold duotone rim, then the scan sweeping inside the body. */}
        <Edge stroke={`url(#${id}-rim)`} strokeWidth="1.5" filter={`url(#${id}-glow)`} pointerEvents="none" />
        <g clipPath={`url(#${id}-body)`} pointerEvents="none">
          <rect x="0" y="0" width="200" height="44" fill={`url(#${id}-beam)`} className="holo-beam" />
        </g>
      </g>

      <Callouts view={view} muscles={muscles} />
    </svg>
  );
};

/**
 * HUD tags on the visible side: your two strongest muscles and your weakest,
 * each with a leader line to the muscle, so the picture reads without tapping.
 */
const Callouts: React.FC<{ view: 'front' | 'back'; muscles: readonly MuscleScore[] }> = ({ view, muscles }) => {
  const anchors = ANCHORS[view];
  const visible = muscles
    .filter((m) => m.level !== null && anchors[m.muscle.id])
    .sort((a, b) => b.level! - a.level!);
  if (visible.length === 0) return null;
  const picks = visible.length <= 3 ? visible : [visible[0], visible[1], visible[visible.length - 1]];
  // Alternate sides, top to bottom, so tags never stack on each other.
  const placed = picks
    .map((m) => ({ m, at: anchors[m.muscle.id]! }))
    .sort((a, b) => a.at[1] - b.at[1])
    .map((p, i) => ({ ...p, right: i % 2 === 1 }));

  return (
    <g className="holo-rise" pointerEvents="none">
      {placed.map(({ m, at, right }) => {
        const [ax, ay] = right ? [200 - at[0], at[1]] : at;
        // Tags sit in the gutters either side of the figure (x < 30, x > 170).
        const tx = right ? 238 : -38;
        const elbow = right ? 176 : 24;
        const color = levelColor(m.level!);
        return (
          <g key={m.muscle.id}>
            <polyline
              points={`${ax},${ay} ${elbow},${ay - 10} ${tx},${ay - 10}`}
              fill="none"
              stroke={color}
              strokeOpacity="0.8"
              strokeWidth="0.6"
            />
            <circle cx={ax} cy={ay} r="1.6" fill={color} />
            <text
              x={tx}
              y={ay - 13}
              textAnchor={right ? 'end' : 'start'}
              fontSize="6.2"
              letterSpacing="1.2"
              fill="#A79EC9"
              className="font-display"
            >
              {m.muscle.label.toUpperCase()}
            </text>
            <text
              x={tx}
              y={ay - 1}
              textAnchor={right ? 'end' : 'start'}
              fontSize="9.5"
              fontWeight="700"
              fill="#F0ECFF"
              className="font-display"
            >
              {m.level!.toFixed(1)}
            </text>
          </g>
        );
      })}
    </g>
  );
};

