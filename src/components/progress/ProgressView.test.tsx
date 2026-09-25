// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { rateLoggedSets } from '@/hooks/useProgress';
import { closestLevelUp, overallLevel, scoreMuscles, scoreRegions } from '@/lib/progress';

const stats = { gender: 'male' as const, age: 30, bodyweight_lbs: 180 };
const state = vi.hoisted(() => ({ value: null as unknown }));
vi.mock('@/hooks/useProgress', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useProgress')>()),
  useProgress: () => state.value,
}));

import { ProgressView } from '@/components/progress/ProgressView';

const summaryFrom = (rows: Array<[string, number, number | null]>, untrained: string[] = []) => {
  const lifts = rateLoggedSets(rows.map(([exercise_name, current_weight, actual_reps]) => ({ exercise_name, current_weight, actual_reps })), stats);
  const muscles = scoreMuscles(lifts);
  return { lifts, untrained, muscles, regions: scoreRegions(muscles), overall: overallLevel(lifts), next: closestLevelUp(lifts, stats) };
};

describe('ProgressView', () => {
  afterEach(cleanup);

  it('shows the headline, the ranked lifts and the untrained ones', () => {
    state.value = {
      summary: summaryFrom([['Bench Press', 225, 5], ['Back Squat', 185, 5]], ['Calf Raise']),
      isLoading: false,
      missing: null,
    };
    render(<ProgressView planned={[]} />);
    expect(screen.getByText('2 LIFTS RATED')).toBeDefined();
    const rows = screen.getAllByRole('listitem').map((li) => li.getAttribute('aria-label'));
    expect(rows[0]).toMatch(/^Bench Press, level/);
    expect(rows[1]).toMatch(/^Back Squat, level/);
    expect(rows[2]).toBe('Calf Raise, untrained');
    expect(screen.getByText('NEXT LEVEL-UP')).toBeDefined();
  });

  it('opens a muscle when you tap it', () => {
    state.value = { summary: summaryFrom([['Bench Press', 225, 5]]), isLoading: false, missing: null };
    render(<ProgressView planned={[]} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Chest, level/ })[0]);
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('heading', { name: 'CHEST' })).toBeDefined();
    expect(dialog.getByText('BUILT BY')).toBeDefined();
    expect(dialog.getByText('Bench Press')).toBeDefined();
  });

  it('marks muscles nothing has worked as untrained', () => {
    state.value = { summary: summaryFrom([['Bench Press', 225, 5]]), isLoading: false, missing: null };
    render(<ProgressView planned={[]} />);
    expect(screen.getAllByRole('button', { name: 'Calves, untrained' }).length).toBeGreaterThan(0);
  });

  it('turns the figure round', () => {
    state.value = { summary: summaryFrom([['Bench Press', 225, 5]]), isLoading: false, missing: null };
    render(<ProgressView planned={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Turn to the back' }));
    expect(screen.getByRole('button', { name: 'Turn to the front' })).toBeDefined();
  });

  it('asks for stats before it can show anything', () => {
    state.value = { summary: null, isLoading: false, missing: 'stats' };
    render(<ProgressView planned={[]} />);
    expect(screen.getByText(/Add your stats/)).toBeDefined();
  });
});
