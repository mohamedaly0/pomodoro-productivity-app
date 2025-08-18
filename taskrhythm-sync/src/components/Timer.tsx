import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Settings, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpotifyPlayer } from './SpotifyPlayer';

export type TimerMode = 'focus' | 'short-break' | 'long-break';

interface TimerProps {
  onSessionComplete: (mode: TimerMode, actualSeconds: number) => void;
  currentTask?: { id: string; title: string } | null;
}

interface TimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
};

export const Timer = ({ onSessionComplete, currentTask }: TimerProps) => {
  const [settings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalTime, setTotalTime] = useState(settings.focusMinutes * 60);

  const getModeDuration = useCallback((selectedMode: TimerMode) => {
    switch (selectedMode) {
      case 'focus':
        return settings.focusMinutes * 60;
      case 'short-break':
        return settings.shortBreakMinutes * 60;
      case 'long-break':
        return settings.longBreakMinutes * 60;
    }
  }, [settings]);

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    const duration = getModeDuration(newMode);
    setTimeLeft(duration);
    setTotalTime(duration);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = getModeDuration(mode);
    setTimeLeft(duration);
    setTotalTime(duration);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            const actualSeconds = totalTime;
            onSessionComplete(mode, actualSeconds);
            
            if (mode === 'focus') {
              const newCount = sessionsCompleted + 1;
              setSessionsCompleted(newCount);
              
              // Auto-switch to break
              if (newCount % settings.longBreakInterval === 0) {
                switchMode('long-break');
              } else {
                switchMode('short-break');
              }
            } else {
              // Auto-switch back to focus after break
              switchMode('focus');
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, onSessionComplete, sessionsCompleted, settings.longBreakInterval, totalTime]);

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const getModeStyles = () => {
    switch (mode) {
      case 'focus':
        return {
          gradient: 'bg-gradient-focus',
          shadow: 'shadow-focus',
          border: 'border-primary',
          badge: 'bg-primary text-primary-foreground'
        };
      case 'short-break':
        return {
          gradient: 'bg-gradient-break',
          shadow: 'shadow-break',
          border: 'border-secondary',
          badge: 'bg-secondary text-secondary-foreground'
        };
      case 'long-break':
        return {
          gradient: 'bg-gradient-long-break',
          shadow: 'shadow-break',
          border: 'border-accent-blue',
          badge: 'bg-accent-blue text-accent-blue-foreground'
        };
    }
  };

  const styles = getModeStyles();

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className={cn("p-8 transition-all duration-300", styles.shadow, styles.border)}>
        {/* Mode Selection */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'focus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchMode('focus')}
            className={mode === 'focus' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            Focus
          </Button>
          <Button
            variant={mode === 'short-break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchMode('short-break')}
            className={mode === 'short-break' ? 'bg-secondary hover:bg-secondary/90' : ''}
          >
            Short Break
          </Button>
          <Button
            variant={mode === 'long-break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchMode('long-break')}
            className={mode === 'long-break' ? 'bg-accent-blue hover:bg-accent-blue/90' : ''}
          >
            Long Break
          </Button>
        </div>

        {/* Current Task */}
        {currentTask && mode === 'focus' && (
          <div className="mb-6 text-center">
            <Badge variant="outline" className="text-sm">
              Working on: {currentTask.title}
            </Badge>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold mb-4 font-mono">
            {formatTime(timeLeft)}
          </div>
          <Progress 
            value={progress} 
            className="h-2 mb-4"
          />
          <Badge className={styles.badge}>
            {mode === 'focus' ? 'Focus Time' : mode === 'short-break' ? 'Short Break' : 'Long Break'}
          </Badge>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center mb-6">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              size="lg"
              className={cn("px-8", styles.gradient, "text-white border-0")}
            >
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="outline"
              size="lg"
              className="px-8"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          
          <Button
            onClick={handleStop}
            variant="outline"
            size="lg"
          >
            <Square className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* Session Counter */}
        <div className="text-center text-sm text-muted-foreground">
          <div>Sessions completed today: {sessionsCompleted}</div>
          <div className="mt-1">
            Next long break in {settings.longBreakInterval - (sessionsCompleted % settings.longBreakInterval)} sessions
          </div>
        </div>
      </Card>

      {/* Spotify Integration */}
      <div className="mt-6">
        <SpotifyPlayer 
          isTimerRunning={isRunning}
          timerMode={mode}
          onConnect={() => console.log('Connect to Spotify')}
        />
      </div>
    </div>
  );
};