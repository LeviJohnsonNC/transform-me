import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, parseISO, subDays, isAfter, isBefore } from 'date-fns';
import type { HabitEntry, DayProgress, StreakData, Habit } from '@/types/habits';
import { CORE_HABITS } from '@/types/habits';

interface HabitStore {
  entries: HabitEntry[];
  selectedDate: string;
  
  // Actions
  setSelectedDate: (date: string) => void;
  toggleHabit: (habitId: string, date?: string) => void;
  addEntry: (entry: Omit<HabitEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<HabitEntry>) => void;
  getEntriesForDate: (date: string) => HabitEntry[];
  getDayProgress: (date: string) => DayProgress;
  getStreakData: (habitId?: string) => StreakData;
  getRecentDays: (days: number) => DayProgress[];
  
  // Undo functionality
  lastAction: (() => void) | null;
  undo: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      entries: [],
      selectedDate: format(new Date(), 'yyyy-MM-dd'),
      lastAction: null,

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

      toggleHabit: (habitId: string, date?: string) => {
        const targetDate = date || get().selectedDate;
        const entries = get().entries;
        const existingEntry = entries.find(
          e => e.habitId === habitId && e.date === targetDate
        );

        const previousState = { entries: [...entries] };

        if (existingEntry) {
          // Toggle existing entry
          const updatedEntries = entries.map(entry =>
            entry.id === existingEntry.id
              ? {
                  ...entry,
                  completed: !entry.completed,
                  completedAt: !entry.completed ? new Date().toISOString() : undefined
                }
              : entry
          );
          set({ 
            entries: updatedEntries,
            lastAction: () => set({ entries: previousState.entries })
          });
        } else {
          // Create new entry
          const newEntry: HabitEntry = {
            id: generateId(),
            habitId,
            date: targetDate,
            completed: true,
            completedAt: new Date().toISOString()
          };
          set({ 
            entries: [...entries, newEntry],
            lastAction: () => set({ entries: previousState.entries })
          });
        }
      },

      addEntry: (entryData) => {
        const newEntry: HabitEntry = {
          ...entryData,
          id: generateId()
        };
        const previousEntries = get().entries;
        set({ 
          entries: [...previousEntries, newEntry],
          lastAction: () => set({ entries: previousEntries })
        });
      },

      updateEntry: (id: string, updates) => {
        const previousEntries = get().entries;
        const updatedEntries = previousEntries.map(entry =>
          entry.id === id ? { ...entry, ...updates } : entry
        );
        set({ 
          entries: updatedEntries,
          lastAction: () => set({ entries: previousEntries })
        });
      },

      getEntriesForDate: (date: string) => {
        return get().entries.filter(entry => entry.date === date);
      },

      getDayProgress: (date: string) => {
        const entries = get().getEntriesForDate(date);
        const completedCount = entries.filter(e => e.completed).length;
        return {
          date,
          entries,
          completedCount,
          totalCount: CORE_HABITS.length
        };
      },

      getStreakData: (habitId?: string) => {
        const entries = get().entries;
        const today = new Date();
        const days = Array.from({ length: 30 }, (_, i) => {
          const date = format(subDays(today, i), 'yyyy-MM-dd');
          const dayEntries = entries.filter(e => e.date === date);
          
          let count = 0;
          if (habitId) {
            count = dayEntries.filter(e => e.habitId === habitId && e.completed).length;
          } else {
            count = dayEntries.filter(e => e.completed).length;
          }
          
          return { date, count };
        }).reverse();

        // Calculate current streak
        let currentStreak = 0;
        for (let i = days.length - 1; i >= 0; i--) {
          if (habitId ? days[i].count > 0 : days[i].count === CORE_HABITS.length) {
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

      getRecentDays: (days: number) => {
        const today = new Date();
        return Array.from({ length: days }, (_, i) => {
          const date = format(subDays(today, i), 'yyyy-MM-dd');
          return get().getDayProgress(date);
        }).reverse();
      },

      undo: () => {
        const { lastAction } = get();
        if (lastAction) {
          lastAction();
          set({ lastAction: null });
        }
      }
    }),
    {
      name: 'transform-habits',
      version: 1
    }
  )
);

// Keyboard shortcut for undo
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      useHabitStore.getState().undo();
    }
  });
}