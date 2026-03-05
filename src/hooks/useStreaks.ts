// Enhanced streak tracking hook for Transform
// Currently used for read-only display in header

import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';
import { getStreakHealth, getMotivation, getWeeklyConsistency, getStreakRingProgress } from '@/lib/streakUtils';
import type { StreakData } from '@/types/habits';

interface EnhancedStreakData extends StreakData {
  streakHealth: 'excellent' | 'good' | 'fair' | 'poor';
  motivation: string;
  weeklyConsistency: number;
  longestEverStreak: number;
}

export const useStreaks = (): EnhancedStreakData => {
  const { getStreakData, getRecentDays } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();
  const habitCount = habits.length || 1;
  const baseStreakData = getStreakData(entries, habitCount);

  const recentDays = getRecentDays(entries, 7, habitCount);

  return {
    ...baseStreakData,
    streakHealth: getStreakHealth(baseStreakData.current),
    motivation: getMotivation(baseStreakData.current),
    weeklyConsistency: getWeeklyConsistency(recentDays, habitCount),
    longestEverStreak: baseStreakData.longest
  };
};

export const useStreakRingProgress = (): number => {
  const { getRecentDays } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();
  const habitCount = habits.length || 1;
  const recentDays = getRecentDays(entries, 14, habitCount);

  return getStreakRingProgress(recentDays, habitCount);
};
