import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { TierBadge } from '@/components/TierBadge';
import { getNextTierInfo, type DayTier } from '@/hooks/useGamification';
import { getHabitIcon } from '@/utils/habitIcons';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RemainingHabit {
  name: string;
  icon: string;
}

interface DayClearStatusProps {
  completed: number;
  total: number;
  remainingHabits?: RemainingHabit[];
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

const COLLAPSED_MAX = 3;

export const DayClearStatus: React.FC<DayClearStatusProps> = ({ completed, total, remainingHabits = [] }) => {
  const { tier, label, nextTier, habitsToNext, isMaxTier } = getNextTierInfo(completed, total);
  const [expanded, setExpanded] = useState(false);

  const secondaryText = isMaxTier
    ? 'Full clear. Day closed.'
    : nextTier
      ? `${habitsToNext} more for ${nextTierLabels[nextTier]}`
      : '';

  const showRemaining = !isMaxTier && remainingHabits.length > 0;
  const needsCollapse = remainingHabits.length > COLLAPSED_MAX;
  const visibleHabits = expanded ? remainingHabits : remainingHabits.slice(0, COLLAPSED_MAX);
  const hiddenCount = remainingHabits.length - COLLAPSED_MAX;

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

      {/* Remaining habits */}
      {showRemaining && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2">Remaining</p>
          <div className="space-y-1.5">
            {visibleHabits.map((h) => {
              const Icon = getHabitIcon(h.icon);
              return (
                <div key={h.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon size={14} className="shrink-0 opacity-60" />
                  <span>{h.name}</span>
                </div>
              );
            })}
          </div>
          {needsCollapse && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              {expanded ? (
                <>Show less <ChevronUp size={12} /></>
              ) : (
                <>Show {hiddenCount} more <ChevronDown size={12} /></>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};