import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Habit, HabitEntry } from '@/types/habits';

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
export const convertToAppFormat = (entry: SupabaseHabitEntry): HabitEntry => ({
  id: entry.id,
  habitId: entry.habit_id,
  date: entry.date,
  completed: entry.completed,
  completedAt: entry.completed_at || undefined,
  notes: entry.notes || undefined,
});

export const mapHabitRow = (h: any): Habit => ({
  id: h.id,
  name: h.name,
  icon: h.icon,
  description: h.description || undefined,
  orderIndex: h.order_index,
  isActive: h.is_active,
  valueType: h.value_type === 'tiered' ? 'tiered' : 'boolean',
  color: h.color || undefined,
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
export const useToggleHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: existingEntry, error: fetchError } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', date)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (existingEntry) {
        const { data, error } = await supabase
          .from('habit_entries')
          .update({
            completed: !existingEntry.completed,
            completed_at: !existingEntry.completed ? new Date().toISOString() : null,
          })
          .eq('id', existingEntry.id)
          .select()
          .single();
        
        if (error) throw error;
        return convertToAppFormat(data);
      } else {
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
        
        if (error) throw error;
        return convertToAppFormat(data);
      }
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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ name: string; description: string; icon: string; is_active: boolean; order_index: number }> }) => {
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
