// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DaySelector } from '@/components/DaySelector';

const plans = (n: number, names: Record<number, string> = {}) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, day_number: i + 1, day_name: names[i + 1] ?? `Day ${i + 1}` }));

describe('DaySelector', () => {
  afterEach(cleanup);

  it('puts every day in one evenly split row, however many there are', () => {
    // Regression: fixed 80px buttons in a scrolling row hid day 5 and on.
    for (const n of [1, 4, 7]) {
      const { unmount } = render(<DaySelector selectedDay={null} onDaySelect={() => {}} workoutPlans={plans(n)} />);
      const group = screen.getByRole('radiogroup', { name: 'Workout day' });
      expect(screen.getAllByRole('radio')).toHaveLength(n);
      expect(group.style.gridTemplateColumns).toBe(`repeat(${n}, minmax(0, 1fr))`);
      expect(group.className).not.toMatch(/overflow/);
      unmount();
    }
  });

  it('marks the selected day and reports taps', () => {
    const onDaySelect = vi.fn();
    render(<DaySelector selectedDay={3} onDaySelect={onDaySelect} workoutPlans={plans(7)} />);
    expect(screen.getByRole('radio', { name: 'Day 3' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Day 6' }).getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByRole('radio', { name: 'Day 6' }));
    expect(onDaySelect).toHaveBeenCalledWith(6);
  });

  it("shows the selected day's own name, but not a default one", () => {
    const { unmount } = render(
      <DaySelector selectedDay={3} onDaySelect={() => {}} workoutPlans={plans(5, { 3: 'Legs' })} />,
    );
    expect(screen.getByText('DAY 3 · LEGS')).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Day 3, Legs' })).toBeDefined();
    unmount();

    render(<DaySelector selectedDay={2} onDaySelect={() => {}} workoutPlans={plans(5, { 3: 'Legs' })} />);
    expect(screen.getByText('DAY 2')).toBeDefined();
  });

  it('dots the days with a set logged today', () => {
    const { container } = render(
      <DaySelector selectedDay={1} onDaySelect={() => {}} workoutPlans={plans(7)} loggedToday={new Set(['p1', 'p4'])} />,
    );
    expect(screen.getByRole('radio', { name: 'Day 4, logged today' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Day 1, logged today' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Day 2' })).toBeDefined();
    expect(container.querySelectorAll('[role="radio"] span[aria-hidden]')).toHaveLength(2);
  });

  it('moves between days with the arrow keys, wrapping at the ends', () => {
    const onDaySelect = vi.fn();
    render(<DaySelector selectedDay={7} onDaySelect={onDaySelect} workoutPlans={plans(7)} />);
    const day7 = screen.getByRole('radio', { name: 'Day 7' });
    expect(day7.tabIndex).toBe(0);
    expect(screen.getByRole('radio', { name: 'Day 1' }).tabIndex).toBe(-1);
    fireEvent.keyDown(day7, { key: 'ArrowRight' });
    expect(onDaySelect).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(day7, { key: 'ArrowLeft' });
    expect(onDaySelect).toHaveBeenLastCalledWith(6);
  });
});
