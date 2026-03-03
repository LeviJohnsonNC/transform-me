// Transform App - Habit Types & Models

export interface Habit {
  id: string;
  name: string;
  icon: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  valueType: 'boolean' | 'tiered';
  color?: string;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: string; // ISO timestamp
  notes?: string;
}

export interface DayProgress {
  date: string;
  entries: HabitEntry[];
  completedCount: number;
  totalCount: number;
}

export interface StreakData {
  current: number;
  longest: number;
  data: Array<{
    date: string;
    count: number;
  }>;
}
