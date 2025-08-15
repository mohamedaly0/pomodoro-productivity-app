// Value objects and business rules for the Pomodoro domain

import { z } from 'zod'

/**
 * Pomodoro settings - configurable timer durations and behavior
 */
export interface PomodoroSettings {
  readonly focusDurationMs: number
  readonly shortBreakDurationMs: number
  readonly longBreakDurationMs: number
  readonly longBreakInterval: number // Every N cycles
  readonly autoStartBreaks: boolean
  readonly autoStartFocus: boolean
  readonly notificationsEnabled: boolean
  readonly soundEnabled: boolean
  readonly dailyGoal: number // Target pomodoros per day
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDurationMs: 25 * 60 * 1000, // 25 minutes
  shortBreakDurationMs: 5 * 60 * 1000, // 5 minutes
  longBreakDurationMs: 15 * 60 * 1000, // 15 minutes
  longBreakInterval: 4, // Long break after every 4 focus cycles
  autoStartBreaks: false,
  autoStartFocus: false,
  notificationsEnabled: true,
  soundEnabled: true,
  dailyGoal: 8,
}

/**
 * Theme settings
 */
export interface ThemeSettings {
  readonly mode: 'light' | 'dark' | 'system'
  readonly accentColor: string
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'system',
  accentColor: '#ef4444', // focus red
}

/**
 * Application settings combining all user preferences
 */
export interface AppSettings {
  readonly pomodoro: PomodoroSettings
  readonly theme: ThemeSettings
  readonly shortcuts: KeyboardShortcuts
}

export interface KeyboardShortcuts {
  readonly toggleTimer: string // Default: 'Space'
  readonly skipCycle: string // Default: 'Escape'
  readonly openTasks: string // Default: 'KeyT'
  readonly openSettings: string // Default: 'KeyS'
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcuts = {
  toggleTimer: 'Space',
  skipCycle: 'Escape',
  openTasks: 'KeyT',
  openSettings: 'KeyS',
}

// Validation schemas using Zod
export const PomodoroSettingsSchema = z.object({
  focusDurationMs: z.number().min(60000).max(3600000), // 1-60 minutes
  shortBreakDurationMs: z.number().min(60000).max(1800000), // 1-30 minutes
  longBreakDurationMs: z.number().min(60000).max(3600000), // 1-60 minutes
  longBreakInterval: z.number().min(2).max(10),
  autoStartBreaks: z.boolean(),
  autoStartFocus: z.boolean(),
  notificationsEnabled: z.boolean(),
  soundEnabled: z.boolean(),
  dailyGoal: z.number().min(1).max(20),
})

export const TaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  notes: z.string().max(2000).optional(),
  targetPomodoros: z.number().min(1).max(100),
  completedPomodoros: z.number().min(0),
  completed: z.boolean(),
  source: z.enum(['local', 'todoist', 'ms_todo', 'planner']),
  externalId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  source: z.enum(['local', 'todoist', 'ms_todo', 'planner']),
  externalId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Business rule: Determine next cycle type based on completed focus cycles
 */
export function getNextCycleKind(
  completedFocusCycles: number,
  longBreakInterval: number
): 'shortBreak' | 'longBreak' {
  return completedFocusCycles > 0 && completedFocusCycles % longBreakInterval === 0
    ? 'longBreak'
    : 'shortBreak'
}

/**
 * Business rule: Calculate cycle duration based on type and settings
 */
export function getCycleDuration(
  kind: 'focus' | 'shortBreak' | 'longBreak',
  settings: PomodoroSettings
): number {
  switch (kind) {
    case 'focus':
      return settings.focusDurationMs
    case 'shortBreak':
      return settings.shortBreakDurationMs
    case 'longBreak':
      return settings.longBreakDurationMs
    default:
      throw new Error(`Unknown cycle kind: ${kind}`)
  }
}

/**
 * Business rule: Check if task is completed based on target pomodoros
 */
export function isTaskCompleted(
  completedPomodoros: number,
  targetPomodoros: number
): boolean {
  return completedPomodoros >= targetPomodoros
}
