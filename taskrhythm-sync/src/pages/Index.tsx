import { useState } from 'react';
import { Timer, TimerMode } from '@/components/Timer';
import { TaskList, Task } from '@/components/TaskList';
import { Stats, PomoSession } from '@/components/Stats';
import { IntegrationSettings } from '@/components/IntegrationSettings';
import { WeeklyPlanner } from '@/components/WeeklyPlanner';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Clock, CheckSquare, BarChart3, Settings, Timer as TimerIcon, Calendar, Link } from 'lucide-react';

const Index = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('pomodoro-tasks', []);
  const [sessions, setSessions] = useLocalStorage<PomoSession[]>('pomodoro-sessions', []);
  const [activeTask, setActiveTask] = useLocalStorage<Task | null>('active-task', null);
  const [dailyGoal] = useLocalStorage<number>('daily-goal', 8);

  const handleTaskCreate = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleTaskUpdate = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
    
    // Update active task if it's the one being updated
    if (activeTask?.id === id) {
      setActiveTask(activeTask ? { ...activeTask, ...updates } : null);
    }
  };

  const handleTaskDelete = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    if (activeTask?.id === id) {
      setActiveTask(null);
    }
  };

  const handleTaskSelect = (task: Task) => {
    setActiveTask(task);
  };

  const handleSessionComplete = (mode: TimerMode, actualSeconds: number) => {
    const session: PomoSession = {
      id: Math.random().toString(36).substr(2, 9),
      mode,
      taskId: activeTask?.id,
      plannedMinutes: mode === 'focus' ? 25 : mode === 'short-break' ? 5 : 15,
      actualSeconds,
      startedAt: new Date(Date.now() - actualSeconds * 1000),
      endedAt: new Date(),
      interrupted: false,
    };
    
    setSessions([...sessions, session]);
    
    // Update task progress if it was a focus session
    if (mode === 'focus' && activeTask) {
      handleTaskUpdate(activeTask.id, {
        usedPomos: activeTask.usedPomos + 1
      });
    }
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(
        mode === 'focus' ? '🍅 Focus session complete!' : '☕ Break time is over!',
        {
          body: mode === 'focus' 
            ? 'Great work! Time for a break.' 
            : 'Ready to get back to work?',
          icon: '/favicon.ico'
        }
      );
    }
  };

  // Request notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Calculate today's completed pomos
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayPomos = sessions.filter(
    s => s.startedAt >= today && s.startedAt < tomorrow && s.mode === 'focus' && !s.interrupted
  ).length;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-focus rounded-lg flex items-center justify-center">
                <TimerIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Focus Flow</h1>
                <p className="text-sm text-muted-foreground">Pomodoro Timer & Task Manager</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Daily Progress */}
              <div className="text-right">
                <div className="text-lg font-bold">{todayPomos}/{dailyGoal}</div>
                <div className="text-xs text-muted-foreground">Today's Goal</div>
              </div>
              
              <ModeToggle />
              
              <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="timer" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
            <TabsTrigger value="timer" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timer
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="planner" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Planner
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Apps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-8">
            <Timer 
              onSessionComplete={handleSessionComplete}
              currentTask={activeTask}
            />
            
            {/* Active Task Card */}
            {activeTask && (
              <Card className="max-w-md mx-auto p-4 bg-primary/5 border-primary/20">
                <div className="text-center">
                  <Badge className="mb-2 bg-primary text-primary-foreground">Active Task</Badge>
                  <h3 className="font-medium">{activeTask.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Progress: {activeTask.usedPomos}/{activeTask.estPomos} pomos
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks">
            <TaskList
              tasks={tasks}
              onTaskCreate={handleTaskCreate}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTaskSelect={handleTaskSelect}
              activeTask={activeTask}
            />
          </TabsContent>

          <TabsContent value="planner">
            <WeeklyPlanner
              tasks={tasks}
              onScheduleUpdate={(slots) => console.log('Schedule updated:', slots)}
            />
          </TabsContent>

          <TabsContent value="stats">
            <Stats
              tasks={tasks}
              sessions={sessions}
              dailyGoal={dailyGoal}
            />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationSettings
              onConnect={(service) => {
                console.log(`Connect to ${service}`);
                // In real implementation, this would redirect to OAuth
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
