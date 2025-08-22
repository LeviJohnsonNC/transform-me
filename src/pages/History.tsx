import React from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { Calendar, Dumbbell, Activity, Flame, Beef, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabitStore } from '@/stores/habitStore';
import { CORE_HABITS } from '@/types/habits';
import { cn } from '@/lib/utils';

export const History: React.FC = () => {
  const { getDayProgress } = useHabitStore();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  
  // Force cache refresh

  // Grid data for habit tracker
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getHabitCompletion = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const progress = getDayProgress(dateStr);
    return progress.entries.some(entry => entry.habitId === habitId && entry.completed);
  };

  const getHabitIcon = (habitId: string) => {
    switch (habitId) {
      case 'strength': return Dumbbell;
      case 'conditioning': return Activity;
      case 'calories': return Flame;
      case 'protein': return Beef;
      case 'supplements': return Pill;
      default: return Calendar;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-sm text-muted-foreground">
              Track your progress over time
            </p>
          </div>
          <Calendar className="text-primary-neon" size={24} />
        </div>
      </header>

      <div className="p-4 max-w-6xl mx-auto space-y-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSelectedMonth(subDays(monthStart, 1))}
            className="text-muted-foreground"
          >
            ← Previous
          </Button>
          <h2 className="text-lg font-semibold">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            onClick={() => setSelectedMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
            className="text-muted-foreground"
            disabled={isSameMonth(selectedMonth, new Date())}
          >
            Next →
          </Button>
        </div>

        {/* Habit Tracker Grid */}
        <div className="bg-card/30 rounded-card p-6 overflow-x-auto">
          <div className="min-w-fit">
            <div className="grid gap-0 border border-border/20 rounded-lg overflow-hidden" 
                 style={{ gridTemplateColumns: `200px repeat(${calendarDays.length}, 1fr)` }}>
              
              {/* Header row */}
              <div className="bg-muted/10 p-3 border-b border-border/20 text-sm font-medium text-muted-foreground">
                Habits
              </div>
              {calendarDays.map(date => {
                const isToday = isSameDay(date, new Date());
                const isFuture = date > new Date();
                
                return (
                  <div
                    key={format(date, 'yyyy-MM-dd')}
                    className={cn(
                      'bg-muted/10 p-3 border-b border-r border-border/20 text-center text-sm font-medium min-w-[40px]',
                      isToday && 'bg-primary/20 text-primary-neon',
                      isFuture && 'text-muted-foreground/50'
                    )}
                  >
                    {format(date, 'd')}
                  </div>
                );
              })}

              {/* Habit rows */}
              {CORE_HABITS.map((habit, habitIndex) => {
                const IconComponent = getHabitIcon(habit.id);
                
                return (
                  <React.Fragment key={habit.id}>
                    {/* Habit label */}
                    <div className={cn(
                      'p-3 border-r border-border/20 flex items-center gap-3 text-sm font-medium',
                      habitIndex < CORE_HABITS.length - 1 && 'border-b border-border/20',
                      habitIndex % 2 === 0 ? 'bg-background/50' : 'bg-muted/5'
                    )}>
                      <IconComponent size={16} className="text-primary-neon" />
                      <span className="truncate">{habit.name}</span>
                    </div>
                    
                    {/* Habit completion cells */}
                    {calendarDays.map(date => {
                      const isCompleted = getHabitCompletion(habit.id, date);
                      const isToday = isSameDay(date, new Date());
                      const isFuture = date > new Date();
                      
                      return (
                        <div
                          key={`${habit.id}-${format(date, 'yyyy-MM-dd')}`}
                          className={cn(
                            'p-3 border-r border-border/20 flex items-center justify-center min-w-[40px] transition-all duration-200',
                            habitIndex < CORE_HABITS.length - 1 && 'border-b border-border/20',
                            habitIndex % 2 === 0 ? 'bg-background/50' : 'bg-muted/5',
                            isToday && 'bg-primary/10',
                            !isFuture && 'hover:bg-muted/20 cursor-pointer'
                          )}
                          title={`${habit.name} - ${format(date, 'MMM d')}`}
                        >
                          {isFuture ? (
                            <div className="w-4 h-4" />
                          ) : isCompleted ? (
                            <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-success-foreground" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-success-foreground" />
              </div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
              <span>Not completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};