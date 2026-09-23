import React from 'react';
import { cn } from '@/lib/utils';
import type { DayTier } from '@/hooks/useGamification';

interface TierBadgeProps {
  tier: DayTier;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Tiers read as neon signage rather than medal metals: each has its own hue and
 * its own glow strength, so intensity rises with the tier.
 */
const tierStyles: Record<DayTier, string> = {
  gold: 'text-amber border-amber/50 bg-amber/[0.09] shadow-[0_0_14px_rgba(255,197,49,0.22)]',
  silver: 'text-[#B8E6FF] border-[#B8E6FF]/45 bg-[#B8E6FF]/[0.08]',
  bronze: 'text-[#FF8A3D] border-[#FF8A3D]/45 bg-[#FF8A3D]/[0.08]',
  partial: 'text-muted-foreground border-muted-foreground/30 bg-muted-foreground/[0.05]',
  missed: 'text-dim border-dim/25 bg-dim/[0.04]',
};

const tierLabels: Record<DayTier, string> = {
  gold: 'GOLD',
  silver: 'SILVER',
  bronze: 'BRONZE',
  partial: 'PARTIAL',
  missed: 'MISSED',
};

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center border font-display font-semibold tracking-[0.14em]',
        size === 'sm' ? 'px-2 py-[3px] text-[9px]' : 'px-2.5 py-[5px] text-[10px]',
        tierStyles[tier],
        className,
      )}
    >
      {tierLabels[tier]}
    </span>
  );
};

/** Square pip for the History grid — a lit cell reads better than a dot here. */
export const TierDot: React.FC<{ tier: DayTier; size?: 'sm' | 'lg'; className?: string }> = ({
  tier,
  size = 'sm',
  className,
}) => {
  const pip: Record<DayTier, string> = {
    gold: 'bg-amber shadow-[0_0_8px_rgba(255,197,49,0.75)]',
    silver: 'bg-[#B8E6FF] shadow-[0_0_6px_rgba(184,230,255,0.5)]',
    bronze: 'bg-[#FF8A3D] shadow-[0_0_6px_rgba(255,138,61,0.45)]',
    partial: 'bg-dim/60',
    missed: 'bg-dim/20',
  };

  return (
    <div
      className={cn(
        size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5',
        pip[tier],
        className,
      )}
    />
  );
};
