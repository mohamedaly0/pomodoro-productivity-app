// Timer store - manages Pomodoro timer state with background resilience
// Uses monotonic time (performance.now) + checkpoints for accuracy

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { CycleKind, CycleStatus } from '@/core/domain/entities'
import type { PomodoroSettings } from '@/core/domain/values'
import { getCycleDuration, getNextCycleKind, DEFAULT_POMODORO_SETTINGS } from '@/core/domain/values'

interface TimerStore {
  // Current state
  currentCycle: CurrentCycle | null
  isRunning: boolean
  startedAt: number | null // Date.now() timestamp
  pausedAt: number | null
  totalPausedMs: number
  completedFocusCycles: number
  settings: PomodoroSettings
  
  // UI state
  isFocusMode: boolean

  // Actions
  startTimer: (kind?: CycleKind) => void
  pauseTimer: () => void
  resumeTimer: () => void
  resetTimer: () => void
  skipCycle: () => void
  updateSettings: (settings: Partial<PomodoroSettings>) => void
  toggleFocusMode: () => void

  // Computed getters
  getRemainingMs: () => number
  getElapsedMs: () => number
  getProgress: () => number
  getCurrentPhase: () => string
  getNextCycleKind: () => CycleKind
}

interface CurrentCycle {
  kind: CycleKind
  lengthMs: number
  status: CycleStatus
}

// Timer tick interval in milliseconds
const TICK_INTERVAL = 1000

export const useTimerStore = create<TimerStore>()(
  subscribeWithSelector((set, get) => {
    let tickInterval: number | null = null

    // Start ticking when timer starts
    const startTicking = () => {
      if (tickInterval) clearInterval(tickInterval)
      
      tickInterval = window.setInterval(() => {
        const state = get()
        if (!state.isRunning || !state.currentCycle) return

        // Force re-render with real-time updates
        set(state => ({ ...state }))

        const remainingMs = state.getRemainingMs()
        
        if (remainingMs <= 0) {
          // Cycle completed
          handleCycleComplete()
        }
      }, TICK_INTERVAL)
    }

    const stopTicking = () => {
      if (tickInterval) {
        clearInterval(tickInterval)
        tickInterval = null
      }
    }

    const handleCycleComplete = () => {
      const state = get()
      if (!state.currentCycle) return

      const wasFocus = state.currentCycle.kind === 'focus'
      
      set(state => ({
        ...state,
        isRunning: false,
        completedFocusCycles: wasFocus 
          ? state.completedFocusCycles + 1 
          : state.completedFocusCycles,
        currentCycle: state.currentCycle ? {
          ...state.currentCycle,
          status: 'completed'
        } : null
      }))

      stopTicking()

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const message = wasFocus 
          ? 'Focus session complete! Time for a break.' 
          : 'Break time over! Ready to focus?'
        
        new Notification('PomoFocus', { body: message })
      }

      // Auto-start next cycle if enabled
      const nextKind = get().getNextCycleKind()
      const shouldAutoStart = wasFocus 
        ? state.settings.autoStartBreaks 
        : state.settings.autoStartFocus

      if (shouldAutoStart) {
        setTimeout(() => {
          get().startTimer(nextKind)
        }, 1000) // Small delay for UX
      }
    }

    return {
      // Initial state
      currentCycle: null,
      isRunning: false,
      startedAt: null,
      pausedAt: null,
      totalPausedMs: 0,
      completedFocusCycles: 0,
      settings: DEFAULT_POMODORO_SETTINGS,
      isFocusMode: false,

      // Actions
      startTimer: (kind = 'focus') => {
        const state = get()
        const lengthMs = getCycleDuration(kind, state.settings)
        
        set({
          currentCycle: {
            kind,
            lengthMs,
            status: 'running'
          },
          isRunning: true,
          startedAt: Date.now(),
          pausedAt: null,
          totalPausedMs: 0
        })

        startTicking()

        // Request notification permission if needed
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission()
        }
      },

      pauseTimer: () => {
        set(state => ({
          ...state,
          isRunning: false,
          pausedAt: Date.now(),
          currentCycle: state.currentCycle ? {
            ...state.currentCycle,
            status: 'paused'
          } : null
        }))

        stopTicking()
      },

      resumeTimer: () => {
        const state = get()
        if (!state.pausedAt) return

        const pauseDuration = Date.now() - state.pausedAt
        
        set(state => ({
          ...state,
          isRunning: true,
          pausedAt: null,
          totalPausedMs: state.totalPausedMs + pauseDuration,
          currentCycle: state.currentCycle ? {
            ...state.currentCycle,
            status: 'running'
          } : null
        }))

        startTicking()
      },

      resetTimer: () => {
        stopTicking()
        
        set({
          currentCycle: null,
          isRunning: false,
          startedAt: null,
          pausedAt: null,
          totalPausedMs: 0,
          completedFocusCycles: 0
        })
      },

      skipCycle: () => {
        const state = get()
        if (!state.currentCycle) return

        const nextKind = state.getNextCycleKind()

        // Don't increment completed cycles when skipping
        set(state => ({
          ...state,
          currentCycle: state.currentCycle ? {
            ...state.currentCycle,
            status: 'cancelled'
          } : null
        }))

        // Start next cycle
        get().startTimer(nextKind)
      },

      updateSettings: (newSettings) => {
        set(state => ({
          ...state,
          settings: { ...state.settings, ...newSettings }
        }))
      },

      toggleFocusMode: () => {
        set(state => ({ ...state, isFocusMode: !state.isFocusMode }))
      },

      // Computed getters
      getRemainingMs: () => {
        const state = get()
        if (!state.currentCycle || !state.startedAt) return 0

        const elapsed = Date.now() - state.startedAt - state.totalPausedMs
        return Math.max(0, state.currentCycle.lengthMs - elapsed)
      },

      getElapsedMs: () => {
        const state = get()
        if (!state.startedAt) return 0

        return Date.now() - state.startedAt - state.totalPausedMs
      },

      getProgress: () => {
        const state = get()
        if (!state.currentCycle) return 0

        const elapsed = state.getElapsedMs()
        return Math.min(1, elapsed / state.currentCycle.lengthMs)
      },

      getCurrentPhase: () => {
        const state = get()
        if (!state.currentCycle) return 'Ready to focus'

        switch (state.currentCycle.kind) {
          case 'focus':
            return 'Focus Session'
          case 'shortBreak':
            return 'Short Break'
          case 'longBreak':
            return 'Long Break'
          default:
            return 'Unknown'
        }
      },

      getNextCycleKind: () => {
        const state = get()
        const currentKind = state.currentCycle?.kind

        if (!currentKind || currentKind !== 'focus') {
          return 'focus'
        }

        return getNextCycleKind(state.completedFocusCycles, state.settings.longBreakInterval)
      }
    }
  })
)

// Utility hook for formatted time display with real-time updates
export function useFormattedTime() {
  const getRemainingMs = useTimerStore(state => state.getRemainingMs)
  
  const remainingMs = getRemainingMs()
  const minutes = Math.floor(remainingMs / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
