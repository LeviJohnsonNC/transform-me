import { describe, it, expect, vi } from 'vitest';

// The picker module pulls in the Supabase client through its hooks; only the
// list is under test here.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { EXERCISES } from '@/components/ExerciseSelector';
import { findStandard } from '@/lib/strengthStandards';
import { unitFor } from '@/lib/recordMath';

// Picker entries with no standard of their own. "Triceps Extensions" could be
// any of several lifts, and a dead bug is not a strength test.
const UNRATED = new Set(['Triceps Extensions', 'Dead Bug', 'Fun (Any lift)', 'Active Recovery']);

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
