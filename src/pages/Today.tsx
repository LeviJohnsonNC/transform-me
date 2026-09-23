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
import {
  useHabitEntries,
  useToggleHabit,
  useUserHabits,
  usePendingHabitToggles,
  toggleKey,
} from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { getLevelUpArt } from '@/lib/exerciseArt';
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
  const pendingToggles = usePendingHabitToggles();
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
  const dayProgress = getDayProgress(safeEntries, selectedDate, habits);
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

  // Gate each habit on its own in-flight toggle, not on a shared flag: one slow
  // save must not freeze the other habits.
  const isTogglePending = (habitId: string) =>
    pendingToggles.has(toggleKey(habitId, selectedDate));

  const handleHabitClick = (habitId: string) => {
    // Still guard the same habit against a double-tap, since the save reads the
    // current row before writing it.
    if (isTogglePending(habitId)) return;
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
          <div className="font-display text-[11px] tracking-[0.24em] text-faint">LOADING</div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen pb-20 relative z-10">
      <div className="p-4 max-w-lg mx-auto">
        <DataMigration />
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 border-b border-cyan/[0.12]">
        <div className="flex items-center justify-between px-[18px] py-3 max-w-lg mx-auto">
          <div>
            <h1 className="font-display font-bold text-[19px] tracking-[0.04em] leading-none text-foreground">
              TRANSFORM<span className="text-magenta">/</span>ME
            </h1>
            <p className="font-display text-[10px] tracking-[0.2em] text-faint mt-1.5 tabular">
              {format(dateObj, 'EEE d MMM').toUpperCase()} · {isWeekendDay ? 'WEEKEND' : 'WEEKDAY'}
            </p>
          </div>
          <StreakRing />
        </div>
      </header>

      <div className="px-[18px] max-w-lg mx-auto">
        {/* Date selector */}
        <div className="surface-sunken rounded-[3px] py-2.5 px-3 flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={() => handleDateChange('prev')}
            aria-label="Previous day"
            className="flex items-center justify-center w-11 h-11 text-faint hover:text-cyan active:scale-[0.94] transition-all duration-150"
          >
            <ChevronLeft size={19} />
          </button>
          <div className="text-center">
            <div className="font-display font-bold text-[22px] leading-none tracking-[0.02em] text-foreground">
              {format(dateObj, 'EEEE').toUpperCase()}
            </div>
            <div className="text-[13px] text-muted-foreground mt-1 tabular">
              {format(dateObj, 'd MMMM yyyy')}
            </div>
            {isToday ? (
              <span className="today-pill font-display inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 h-[21px] mt-1.5">
                Today
              </span>
            ) : (
              <button
                type="button"
                onClick={handleToday}
                className="today-pill font-display inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 h-[21px] mt-1.5 hover:bg-cyan/20 transition-colors"
              >
                Jump to today
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDateChange('next')}
            disabled={isToday}
            aria-label="Next day"
            className="flex items-center justify-center w-11 h-11 text-faint hover:text-cyan active:scale-[0.94] transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronRight size={19} />
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
        <div className="grid grid-cols-2 gap-[11px] mt-3.5">
          {activeHabits.map(habit => {
            // A completed row wins over an incomplete one. `find` alone takes
            // whichever duplicate happens to come back first, which showed a
            // done habit as undone whenever the stale row sorted earlier.
            const completed = dayProgress.entries.some(
              (e) => e.habitId === habit.id && e.completed,
            );
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={completed}
                onClick={() => handleHabitClick(habit.id)}
                disabled={isTogglePending(habit.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Level-up Sheet — the one place the art goes full bleed. */}
      <Sheet open={showLevelUp} onOpenChange={setShowLevelUp}>
        <SheetContent
          side="bottom"
          className="border-cyan/25 bg-background p-0 overflow-hidden rounded-none h-[86vh] max-h-[760px]"
        >
          <div className="relative h-full flex flex-col">
            {/* Full-bleed art, scrimmed so the panel below stays readable. */}
            <img
              src={getLevelUpArt(pendingUnlock?.level ?? 1)}
              alt=""
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/30 to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_18%,hsl(var(--background)/0.6)_78%)]" />

            <div className="relative flex-1 flex flex-col justify-between p-6">
              <SheetHeader className="text-center pt-2 space-y-0">
                <div className="font-display text-[10px] tracking-[0.34em] text-magenta-soft">
                  {pendingUnlock?.rewardType === 'boss' ? 'CYCLE COMPLETE' : 'LEVEL REACHED'}
                </div>
                <SheetTitle
                  className="font-display font-bold text-[84px] leading-[0.92] tracking-[-0.02em] tabular pt-2"
                  style={{
                    background: 'linear-gradient(180deg,#FFFFFF 8%,#2BE8FF 52%,#A855F7 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    filter: 'drop-shadow(0 0 30px rgba(43,232,255,0.5))',
                  }}
                >
                  {pendingUnlock?.rewardType === 'boss'
                    ? String(cycle.cycleNumber).padStart(2, '0')
                    : String(pendingUnlock?.level ?? 0).padStart(2, '0')}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {pendingUnlock?.rewardType === 'boss'
                    ? 'You completed the full cycle.'
                    : `Level ${pendingUnlock?.level} unlocked.`}
                </SheetDescription>
              </SheetHeader>

              <div className="surface rounded-[3px] edge-rule relative p-5">
                <div className="flex items-center gap-2">
                  {pendingUnlock?.rewardType === 'boss' ? (
                    <Trophy size={15} className="text-amber shrink-0" />
                  ) : (
                    <Gift size={15} className="text-amber shrink-0" />
                  )}
                  <span className="font-display text-[10px] tracking-[0.2em] text-amber">
                    REWARD UNLOCKED
                  </span>
                </div>
                <p className="font-display font-bold text-[23px] leading-[1.15] mt-2.5">
                  {pendingUnlock?.rewardTitle}
                </p>
                {pendingUnlock?.rewardDescription && (
                  <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                    {pendingUnlock.rewardDescription}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5">
                <Button
                  className="flex-1 rounded-[3px] font-display font-bold tracking-[0.12em] bg-cyan text-[#06121A] hover:bg-cyan-soft h-12"
                  onClick={handleClaim}
                >
                  CLAIM IT
                </Button>
                <Button
                  variant="outline"
                  className="w-[122px] rounded-[3px] font-display font-semibold tracking-[0.1em] border-foreground/25 bg-background/70 h-12"
                  onClick={handleClaimLater}
                >
                  LATER
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
