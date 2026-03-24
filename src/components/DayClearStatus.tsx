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

  const secondaryText = isMaxTier
    ? 'Full clear. Day closed.'
    : nextTier
      ? `${habitsToNext} more for ${nextTierLabels[nextTier]}`
      : '';

  const progressPercent = pointsPerLevel > 0
    ? (levelProgress / pointsPerLevel) * 100
    : 0;

  return (
    <div className="relative glass-card-hero rounded-card p-[18px] transition-all duration-500">
      {/* Top row: label + completion fraction */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Daily Status
          </span>
          <TierBadge tier={tier} size="sm" />
        </div>
        <span className="text-[28px] font-extrabold leading-none tabular-nums text-foreground">
          {completed} <span className="text-muted-foreground text-lg font-semibold">/ {total}</span>
        </span>
      </div>

      {/* Glowing capsule progress segments */}
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-pill transition-all duration-300',
              i < completed ? 'capsule-filled' : 'capsule-empty'
            )}
            style={i < completed ? { animationDelay: `${i * 30}ms` } : undefined}
          />
        ))}
      </div>

      {/* Tier messaging strip */}
      {secondaryText && (
        <div className={cn(
          'tier-strip rounded-[14px] h-[34px] px-3 flex items-center gap-2',
          isMaxTier && 'border-amber-500/20'
        )}>
          <TierBadge tier={isMaxTier ? 'gold' : (nextTier || 'partial')} size="sm" />
          <span className={cn(
            'text-[13px] font-medium',
            isMaxTier ? 'text-amber-400/80' : 'text-muted-foreground'
          )}>
            {secondaryText}
          </span>
        </div>
      )}

      {/* Cycle Progress */}
      {hasCycle && (
        <div className="mt-3.5 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
          {/* Cycle progress bar */}
          <div className="h-1.5 rounded-pill bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-pill cycle-bar-fill transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
