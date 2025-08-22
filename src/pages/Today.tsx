import React from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HabitCard } from '@/components/HabitCard';
import { StreakRing } from '@/components/StreakRing';
import { DataMigration } from '@/components/DataMigration';
import { Button } from '@/components/ui/button';
import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useToggleHabit } from '@/hooks/useHabits';
import { CORE_HABITS } from '@/types/habits';
import { cn } from '@/lib/utils';
export const Today: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    getEntriesForDate,
    getDayProgress
  } = useHabitStore();
  
  const { data: entries = [], isLoading } = useHabitEntries();
  const toggleHabit = useToggleHabit();
  
  const dayProgress = getDayProgress(entries, selectedDate);
  const completedCount = dayProgress.completedCount;
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
    toggleHabit.mutate({ habitId, date: selectedDate });
  };
  
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const dateObj = parseISO(selectedDate);
  
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
      {/* Data Migration Notice */}
      <div className="p-4 max-w-lg mx-auto">
        <DataMigration />
      </div>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Transform
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {CORE_HABITS.length} habits
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Streak ring */}
            <StreakRing size={52} />
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

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Daily Progress</span>
            <span className="text-sm font-medium text-primary-neon">
              {completedCount}/{CORE_HABITS.length}
            </span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2">
            <div className="bg-gradient-primary h-2 rounded-full transition-all duration-1000 ease-out" style={{
            width: `${completedCount / CORE_HABITS.length * 100}%`
          }} />
          </div>
        </div>

        {/* Habit cards */}
        <div className="space-y-4">
          {CORE_HABITS.map(habit => {
          const entry = dayProgress.entries.find(e => e.habitId === habit.id);
          const completed = entry?.completed || false;
          return <HabitCard key={habit.id} habit={habit} completed={completed} onClick={() => handleHabitClick(habit.id)} className={cn('transform transition-all duration-smooth', completed && 'shadow-card-hover')} />;
        })}
        </div>

        {/* Motivational message */}
        {completedCount === CORE_HABITS.length && <div className="mt-8 p-6 bg-gradient-success rounded-card text-center">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Perfect Day!
            </h3>
            <p className="text-sm text-foreground/80">
              You've completed all your habits for today. Keep up the amazing work!
            </p>
          </div>}

        {/* Empty state for zero progress */}
        {completedCount === 0 && isToday}
      </div>
    </div>;
};