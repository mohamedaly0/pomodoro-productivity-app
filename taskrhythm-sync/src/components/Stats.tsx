import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Target, TrendingUp, Flame } from 'lucide-react';
import { Task } from './TaskList';
import { TimerMode } from './Timer';

export interface PomoSession {
  id: string;
  mode: TimerMode;
  taskId?: string;
  plannedMinutes: number;
  actualSeconds: number;
  startedAt: Date;
  endedAt: Date;
  interrupted: boolean;
}

interface StatsProps {
  tasks: Task[];
  sessions: PomoSession[];
  dailyGoal: number;
}

export const Stats = ({ tasks, sessions, dailyGoal }: StatsProps) => {
  // Calculate today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySessions = sessions.filter(
    s => s.startedAt >= today && s.startedAt < tomorrow && s.mode === 'focus' && !s.interrupted
  );

  const todayPomos = todaySessions.length;
  const todayMinutes = Math.round(todaySessions.reduce((sum, s) => sum + s.actualSeconds, 0) / 60);

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySessions = sessions.filter(
        s => s.startedAt >= dayStart && s.startedAt < dayEnd && s.mode === 'focus' && !s.interrupted
      );

      if (daySessions.length === 0) {
        break;
      }

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  // Weekly stats
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  
  const weekSessions = sessions.filter(
    s => s.startedAt >= weekStart && s.mode === 'focus' && !s.interrupted
  );

  const weekPomos = weekSessions.length;
  const weekMinutes = Math.round(weekSessions.reduce((sum, s) => sum + s.actualSeconds, 0) / 60);

  // Task completion stats
  const completedTasks = tasks.filter(t => t.status === 'done');
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Goal progress
  const goalProgress = (todayPomos / dailyGoal) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Daily Overview */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Today's Progress</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily Goal</span>
              <Badge variant={goalProgress >= 100 ? "default" : "outline"} className={goalProgress >= 100 ? "bg-primary" : ""}>
                {todayPomos}/{dailyGoal}
              </Badge>
            </div>
            <Progress value={Math.min(goalProgress, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {goalProgress >= 100 ? "Goal achieved! 🎉" : `${Math.max(0, dailyGoal - todayPomos)} pomos to go`}
            </p>
          </div>

          {/* Time Focused */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Time Focused</span>
            </div>
            <div className="text-2xl font-bold">{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m</div>
            <p className="text-xs text-muted-foreground">{todayPomos} sessions completed</p>
          </div>

          {/* Current Streak */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Streak</span>
            </div>
            <div className="text-2xl font-bold">{currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 0 ? "Start your streak today!" : "Keep it going! 🔥"}
            </p>
          </div>
        </div>
      </Card>

      {/* Weekly Summary */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">This Week</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-3xl font-bold text-primary mb-1">{weekPomos}</div>
            <p className="text-sm text-muted-foreground">Pomodoro sessions</p>
          </div>
          
          <div>
            <div className="text-3xl font-bold text-secondary mb-1">
              {Math.floor(weekMinutes / 60)}h {weekMinutes % 60}m
            </div>
            <p className="text-sm text-muted-foreground">Total focus time</p>
          </div>
        </div>
      </Card>

      {/* Task Stats */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Task Performance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-sm text-muted-foreground">Tasks completed</p>
          </div>
          
          <div>
            <div className="text-2xl font-bold">{tasks.length - completedTasks.length}</div>
            <p className="text-sm text-muted-foreground">Tasks remaining</p>
          </div>
          
          <div>
            <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
            <p className="text-sm text-muted-foreground">Completion rate</p>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="mt-4">
            <Progress value={completionRate} className="h-2" />
          </div>
        )}
      </Card>

      {/* Recent Sessions */}
      {todaySessions.length > 0 && (
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">Today's Sessions</h3>
          <div className="space-y-2">
            {todaySessions.slice(-5).reverse().map((session) => {
              const task = tasks.find(t => t.id === session.taskId);
              return (
                <div key={session.id} className="flex items-center justify-between p-3 bg-accent rounded">
                  <div>
                    <div className="font-medium">
                      {task ? task.title : 'General Focus'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(session.actualSeconds / 60)} minutes
                    </div>
                  </div>
                  <Badge variant="outline">
                    {session.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};