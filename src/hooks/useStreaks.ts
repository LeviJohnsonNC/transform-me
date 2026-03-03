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
  const habitCount = habits.length || 1;
  const baseStreakData = getStreakData(entries, habitCount);
  
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
  
  const recentDays = getRecentDays(entries, 7, habitCount);
  const weeklyConsistency = recentDays.reduce((sum, day) => sum + (day.completedCount / habitCount), 0) / 7;
  
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
  const habitCount = habits.length || 1;
  const recentDays = getRecentDays(entries, 14, habitCount);
  
  const completedDays = recentDays.filter(day => day.completedCount === habitCount).length;
  
  return (completedDays / 14) * 100;
};
