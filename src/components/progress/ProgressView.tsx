import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { HoloBody } from '@/components/progress/HoloBody';
import { useProgress } from '@/hooks/useProgress';
import { cn } from '@/lib/utils';
import {
  LEVEL_HEX,
  levelColor,
  rankFor,
  type MuscleId,
  type MuscleScore,
  type NextStep,
  type RatedLift,
} from '@/lib/progress';

interface ProgressViewProps {
  /** Exercise names on the plan, so set-up-but-never-logged lifts show as untrained. */
  planned: readonly string[];
}

const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('font-display text-[10px] tracking-[0.2em] text-faint', className)}>{children}</div>
);

/** Ten segments in the lift cards' colours; the next one partly lit to show progress into it. */
const LevelCells: React.FC<{ level: number | null }> = ({ level }) => (
  <div className="grid grid-cols-10 gap-[2px]" aria-hidden>
    {LEVEL_HEX.map((hex, i) => {
      const fill = level === null ? 0 : Math.max(0, Math.min(1, level - i));
      return (
        <div key={i} className="relative h-[7px] overflow-hidden bg-[#150E28]">
          {fill > 0 && (
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${fill * 100}%`, background: hex, opacity: fill < 1 ? 0.55 : 1 }}
            />
          )}
        </div>
      );
    })}
  </div>
);

const Bar: React.FC<{ level: number }> = ({ level }) => (
  <div className="h-2 flex-1 rounded-r-[4px] bg-[#1A1230]">
    <div
      className="h-full rounded-r-[4px]"
      style={{ width: `${Math.min(10, level) * 10}%`, background: levelColor(level), boxShadow: `0 0 10px ${levelColor(level)}55` }}
    />
  </div>
);

export const ProgressView: React.FC<ProgressViewProps> = ({ planned }) => {
  const { summary, isLoading, missing } = useProgress(planned);
  const [selected, setSelected] = useState<MuscleId | null>(null);

  if (missing) {
    return (
      <div className="surface rounded-[3px] p-5 text-sm text-muted-foreground">
        {missing === 'stats' ? 'Add your stats' : 'Choose which standards to score against'} in{' '}
        <span className="text-cyan">Settings → My Stats</span> to see your progress.
      </div>
    );
  }
  if (isLoading || !summary) {
    return <div className="h-[520px] animate-pulse rounded-[3px] bg-muted/40" aria-label="Loading progress" />;
  }

  const { lifts, untrained, muscles, regions, overall, next } = summary;
  const selectedScore = muscles.find((m) => m.muscle.id === selected) ?? null;
  const ratedRegions = regions.filter((r) => r.level !== null) as Array<{ id: string; label: string; level: number }>;
  const weakest = [...ratedRegions].sort((a, b) => a.level - b.level)[0];
  const strongest = [...ratedRegions].sort((a, b) => b.level - a.level)[0];

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Label>OVERALL LEVEL</Label>
          <div className="font-display font-bold leading-none mt-1">
            <span
              className="text-[56px] tabular"
              style={{
                color: overall !== null ? levelColor(Math.max(1, overall)) : undefined,
                textShadow: overall !== null ? `0 0 26px ${levelColor(Math.max(1, overall))}66` : undefined,
              }}
            >
              {overall !== null ? overall.toFixed(1) : '—'}
            </span>
            <span className="text-dim text-[16px]"> / 10</span>
          </div>
        </div>
        <div className="text-right pb-1">
          <Label>RANK</Label>
          <div className="font-display font-bold text-[17px] tracking-[0.2em] mt-1">{rankFor(overall ?? 0)}</div>
          <div className="font-display text-[10px] tracking-[0.16em] text-dim mt-1">
            {lifts.length} LIFT{lifts.length === 1 ? '' : 'S'} RATED
          </div>
        </div>
      </div>

      {/* The hologram */}
      <div>
        <HoloBody muscles={muscles} selected={selected} onSelect={setSelected} />
        <div className="flex items-center gap-2 mt-1">
          <span className="font-display text-[9px] tracking-[0.14em] text-faint">LV 1</span>
          <div className="grid flex-1 grid-cols-10 gap-[2px]" aria-hidden>
            {LEVEL_HEX.map((hex, i) => (
              <div key={i} className="h-[5px]" style={{ background: hex, opacity: 0.35 + i * 0.065 }} />
            ))}
          </div>
          <span className="font-display text-[9px] tracking-[0.14em] text-faint">10</span>
          <span className="ml-2 h-[8px] w-[14px] rounded-[2px] border border-dashed border-[#6B5C96]" aria-hidden />
          <span className="font-display text-[9px] tracking-[0.14em] text-faint">UNTRAINED</span>
        </div>
        <p className="mt-2 text-center font-display text-[10px] tracking-[0.16em] text-dim">
          {lifts.length ? 'TAP A MUSCLE · SWIPE TO TURN' : 'LOG A LIFT TO LIGHT UP YOUR HOLOGRAM'}
        </p>
      </div>

      {next && <NextUp step={next} />}

      {ratedRegions.length > 0 && (
        <div className="surface rounded-[3px] p-4">
          <Label className="mb-3">BALANCE</Label>
          <div className="space-y-2.5">
            {regions.map((r) => (
              <div key={r.id} className="grid grid-cols-[52px_1fr_30px] items-center gap-3">
                <span className="font-display text-[11px] tracking-[0.12em] text-dim">{r.label.toUpperCase()}</span>
                {r.level !== null ? <Bar level={r.level} /> : <div className="h-2 flex-1 border border-dashed border-[#6B5C96]/60" />}
                <span className="text-right font-display text-[13px] font-bold tabular">
                  {r.level !== null ? r.level.toFixed(1) : '—'}
                </span>
              </div>
            ))}
          </div>
          {weakest && strongest && weakest.id !== strongest.id && (
            <p className="mt-3 text-[12px] text-muted-foreground">
              Weakest link: <span className="text-foreground font-semibold">{weakest.label}</span>,{' '}
              {(strongest.level - weakest.level).toFixed(1)} levels behind your {strongest.label.toLowerCase()}.
            </p>
          )}
        </div>
      )}

      {/* Every lift, strongest first */}
      {(lifts.length > 0 || untrained.length > 0) && (
        <div>
          <Label className="mb-1">YOUR LIFTS, STRONGEST FIRST</Label>
          <ul>
            {lifts.map((l) => (
              <LiftRow key={l.key} label={l.label} level={l.level} />
            ))}
            {untrained.map((label) => (
              <LiftRow key={label} label={label} level={null} />
            ))}
          </ul>
        </div>
      )}

      <MuscleSheet score={selectedScore} onClose={() => setSelected(null)} />
    </div>
  );
};

const NextUp: React.FC<{ step: NextStep }> = ({ step }) => (
  <div className="rounded-[3px] border border-magenta/45 bg-surface p-4 shadow-[0_0_18px_rgba(255,46,151,0.12)]">
    <div className="font-display text-[10px] tracking-[0.22em] text-magenta mb-1.5">NEXT LEVEL-UP</div>
    <div className="text-[15px] font-semibold">
      {step.lift.label}: <span className="text-cyan">{step.ask}</span> → LV {step.lift.nextLevel}
    </div>
    <p className="mt-1 text-[12px] text-muted-foreground">
      Your closest lift to a whole new level, from your best of {formatSet(step.lift)}.
    </p>
  </div>
);

const formatSet = (l: RatedLift) =>
  l.unit === 'reps' ? `${l.weight} reps` : l.unit === 'seconds' ? `${l.weight} s` : `${l.weight}×${l.reps ?? 1}`;

const LiftRow: React.FC<{ label: string; level: number | null }> = ({ label, level }) => (
  <li className="border-b border-[#1B1432] py-2.5" aria-label={`${label}, ${level !== null ? `level ${level.toFixed(1)}` : 'untrained'}`}>
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className={cn('text-[13px]', level === null && 'text-faint')}>{label}</span>
      <span className={cn('font-display text-[13px] font-bold tabular', level === null && 'text-faint')}>
        {level !== null ? level.toFixed(1) : '—'}
      </span>
    </div>
    <LevelCells level={level} />
  </li>
);

const MuscleSheet: React.FC<{ score: MuscleScore | null; onClose: () => void }> = ({ score, onClose }) => (
  <Sheet open={!!score} onOpenChange={(open) => !open && onClose()}>
    <SheetContent side="bottom" className="rounded-t-2xl border-t border-cyan/35 bg-[#140C28] px-5 pb-8">
      {score && (
        <>
          <div className="flex items-end justify-between gap-4 pr-6">
            <div>
              <div className="font-display text-[10px] tracking-[0.22em] text-cyan">MUSCLE</div>
              <SheetTitle className="font-display text-[22px] font-bold tracking-[0.08em]">
                {score.muscle.label.toUpperCase()}
              </SheetTitle>
            </div>
            <div
              className="font-display text-[40px] font-bold leading-none tabular"
              style={score.level !== null ? { color: levelColor(score.level), textShadow: `0 0 20px ${levelColor(score.level)}66` } : undefined}
            >
              {score.level !== null ? score.level.toFixed(1) : '—'}
            </div>
          </div>
          <SheetDescription className="sr-only">
            The lifts that make up this muscle's level.
          </SheetDescription>

          {score.lifts.length > 0 ? (
            <>
              <Label className="mt-4 mb-2">BUILT BY</Label>
              <div className="space-y-2">
                {score.lifts.map(({ lift, weight }) => (
                  <div key={lift.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                    <span className="text-[13px]">
                      {lift.label}
                      {weight < 1 && <span className="text-faint text-[11px]"> · assists</span>}
                    </span>
                    <span className="font-display text-[13px] font-bold tabular">{lift.level.toFixed(1)}</span>
                    <div className="col-span-2 flex">
                      <Bar level={lift.level} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-[13px] text-muted-foreground">Untrained so far: nothing you have logged works it.</p>
          )}
          {score.wouldCount.length > 0 && (
            <p className="mt-4 text-[12px] text-muted-foreground">
              {score.lifts.length ? 'Also counts here: ' : 'Log any of these to light it up: '}
              <span className="text-foreground">{score.wouldCount.slice(0, 4).join(', ')}</span>.
            </p>
          )}
        </>
      )}
    </SheetContent>
  </Sheet>
);
