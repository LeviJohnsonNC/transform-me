import { create } from 'zustand';
import { format } from 'date-fns';
import type { Habit, HabitEntry, DayProgress, StreakData } from '@/types/habits';
import {
  getEntriesForDate,
  getDayProgress,
  getStreakData,
  getRecentDays,
} from '@/lib/habitMath';
import { resumeSelectedDate, writeResume } from '@/lib/resumeState';

// The calculations below are pure and live in '@/lib/habitMath' so they can be
// tested without a store. They are re-exposed here for existing consumers; new
// code should import from '@/lib/habitMath' directly.
//
// Each takes the habit list rather than a habit count, because how many habits
// count towards a day depends on the day — see the notes in habitMath.

interface HabitStore {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getEntriesForDate: (entries: HabitEntry[], date: string) => HabitEntry[];
  getDayProgress: (entries: HabitEntry[], date: string, habits: Habit[]) => DayProgress;
  getStreakData: (entries: HabitEntry[], habits: Habit[], habitId?: string) => StreakData;
  getRecentDays: (entries: HabitEntry[], days: number, habits: Habit[]) => DayProgress[];
}

export const useHabitStore = create<HabitStore>()((set) => ({
  // A cold launch shortly after leaving reopens the date you were on — unless
  // the day has rolled over since, in which case today wins. See resumeState.
  selectedDate: resumeSelectedDate() ?? format(new Date(), 'yyyy-MM-dd'),

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
    writeResume({ selectedDate: date });
  },

  getEntriesForDate,
  getDayProgress,
  getStreakData,
  getRecentDays,
}));
