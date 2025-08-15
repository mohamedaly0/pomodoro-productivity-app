// Timer service - core business logic for accurate Pomodoro timing
// Uses monotonic time (performance.now) + checkpoints for background resilience

import type {
  PomodoroCycle,
  Session,
  TimerState,
  CycleKind,
} from '../domain/entities'
import type { PomodoroSettings } from '../domain/values'
import type { StoragePort } from '../ports/storage.port'
import { getCycleDuration, getNextCycleKind } from '../domain/values'

export interface TimerService {
  // State queries
  getCurrentState(): Promise<TimerState>
  getCurrentSession(): Promise<Session | null>
  getCurrentCycle(): Promise<PomodoroCycle | null>

  // Session management
  startSession(taskId?: string): Promise<Session>
  pauseSession(): Promise<Session>
  resumeSession(): Promise<Session>
  stopSession(): Promise<Session>

  // Cycle management
  startNextCycle(): Promise<PomodoroCycle>
  skipCurrentCycle(): Promise<PomodoroCycle>
  pauseCycle(): Promise<PomodoroCycle>
  resumeCycle(): Promise<PomodoroCycle>

  // Time calculations
  getRemainingTime(): Promise<number>
  getElapsedTime(): Promise<number>
  getProgress(): Promise<number> // 0-1

  // Event subscriptions
  onTick(callback: (state: TimerState) => void): () => void
  onCycleComplete(callback: (cycle: PomodoroCycle) => void): () => void
  onSessionComplete(callback: (session: Session) => void): () => void
}

export class TimerServiceImpl implements TimerService {
  private tickInterval?: number
  private tickCallbacks = new Set<(state: TimerState) => void>()
  private cycleCompleteCallbacks = new Set<(cycle: PomodoroCycle) => void>()
  private sessionCompleteCallbacks = new Set<(session: Session) => void>()

  constructor(
    private storage: StoragePort,
    private getSettings: () => Promise<PomodoroSettings>
  ) {
    this.startTicking()
  }

  async getCurrentState(): Promise<TimerState> {
    const cycle = await this.getCurrentCycle()
    if (!cycle) {
      return {
        currentCycle: undefined,
        remainingMs: 0,
        isRunning: false,
        lastTickAt: performance.now(),
      }
    }

    const remainingMs = await this.getRemainingTime()
    const isRunning = cycle.status === 'running'

    return {
      currentCycle: cycle,
      remainingMs,
      isRunning,
      lastTickAt: performance.now(),
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    return this.storage.sessions.findActive()
  }

  async getCurrentCycle(): Promise<PomodoroCycle | null> {
    return this.storage.cycles.getActive()
  }

  async startSession(taskId?: string): Promise<Session> {
    // End any existing session
    const existingSession = await this.getCurrentSession()
    if (existingSession) {
      await this.stopSession()
    }

    const session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'> = {
      taskId,
      startedAt: new Date(),
      status: 'running',
      totalFocusMs: 0,
      totalBreakMs: 0,
      completedCycles: 0,
    }

    const newSession = await this.storage.sessions.create(session)

    // Start first focus cycle
    await this.startCycle('focus', newSession.id)

    return newSession
  }

  async pauseSession(): Promise<Session> {
    const session = await this.getCurrentSession()
    if (!session) throw new Error('No active session')

    const cycle = await this.getCurrentCycle()
    if (cycle) {
      await this.pauseCycle()
    }

    return this.storage.sessions.update(session.id, { status: 'paused' })
  }

  async resumeSession(): Promise<Session> {
    const session = await this.getCurrentSession()
    if (!session) throw new Error('No active session')

    const cycle = await this.getCurrentCycle()
    if (cycle && cycle.status === 'paused') {
      await this.resumeCycle()
    }

    return this.storage.sessions.update(session.id, { status: 'running' })
  }

  async stopSession(): Promise<Session> {
    const session = await this.getCurrentSession()
    if (!session) throw new Error('No active session')

    const cycle = await this.getCurrentCycle()
    if (cycle && cycle.status === 'running') {
      await this.storage.cycles.update(cycle.id, {
        status: 'cancelled',
        endedAt: new Date(),
      })
    }

    const endedSession = await this.storage.sessions.update(session.id, {
      status: 'completed',
      endedAt: new Date(),
    })

    this.sessionCompleteCallbacks.forEach(cb => cb(endedSession))
    return endedSession
  }

  async startNextCycle(): Promise<PomodoroCycle> {
    const session = await this.getCurrentSession()
    if (!session) throw new Error('No active session')

    const currentCycle = await this.getCurrentCycle()
    if (currentCycle) {
      // Complete current cycle
      await this.completeCycle(currentCycle)
    }

    // Determine next cycle type
    const completedFocusCycles = await this.getCompletedFocusCycles(session.id)
    const settings = await this.getSettings()
    
    let nextKind: CycleKind
    if (!currentCycle || currentCycle.kind !== 'focus') {
      nextKind = 'focus'
    } else {
      nextKind = getNextCycleKind(completedFocusCycles, settings.longBreakInterval)
    }

    return this.startCycle(nextKind, session.id)
  }

