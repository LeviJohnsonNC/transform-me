import { create } from 'zustand';
import { format, subDays } from 'date-fns';
import type { HabitEntry, DayProgress, StreakData } from '@/types/habits';

interface HabitStore {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getEntriesForDate: (entries: HabitEntry[], date: string) => HabitEntry[];
  getDayProgress: (entries: HabitEntry[], date: string, totalHabits: number) => DayProgress;
  getStreakData: (entries: HabitEntry[], totalHabits: number, habitId?: string) => StreakData;
  getRecentDays: (entries: HabitEntry[], days: number, totalHabits: number) => DayProgress[];
}

export const useHabitStore = create<HabitStore>()((set, get) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  getEntriesForDate: (entries: HabitEntry[], date: string) => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    return safeEntries.filter(entry => entry.date === date);
  },

  getDayProgress: (entries: HabitEntry[], date: string, totalHabits: number) => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const dayEntries = get().getEntriesForDate(safeEntries, date);
    const completedCount = dayEntries.filter(e => e.completed).length;
    return {
      date,
      entries: dayEntries,
      completedCount,
      totalCount: totalHabits
    };
  },

  getStreakData: (entries: HabitEntry[], totalHabits: number, habitId?: string) => {
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

    let currentStreak = 0;
    const todayStr = format(today, 'yyyy-MM-dd');
    
    for (let i = days.length - 1; i >= 0; i--) {
      const dayData = days[i];
      const isComplete = habitId ? dayData.count > 0 : dayData.count === totalHabits;
      
      if (dayData.date === todayStr && !isComplete) {
        continue;
      }
      
      if (isComplete) {
        currentStreak++;
      } else {
        break;
      }
    }

    let longestStreak = 0;
    let tempStreak = 0;
    days.forEach(day => {
      if (habitId ? day.count > 0 : day.count === totalHabits) {
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

  getRecentDays: (entries: HabitEntry[], days: number, totalHabits: number) => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      return get().getDayProgress(safeEntries, date, totalHabits);
    }).reverse();
  },
}));
