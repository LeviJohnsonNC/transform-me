import type { DayProgress } from '@/types/habits';

export type StreakHealth = 'excellent' | 'good' | 'fair' | 'poor';

export const getStreakHealth = (currentStreak: number): StreakHealth => {
  if (currentStreak >= 21) return 'excellent';
  if (currentStreak >= 14) return 'good';
  if (currentStreak >= 7) return 'fair';
  return 'poor';
};

export const getMotivation = (currentStreak: number): string => {
  if (currentStreak === 0) return "Today is a fresh start! 🌅";
  if (currentStreak < 7) return "Building momentum! 💪";
  if (currentStreak < 14) return "You're on fire! 🔥";
  if (currentStreak < 21) return "Habit mastery incoming! ⚡";
  return "Transformation legend! 🏆";
};

export const getWeeklyConsistency = (recentDays: DayProgress[], habitCount: number): number => {
  return recentDays.reduce((sum, day) => sum + (day.completedCount / habitCount), 0) / 7;
};

export const getStreakRingProgress = (recentDays: DayProgress[], habitCount: number): number => {
  const completedDays = recentDays.filter(day => day.completedCount === habitCount).length;
  return (completedDays / 14) * 100;
};
