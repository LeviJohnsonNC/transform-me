import React from 'react';
import { format, parseISO, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabitStore } from '@/stores/habitStore';
import { CORE_HABITS } from '@/types/habits';
import { cn } from '@/lib/utils';

export const History: React.FC = () => {
  const { getRecentDays, getDayProgress } = useHabitStore();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const [filterHabit, setFilterHabit] = React.useState<string | null>(null);

  const recentDays = getRecentDays(30);
  
  // Calendar heatmap data
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getHeatmapIntensity = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const progress = getDayProgress(dateStr);
    const intensity = progress.completedCount / CORE_HABITS.length;
    
    if (intensity === 0) return 'bg-muted/20';
    if (intensity <= 0.2) return 'bg-primary/20';
    if (intensity <= 0.4) return 'bg-primary/40';
    if (intensity <= 0.6) return 'bg-primary/60';
    if (intensity <= 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };

  const filteredDays = filterHabit 
    ? recentDays.filter(day => 
        day.entries.some(entry => entry.habitId === filterHabit && entry.completed)
      )
    : recentDays;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <div>
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-sm text-muted-foreground">
              Track your progress over time
            </p>
          </div>
          <Calendar className="text-primary-neon" size={24} />
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
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

        {/* Calendar Heatmap */}
        <div className="bg-card/30 rounded-card p-4">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Monthly Overview</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs text-center text-muted-foreground py-1">
                {day}
              </div>
            ))}
            {calendarDays.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const progress = getDayProgress(dateStr);
              const isToday = isSameDay(date, new Date());
              
              return (
                <div
                  key={dateStr}
                  className={cn(
                    'aspect-square rounded-md flex items-center justify-center text-xs transition-all duration-200',
                    getHeatmapIntensity(date),
                    'hover:scale-110 cursor-pointer',
                    isToday && 'ring-2 ring-primary-neon ring-offset-2 ring-offset-background'
                  )}
                  title={`${format(date, 'MMM d')}: ${progress.completedCount}/${CORE_HABITS.length} habits`}
                >
                  {format(date, 'd')}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted/20"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/20"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/60"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/80"></div>
              <div className="w-3 h-3 rounded-sm bg-primary"></div>
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={filterHabit === null ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterHabit(null)}
            className="whitespace-nowrap"
          >
            All Habits
          </Button>
          {CORE_HABITS.map(habit => (
            <Button
              key={habit.id}
              variant={filterHabit === habit.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterHabit(habit.id)}
              className="whitespace-nowrap"
            >
              {habit.name}
            </Button>
          ))}
        </div>

        {/* Recent Days List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recent Days</h3>
          {filteredDays.slice(0, 14).reverse().map(day => {
            const dayObj = parseISO(day.date);
            const isToday = isSameDay(dayObj, new Date());
            
            return (
              <div
                key={day.date}
                className={cn(
                  'bg-card/30 rounded-card p-4 transition-all duration-200',
                  'hover:bg-card/50 hover:shadow-card',
                  isToday && 'ring-1 ring-primary-neon/50'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">
                      {isToday ? 'Today' : format(dayObj, 'EEEE')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(dayObj, 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-neon">
                      {day.completedCount}/{day.totalCount}
                    </div>
                    <div className="text-xs text-muted-foreground">habits</div>
                  </div>
                </div>
                
                {/* Habit icons */}
                <div className="flex gap-2">
                  {CORE_HABITS.map(habit => {
                    const entry = day.entries.find(e => e.habitId === habit.id);
                    const completed = entry?.completed || false;
                    
                    return (
                      <div
                        key={habit.id}
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all duration-200',
                          completed 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-muted/30 text-muted-foreground'
                        )}
                        title={habit.name}
                      >
                        {completed ? '✓' : '○'}
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-muted/30 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(day.completedCount / day.totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};