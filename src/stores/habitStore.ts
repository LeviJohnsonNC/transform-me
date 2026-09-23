import { create } from 'zustand';
import { format } from 'date-fns';
import type { HabitEntry, DayProgress, StreakData } from '@/types/habits';
import {
  getEntriesForDate,
  getDayProgress,
  getStreakData,
  getRecentDays,
} from '@/lib/habitMath';

// The calculations below are pure and live in '@/lib/habitMath' so they can be
// tested without a store. They are re-exposed here unchanged so existing
// consumers keep working; new code should import from '@/lib/habitMath' directly.

interface HabitStore {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getEntriesForDate: (entries: HabitEntry[], date: string) => HabitEntry[];
  getDayProgress: (entries: HabitEntry[], date: string, totalHabits: number) => DayProgress;
  getStreakData: (entries: HabitEntry[], totalHabits: number, habitId?: string) => StreakData;
  getRecentDays: (entries: HabitEntry[], days: number, totalHabits: number) => DayProgress[];
}

export const useHabitStore = create<HabitStore>()((set) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  getEntriesForDate,
  getDayProgress,
  getStreakData,
  getRecentDays,
}));
