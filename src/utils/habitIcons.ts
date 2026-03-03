import {
  Dumbbell,
  Activity,
  Pill,
  Beef,
  Flame,
  Sparkles,
  BookOpen,
  Snowflake,
  GraduationCap,
  Circle,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Dumbbell,
  Activity,
  Pill,
  Beef,
  Flame,
  Sparkles,
  BookOpen,
  Snowflake,
  GraduationCap,
};

export const getHabitIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};

export { iconMap };
