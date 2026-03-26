import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Gift, Trophy } from 'lucide-react';
import { getActiveHabitsForDate, isWeekend } from '@/utils/dayType';
import { HabitCard } from '@/components/HabitCard';
import { StreakRing } from '@/components/StreakRing';
import { DataMigration } from '@/components/DataMigration';
import { DayClearStatus } from '@/components/DayClearStatus';
import { Button } from '@/components/ui/button';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useToggleHabit, useUserHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { useDayTier } from '@/hooks/useGamification';
import {
  useCycleProgress,
  useInitializeCycle,
  useCreateUnlock,
  useClaimReward,
  selectRandomReward,
} from '@/hooks/useCycleProgression';
import { useRewardSettings } from '@/hooks/useRewardSettings';

export const Today: React.FC = () => {
  const { selectedDate, setSelectedDate, getDayProgress } = useHabitStore();
  const { data: habits = [], isLoading: habitsLoading } = useUserHabits();
  const { data: entries = [], isLoading: entriesLoading } = useHabitEntries();
  const toggleHabit = useToggleHabit();
  const { completed: completedCount, total, tier } = useDayTier();

  const cycle = useCycleProgress();
  const initCycle = useInitializeCycle();
  const createUnlock = useCreateUnlock();
  const claimReward = useClaimReward();
  const { data: allRewards = [] } = useRewardSettings();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [pendingUnlock, setPendingUnlock] = useState<{
    level: number;
    rewardTitle: string;
    rewardDescription: string | null;
    rewardType: 'standard' | 'boss';
    unlockId: string | null;
  } | null>(null);

  const safeEntries = entries || [];
  const activeHabits = getActiveHabitsForDate(habits, selectedDate);
  const dayProgress = getDayProgress(safeEntries, selectedDate, activeHabits.length);
  const isWeekendDay = isWeekend(selectedDate);

  // Auto-init cycle — run only once per mount
  const [cycleInitAttempted, setCycleInitAttempted] = useState(false);
  useEffect(() => {
    if (cycleInitAttempted) return;
    if (cycle.isLoading) return;
    if (cycle.hasCycle) return;
    if (initCycle.isPending) return;

    setCycleInitAttempted(true);
    console.log('[Cycle] No active cycle found, initializing...');
    initCycle.mutate(undefined, {
      onSuccess: () => console.log('[Cycle] Cycle initialized successfully'),
      onError: (error) => console.error('[Cycle] Failed to initialize cycle:', error),
    });
  }, [cycle.isLoading, cycle.hasCycle, initCycle.isPending, cycleInitAttempted]);

  // Detect level-ups
  useEffect(() => {
    if (cycle.isLoading || !cycle.cycle || !cycle.pendingUnlockLevel || createUnlock.isPending) return;

    const level = cycle.pendingUnlockLevel;
    const isBoss = level === 10;

    if (isBoss) {
      const title = cycle.bossReward?.title || 'Cycle Complete';
      const desc = cycle.bossReward?.description || null;

      createUnlock.mutate({
        cycleId: cycle.cycle.id,
        level,
        rewardType: 'boss',
        rewardSettingId: cycle.bossReward?.id || null,
        rewardTitle: title,
        rewardDescription: desc,
      }, {
        onSuccess: (data) => {
          setPendingUnlock({ level, rewardTitle: title, rewardDescription: desc, rewardType: 'boss', unlockId: data.id });
          setShowLevelUp(true);
        },
      });
    } else {
      const activeStandard = allRewards.filter(r => r.type === 'standard' && r.is_active);
      const lastUnlock = cycle.unlocks.filter(u => u.reward_type === 'standard').slice(-1)[0];
      const selected = selectRandomReward(activeStandard, lastUnlock?.reward_setting_id || null);

      const title = selected?.title || 'No standard rewards configured';
      const desc = selected?.description || null;

      createUnlock.mutate({
        cycleId: cycle.cycle.id,
        level,
        rewardType: 'standard',
        rewardSettingId: selected?.id || null,
        rewardTitle: title,
        rewardDescription: desc,
      }, {
        onSuccess: (data) => {
          setPendingUnlock({ level, rewardTitle: title, rewardDescription: desc, rewardType: 'standard', unlockId: data.id });
          setShowLevelUp(true);
        },
      });
    }
  }, [cycle.pendingUnlockLevel, cycle.isLoading]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = parseISO(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const handleToday = () => setSelectedDate(format(new Date(), 'yyyy-MM-dd'));

  const handleHabitClick = (habitId: string) => {
    if (toggleHabit.isPending) return;
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    toggleHabit.mutate({ habitId, date: selectedDate });
  };

  const handleClaim = () => {
    if (pendingUnlock?.unlockId) {
      claimReward.mutate(pendingUnlock.unlockId);
    }
    setShowLevelUp(false);
    setPendingUnlock(null);
  };

  const handleClaimLater = () => {
    setShowLevelUp(false);
    setPendingUnlock(null);
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const dateObj = parseISO(selectedDate);
  const isLoading = habitsLoading || entriesLoading;


  if (isLoading) {
    return (
      <div className="min-h-screen p-4 pb-20">
        <div className="max-w-lg mx-auto flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading habits...</div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen pb-20 relative z-10">
      <div className="p-4 max-w-lg mx-auto">
        <DataMigration />
      </div>

      {/* Sticky header — refined glass strip */}
      <header className="sticky top-0 z-40 glass-card border-b border-white/[0.03]" style={{ borderRadius: 0 }}>
        <div className="flex items-center justify-between px-4 py-2.5 max-w-lg mx-auto">
          <div>
            <h1 className="text-[26px] font-extrabold text-foreground tracking-[-0.02em] leading-[1.05]">
              Transform Me
            </h1>
            <p className="text-[15px] font-semibold" style={{ color: 'rgba(210,220,255,0.62)' }}>
              {completedCount} of {total} complete{isWeekendDay ? ' · Weekend' : ''}
            </p>
          </div>
          <StreakRing size={52} habitCount={activeHabits.length} />
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto">
        {/* Date selector — compact glass card */}
        <div className="glass-card rounded-card py-3 px-4 flex items-center justify-between mt-2.5">
          <button
            onClick={() => handleDateChange('prev')}
            className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground active:scale-[0.96] transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-foreground">
              {format(dateObj, 'EEEE')}
            </div>
            <div className="text-[15px] font-medium mt-0.5" style={{ color: 'rgba(220,225,245,0.74)' }}>
              {format(dateObj, 'MMMM d, yyyy')}
            </div>
            {isToday && (
              <span className="today-pill inline-flex items-center rounded-pill text-[11px] font-semibold uppercase tracking-[0.06em] px-2.5 h-[22px] mt-1">
                Today
              </span>
            )}
            {!isToday && (
              <button
                onClick={handleToday}
                className="today-pill inline-flex items-center rounded-pill text-[11px] font-semibold uppercase tracking-[0.06em] px-2.5 h-[22px] mt-1 hover:bg-primary/20 transition-colors"
              >
                Go to today
              </button>
            )}
          </div>
          <button
            onClick={() => handleDateChange('next')}
            disabled={isToday}
            className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground active:scale-[0.96] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day Clear Status — hero card */}
        <div className="mt-3">
          <DayClearStatus
            completed={completedCount}
            total={total}
            hasCycle={cycle.hasCycle}
            level={cycle.level}
            cycleNumber={cycle.cycleNumber}
            levelProgress={cycle.levelProgress}
            pointsPerLevel={cycle.pointsPerLevel}
            bossRewardTitle={cycle.bossReward?.title}
          />
        </div>

        {/* Habits — 2-column grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {activeHabits.map(habit => {
            const entry = dayProgress.entries.find(e => e.habitId === habit.id);
            const completed = entry?.completed || false;
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={completed}
                onClick={() => handleHabitClick(habit.id)}
                disabled={toggleHabit.isPending}
              />
            );
          })}
        </div>
      </div>

      {/* Level-up Sheet */}
      <Sheet open={showLevelUp} onOpenChange={setShowLevelUp}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-center pb-4">
            <SheetTitle className="text-xl">
              {pendingUnlock?.rewardType === 'boss'
                ? 'Cycle Complete'
                : `Level ${pendingUnlock?.level} Unlocked`}
            </SheetTitle>
            <SheetDescription>
              {pendingUnlock?.rewardType === 'boss'
                ? 'You completed the full cycle.'
                : 'Reward unlocked'}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 text-center space-y-4">
            <div className={cn(
              'inline-flex items-center justify-center w-16 h-16 rounded-full',
              pendingUnlock?.rewardType === 'boss'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-primary/20 text-primary-foreground'
            )}>
              {pendingUnlock?.rewardType === 'boss'
                ? <Trophy size={32} />
                : <Gift size={32} />}
            </div>

            <div>
              <p className="text-lg font-semibold">{pendingUnlock?.rewardTitle}</p>
              {pendingUnlock?.rewardDescription && (
                <p className="text-sm text-muted-foreground mt-1">{pendingUnlock.rewardDescription}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pb-6">
            <Button variant="outline" className="flex-1" onClick={handleClaimLater}>
              Claim later
            </Button>
            <Button className="flex-1" onClick={handleClaim}>
              Mark as claimed
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
