// Enhanced streak tracking hook for Transform
// Currently used for read-only display in header

import { useHabitStore } from '@/stores/habitStore';
import type { StreakData } from '@/types/habits';

interface EnhancedStreakData extends StreakData {
  streakHealth: 'excellent' | 'good' | 'fair' | 'poor';
  motivation: string;
  weeklyConsistency: number;
  longestEverStreak: number;
}

export const useStreaks = (): EnhancedStreakData => {
  const { getStreakData } = useHabitStore();
  const baseStreakData = getStreakData();
  
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
  const lastWeekData = baseStreakData.data.slice(-7);
  const weeklyConsistency = lastWeekData.reduce((sum, day) => sum + (day.count / 5), 0) / 7;
  
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
  const { getStreakData } = useHabitStore();
  const streakData = getStreakData();
  
  // Show progress for last 14 days
  const recent14Days = streakData.data.slice(-14);
  const completedDays = recent14Days.filter(day => day.count === 5).length;
  
  return (completedDays / 14) * 100;
};