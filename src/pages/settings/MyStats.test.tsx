// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { UserStats } from '@/hooks/useUserStats';

const mutateAsync = vi.fn();
let stored: UserStats | null = null;

vi.mock('@/hooks/useUserStats', () => ({
  useUserStats: () => ({ data: stored, isLoading: false }),
  useUpsertUserStats: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { MyStats } from '@/pages/settings/MyStats';
import { toast } from 'sonner';

const profile = (over: Partial<UserStats>): UserStats => ({
  user_id: 'u',
  gender: 'male',
  age: 30,
  bodyweight_lbs: 180,
  rating_scale: null,
  ...over,
});

describe('MyStats', () => {
  beforeEach(() => {
    mutateAsync.mockReset().mockResolvedValue({});
    vi.mocked(toast.error).mockReset();
  });
  afterEach(cleanup);

  it('asks for a scale only when gender is "prefer not to say"', () => {
    stored = profile({ gender: 'male' });
    const { unmount } = render(<MyStats onBack={() => {}} />);
    expect(screen.queryByText('Score my lifts against')).toBeNull();
    unmount();

    stored = profile({ gender: 'other' });
    render(<MyStats onBack={() => {}} />);
    expect(screen.getByText('Score my lifts against')).toBeDefined();
    expect(screen.queryByText(/uses male standards/)).toBeNull();
  });

  it('will not save "prefer not to say" without a scale', () => {
    stored = profile({ gender: 'other', rating_scale: null });
    render(<MyStats onBack={() => {}} />);
    fireEvent.click(screen.getByText('Save Stats'));
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Choose which standards to score your lifts against');
  });

  it('saves the chosen scale', () => {
    stored = profile({ gender: 'other', rating_scale: 'female' });
    render(<MyStats onBack={() => {}} />);
    fireEvent.click(screen.getByText('Save Stats'));
    expect(mutateAsync).toHaveBeenCalledWith({ gender: 'other', age: 30, bodyweight_lbs: 180, rating_scale: 'female' });
  });
});
