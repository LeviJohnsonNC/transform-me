import React from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries, useToggleHabit, useUserHabits } from '@/hooks/useHabits';
import { getHabitIcon } from '@/utils/habitIcons';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { getDayTier, type DayTier } from '@/hooks/useGamification';
import { TierDot } from '@/components/TierBadge';
import { getActiveHabitsForDate } from '@/utils/dayType';

export const History: React.FC = () => {
  const { getDayProgress } = useHabitStore();
  const { data: habits = [], isLoading: habitsLoading } = useUserHabits();
  const { data: entries = [], isLoading: entriesLoading } = useHabitEntries();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const isMobile = useIsMobile();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const toggleHabit = useToggleHabit();
  const [loadingCell, setLoadingCell] = React.useState<string | null>(null);
  
  const safeEntries = entries || [];

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  React.useEffect(() => {
    if (isMobile && scrollRef.current) {
      const todayIndex = calendarDays.findIndex(date => isSameDay(date, new Date()));
      if (todayIndex !== -1) {
        const cellWidth = 32;
        const scrollPosition = todayIndex * cellWidth - 100;
        scrollRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  }, [selectedMonth, isMobile, calendarDays]);

  const getHabitCompletion = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const progress = getDayProgress(safeEntries, dateStr, habits.length);
    return progress.entries.some(entry => entry.habitId === habitId && entry.completed);
  };

  const getDayTierForDate = (date: Date): DayTier => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const activeHabits = getActiveHabitsForDate(habits, dateStr);
    const total = activeHabits.length;
    const progress = getDayProgress(safeEntries, dateStr, total);
    return getDayTier(progress.completedCount, total);
  };

  const handleCellClick = async (habitId: string, date: Date) => {
    const isFuture = date > new Date();
    if (isFuture) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const cellKey = `${habitId}-${dateStr}`;
    
    setLoadingCell(cellKey);
    
    try {
      await toggleHabit.mutateAsync({ habitId, date: dateStr });
      toast({ title: "Updated", description: "Habit status updated successfully", duration: 2000 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update habit status", variant: "destructive", duration: 3000 });
    } finally {
      setLoadingCell(null);
    }
  };
  
  const isLoading = habitsLoading || entriesLoading;
  
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

  const habitLabelWidth = isMobile ? '120px' : '200px';
  const cellMinWidth = isMobile ? '32px' : '40px';
  const gridTemplateColumns = `${habitLabelWidth} repeat(${calendarDays.length}, minmax(${cellMinWidth}, 1fr))`;
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-sm text-muted-foreground">Track your progress over time</p>
          </div>
          <Calendar className="text-primary-neon" size={24} />
        </div>
      </header>

      <div className={cn("p-4 max-w-6xl mx-auto space-y-6", isMobile && "px-2")}>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedMonth(subDays(monthStart, 1))} className="text-muted-foreground" size={isMobile ? "sm" : "default"}>
            ← Previous
          </Button>
          <h2 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="ghost" onClick={() => setSelectedMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))} className="text-muted-foreground" disabled={isSameMonth(selectedMonth, new Date())} size={isMobile ? "sm" : "default"}>
            Next →
          </Button>
        </div>

        <div className="bg-card/30 rounded-card overflow-hidden">
          <div className="relative">
            <div 
              ref={scrollRef}
              className={cn(
                "overflow-x-auto",
                isMobile ? "pb-4" : "p-6",
                "[&::-webkit-scrollbar]:h-2",
                "[&::-webkit-scrollbar-track]:bg-muted/20",
                "[&::-webkit-scrollbar-track]:rounded-full", 
                "[&::-webkit-scrollbar-thumb]:bg-primary/60",
                "[&::-webkit-scrollbar-thumb]:rounded-full",
                "[&::-webkit-scrollbar-thumb:hover]:bg-primary/80",
                "overscroll-x-contain",
                isMobile && "[&::-webkit-scrollbar]:block"
              )}
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              <div className="min-w-fit">
                <div className="grid gap-0 border border-border/20 rounded-lg overflow-hidden" style={{ gridTemplateColumns }}>
                  
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

                  {/* Tier summary row — at top */}
                  <div className={cn(
                    'bg-muted/15 border-b border-r border-border/20 flex items-center text-xs font-semibold text-muted-foreground sticky left-0 z-10',
                    isMobile ? 'p-2' : 'p-3'
                  )}>
                    Day Tier
                  </div>
                  {calendarDays.map(date => {
                    const isFuture = date > new Date();
                    const isToday = isSameDay(date, new Date());
                    const tier = isFuture ? null : getDayTierForDate(date);
                    
                    return (
                      <div
                        key={`tier-${format(date, 'yyyy-MM-dd')}`}
                        className={cn(
                          'border-r border-b border-border/20 flex items-center justify-center',
                          isMobile ? 'p-1 min-w-[32px] min-h-[36px]' : 'p-3 min-w-[40px]',
                          'bg-muted/15',
                          isToday && 'bg-primary/10'
                        )}
                      >
                        {tier && <TierDot tier={tier} size="lg" />}
                      </div>
                    );
                  })}

                  {/* Habit rows */}
                  {habits.map((habit, habitIndex) => {
                    const IconComponent = getHabitIcon(habit.icon);
                    
                    return (
                      <React.Fragment key={habit.id}>
                        <div className={cn(
                          'border-r border-border/20 flex items-center text-sm font-medium sticky left-0 z-10',
                          isMobile ? 'p-2 gap-1' : 'p-3 gap-3',
                          'border-b border-border/20',
                          habitIndex % 2 === 0 ? 'bg-background/50' : 'bg-muted/5'
                        )}>
                          <IconComponent size={isMobile ? 14 : 16} className="text-primary-neon flex-shrink-0" />
                          <span className={cn("truncate", isMobile ? "text-xs" : "text-sm")}>
                            {isMobile ? habit.name.split(' ')[0] : habit.name}
                          </span>
                        </div>
                        
                        {calendarDays.map(date => {
                          const isCompleted = getHabitCompletion(habit.id, date);
                          const isToday = isSameDay(date, new Date());
                          const isFuture = date > new Date();
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const cellKey = `${habit.id}-${dateStr}`;
                          const isCellLoading = loadingCell === cellKey;
                          
                          return (
                            <div
                              key={cellKey}
                              onClick={() => handleCellClick(habit.id, date)}
                              className={cn(
                                'border-r border-border/20 flex items-center justify-center transition-all duration-200',
                                isMobile ? 'p-1 min-w-[32px] min-h-[32px]' : 'p-3 min-w-[40px]',
                                'border-b border-border/20',
                                habitIndex % 2 === 0 ? 'bg-background/50' : 'bg-muted/5',
                                isToday && 'bg-primary/10',
                                !isFuture && 'hover:bg-muted/20 cursor-pointer active:scale-95',
                                isFuture && 'cursor-not-allowed',
                                isCellLoading && 'opacity-50'
                              )}
                              role="button"
                              tabIndex={isFuture ? -1 : 0}
                              aria-label={`${habit.name} - ${format(date, 'MMM d')} - ${isCompleted ? 'Completed' : 'Not completed'}. Click to toggle.`}
                              aria-pressed={isCompleted}
                              aria-disabled={isFuture || isCellLoading}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && !isFuture && !isCellLoading) {
                                  e.preventDefault();
                                  handleCellClick(habit.id, date);
                                }
                              }}
                            >
                              {isFuture ? (
                                <div className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                              ) : isCompleted ? (
                                <div className={cn("rounded-full bg-success flex items-center justify-center", isMobile ? "w-3 h-3" : "w-4 h-4")}>
                                  <div className={cn("rounded-full bg-success-foreground", isMobile ? "w-1.5 h-1.5" : "w-2 h-2")} />
                                </div>
                              ) : (
                                <div className={cn("rounded-full border-2 border-muted-foreground/30", isMobile ? "w-3 h-3" : "w-4 h-4")} />
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              
              {isMobile && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-background via-transparent to-background pointer-events-none" />
              )}
            </div>
            
            {isMobile && (
              <div className="absolute top-2 right-2 text-xs text-muted-foreground/70 bg-background/80 px-2 py-1 rounded-md">
                Swipe to scroll →
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className={cn(
            "flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border/20",
            isMobile ? "px-2 py-3" : "px-6 py-4"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn("rounded-full bg-success flex items-center justify-center", isMobile ? "w-3 h-3" : "w-4 h-4")}>
                <div className={cn("rounded-full bg-success-foreground", isMobile ? "w-1.5 h-1.5" : "w-2 h-2")} />
              </div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("rounded-full border-2 border-muted-foreground/30", isMobile ? "w-3 h-3" : "w-4 h-4")} />
              <span>Not completed</span>
            </div>
            <div className="border-l border-border/30 h-3" />
            <div className="flex items-center gap-1.5">
              <TierDot tier="gold" />
              <span>Gold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TierDot tier="silver" />
              <span>Silver</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TierDot tier="bronze" />
              <span>Bronze</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TierDot tier="partial" />
              <span>Partial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};