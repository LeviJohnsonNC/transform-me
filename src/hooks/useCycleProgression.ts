import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';
import { getDayTier, type DayTier } from '@/hooks/useGamification';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { getActiveHabitsForDate } from '@/utils/dayType';
import type { Habit } from '@/types/habits';

// --- Pure functions ---

export const tierToPoints = (tier: DayTier): number => {
  switch (tier) {
    case 'gold': return 3;
    case 'silver': return 2;
    case 'bronze': return 1;
    default: return 0;
  }
};

export interface CycleComputedProgress {
  totalPoints: number;
  currentLevel: number;
  levelProgress: number;
  pointsPerLevel: number;
  pointsToNextLevel: number;
}

export const computeCycleProgress = (
  entries: Array<{ habitId: string; date: string; completed: boolean }>,
  habits: Habit[],
  cycleStartDate: string,
  pointsPerLevel: number = 12,
  maxLevel: number = 10,
): CycleComputedProgress => {
  if (habits.length === 0) {
    return { totalPoints: 0, currentLevel: 1, levelProgress: 0, pointsPerLevel, pointsToNextLevel: pointsPerLevel };
  }

  const startDate = cycleStartDate.split('T')[0];

  let start: Date;
  try {
    start = parseISO(startDate);
  } catch {
    start = new Date();
  }

  const days = eachDayOfInterval({ start, end: new Date() });

  let totalPoints = 0;
  for (const day of days) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const activeHabits = getActiveHabitsForDate(habits, dateStr);
    const totalHabits = activeHabits.length;
    if (totalHabits === 0) continue;
    const activeIds = new Set(activeHabits.map(h => h.id));
    const completedCount = entries.filter(e => e.date === dateStr && e.completed && activeIds.has(e.habitId)).length;
    const tier = getDayTier(completedCount, totalHabits);
    totalPoints += tierToPoints(tier);
  }

  const maxPoints = maxLevel * pointsPerLevel;
  const cappedPoints = Math.min(totalPoints, maxPoints);

  const currentLevel = Math.min(Math.floor(cappedPoints / pointsPerLevel) + 1, maxLevel);
  const levelProgress = cappedPoints - (currentLevel - 1) * pointsPerLevel;
  const pointsToNextLevel = pointsPerLevel - levelProgress;

  return { totalPoints: cappedPoints, currentLevel, levelProgress, pointsPerLevel, pointsToNextLevel };
};

export const selectRandomReward = (
  activeRewards: Array<{ id: string; title: string; description: string | null }>,
  lastAssignedId: string | null,
): { id: string; title: string; description: string | null } | null => {
  if (activeRewards.length === 0) return null;
  if (activeRewards.length === 1) return activeRewards[0];

  const pool = lastAssignedId
    ? activeRewards.filter(r => r.id !== lastAssignedId)
    : activeRewards;

  const candidates = pool.length > 0 ? pool : activeRewards;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

// --- DB types ---

interface CycleRow {
  id: string;
  user_id: string;
  cycle_number: number;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
  points_per_level: number;
}

interface UnlockRow {
  id: string;
  cycle_id: string;
  level: number;
  reward_type: string;
  reward_setting_id: string | null;
  reward_title_snapshot: string;
  reward_description_snapshot: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
  unlocked_at: string;
}

// --- Hook ---

export const useCycleProgress = () => {
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();
  const queryClient = useQueryClient();

  // Fetch active cycle
  const cycleQuery = useQuery({
    queryKey: ['cycle-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycle_progress')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      const rows = data as CycleRow[] | null;
      return rows && rows.length > 0 ? rows[0] : null;
    },
  });

  // Fetch unlocks for active cycle
  const unlocksQuery = useQuery({
    queryKey: ['cycle-level-unlocks', cycleQuery.data?.id],
    queryFn: async () => {
      if (!cycleQuery.data) return [];
      const { data, error } = await supabase
        .from('cycle_level_unlocks')
        .select('*')
        .eq('cycle_id', cycleQuery.data.id)
        .order('level', { ascending: true });

      if (error) throw error;
      return (data || []) as UnlockRow[];
    },
    enabled: !!cycleQuery.data,
  });

  // Fetch boss reward setting
  const bossRewardQuery = useQuery({
    queryKey: ['boss-reward-setting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_settings')
        .select('*')
        .eq('type', 'boss')
        .maybeSingle();

      if (error) throw error;
      return data as { id: string; title: string; description: string | null } | null;
    },
  });

  const cycle = cycleQuery.data;
  const unlocks = unlocksQuery.data || [];
  const bossReward = bossRewardQuery.data;

  // Compute progress
  const computed = cycle
    ? computeCycleProgress(entries, habits, cycle.started_at, cycle.points_per_level)
    : { totalPoints: 0, currentLevel: 1, levelProgress: 0, pointsPerLevel: 12, pointsToNextLevel: 12 };

  // Detect pending unlocks
  const maxUnlockedLevel = unlocks.length > 0 ? Math.max(...unlocks.map(u => u.level)) : 0;
  const pendingUnlockLevel = computed.currentLevel > maxUnlockedLevel && cycle
    ? maxUnlockedLevel + 1
    : null;

  return {
    cycle,
    cycleNumber: cycle?.cycle_number || 1,
    level: computed.currentLevel,
    levelProgress: computed.levelProgress,
    pointsPerLevel: computed.pointsPerLevel,
    pointsToNextLevel: computed.pointsToNextLevel,
    totalPoints: computed.totalPoints,
    unlocks,
    bossReward,
    pendingUnlockLevel,
    isLoading: cycleQuery.isLoading || unlocksQuery.isLoading,
    hasCycle: !!cycle,
  };
};

// --- Mutations ---

export const useInitializeCycle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cycle_progress')
        .insert({
          user_id: user.id,
          cycle_number: 1,
          is_active: true,
          points_per_level: 12,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-progress'] });
    },
  });
};

export const useCreateUnlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cycleId,
      level,
      rewardType,
      rewardSettingId,
      rewardTitle,
      rewardDescription,
    }: {
      cycleId: string;
      level: number;
      rewardType: 'standard' | 'boss';
      rewardSettingId: string | null;
      rewardTitle: string;
      rewardDescription: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cycle_level_unlocks')
        .insert({
          user_id: user.id,
          cycle_id: cycleId,
          level,
          reward_type: rewardType,
          reward_setting_id: rewardSettingId,
          reward_title_snapshot: rewardTitle,
          reward_description_snapshot: rewardDescription,
          is_claimed: false,
        })
        .select()
        .single();

      if (error) throw error;

      // If level 10, mark cycle complete and start new one
      if (level === 10) {
        await supabase
          .from('cycle_progress')
          .update({ is_active: false, completed_at: new Date().toISOString() })
          .eq('id', cycleId);

        // Get current cycle number
        const { data: oldCycle } = await supabase
          .from('cycle_progress')
          .select('cycle_number')
          .eq('id', cycleId)
          .single();

        await supabase
          .from('cycle_progress')
          .insert({
            user_id: user.id,
            cycle_number: (oldCycle?.cycle_number || 1) + 1,
            is_active: true,
            points_per_level: 12,
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-progress'] });
      queryClient.invalidateQueries({ queryKey: ['cycle-level-unlocks'] });
    },
  });
};

export const useClaimReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unlockId: string) => {
      const { error } = await supabase
        .from('cycle_level_unlocks')
        .update({ is_claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', unlockId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-level-unlocks'] });
    },
  });
};
