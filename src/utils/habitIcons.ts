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
  Heart,
  Droplets,
  Moon,
  Sun,
  Brain,
  Footprints,
  Apple,
  Clock,
  Eye,
  Music,
  Smile,
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
  Heart,
  Droplets,
  Moon,
  Sun,
  Brain,
  Footprints,
  Apple,
  Clock,
  Eye,
  Music,
  Smile,
};

export const getHabitIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};

export { iconMap };
