import React from 'react';
import { TierBadge } from '@/components/TierBadge';
import { getNextTierInfo, type DayTier } from '@/hooks/useGamification';
import { Gift, Trophy, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DayClearStatusProps {
  completed: number;
  total: number;
  hasCycle?: boolean;
  level?: number;
  cycleNumber?: number;
  levelProgress?: number;
  pointsPerLevel?: number;
  bossRewardTitle?: string;
}

const nextTierLabels: Record<DayTier, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  partial: 'Partial',
  missed: '',
};

export const DayClearStatus: React.FC<DayClearStatusProps> = ({
  completed,
  total,
  hasCycle = false,
  level = 1,
  cycleNumber = 1,
  levelProgress = 0,
  pointsPerLevel = 12,
  bossRewardTitle,
}) => {
  const { tier, nextTier, habitsToNext, isMaxTier } = getNextTierInfo(completed, total);

  const dayPercent = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  const cyclePercent = pointsPerLevel > 0 ? Math.min(100, (levelProgress / pointsPerLevel) * 100) : 0;

  return (
    <div className="surface rounded-[3px] scanlines relative overflow-hidden">
      {/* Outrun horizon, receding to a magenta sun. */}
      <div className="horizon h-[140px]" aria-hidden="true">
        <div className="horizon__grid" />
        <div className="horizon__fade" />
        <div className="horizon__sun" />
      </div>

      <div className="relative px-[18px] pt-4 pb-5">
        {/* Count + tier */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-[10px] tracking-[0.24em] text-faint">DAILY CLEAR</div>
            <div
              className="font-display font-bold text-[52px] leading-none mt-1.5 tracking-[-0.01em] tabular"
              style={{ textShadow: '0 0 26px rgba(255,46,151,0.4)' }}
            >
              {completed}
              <span className="text-dim text-[26px] font-semibold">/{total}</span>
            </div>
          </div>
          <TierBadge tier={tier} />
        </div>

        {/* Day meter */}
        <div className="meter mt-4">
          <div className="meter__fill" style={{ width: `calc(${dayPercent}% - 2px)` }} />
          {dayPercent > 0 && <div className="meter__head" style={{ left: `${dayPercent}%` }} />}
        </div>

        {/* Next unlock + cycle position */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-[13px] text-foreground">
            {isMaxTier || !nextTier ? (
              <span className="text-cyan-soft font-semibold">Day cleared</span>
            ) : (
              <>
                <span className="text-cyan font-semibold">
                  {habitsToNext} more
                </span>{' '}
                to {nextTierLabels[nextTier]}
              </>
            )}
          </div>

          {hasCycle && (
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[11px] tracking-[0.1em] text-faint tabular">
                LV {level} · CYCLE {cycleNumber}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="What comes next"
                    className="text-dim hover:text-cyan transition-colors"
                  >
                    <Info size={13} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-64 text-xs space-y-1.5 p-3">
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Gift size={12} className="shrink-0" /> Next: random standard reward
                  </p>
                  {bossRewardTitle && (
                    <p className="flex items-center gap-1.5 text-amber">
                      <Trophy size={12} className="shrink-0" /> Lv 10: {bossRewardTitle}
                    </p>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Cycle meter */}
        {hasCycle && (
          <>
            <div className="meter-thin mt-2.5">
              <div className="meter-thin__fill" style={{ width: `${cyclePercent}%` }} />
            </div>
            <div className="font-display text-[10px] tracking-[0.12em] text-dim mt-1.5 tabular">
              {levelProgress} / {pointsPerLevel} TO NEXT UNLOCK
            </div>
          </>
        )}
      </div>
    </div>
  );
};
