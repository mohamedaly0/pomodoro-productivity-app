// Domain entities and value objects - pure business logic

/**
 * Project entity - represents a collection of tasks
 */
export interface Project {
  readonly id: string
  readonly name: string
  readonly source: ProjectSource
  readonly externalId?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type ProjectSource = 'local' | 'todoist' | 'ms_todo' | 'planner'

/**
 * Task entity - represents work to be done with target pomodoros
 */
export interface Task {
  readonly id: string
  readonly projectId?: string
  readonly title: string
  readonly notes?: string
  readonly targetPomodoros: number
  readonly completedPomodoros: number
  readonly completed: boolean
  readonly source: TaskSource
  readonly externalId?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type TaskSource = 'local' | 'todoist' | 'ms_todo' | 'planner'

/**
 * Session entity - represents a work session with multiple cycles
 */
export interface Session {
  readonly id: string
  readonly taskId?: string
  readonly startedAt: Date
  readonly endedAt?: Date
  readonly status: SessionStatus
  readonly totalFocusMs: number
  readonly totalBreakMs: number
  readonly completedCycles: number
}

export type SessionStatus = 'running' | 'paused' | 'completed' | 'cancelled'

/**
 * PomodoroCycle entity - represents a single focus/break period
 */
export interface PomodoroCycle {
  readonly id: string
  readonly sessionId: string
  readonly kind: CycleKind
  readonly lengthMs: number
  readonly startedAt: Date
  readonly endedAt?: Date
  readonly status: CycleStatus
}

export type CycleKind = 'focus' | 'shortBreak' | 'longBreak'
export type CycleStatus = 'running' | 'paused' | 'completed' | 'cancelled'

/**
 * Timer state - current running state
 */
export interface TimerState {
  readonly currentCycle?: PomodoroCycle
  readonly remainingMs: number
  readonly isRunning: boolean
  readonly lastTickAt: number // performance.now() timestamp
}

/**
 * Integration token for OAuth providers
 */
export interface IntegrationToken {
  readonly provider: string
  readonly accessToken: string
  readonly refreshToken?: string
  readonly expiresAt?: Date
  readonly scopes: string[]
}
