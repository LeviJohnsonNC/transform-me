import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Gift, Trophy, Info } from 'lucide-react';
import { getActiveHabitsForDate, isWeekend } from '@/utils/dayType';
import { HabitCard } from '@/components/HabitCard';
import { StreakRing } from '@/components/StreakRing';
import { DataMigration } from '@/components/DataMigration';
import { DayClearStatus } from '@/components/DayClearStatus';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

  // Auto-init cycle
  useEffect(() => {
    if (!cycle.isLoading && !cycle.hasCycle && !initCycle.isPending) {
      initCycle.mutate();
    }
  }, [cycle.isLoading, cycle.hasCycle, initCycle.isPending]);

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

  const tierShortLabel: Record<string, string> = {
    gold: 'Gold', silver: 'Silver', bronze: 'Bronze', partial: 'Partial', missed: '',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-lg mx-auto flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading habits...</div>
        </div>
      </div>
    );
  }

  const progressPercent = cycle.pointsPerLevel > 0
    ? (cycle.levelProgress / cycle.pointsPerLevel) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 max-w-lg mx-auto">
        <DataMigration />
      </div>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Transform Me
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {total}{tierShortLabel[tier] ? ` · ${tierShortLabel[tier]}` : ''}{isWeekendDay ? ' · Weekend' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StreakRing size={52} habitCount={activeHabits.length} />
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {/* Date selector */}
        <div className="flex items-center justify-between mb-6 bg-card/30 rounded-card p-4">
          <Button variant="ghost" size="sm" onClick={() => handleDateChange('prev')} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={18} />
          </Button>
          <div className="text-center">
            <div className="text-lg font-semibold">{format(dateObj, 'EEEE')}</div>
            <div className="text-sm text-muted-foreground">{format(dateObj, 'MMMM d, yyyy')}</div>
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={handleToday} className="text-xs text-primary-neon hover:text-primary mt-1">
                Go to today
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleDateChange('next')} className="text-muted-foreground hover:text-foreground" disabled={isToday}>
            <ChevronRight size={18} />
          </Button>
        </div>

        {/* Day Clear Status */}
        <div className="mb-4">
          <DayClearStatus
            completed={completedCount}
            total={total}
            remainingHabits={activeHabits
              .filter(h => !dayProgress.entries.find(e => e.habitId === h.id && e.completed))
              .map(h => ({ name: h.name, icon: h.icon }))}
          />
        </div>

        {/* Cycle Progress Card */}
        {cycle.hasCycle && (
          <div className="mb-6 bg-card/30 rounded-card p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">
                  Level {cycle.level} · Cycle {cycle.cycleNumber}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" className="w-64 text-xs space-y-1.5 p-3">
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Gift size={12} className="shrink-0" /> Next: Random standard reward
                    </p>
                    {cycle.bossReward && (
                      <p className="flex items-center gap-1.5 text-amber-400/70">
                        <Trophy size={12} className="shrink-0" /> Lv 10: {cycle.bossReward.title}
                      </p>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {cycle.levelProgress} / {cycle.pointsPerLevel}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Habits */}
        <div className="space-y-4">
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
                className={cn('transform transition-all duration-smooth', completed && 'shadow-card-hover')}
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
