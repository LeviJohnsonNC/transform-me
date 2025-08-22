import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HabitEntry } from '@/types/habits';
import { format } from 'date-fns';

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
      // Check if entry exists
      const { data: existingEntry, error: fetchError } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', date)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existingEntry) {
        // Toggle existing entry
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
        // Create new entry
        const { data, error } = await supabase
          .from('habit_entries')
          .insert({
            habit_id: habitId,
            date,
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        return convertToAppFormat(data);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['habit-entries'] });
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
      
      // Convert local entries to Supabase format
      const supabaseEntries = entries.map((entry: HabitEntry) => ({
        habit_id: entry.habitId,
        date: entry.date,
        completed: entry.completed,
        completed_at: entry.completedAt || null,
        notes: entry.notes || null,
      }));
      
      // Insert all entries
      const { data, error } = await supabase
        .from('habit_entries')
        .insert(supabaseEntries)
        .select();
      
      if (error) throw error;
      
      // Clear local storage after successful migration
      localStorage.removeItem('transform-habits');
      
      return { migrated: data.length };
    },
    onSuccess: (result) => {
      console.log(`Migrated ${result.migrated} habit entries to Supabase`);
      queryClient.invalidateQueries({ queryKey: ['habit-entries'] });
    },
  });
};