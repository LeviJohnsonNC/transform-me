import React from 'react';
import { cn } from '@/lib/utils';
import type { DayTier } from '@/hooks/useGamification';

interface TierBadgeProps {
  tier: DayTier;
  size?: 'sm' | 'md';
  className?: string;
}

const tierStyles: Record<DayTier, string> = {
  gold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  silver: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
  bronze: 'bg-orange-700/20 text-orange-400 border-orange-600/30',
  partial: 'bg-muted/30 text-muted-foreground border-border/30',
  missed: 'bg-muted/10 text-muted-foreground/50 border-border/10',
};

const tierLabels: Record<DayTier, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  partial: 'Partial',
  missed: 'Missed',
};

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        tierStyles[tier],
        className
      )}
    >
      {tierLabels[tier]}
    </span>
  );
};

// Small dot for calendar use
export const TierDot: React.FC<{ tier: DayTier; size?: 'sm' | 'lg'; className?: string }> = ({ tier, size = 'sm', className }) => {
  const dotColors: Record<DayTier, string> = {
    gold: 'bg-amber-400',
    silver: 'bg-slate-400',
    bronze: 'bg-orange-500',
    partial: 'bg-muted-foreground/40',
    missed: 'bg-muted-foreground/15',
  };

  return <div className={cn(
    'rounded-full',
    size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5',
    dotColors[tier],
    className
  )} />;
};
