import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Play, Edit2, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Task {
  id: string;
  title: string;
  note?: string;
  label?: string;
  priority: 1 | 2 | 3 | 4;
  estPomos: number;
  usedPomos: number;
  status: 'pending' | 'active' | 'done';
  createdAt: Date;
}

interface TaskListProps {
  tasks: Task[];
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
  onTaskSelect: (task: Task) => void;
  activeTask?: Task | null;
}

const PRIORITY_COLORS = {
  1: 'bg-gray-100 text-gray-800 border-gray-200',
  2: 'bg-blue-100 text-blue-800 border-blue-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-red-100 text-red-800 border-red-200',
};

const PRIORITY_LABELS = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
};

export const TaskList = ({
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskSelect,
  activeTask
}: TaskListProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3 | 4>(2);
  const [newTaskPomos, setNewTaskPomos] = useState(1);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    onTaskCreate({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      estPomos: newTaskPomos,
      usedPomos: 0,
      status: 'pending',
    });

    setNewTaskTitle('');
    setNewTaskPriority(2);
    setNewTaskPomos(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTask();
    }
  };

  const toggleTaskStatus = (task: Task) => {
    onTaskUpdate(task.id, {
      status: task.status === 'done' ? 'pending' : 'done'
    });
  };

  const filteredTasks = tasks.filter(task => 
    showCompleted || task.status !== 'done'
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Active task first
    if (a.id === activeTask?.id) return -1;
    if (b.id === activeTask?.id) return 1;
    
    // Then by status (pending first)
    if (a.status !== b.status) {
      if (a.status === 'pending') return -1;
      if (b.status === 'pending') return 1;
    }
    
    // Then by priority (higher first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    
    // Then by creation date (newer first)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Tasks</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked === true)}
            />
            <label htmlFor="show-completed">Show completed</label>
          </div>
        </div>

        {/* Quick Add Task */}
        <div className="space-y-3 mb-6 p-4 bg-accent rounded-lg">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleCreateTask} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Priority:</label>
              <Select value={newTaskPriority.toString()} onValueChange={(value) => setNewTaskPriority(Number(value) as 1 | 2 | 3 | 4)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                  <SelectItem value="4">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Pomos:</label>
              <Select value={newTaskPomos.toString()} onValueChange={(value) => setNewTaskPomos(Number(value))}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tasks yet. Add your first task to get started!</p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border transition-all",
                  task.id === activeTask?.id ? "bg-primary/10 border-primary shadow-focus" : "bg-card hover:bg-accent/50",
                  task.status === 'done' && "opacity-60"
                )}
              >
                <Checkbox
                  checked={task.status === 'done'}
                  onCheckedChange={() => toggleTaskStatus(task)}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "font-medium",
                      task.status === 'done' && "line-through"
                    )}>
                      {task.title}
                    </h3>
                    {task.id === activeTask?.id && (
                      <Badge variant="outline" className="text-xs bg-primary text-primary-foreground">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                    
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.usedPomos}/{task.estPomos} pomos
                    </span>
                    
                    {task.label && (
                      <Badge variant="outline">#{task.label}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  {task.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTaskSelect(task)}
                      className={cn(
                        task.id === activeTask?.id && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTaskDelete(task.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {tasks.length > 0 && (
          <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>{tasks.filter(t => t.status === 'done').length} completed</span>
              <span>{tasks.filter(t => t.status === 'pending').length} remaining</span>
              <span>{tasks.reduce((sum, t) => sum + t.usedPomos, 0)} total pomos</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};