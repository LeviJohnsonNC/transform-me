import { create } from 'zustand';
import { format, subDays } from 'date-fns';
import type { HabitEntry, DayProgress, StreakData, Habit } from '@/types/habits';
import { CORE_HABITS } from '@/types/habits';

interface HabitStore {
  // UI State only - data is now handled by React Query
  selectedDate: string;
  
  // Actions
  setSelectedDate: (date: string) => void;
  
  // Utility functions that work with passed data
  getEntriesForDate: (entries: HabitEntry[], date: string) => HabitEntry[];
  getDayProgress: (entries: HabitEntry[], date: string) => DayProgress;
  getStreakData: (entries: HabitEntry[], habitId?: string) => StreakData;
  getRecentDays: (entries: HabitEntry[], days: number) => DayProgress[];
}

export const useHabitStore = create<HabitStore>()((set, get) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  getEntriesForDate: (entries: HabitEntry[], date: string) => {
    // Ensure entries is always an array
    const safeEntries = Array.isArray(entries) ? entries : [];
    return safeEntries.filter(entry => entry.date === date);
  },

  getDayProgress: (entries: HabitEntry[], date: string) => {
    // Ensure entries is always an array
    const safeEntries = Array.isArray(entries) ? entries : [];
    const dayEntries = get().getEntriesForDate(safeEntries, date);
    const completedCount = dayEntries.filter(e => e.completed).length;
    return {
      date,
      entries: dayEntries,
      completedCount,
      totalCount: CORE_HABITS.length
    };
  },

  getStreakData: (entries: HabitEntry[], habitId?: string) => {
    // Ensure entries is always an array
    const safeEntries = Array.isArray(entries) ? entries : [];
    const today = new Date();
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      const dayEntries = safeEntries.filter(e => e.date === date);
      
      let count = 0;
      if (habitId) {
        count = dayEntries.filter(e => e.habitId === habitId && e.completed).length;
      } else {
        count = dayEntries.filter(e => e.completed).length;
      }
      
      return { date, count };
    }).reverse();

    // Calculate current streak - only count fully completed days
    let currentStreak = 0;
    const todayStr = format(today, 'yyyy-MM-dd');
    
    for (let i = days.length - 1; i >= 0; i--) {
      const dayData = days[i];
      const isComplete = habitId ? dayData.count > 0 : dayData.count === CORE_HABITS.length;
      
      // Skip today unless it's complete (don't break streak for incomplete current day)
      if (dayData.date === todayStr && !isComplete) {
        continue;
      }
      
      if (isComplete) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    days.forEach(day => {
      if (habitId ? day.count > 0 : day.count === CORE_HABITS.length) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    return {
      current: currentStreak,
      longest: longestStreak,
      data: days
    };
  },

  getRecentDays: (entries: HabitEntry[], days: number) => {
    // Ensure entries is always an array
    const safeEntries = Array.isArray(entries) ? entries : [];
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      return get().getDayProgress(safeEntries, date);
    }).reverse();
  },
}));

// Note: Undo functionality is temporarily disabled during Supabase migration
// Will be re-implemented with optimistic updates in the future