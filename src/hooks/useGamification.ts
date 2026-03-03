// Phase 2 Extension Point - Gamification Module
// Currently disabled in UI, but hook is ready for future implementation

import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  available: boolean;
}

interface GamificationData {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalPoints: number;
  achievements: Achievement[];
  availableRewards: Reward[];
  badges: string[];
}

export const useGamification = (): GamificationData => {
  const { getStreakData } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();
  const habitCount = habits.length || 1;
  
  const completedEntries = entries.filter(e => e.completed);
  const totalXP = completedEntries.length * 10;
  
  const level = Math.floor(totalXP / 100) + 1;
  const xpInCurrentLevel = totalXP % 100;
  const xpToNextLevel = 100 - xpInCurrentLevel;
  
  const achievements: Achievement[] = [
    {
      id: 'first-habit',
      name: 'First Step',
      description: 'Complete your first habit',
      icon: '🎯',
      unlocked: completedEntries.length > 0
    },
    {
      id: 'week-streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      unlocked: getStreakData(entries, habitCount).current >= 7
    },
    {
      id: 'perfect-day',
      name: 'Perfect Day',
      description: 'Complete all habits in one day',
      icon: '⭐',
      unlocked: false
    }
  ];
  
  const availableRewards: Reward[] = [
    {
      id: 'custom-theme',
      name: 'Custom Theme',
      description: 'Unlock additional color themes',
      cost: 500,
      available: totalXP >= 500
    }
  ];
  
  return {
    level,
    xp: totalXP,
    xpToNextLevel,
    totalPoints: totalXP,
    achievements,
    availableRewards,
    badges: []
  };
};

export const useGamificationEnabled = () => false;
