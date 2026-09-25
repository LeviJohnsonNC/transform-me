import React from 'react';
import { SegmentedControl } from '@/components/SegmentedControl';

interface DaySelectorProps {
  selectedDay: number | null;
  onDaySelect: (dayNumber: number) => void;
  workoutPlans: Array<{ id: string; day_number: number; day_name: string }>;
  /** Plan ids with a set logged today; those days get a dot. */
  loggedToday?: ReadonlySet<string>;
}

/** The plan's own name for a day, unless it is just the default "Day N". */
const customName = (plan: { day_number: number; day_name: string }): string | null => {
  const name = plan.day_name?.trim();
  if (!name || name.toLowerCase() === `day ${plan.day_number}`) return null;
  return name;
};

/**
 * Every day of the plan in one row, however many there are (up to 7 fits a
 * 375px phone at ~42px a segment). The number is all a segment has room for,
 * so the selected day's name, which the old buttons never showed, sits on the
 * label line above.
 */
export const DaySelector: React.FC<DaySelectorProps> = ({ selectedDay, onDaySelect, workoutPlans, loggedToday }) => {
  const selected = workoutPlans.find((p) => p.day_number === selectedDay);
  const selectedName = selected ? customName(selected) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="font-display text-[10px] tracking-[0.2em] text-faint">DAY</span>
        {selected && (
          <span className="font-display text-[10px] font-semibold tracking-[0.14em] text-cyan truncate">
            DAY {selected.day_number}
            {selectedName && ` · ${selectedName.toUpperCase()}`}
          </span>
        )}
      </div>
      <SegmentedControl
        ariaLabel="Workout day"
        value={selectedDay}
        onChange={onDaySelect}
        segmentClassName="h-[46px] text-[18px] font-bold tabular"
        segments={workoutPlans.map((plan) => {
          const name = customName(plan);
          const logged = loggedToday?.has(plan.id) ?? false;
          return {
            value: plan.day_number,
            label: plan.day_number,
            dot: logged,
            ariaLabel: [`Day ${plan.day_number}`, name, logged && 'logged today'].filter(Boolean).join(', '),
          };
        })}
      />
    </div>
  );
};
