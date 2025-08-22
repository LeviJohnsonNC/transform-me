// Phase 2 Extension Point - Coach Module
// Currently disabled in UI, but hook is ready for future implementation

import { useHabitStore } from '@/stores/habitStore';
import { CORE_HABITS } from '@/types/habits';

interface CoachSuggestion {
  id: string;
  type: 'motivation' | 'tip' | 'adjustment';
  title: string;
  message: string;
  habitId?: string;
  priority: 'low' | 'medium' | 'high';
}

interface CoachAnalysis {
  weeklyAverage: number;
  strugglingHabits: string[];
  strongHabits: string[];
  suggestions: CoachSuggestion[];
}

export const useCoach = (): CoachAnalysis => {
  const { getRecentDays } = useHabitStore();
  
  // Analyze last 7 days
  const recentDays = getRecentDays(7);
  const weeklyAverage = recentDays.reduce((sum, day) => sum + day.completedCount, 0) / 7;
  
  // Identify struggling and strong habits
  const habitStats = CORE_HABITS.map(habit => {
    const completions = recentDays.filter(day => 
      day.entries.some(entry => entry.habitId === habit.id && entry.completed)
    ).length;
    return { habitId: habit.id, completions, rate: completions / 7 };
  });
  
  const strugglingHabits = habitStats
    .filter(stat => stat.rate < 0.5)
    .map(stat => stat.habitId);
    
  const strongHabits = habitStats
    .filter(stat => stat.rate >= 0.8)
    .map(stat => stat.habitId);
  
  // Generate suggestions (placeholder implementation)
  const suggestions: CoachSuggestion[] = [];
  
  if (weeklyAverage < 2) {
    suggestions.push({
      id: 'motivation-low',
      type: 'motivation',
      title: 'Start Small',
      message: 'Focus on just one habit at a time to build momentum.',
      priority: 'high'
    });
  }
  
  if (strugglingHabits.length > 2) {
    suggestions.push({
      id: 'tip-simplify',
      type: 'tip',
      title: 'Simplify Your Approach',
      message: 'Try reducing the difficulty of struggling habits temporarily.',
      priority: 'medium'
    });
  }
  
  return {
    weeklyAverage,
    strugglingHabits,
    strongHabits,
    suggestions
  };
};

// Hook is ready but disabled in UI for Phase 1
export const useCoachEnabled = () => false;