import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Plus, RefreshCw } from 'lucide-react';
import { Task } from './TaskList';
import { cn } from '@/lib/utils';

interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  taskId?: string;
  type: 'focus' | 'short-break' | 'long-break';
  title?: string;
}

interface WeeklyPlannerProps {
  tasks: Task[];
  onScheduleUpdate?: (slots: TimeSlot[]) => void;
}

export const WeeklyPlanner = ({ tasks, onScheduleUpdate }: WeeklyPlannerProps) => {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday;
  });

  // Generate mock schedule for demo
  const scheduledSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    // Generate slots for next 5 weekdays
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const day = new Date(selectedWeek);
      day.setDate(selectedWeek.getDate() + dayOffset);
      
      // Schedule 2-3 focus blocks per day during work hours
      const workStart = 9; // 9 AM
      const workEnd = 17; // 5 PM
      
      let currentHour = workStart;
      let sessionCount = 0;
      
      while (currentHour < workEnd && sessionCount < 4) {
        const taskIndex = sessionCount % pendingTasks.length;
        const task = pendingTasks[taskIndex];
        
        if (!task) break;
        
        // Focus block
        const focusStart = new Date(day);
        focusStart.setHours(currentHour, 0, 0, 0);
        const focusEnd = new Date(focusStart);
        focusEnd.setMinutes(focusEnd.getMinutes() + 25);
        
        slots.push({
          id: `focus-${day.toDateString()}-${sessionCount}`,
          start: focusStart,
          end: focusEnd,
          taskId: task.id,
          type: 'focus',
          title: task.title
        });
        
        // Break
        const breakStart = new Date(focusEnd);
        const breakEnd = new Date(breakStart);
        const isLongBreak = (sessionCount + 1) % 4 === 0;
        breakEnd.setMinutes(breakEnd.getMinutes() + (isLongBreak ? 15 : 5));
        
        slots.push({
          id: `break-${day.toDateString()}-${sessionCount}`,
          start: breakStart,
          end: breakEnd,
          type: isLongBreak ? 'long-break' : 'short-break'
        });
        
        currentHour = breakEnd.getHours() + (breakEnd.getMinutes() > 30 ? 1 : 0);
        sessionCount++;
      }
    }
    
    return slots;
  }, [selectedWeek, tasks]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(selectedWeek);
      day.setDate(selectedWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [selectedWeek]);

  const getSlotColor = (type: TimeSlot['type']) => {
    switch (type) {
      case 'focus':
        return 'bg-primary/20 border-primary/40 text-primary-foreground';
      case 'short-break':
        return 'bg-secondary/20 border-secondary/40 text-secondary-foreground';
      case 'long-break':
        return 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue-foreground';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getTotalFocusTime = () => {
    const focusSlots = scheduledSlots.filter(s => s.type === 'focus');
    return focusSlots.length * 25; // 25 minutes per slot
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
  };

  const generateSchedule = () => {
    // In a real app, this would call your scheduling algorithm
    console.log('Regenerating schedule with updated tasks...');
    onScheduleUpdate?.(scheduledSlots);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Planner</h2>
          <p className="text-muted-foreground">
            Auto-scheduled focus blocks for your tasks
          </p>
        </div>
        <Button onClick={generateSchedule} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>

      {/* Week Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            ← Previous
          </Button>
          <div className="font-semibold">
            {selectedWeek.toLocaleDateString([], { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })} - {new Date(selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString([], {
              month: 'long', 
              day: 'numeric'
            })}
          </div>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            Next →
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{scheduledSlots.filter(s => s.type === 'focus').length}</div>
            <div className="text-sm text-muted-foreground">Focus Sessions</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-secondary">{Math.floor(getTotalFocusTime() / 60)}h {getTotalFocusTime() % 60}m</div>
            <div className="text-sm text-muted-foreground">Total Focus Time</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-accent-blue">{new Set(scheduledSlots.filter(s => s.taskId).map(s => s.taskId)).size}</div>
            <div className="text-sm text-muted-foreground">Tasks Covered</div>
          </div>
        </div>
      </Card>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day, dayIndex) => {
          const daySlots = scheduledSlots.filter(slot => 
            slot.start.toDateString() === day.toDateString()
          );
          
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          
          return (
            <Card key={day.toDateString()} className={cn(
              "p-4",
              isWeekend && "opacity-50"
            )}>
              <div className="text-center mb-4">
                <div className="font-semibold">
                  {day.toLocaleDateString([], { weekday: 'short' })}
                </div>
                <div className="text-2xl font-bold">
                  {day.getDate()}
                </div>
              </div>

              {isWeekend ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Weekend
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {daySlots.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No sessions scheduled
                      </div>
                    ) : (
                      daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={cn(
                            "p-2 rounded-lg border text-xs transition-all hover:shadow-sm",
                            getSlotColor(slot.type)
                          )}
                        >
                          <div className="font-medium mb-1">
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </div>
                          {slot.type === 'focus' && slot.title && (
                            <div className="truncate">{slot.title}</div>
                          )}
                          <Badge variant="outline" className="text-xs mt-1">
                            {slot.type === 'focus' ? '🍅 Focus' : 
                             slot.type === 'short-break' ? '☕ Break' : '🌟 Long Break'}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">Smart Scheduling</p>
            <p className="text-sm text-muted-foreground">
              The planner automatically finds free time slots and schedules your tasks based on priority, 
              estimates, and due dates. Connect your calendar for even smarter scheduling around meetings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};