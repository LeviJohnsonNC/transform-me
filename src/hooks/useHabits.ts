import { useQuery, useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Habit, HabitEntry } from '@/types/habits';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

// Types for Supabase
type SupabaseHabitEntry = {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
};

// Convert Supabase format to app format
const convertToAppFormat = (entry: SupabaseHabitEntry): HabitEntry => ({
  id: entry.id,
  habitId: entry.habit_id,
  date: entry.date,
  completed: entry.completed,
  completedAt: entry.completed_at || undefined,
  notes: entry.notes || undefined,
});

const mapHabitRow = (h: Tables<'habits'>): Habit => ({
  id: h.id,
  name: h.name,
  icon: h.icon,
  description: h.description || undefined,
  orderIndex: h.order_index,
  isActive: h.is_active,
  valueType: h.value_type === 'tiered' ? 'tiered' : 'boolean',
  color: h.color || undefined,
  activeOnWeekdays: h.active_on_weekdays ?? true,
  activeOnWeekends: h.active_on_weekends ?? true,
});

// Fetch user's active habits from DB
export const useUserHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(mapHabitRow);
    },
  });
};

// Fetch ALL habits (including inactive) for management
export const useAllHabits = () => {
  return useQuery({
    queryKey: ['all-habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(mapHabitRow);
    },
  });
};

// Fetch all habit entries
export const useHabitEntries = () => {
  return useQuery({
    queryKey: ['habit-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data.map(convertToAppFormat);
    },
  });
};

// Fetch entries for a specific date range
export const useHabitEntriesForDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['habit-entries', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data.map(convertToAppFormat);
    },
  });
};

// Toggle habit completion
type ToggleHabitVariables = { habitId: string; date: string };

// Tagging the mutation lets callers see which individual toggles are in flight,
// rather than sharing one isPending flag across every habit on screen.
const TOGGLE_HABIT_MUTATION_KEY = ['toggle-habit'] as const;

/** Stable identity for one habit on one date. */
export const toggleKey = (habitId: string, date: string) => `${habitId}|${date}`;

/**
 * The set of (habit, date) toggles currently in flight, as `toggleKey` strings.
 *
 * Gate each habit on its own entry here. Using the mutation's `isPending`
 * instead disables every habit while any one of them is saving, which on a slow
 * connection freezes the whole grid — each toggle is several round trips.
 */
export const usePendingHabitToggles = (): Set<string> => {
  const pending = useMutationState({
    filters: { mutationKey: TOGGLE_HABIT_MUTATION_KEY, status: 'pending' },
    select: (mutation) => mutation.state.variables as ToggleHabitVariables | undefined,
  });

  const keys = new Set<string>();
  for (const variables of pending) {
    if (variables) keys.add(toggleKey(variables.habitId, variables.date));
  }
  return keys;
};

