// Enhanced streak tracking hook for Transform
// Currently used for read-only display in header

import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries } from '@/hooks/useHabits';
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
  const baseStreakData = getStreakData(entries);
  
  // Calculate streak health based on current streak
  let streakHealth: EnhancedStreakData['streakHealth'] = 'poor';
  if (baseStreakData.current >= 21) streakHealth = 'excellent';
  else if (baseStreakData.current >= 14) streakHealth = 'good';
  else if (baseStreakData.current >= 7) streakHealth = 'fair';
  
  // Generate motivational message
  const getMotivation = () => {
    if (baseStreakData.current === 0) return "Today is a fresh start! 🌅";
    if (baseStreakData.current < 7) return "Building momentum! 💪";
    if (baseStreakData.current < 14) return "You're on fire! 🔥";
    if (baseStreakData.current < 21) return "Habit mastery incoming! ⚡";
    return "Transformation legend! 🏆";
  };
  
  // Calculate weekly consistency (last 7 days)
  const recentDays = getRecentDays(entries, 7);
  const weeklyConsistency = recentDays.reduce((sum, day) => sum + (day.completedCount / 5), 0) / 7;
  
  return {
    ...baseStreakData,
    streakHealth,
    motivation: getMotivation(),
    weeklyConsistency,
    longestEverStreak: baseStreakData.longest
  };
};

// Get ring progress for visual display (0-100)
export const useStreakRingProgress = (): number => {
  const { getRecentDays } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  const recentDays = getRecentDays(entries, 14);
  
  // Show progress for last 14 days
  const completedDays = recentDays.filter(day => day.completedCount === 5).length;
  
  return (completedDays / 14) * 100;
};