  async skipCurrentCycle(): Promise<PomodoroCycle> {
    const cycle = await this.getCurrentCycle()
    if (!cycle) throw new Error('No active cycle')

    await this.storage.cycles.update(cycle.id, {
      status: 'cancelled',
      endedAt: new Date(),
    })

    return this.startNextCycle()
  }

  async pauseCycle(): Promise<PomodoroCycle> {
    const cycle = await this.getCurrentCycle()
    if (!cycle) throw new Error('No active cycle')

    return this.storage.cycles.update(cycle.id, { status: 'paused' })
  }

  async resumeCycle(): Promise<PomodoroCycle> {
    const cycle = await this.getCurrentCycle()
    if (!cycle) throw new Error('No active cycle')

    return this.storage.cycles.update(cycle.id, { status: 'running' })
  }

  async getRemainingTime(): Promise<number> {
    const cycle = await this.getCurrentCycle()
    if (!cycle || cycle.status !== 'running') return 0

    const elapsed = Date.now() - cycle.startedAt.getTime()
    return Math.max(0, cycle.lengthMs - elapsed)
  }

  async getElapsedTime(): Promise<number> {
    const cycle = await this.getCurrentCycle()
    if (!cycle) return 0

    return Date.now() - cycle.startedAt.getTime()
  }

  async getProgress(): Promise<number> {
    const cycle = await this.getCurrentCycle()
    if (!cycle) return 0

    const elapsed = await this.getElapsedTime()
    return Math.min(1, elapsed / cycle.lengthMs)
  }

  onTick(callback: (state: TimerState) => void): () => void {
    this.tickCallbacks.add(callback)
    return () => this.tickCallbacks.delete(callback)
  }

  onCycleComplete(callback: (cycle: PomodoroCycle) => void): () => void {
    this.cycleCompleteCallbacks.add(callback)
    return () => this.cycleCompleteCallbacks.delete(callback)
  }

  onSessionComplete(callback: (session: Session) => void): () => void {
    this.sessionCompleteCallbacks.add(callback)
    return () => this.sessionCompleteCallbacks.delete(callback)
  }

  private async startCycle(kind: CycleKind, sessionId: string): Promise<PomodoroCycle> {
    const settings = await this.getSettings()
    const lengthMs = getCycleDuration(kind, settings)

    const cycle: Omit<PomodoroCycle, 'id' | 'createdAt' | 'updatedAt'> = {
      sessionId,
      kind,
      lengthMs,
      startedAt: new Date(),
      status: 'running',
    }

    return this.storage.cycles.create(cycle)
  }

  private async completeCycle(cycle: PomodoroCycle): Promise<void> {
    const completedCycle = await this.storage.cycles.update(cycle.id, {
      status: 'completed',
      endedAt: new Date(),
    })

      // Update session stats
      const session = await this.storage.sessions.findById(cycle.sessionId)
      if (session) {
        const updates: Partial<Session> = {
          completedCycles: session.completedCycles + 1,
        }

        if (cycle.kind === 'focus') {
          ;(updates as any).totalFocusMs = session.totalFocusMs + cycle.lengthMs
          
          // Update task completed pomodoros
          if (session.taskId) {
            const task = await this.storage.tasks.findById(session.taskId)
            if (task) {
              await this.storage.tasks.updateCompletedPomodoros(
                task.id,
                task.completedPomodoros + 1
              )
            }
          }
        } else {
          ;(updates as any).totalBreakMs = session.totalBreakMs + cycle.lengthMs
        }      await this.storage.sessions.update(session.id, updates)
    }

    this.cycleCompleteCallbacks.forEach(cb => cb(completedCycle))
  }

  private async getCompletedFocusCycles(sessionId: string): Promise<number> {
    const cycles = await this.storage.cycles.findBySessionId(sessionId)
    return cycles.filter(c => c.kind === 'focus' && c.status === 'completed').length
  }

  private startTicking(): void {
    this.tickInterval = window.setInterval(async () => {
      const cycle = await this.getCurrentCycle()
      if (!cycle || cycle.status !== 'running') return

      const remainingMs = await this.getRemainingTime()
      
      if (remainingMs <= 0) {
        // Cycle completed
        await this.completeCycle(cycle)
        
        // Auto-start next cycle if enabled
        const settings = await this.getSettings()
        const shouldAutoStart = cycle.kind === 'focus' 
          ? settings.autoStartBreaks 
          : settings.autoStartFocus

        if (shouldAutoStart) {
          await this.startNextCycle()
        }
      }

      // Emit tick event
      const state = await this.getCurrentState()
      this.tickCallbacks.forEach(cb => cb(state))
    }, 1000) // Tick every second
  }

  destroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
    }
    this.tickCallbacks.clear()
    this.cycleCompleteCallbacks.clear()
    this.sessionCompleteCallbacks.clear()
  }
}
