import React from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { Calendar, Dumbbell, Activity, Flame, Beef, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries } from '@/hooks/useHabits';
import { CORE_HABITS } from '@/types/habits';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const History: React.FC = () => {
  const { getDayProgress } = useHabitStore();
  const { data: entries = [], isLoading } = useHabitEntries();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const isMobile = useIsMobile();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  
  // Force cache refresh

  // Grid data for habit tracker
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Auto-scroll to current day on mobile
  React.useEffect(() => {
    if (isMobile && scrollRef.current) {
      const todayIndex = calendarDays.findIndex(date => isSameDay(date, new Date()));
      if (todayIndex !== -1) {
        const cellWidth = 32; // mobile cell width
        const scrollPosition = todayIndex * cellWidth - 100; // offset to show a bit before today
        scrollRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  }, [selectedMonth, isMobile, calendarDays]);

  const getHabitCompletion = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const progress = getDayProgress(entries, dateStr);
    return progress.entries.some(entry => entry.habitId === habitId && entry.completed);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading history...</div>
          </div>
        </div>
      </div>
    );
  }

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

  // Responsive grid template columns
  const habitLabelWidth = isMobile ? '120px' : '200px';
  const cellMinWidth = isMobile ? '32px' : '40px';
  const gridTemplateColumns = `${habitLabelWidth} repeat(${calendarDays.length}, minmax(${cellMinWidth}, 1fr))`;
  
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

      <div className={cn("p-4 max-w-6xl mx-auto space-y-6", isMobile && "px-2")}>
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSelectedMonth(subDays(monthStart, 1))}
            className="text-muted-foreground"
            size={isMobile ? "sm" : "default"}
          >
            ← Previous
          </Button>
          <h2 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            onClick={() => setSelectedMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
            className="text-muted-foreground"
            disabled={isSameMonth(selectedMonth, new Date())}
            size={isMobile ? "sm" : "default"}
          >
            Next →
          </Button>
        </div>

        {/* Habit Tracker Grid */}
        <div className="bg-card/30 rounded-card overflow-hidden">
          <div className="relative">
            <div 
              ref={scrollRef}
              className={cn(
                "overflow-x-auto",
                isMobile ? "pb-4" : "p-6",
                // Custom scrollbar styling
                "[&::-webkit-scrollbar]:h-2",
                "[&::-webkit-scrollbar-track]:bg-muted/20",
                "[&::-webkit-scrollbar-track]:rounded-full", 
                "[&::-webkit-scrollbar-thumb]:bg-primary/60",
                "[&::-webkit-scrollbar-thumb]:rounded-full",
                "[&::-webkit-scrollbar-thumb:hover]:bg-primary/80",
                // Touch scrolling
                "overscroll-x-contain",
                // Show scrollbar on mobile
                isMobile && "[&::-webkit-scrollbar]:block"
              )}
              style={{ 
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="min-w-fit">
                <div 
                  className="grid gap-0 border border-border/20 rounded-lg overflow-hidden" 
                  style={{ gridTemplateColumns }}
                >
                  
                  {/* Header row */}
                  <div className={cn(
                    "bg-muted/10 border-b border-border/20 text-sm font-medium text-muted-foreground sticky left-0 z-10",
                    isMobile ? "p-2" : "p-3"
                  )}>
                    Habits
                  </div>
                  {calendarDays.map(date => {
                    const isToday = isSameDay(date, new Date());
                    const isFuture = date > new Date();
                    
                    return (
                      <div
                        key={format(date, 'yyyy-MM-dd')}
                        className={cn(
                          'bg-muted/10 border-b border-r border-border/20 text-center text-sm font-medium',
                          isMobile ? 'p-1 min-w-[32px]' : 'p-3 min-w-[40px]',
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
                          'border-r border-border/20 flex items-center text-sm font-medium sticky left-0 z-10',
                          isMobile ? 'p-2 gap-1' : 'p-3 gap-3',
                          habitIndex < CORE_HABITS.length - 1 && 'border-b border-border/20',
                          habitIndex % 2 === 0 ? 'bg-background/50' : 'bg-muted/5'
                        )}>
                          <IconComponent size={isMobile ? 14 : 16} className="text-primary-neon flex-shrink-0" />
                          <span className={cn("truncate", isMobile ? "text-xs" : "text-sm")}>
                            {isMobile ? habit.name.split(' ')[0] : habit.name}
                          </span>
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
                                'border-r border-border/20 flex items-center justify-center transition-all duration-200',
                                isMobile ? 'p-1 min-w-[32px] min-h-[32px]' : 'p-3 min-w-[40px]',
                                habitIndex < CORE_HABITS.length - 1 && 'border-b border-border/20',
                                habitIndex % 2 === 0 ? 'bg-background/50' : 'bg-muted/5',
                                isToday && 'bg-primary/10',
                                !isFuture && 'hover:bg-muted/20 cursor-pointer active:scale-95'
                              )}
                              title={`${habit.name} - ${format(date, 'MMM d')}`}
                            >
                              {isFuture ? (
                                <div className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                              ) : isCompleted ? (
                                <div className={cn(
                                  "rounded-full bg-success flex items-center justify-center",
                                  isMobile ? "w-3 h-3" : "w-4 h-4"
                                )}>
                                  <div className={cn(
                                    "rounded-full bg-success-foreground",
                                    isMobile ? "w-1.5 h-1.5" : "w-2 h-2"
                                  )} />
                                </div>
                              ) : (
                                <div className={cn(
                                  "rounded-full border-2 border-muted-foreground/30",
                                  isMobile ? "w-3 h-3" : "w-4 h-4"
                                )} />
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              
              {/* Scroll indicator for mobile */}
              {isMobile && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-background via-transparent to-background pointer-events-none" />
              )}
            </div>
            
            {/* Scroll hint for mobile */}
            {isMobile && (
              <div className="absolute top-2 right-2 text-xs text-muted-foreground/70 bg-background/80 px-2 py-1 rounded-md">
                Swipe to scroll →
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className={cn(
            "flex items-center gap-6 text-xs text-muted-foreground border-t border-border/20",
            isMobile ? "px-2 py-3 gap-4" : "px-6 py-4"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "rounded-full bg-success flex items-center justify-center",
                isMobile ? "w-3 h-3" : "w-4 h-4"
              )}>
                <div className={cn(
                  "rounded-full bg-success-foreground",
                  isMobile ? "w-1.5 h-1.5" : "w-2 h-2"
                )} />
              </div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "rounded-full border-2 border-muted-foreground/30",
                isMobile ? "w-3 h-3" : "w-4 h-4"
              )} />
              <span>Not completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};