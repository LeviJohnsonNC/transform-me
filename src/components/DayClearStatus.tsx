import React from 'react';
import { cn } from '@/lib/utils';
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
  const { tier, label, nextTier, habitsToNext, isMaxTier } = getNextTierInfo(completed, total);

  const progressPercent = pointsPerLevel > 0
    ? (levelProgress / pointsPerLevel) * 100
    : 0;

  return (
    <div className="relative glass-card-hero rounded-card p-[18px] transition-all duration-500">
      {/* Top row: label + completion fraction */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Daily Status
        </span>
        <span className="text-[28px] font-extrabold leading-none tabular-nums text-foreground">
          {completed} <span className="text-muted-foreground text-lg font-semibold">/ {total}</span>
        </span>
      </div>

      {/* Continuous gradient progress bar */}
      <div className="h-2 rounded-pill bg-white/[0.06] overflow-hidden mb-3">
        <div
          className="h-full rounded-pill transition-all duration-500 ease-out"
          style={{
            width: total > 0 ? `${(completed / total) * 100}%` : '0%',
            background: 'linear-gradient(90deg, #7C4DFF, #C957FF, #FF6B9D)',
          }}
        />
      </div>

      {/* Tier / next unlock strip */}
      {!isMaxTier && nextTier && (
        <div
          className="rounded-[16px] h-[42px] px-3 flex items-center gap-2.5"
          style={{
            background: 'rgba(255,255,255,0.028)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <TierBadge tier={nextTier} size="sm" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground leading-none">
              Next unlock
            </span>
            <span className="text-[14px] font-semibold text-foreground/90 leading-tight">
              {habitsToNext} habit{habitsToNext !== 1 ? 's' : ''} to {nextTierLabels[nextTier]}
            </span>
          </div>
        </div>
      )}

      {isMaxTier && (
        <div
          className="rounded-[16px] h-[42px] px-3 flex items-center gap-2.5"
          style={{
            background: 'rgba(255,255,255,0.028)',
            border: '1px solid rgba(255,190,50,0.12)',
          }}
        >
          <TierBadge tier={tier} size="sm" />
          <span className="text-[14px] font-semibold text-amber-400/80">
            Full clear. Day closed.
          </span>
        </div>
      )}

      {/* Cycle Progress */}
      {hasCycle && (
        <div className="mt-3.5 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold text-foreground">
                Level {level}
              </span>
              <span className="text-muted-foreground text-[15px]">·</span>
              <span className="text-[15px] font-medium text-muted-foreground">
                Cycle {cycleNumber}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-0.5">
                    <Info size={13} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="w-64 text-xs space-y-1.5 p-3">
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Gift size={12} className="shrink-0" /> Next: Random standard reward
                  </p>
                  {bossRewardTitle && (
                    <p className="flex items-center gap-1.5 text-amber-400/70">
                      <Trophy size={12} className="shrink-0" /> Lv 10: {bossRewardTitle}
                    </p>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <span className="text-[13px] tabular-nums font-medium text-muted-foreground">
              {levelProgress} / {pointsPerLevel}
            </span>
          </div>
          {/* Cycle progress bar — enhanced contrast */}
          <div className="h-1.5 rounded-pill overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-pill transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, rgba(125,145,255,0.92), rgba(165,92,255,0.88))',
                boxShadow: '0 0 10px rgba(120,120,255,0.16)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
