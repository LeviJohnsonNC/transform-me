import React from 'react';
import { cn } from '@/lib/utils';
import { TierBadge } from '@/components/TierBadge';
import { getNextTierInfo, type DayTier } from '@/hooks/useGamification';
import { Gift, Trophy, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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

const tierAccentColors: Record<DayTier, string> = {
  gold: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  silver: 'from-slate-400/15 to-slate-500/5 border-slate-400/20',
  bronze: 'from-orange-600/15 to-orange-700/5 border-orange-600/20',
  partial: 'from-muted/20 to-muted/5 border-border/20',
  missed: 'from-muted/10 to-muted/5 border-border/10',
};

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
    <div className={cn(
      'rounded-card p-4 border bg-gradient-to-br transition-all duration-500',
      tierAccentColors[tier]
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <TierBadge tier={tier} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {completed} / {total}
        </span>
      </div>

      {/* Progress segments */}
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: total }, (_, i) => {
          const filled = i < completed;
          const segmentRatio = (i + 1) / total;
          let segmentColor = 'bg-muted/20';
          if (filled) {
            if (segmentRatio > 0.9) segmentColor = 'bg-amber-400';
            else if (segmentRatio > 0.7) segmentColor = 'bg-slate-400';
            else if (segmentRatio > 0.5) segmentColor = 'bg-orange-500';
            else segmentColor = 'bg-muted-foreground/30';
          }
          return (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                segmentColor
              )}
            />
          );
        })}
      </div>

      {secondaryText && (
        <p className={cn(
          'text-xs',
          isMaxTier ? 'text-amber-400/80' : 'text-muted-foreground'
        )}>
          {secondaryText}
        </p>
      )}

      {/* Cycle Progress */}
      {hasCycle && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">
                Level {level} · Cycle {cycleNumber}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info size={14} />
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
            <span className="text-xs tabular-nums text-muted-foreground">
              {levelProgress} / {pointsPerLevel}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}
    </div>
  );
};
