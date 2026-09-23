import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getHabitIcon } from '@/utils/habitIcons';
import type { Habit } from '@/types/habits';

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/** How long the tube takes to strike. Matches the neon-ignite keyframes. */
const IGNITE_MS = 520;

/**
 * A habit is a neon sign: dark when pending, lit when done.
 *
 * The state is carried entirely by light — glowing icon, lit label, magenta
 * rim, and a pool of light at the foot — so there is no checkbox. `aria-pressed`
 * carries the same state for anyone not reading the glow.
 */
export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  completed,
  onClick,
  disabled = false,
  className,
}) => {
  const IconComponent = getHabitIcon(habit.icon);
  const [igniting, setIgniting] = useState(false);
  const wasCompleted = useRef(completed);

  // Strike the tube only on the transition into completed, never on mount or
  // on a re-render that happens to arrive while it is already lit.
  useEffect(() => {
    const justLit = completed && !wasCompleted.current;
    wasCompleted.current = completed;
    if (!justLit) return;

    setIgniting(true);
    const timer = setTimeout(() => setIgniting(false), IGNITE_MS);
    return () => clearTimeout(timer);
  }, [completed]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={completed}
      className={cn(
        'neon-tile rounded-[3px]',
        completed && 'neon-tile--lit',
        igniting && 'neon-tile--igniting',
        className,
      )}
    >
      <span className="neon-tile__bloom" aria-hidden="true" />

      {IconComponent && (
        <IconComponent size={27} strokeWidth={completed ? 1.9 : 1.7} className="neon-tile__icon" />
      )}

      <span className="neon-tile__label line-clamp-2">{habit.name}</span>

      <span className="neon-tile__pool" aria-hidden="true" />
    </button>
  );
};
