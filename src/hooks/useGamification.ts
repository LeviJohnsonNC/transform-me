import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';

// --- Pure functions (exported for testability) ---

export const calculateDayXP = (completedCount: number, totalHabits: number): number => {
  if (completedCount === 0 || totalHabits === 0) return 0;
  const ratio = completedCount / totalHabits;
  let xp = 10; // at least 1 habit
  if (ratio >= 0.33) xp += 15;
  if (ratio >= 0.67) xp += 25;
  if (ratio >= 1.0) xp += 50;
  return xp;
};

export const getLevelFromXP = (totalXP: number): {
  level: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  totalXpForNextLevel: number;
} => {
  let remaining = totalXP;
  let level = 1;
  while (true) {
    const required = 100 + (level - 1) * 25;
    if (remaining < required) {
      return { level, xpInCurrentLevel: remaining, xpToNextLevel: required - remaining, totalXpForNextLevel: required };
    }
    remaining -= required;
    level++;
  }
};

// --- Hook ---

export interface GamificationData {
  level: number;
  xp: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  totalXpForNextLevel: number;
}

export const useGamification = (): GamificationData => {
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();
  const totalHabits = habits.length || 1;

  // Group completed entries by date and count per day
  const dayMap = new Map<string, number>();
  for (const e of entries) {
    if (e.completed) {
      dayMap.set(e.date, (dayMap.get(e.date) || 0) + 1);
    }
  }

  let totalXP = 0;
  for (const count of dayMap.values()) {
    totalXP += calculateDayXP(count, totalHabits);
  }

  const { level, xpInCurrentLevel, xpToNextLevel, totalXpForNextLevel } = getLevelFromXP(totalXP);

  return { level, xp: totalXP, xpInCurrentLevel, xpToNextLevel, totalXpForNextLevel };
};

export const useGamificationEnabled = () => false;
