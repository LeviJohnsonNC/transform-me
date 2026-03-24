import React from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HabitCard } from '@/components/HabitCard';
import { StreakRing } from '@/components/StreakRing';
import { DataMigration } from '@/components/DataMigration';
import { DayClearStatus } from '@/components/DayClearStatus';
import { Button } from '@/components/ui/button';
import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useToggleHabit, useUserHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { useDayTier } from '@/hooks/useGamification';

export const Today: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    getDayProgress
  } = useHabitStore();
  
  const { data: habits = [], isLoading: habitsLoading } = useUserHabits();
  const { data: entries = [], isLoading: entriesLoading } = useHabitEntries();
  const toggleHabit = useToggleHabit();
  const { completed: completedCount, total, tier } = useDayTier();
  
  const safeEntries = entries || [];
  const dayProgress = getDayProgress(safeEntries, selectedDate, habits.length);

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = parseISO(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleHabitClick = (habitId: string) => {
    if (toggleHabit.isPending) return;
    toggleHabit.mutate({ habitId, date: selectedDate });
  };
  
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const dateObj = parseISO(selectedDate);
  const isLoading = habitsLoading || entriesLoading;

  const tierShortLabel: Record<string, string> = {
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
    partial: 'Partial',
    missed: '',
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading habits...</div>
          </div>
        </div>
      </div>
    );
  }
  
  return <div className="min-h-screen bg-background pb-20">
      <div className="p-4 max-w-lg mx-auto">
        <DataMigration />
      </div>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Transform
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {habits.length}{tierShortLabel[tier] ? ` · ${tierShortLabel[tier]}` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <StreakRing size={52} habitCount={habits.length} />
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6 bg-card/30 rounded-card p-4">
          <Button variant="ghost" size="sm" onClick={() => handleDateChange('prev')} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={18} />
          </Button>
          
          <div className="text-center">
            <div className="text-lg font-semibold">
              {format(dateObj, 'EEEE')}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(dateObj, 'MMMM d, yyyy')}
            </div>
            {!isToday && <Button variant="ghost" size="sm" onClick={handleToday} className="text-xs text-primary-neon hover:text-primary mt-1">
                Go to today
              </Button>}
          </div>
          
          <Button variant="ghost" size="sm" onClick={() => handleDateChange('next')} className="text-muted-foreground hover:text-foreground" disabled={isToday}>
            <ChevronRight size={18} />
          </Button>
        </div>

        <div className="mb-6">
          <DayClearStatus completed={completedCount} total={habits.length} />
        </div>

        <div className="space-y-4">
          {habits.map(habit => {
          const entry = dayProgress.entries.find(e => e.habitId === habit.id);
          const completed = entry?.completed || false;
          return <HabitCard key={habit.id} habit={habit} completed={completed} onClick={() => handleHabitClick(habit.id)} disabled={toggleHabit.isPending} className={cn('transform transition-all duration-smooth', completed && 'shadow-card-hover')} />;
        })}
        </div>
      </div>
    </div>;
};
