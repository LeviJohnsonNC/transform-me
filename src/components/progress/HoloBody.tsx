import React, { useId, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { levelColor, type MuscleId, type MuscleScore } from '@/lib/progress';
import { ANCHORS, BACK, FRONT, HEAD, SILHOUETTE_HALF, type BodyPart } from '@/components/progress/bodyGeometry';

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

/** How bright a muscle burns: barely there at L1, full at L10. */
const intensity = (level: number) => 0.18 + 0.82 * Math.pow(Math.min(level, 10) / 10, 1.25);

/**
 * The body as a hologram: a wireframe figure on a projector base whose muscles
 * light up in the lift cards' colours as their levels rise. Front and back are
 * the two faces of a card that spins in 3D; tap the button or swipe to turn it.
 */
export const HoloBody: React.FC<HoloBodyProps> = ({ muscles, selected, onSelect }) => {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const touchX = useRef<number | null>(null);
  const flip = () => setSide((s) => (s === 'front' ? 'back' : 'front'));

  return (
    <div className="relative select-none">
      <div
        className="holo-stage relative mx-auto w-full max-w-[360px] aspect-[280/470]"
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

  return (
    <svg viewBox="-40 0 280 470" className="h-full w-full overflow-visible" role="group" aria-label={`Muscles, ${view}`}>
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={SILHOUETTE_HALF} />
          <path d={SILHOUETTE_HALF} transform={MIRROR} />
          <ellipse {...HEAD} />
        </clipPath>
        <pattern id={`${id}-scan`} width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="rgba(255,255,255,0.22)" />
        </pattern>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2BE8FF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#7BF0FF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2BE8FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-cone`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#A855F7" stopOpacity="0.16" />
          <stop offset="0.45" stopColor="#A855F7" stopOpacity="0.05" />
          <stop offset="1" stopColor="#A855F7" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-pad`}>
          <stop offset="0" stopColor="#2BE8FF" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#A855F7" stopOpacity="0.18" />
          <stop offset="1" stopColor="#A855F7" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="wide" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="tight" />
          <feMerge>
            <feMergeNode in="wide" />
            <feMergeNode in="tight" />
          </feMerge>
        </filter>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        {ids.map((m) => {
          const level = levelOf(m);
          if (level === null) return null;
          const color = levelColor(level);
          const a = intensity(level);
          return (
            <linearGradient key={m} id={`${id}-${m}`} x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={Math.min(1, a * 1.1)} />
              <stop offset="1" stopColor={color} stopOpacity={a * 0.45} />
            </linearGradient>
          );
        })}
      </defs>

      {/* Projector: light cone and the pad under the feet. */}
      <path d="M 44 436 L 156 436 L 124 60 L 76 60 Z" fill={`url(#${id}-cone)`} className="holo-cone" />
      <ellipse cx="100" cy="436" rx="70" ry="13" fill={`url(#${id}-pad)`} />
      <ellipse cx="100" cy="436" rx="56" ry="9" fill="none" stroke="#2BE8FF" strokeOpacity="0.6" strokeWidth="0.8" />
      <ellipse cx="100" cy="436" rx="70" ry="13" fill="none" stroke="#A855F7" strokeOpacity="0.45" strokeWidth="0.6" strokeDasharray="2 4" className="holo-ring" />
      <ellipse cx="100" cy="436" rx="40" ry="5.5" fill="none" stroke="#FF2E97" strokeOpacity="0.5" strokeWidth="0.6" />
      {/* Motes of light drifting up the beam. */}
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

      {/* The figure: a faint body, its outline, and wireframe contours inside it. */}
      <g className="holo-figure">
        <g fill="rgba(168,85,247,0.07)">
          <path d={SILHOUETTE_HALF} />
          <path d={SILHOUETTE_HALF} transform={MIRROR} />
          <ellipse {...HEAD} />
        </g>
        <g clipPath={`url(#${id}-body)`} stroke="#A855F7" strokeOpacity="0.1" strokeWidth="0.5" fill="none">
          {Array.from({ length: 48 }, (_, i) => (
            <path key={i} d={`M 20 ${14 + i * 9} Q 100 ${20 + i * 9} 180 ${14 + i * 9}`} />
          ))}
          <path d="M 100 70 L 100 300" strokeOpacity="0.14" />
        </g>

        {/* Glow under the lit muscles. */}
        <g filter={`url(#${id}-glow)`}>
          {halves((p, i, mirrored) => {
            const level = levelOf(p.muscle);
            if (level === null || level < 2) return null;
            return (
              <path
                key={`g${i}${mirrored}`}
                d={p.d}
                transform={mirrored ? MIRROR : undefined}
                fill={levelColor(level)}
                opacity={Math.min(1, 0.25 + (level - 2) / 7)}
                className={cn(level >= 7 && 'holo-pulse')}
              />
            );
          })}
        </g>

        {/* The muscles themselves. */}
        {halves((p, i, mirrored) => {
          const level = levelOf(p.muscle);
          const isSelected = selected === p.muscle;
          const lit = level !== null;
          return (
            <path
              key={`m${i}${mirrored}`}
              d={p.d}
              transform={mirrored ? MIRROR : undefined}
              fill={lit ? `url(#${id}-${p.muscle})` : 'rgba(168,85,247,0.04)'}
              stroke={isSelected ? '#FFFFFF' : lit ? levelColor(level) : '#6B5C96'}
              strokeOpacity={isSelected ? 1 : lit ? 0.85 : 0.8}
              strokeWidth={isSelected ? 1.4 : 0.7}
              strokeDasharray={lit ? undefined : '2.5 2'}
              strokeLinejoin="round"
              className="cursor-pointer outline-none focus-visible:stroke-white"
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

        {/* Head: wireframe only, it carries no level. */}
        <g fill="none" stroke="#A855F7" strokeWidth="0.7">
          <ellipse {...HEAD} strokeOpacity="0.7" />
          <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx * 0.45} ry={HEAD.ry} strokeOpacity="0.25" />
          <path d={`M ${HEAD.cx - HEAD.rx} ${HEAD.cy} Q ${HEAD.cx} ${HEAD.cy + 6} ${HEAD.cx + HEAD.rx} ${HEAD.cy}`} strokeOpacity="0.25" />
        </g>

        {/* Outline, scanlines and the sweeping beam, all inside the body. */}
        <g fill="none" stroke="#C084FC" strokeOpacity="0.55" strokeWidth="0.7" filter={`url(#${id}-soft)`}>
          <path d={SILHOUETTE_HALF} />
          <path d={SILHOUETTE_HALF} transform={MIRROR} />
        </g>
        <g fill="none" stroke="#E9D5FF" strokeOpacity="0.5" strokeWidth="0.45">
          <path d={SILHOUETTE_HALF} />
          <path d={SILHOUETTE_HALF} transform={MIRROR} />
        </g>
        <g clipPath={`url(#${id}-body)`} pointerEvents="none">
          <rect x="0" y="0" width="200" height="470" fill={`url(#${id}-scan)`} opacity="0.35" />
          <rect x="0" y="-40" width="200" height="40" fill={`url(#${id}-beam)`} className="holo-beam" />
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

