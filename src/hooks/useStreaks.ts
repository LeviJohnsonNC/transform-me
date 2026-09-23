// Enhanced streak tracking hook for Transform
// Currently used for read-only display in header

import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';
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
  const baseStreakData = getStreakData(entries, habits);
  
  let streakHealth: EnhancedStreakData['streakHealth'] = 'poor';
  if (baseStreakData.current >= 21) streakHealth = 'excellent';
  else if (baseStreakData.current >= 14) streakHealth = 'good';
  else if (baseStreakData.current >= 7) streakHealth = 'fair';
  
  const getMotivation = () => {
    if (baseStreakData.current === 0) return "Today is a fresh start! 🌅";
    if (baseStreakData.current < 7) return "Building momentum! 💪";
    if (baseStreakData.current < 14) return "You're on fire! 🔥";
    if (baseStreakData.current < 21) return "Habit mastery incoming! ⚡";
    return "Transformation legend! 🏆";
  };
  
  const recentDays = getRecentDays(entries, 7, habits);
  // Each day is scored against its own total, since that varies by weekday.
  const weeklyConsistency =
    recentDays.reduce(
      (sum, day) => sum + (day.totalCount > 0 ? day.completedCount / day.totalCount : 0),
      0,
    ) / 7;
  
  return {
    ...baseStreakData,
    streakHealth,
    motivation: getMotivation(),
    weeklyConsistency,
    longestEverStreak: baseStreakData.longest
  };
};

export const useStreakRingProgress = (): number => {
  const { getRecentDays } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();
  const recentDays = getRecentDays(entries, 14, habits);

  const completedDays = recentDays.filter(
    (day) => day.totalCount > 0 && day.completedCount === day.totalCount,
  ).length;
  
  return (completedDays / 14) * 100;
};
