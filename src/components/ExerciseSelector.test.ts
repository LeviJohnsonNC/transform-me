import { describe, it, expect, vi } from 'vitest';

// The picker module pulls in the Supabase client through its hooks; only the
// list is under test here.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { EXERCISES } from '@/components/ExerciseSelector';
import { findStandard } from '@/lib/strengthStandards';
import { unitFor } from '@/lib/recordMath';

// Picker entries with no standard of their own. Front squat and side plank used
// to be graded as a back squat and a front plank.
const UNRATED = new Set([
  '1-Arm DB Row', 'Inverted Row', 'Triceps Extensions', 'Front Squat', 'Side Plank', 'Dead Bug',
  'Fun (Any lift)', 'Active Recovery',
]);

describe('EXERCISES', () => {
  it('rates exactly the picker entries that have a standard', () => {
    for (const name of EXERCISES) {
      expect(findStandard(name) !== null, name).toBe(!UNRATED.has(name));
    }
  });

  it('gives every rated entry the same unit on the card as in its standard', () => {
    for (const name of EXERCISES) {
      const standard = findStandard(name);
      if (standard) expect(unitFor(name), name).toBe(standard.unit);
    }
  });
});
