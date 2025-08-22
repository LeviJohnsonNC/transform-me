// Phase 2 Extension Point - Gamification Module
// Currently disabled in UI, but hook is ready for future implementation

import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries } from '@/hooks/useHabits';

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
  
  // Calculate XP based on completed habits
  const completedEntries = entries.filter(e => e.completed);
  const totalXP = completedEntries.length * 10; // 10 XP per completed habit
  
  // Calculate level (every 100 XP = 1 level)
  const level = Math.floor(totalXP / 100) + 1;
  const xpInCurrentLevel = totalXP % 100;
  const xpToNextLevel = 100 - xpInCurrentLevel;
  
  // Generate achievements (placeholder)
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
      unlocked: getStreakData(entries).current >= 7
    },
    {
      id: 'perfect-day',
      name: 'Perfect Day',
      description: 'Complete all 5 habits in one day',
      icon: '⭐',
      unlocked: false // Would check for perfect days in actual implementation
    }
  ];
  
  // Generate rewards (placeholder)
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

// Hook is ready but disabled in UI for Phase 1
export const useGamificationEnabled = () => false;