export const useToggleHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: TOGGLE_HABIT_MUTATION_KEY,
    mutationFn: async ({ habitId, date }: ToggleHabitVariables) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Read every row for this habit/day, not one. Two things make that
      // necessary: `maybeSingle()` ERRORS when more than one row matches, and
      // a duplicated day (possible on any data written before the unique index
      // landed) would therefore fail the whole toggle, roll the optimistic
      // update back, and make the tile flick straight off again.
      const { data: rows, error: fetchError } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', date)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const existing = rows ?? [];

      if (existing.length > 0) {
        // Duplicates can disagree with each other, so "done" means any row says
        // so, and the write goes to ALL of them by filter rather than by id.
        // That heals the divergence instead of leaving a stale row behind to
        // contradict the one we touched.
        const isCompleted = existing.some((entry) => entry.completed);
        const next = !isCompleted;

        const { data, error } = await supabase
          .from('habit_entries')
          .update({
            completed: next,
            completed_at: next ? new Date().toISOString() : null,
          })
          .eq('habit_id', habitId)
          .eq('date', date)
          .eq('user_id', user.id)
          .select();

        if (error) throw error;
        return convertToAppFormat((data ?? [])[0]);
      }

      // A plain insert, deliberately not an upsert. `upsert(..., { onConflict })`
      // emits ON CONFLICT (cols), which Postgres can only resolve against a
      // matching unique index — so if that index is not present the write fails
      // outright, and only for habits with no row yet today. Racing on the
      // insert instead is handled below, and costs nothing when it does not
      // happen.
      const { data, error } = await supabase
        .from('habit_entries')
        .insert({
          habit_id: habitId,
          date,
          completed: true,
          completed_at: new Date().toISOString(),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        // 23505 = unique violation: a second tap got there first, and its row
        // is already the state this one wanted. Adopt it rather than failing.
        if (error.code === '23505') {
          const { data: winner, error: reReadError } = await supabase
            .from('habit_entries')
            .select('*')
            .eq('habit_id', habitId)
            .eq('date', date)
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (reReadError) throw reReadError;
          if (winner) return convertToAppFormat(winner);
        }
        throw error;
      }

      return convertToAppFormat(data);
    },
    onMutate: async ({ habitId, date }) => {
      await queryClient.cancelQueries({ queryKey: ['habit-entries'] });
      
      const previousEntries = queryClient.getQueryData(['habit-entries']) as HabitEntry[] || [];
      const existingEntry = previousEntries.find(e => e.habitId === habitId && e.date === date);
      const optimisticEntries = [...previousEntries];
      
      if (existingEntry) {
        const index = optimisticEntries.findIndex(e => e.id === existingEntry.id);
        optimisticEntries[index] = {
          ...existingEntry,
          completed: !existingEntry.completed,
          completedAt: !existingEntry.completed ? new Date().toISOString() : undefined,
        };
      } else {
        optimisticEntries.push({
          id: `temp-${Date.now()}`,
          habitId,
          date,
          completed: true,
          completedAt: new Date().toISOString(),
        });
      }
      
      queryClient.setQueryData(['habit-entries'], optimisticEntries);
      return { previousEntries };
    },
    onError: (err, variables, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(['habit-entries'], context.previousEntries);
      }
      // Without this the only sign of a failed save is the tile quietly
      // reverting, which is indistinguishable from a bug — and was in fact
      // reported as one. Mutations are not retried (see lib/queryClient), so
      // tapping again is the recovery.
      toast.error('Could not save that', {
        description: err instanceof Error ? err.message : 'Tap it again to retry.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-entries'] });
    },
  });
};

// Update a habit
export const useUpdateHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ name: string; description: string; icon: string; is_active: boolean; order_index: number; active_on_weekdays: boolean; active_on_weekends: boolean }> }) => {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapHabitRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['all-habits'] });
    },
  });
};

// Add a new habit
export const useAddHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (habit: { name: string; description: string; icon: string; order_index: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('habits')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          name: habit.name,
          description: habit.description,
          icon: habit.icon,
          order_index: habit.order_index,
          is_active: true,
          value_type: 'boolean',
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapHabitRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['all-habits'] });
    },
  });
};

// Delete a habit
export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['all-habits'] });
    },
  });
};

// Reorder habits (batch update order_index)
export const useReorderHabits = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Array<{ id: string; order_index: number }>) => {
      const promises = updates.map(({ id, order_index }) =>
        supabase.from('habits').update({ order_index }).eq('id', id)
      );
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['all-habits'] });
    },
  });
};

// Add new habit entry
export const useAddHabitEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: Omit<HabitEntry, 'id'>) => {
      const { data, error } = await supabase
        .from('habit_entries')
        .insert({
          habit_id: entry.habitId,
          date: entry.date,
          completed: entry.completed,
          completed_at: entry.completedAt || null,
          notes: entry.notes || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return convertToAppFormat(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-entries'] });
    },
  });
};

// Update habit entry
export const useUpdateHabitEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HabitEntry> }) => {
      const { data, error } = await supabase
        .from('habit_entries')
        .update({
          ...(updates.completed !== undefined && { completed: updates.completed }),
          ...(updates.completedAt !== undefined && { completed_at: updates.completedAt }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return convertToAppFormat(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-entries'] });
    },
  });
};

// Migrate local storage data to Supabase
export const useMigrateLocalData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const localData = localStorage.getItem('transform-habits');
      if (!localData) return { migrated: 0 };
      
      const parsedData = JSON.parse(localData);
      const entries = parsedData.state?.entries || [];
      
      if (entries.length === 0) return { migrated: 0 };
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const supabaseEntries = entries.map((entry: HabitEntry) => ({
        habit_id: entry.habitId,
        date: entry.date,
        completed: entry.completed,
        completed_at: entry.completedAt || null,
        notes: entry.notes || null,
        user_id: user.id,
      }));
      
      const { data, error } = await supabase
        .from('habit_entries')
        .insert(supabaseEntries)
        .select();
      
      if (error) throw error;
      
      localStorage.removeItem('transform-habits');
      return { migrated: data.length };
    },
    onSuccess: (result) => {
      console.log(`Migrated ${result.migrated} habit entries to Supabase`);
      queryClient.invalidateQueries({ queryKey: ['habit-entries'] });
    },
  });
};
