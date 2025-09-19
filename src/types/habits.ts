// Transform App - Habit Types & Models

export interface Habit {
  id: string;
  name: string;
  icon: string;
  description?: string;
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

// The 5 core habits for Transform
export const CORE_HABITS: Habit[] = [
  {
    id: 'strength',
    name: 'Strength training',
    icon: 'Dumbbell',
    description: 'Complete your strength workout'
  },
  {
    id: 'conditioning',
    name: 'Conditioning',
    icon: 'Activity',
    description: 'Cardio or conditioning work'
  },
  {
    id: 'supplements',
    name: 'Supplements & vitamins',
    icon: 'Pill',
    description: 'Take daily supplements'
  },
  {
    id: 'protein',
    name: 'Hit protein target',
    icon: 'Beef',
    description: 'Meet daily protein goal'
  },
  {
    id: 'calories',
    name: 'Under calorie budget',
    icon: 'Flame',
    description: 'Stay within daily calorie target'
  }
];

export const HABIT_COLORS = {
  strength: 'text-primary',
  conditioning: 'text-accent',
  calories: 'text-danger',
  protein: 'text-success',
  supplements: 'text-primary-neon'
} as const;