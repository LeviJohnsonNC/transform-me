// Phase 2 Extension Point - Coach Module
// Currently disabled in UI, but hook is ready for future implementation

import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';

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
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();
  
  const recentDays = getRecentDays(entries, 7, habits.length);
  const weeklyAverage = recentDays.reduce((sum, day) => sum + day.completedCount, 0) / 7;
  
  const habitStats = habits.map(habit => {
    const completions = recentDays.filter(day => 
      day.entries.some(entry => entry.habitId === habit.id && entry.completed)
    ).length;
    return { habitId: habit.id, completions, rate: completions / 7 };
  });
  
  const strugglingHabits = habitStats.filter(stat => stat.rate < 0.5).map(stat => stat.habitId);
  const strongHabits = habitStats.filter(stat => stat.rate >= 0.8).map(stat => stat.habitId);
  
  const suggestions: CoachSuggestion[] = [];
  
  if (weeklyAverage < 2) {
    suggestions.push({ id: 'motivation-low', type: 'motivation', title: 'Start Small', message: 'Focus on just one habit at a time to build momentum.', priority: 'high' });
  }
  
  if (strugglingHabits.length > 2) {
    suggestions.push({ id: 'tip-simplify', type: 'tip', title: 'Simplify Your Approach', message: 'Try reducing the difficulty of struggling habits temporarily.', priority: 'medium' });
  }
  
  return { weeklyAverage, strugglingHabits, strongHabits, suggestions };
};

export const useCoachEnabled = () => false;
