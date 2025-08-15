// Timer controls component - handles start/pause/reset with keyboard shortcuts and focus mode

import { useEffect } from 'react'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { useTimerStore, useFormattedTime } from './timer-store'
import { useTasksStore } from '@/features/tasks/tasks-store'

interface TimerControlsProps {
  compact?: boolean
}

export function TimerControls({ compact = false }: TimerControlsProps) {
  const {
    currentCycle,
    isRunning,
    isFocusMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipCycle,
    toggleFocusMode,
    getCurrentPhase,
    getProgress,
    completedFocusCycles,
    lastTick // This ensures re-renders for real-time updates
  } = useTimerStore()

  const formattedTime = useFormattedTime()
  const { getActiveTask, incrementTaskPomodoros } = useTasksStore()
  const activeTask = getActiveTask()

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (isRunning) {
            pauseTimer()
          } else if (currentCycle) {
            resumeTimer()
          } else {
            startTimer('focus')
          }
          break
        case 'KeyR':
          event.preventDefault()
          resetTimer()
          break
        case 'Escape':
          event.preventDefault()
          if (currentCycle) {
            skipCycle()
            // Exit focus mode when skipping
            if (isFocusMode) {
              toggleFocusMode()
            }
          }
          break
        case 'KeyF':
          event.preventDefault()
          toggleFocusMode()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, currentCycle, pauseTimer, resumeTimer, startTimer, resetTimer, skipCycle, toggleFocusMode])

  // Handle cycle completion for task tracking
  useEffect(() => {
    // Subscribe to timer store changes to detect focus cycle completion
    const unsubscribe = useTimerStore.subscribe(
      (state) => state.completedFocusCycles,
      (completedCycles, prevCompletedCycles) => {
        // If a focus cycle was completed and we have an active task
        if (completedCycles > prevCompletedCycles && activeTask) {
          incrementTaskPomodoros(activeTask.id)
        }
      }
    )

    return unsubscribe
  }, [activeTask, incrementTaskPomodoros])

  // Auto-enter focus mode when timer starts, exit on pause/skip
  useEffect(() => {
    if (isRunning && currentCycle && !isFocusMode) {
      toggleFocusMode()
    } else if (!isRunning && isFocusMode) {
      toggleFocusMode()
    }
  }, [isRunning, currentCycle, isFocusMode, toggleFocusMode])

  const handleStart = () => {
    if (isRunning) {
      pauseTimer()
    } else if (currentCycle) {
      resumeTimer()
    } else {
      startTimer('focus')
    }
  }

  const progress = getProgress()

  // Focus mode - simplified view
  if (isFocusMode && !compact) {
    return (
      <div className="fixed inset-0 bg-bg/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-8">
          {/* Large timer display */}
          <div className="mb-8">
            <div className="text-8xl font-bold font-mono text-text-base mb-4 tracking-wider">
              {formattedTime}
            </div>
            <div className="text-2xl text-text-subtle mb-2">
              {getCurrentPhase()}
            </div>
            {activeTask && (
              <div className="text-xl text-text-base font-medium max-w-lg mx-auto">
                {activeTask.title}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto mb-8">
            <div className="w-full bg-border rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  currentCycle?.kind === 'focus' ? 'bg-primary' : 'bg-success'
                }`}
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Minimal controls */}
          <div className="flex gap-6 justify-center mb-8">
            <button
              onClick={handleStart}
              className="btn btn-primary px-12 py-4 text-xl flex items-center gap-3 rounded-full"
              title={isRunning ? 'Pause (Space)' : 'Resume (Space)'}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} />}
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            
            <button
              onClick={() => {
                skipCycle()
                toggleFocusMode()
              }}
              className="btn btn-ghost px-8 py-4 text-lg flex items-center gap-3 rounded-full"
              title="Skip cycle (Esc)"
            >
              <SkipForward size={20} />
              Skip
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      {/* Progress circle */}
      <div className="relative w-64 h-64 mx-auto mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${progress * 283} 283`}
            className={currentCycle?.kind === 'focus' ? 'text-primary' : 'text-success'}
            style={{
              transition: 'stroke-dasharray 0.3s ease-in-out'
            }}
          />
        </svg>
        
        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold font-mono text-text-base mb-2">
            {formattedTime}
          </div>
          <div className="text-lg text-text-subtle">
            {getCurrentPhase()}
          </div>
        </div>
      </div>

      {/* Active task display */}
      {activeTask && (
        <div className="mb-6 p-4 bg-surface rounded-lg border border-primary/20">
          <div className="text-sm text-text-subtle mb-1">Current Task</div>
          <div className="font-medium text-text-base mb-2">{activeTask.title}</div>
          <div className="text-sm text-text-muted">
            {activeTask.completedPomodoros}/{activeTask.targetPomodoros} pomodoros completed
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={handleStart}
          className="btn btn-primary px-8 py-3 text-lg flex items-center gap-2"
          title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? 'Pause' : currentCycle ? 'Resume' : 'Start'}
        </button>
        
        <button
          onClick={resetTimer}
          className="btn btn-secondary px-6 py-3 flex items-center gap-2"
          title="Reset timer (R)"
          disabled={!currentCycle}
        >
          <RotateCcw size={20} />
          Reset
        </button>

        {currentCycle && (
          <button
            onClick={() => {
              skipCycle()
              if (isFocusMode) toggleFocusMode()
            }}
            className="btn btn-ghost px-6 py-3 flex items-center gap-2"
            title="Skip current cycle (Esc)"
          >
            <SkipForward size={20} />
            Skip
          </button>
        )}
      </div>

      {/* Session stats */}
      <div className="text-center space-y-1">
        <div className="text-sm text-text-subtle">
          Focus cycles completed today: <span className="font-semibold text-text-base">{completedFocusCycles}</span>
        </div>
      </div>
    </div>
  )
}
