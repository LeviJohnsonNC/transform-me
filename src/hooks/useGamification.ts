import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';
import { useHabitStore } from '@/stores/habitStore';
import { getActiveHabitsForDate } from '@/utils/dayType';

// --- Types ---

export type DayTier = 'gold' | 'silver' | 'bronze' | 'partial' | 'missed';

export interface TierInfo {
  tier: DayTier;
  label: string;
  nextTier: DayTier | null;
  habitsToNext: number;
  isMaxTier: boolean;
}

export interface DayTierData extends TierInfo {
  completed: number;
  total: number;
}

// --- Pure functions ---

export const getDayTier = (completed: number, total: number): DayTier => {
  if (total === 0) return 'missed';
  const ratio = completed / total;
  if (ratio >= 1) return 'gold';
  if (ratio >= 0.9) return 'silver';
  if (ratio >= 0.7) return 'bronze';
  if (ratio >= 0.5) return 'partial';
  return 'missed';
};

const TIER_ORDER: DayTier[] = ['missed', 'partial', 'bronze', 'silver', 'gold'];

const TIER_THRESHOLDS: Record<DayTier, number> = {
  missed: 0,
  partial: 0.5,
  bronze: 0.7,
  silver: 0.9,
  gold: 1.0,
};

const TIER_LABELS: Record<DayTier, string> = {
  gold: 'Gold Day complete',
  silver: 'Silver Day secured',
  bronze: 'Bronze Day secured',
  partial: 'Partial day',
  missed: 'Day incomplete',
};

export const getNextTierInfo = (completed: number, total: number): TierInfo => {
  if (total === 0) {
    return { tier: 'missed', label: TIER_LABELS.missed, nextTier: null, habitsToNext: 0, isMaxTier: false };
  }

  const tier = getDayTier(completed, total);
  const tierIndex = TIER_ORDER.indexOf(tier);

  if (tier === 'gold') {
    return { tier, label: TIER_LABELS.gold, nextTier: null, habitsToNext: 0, isMaxTier: true };
  }

  // Find next tier
  const nextTier = TIER_ORDER[tierIndex + 1];
  const threshold = TIER_THRESHOLDS[nextTier];
  const habitsNeeded = Math.ceil(threshold * total);
  const habitsToNext = Math.max(0, habitsNeeded - completed);

  return { tier, label: TIER_LABELS[tier], nextTier, habitsToNext, isMaxTier: false };
};

// Pure computation for any date given entries and habits
export const computeDayTier = (
  entries: Array<{ habitId: string; date: string; completed: boolean }>,
  totalHabits: number,
  date: string
): DayTierData => {
  const completed = entries.filter(e => e.date === date && e.completed).length;
  const info = getNextTierInfo(completed, totalHabits);
  return { ...info, completed, total: totalHabits };
};

// --- Hook ---

export const useDayTier = (): DayTierData => {
  const { selectedDate, getDayProgress } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();

  const safeEntries = entries || [];
  const dayProgress = getDayProgress(safeEntries, selectedDate, habits.length);
  const completed = dayProgress.completedCount;
  const total = habits.length;
  const info = getNextTierInfo(completed, total);

  return { ...info, completed, total };
};
