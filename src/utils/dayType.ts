import { parseISO } from 'date-fns';
import type { Habit } from '@/types/habits';

export const isWeekend = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const day = d.getDay();
  return day === 0 || day === 6;
};

export const getActiveHabitsForDate = (habits: Habit[], date: string | Date): Habit[] => {
  const weekend = isWeekend(date);
  return habits.filter(h =>
    weekend ? h.activeOnWeekends !== false : h.activeOnWeekdays !== false
  );
};
