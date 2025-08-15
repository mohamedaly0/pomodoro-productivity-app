// IndexedDB storage implementation using Dexie

import Dexie, { Table } from 'dexie'
import type {
  Project,
  Task,
  Session,
  PomodoroCycle,
  IntegrationToken,
} from '../../domain/entities'
import type { AppSettings } from '../../domain/values'
import { DEFAULT_POMODORO_SETTINGS, DEFAULT_THEME_SETTINGS, DEFAULT_KEYBOARD_SHORTCUTS } from '../../domain/values'
import { generateId } from '../../utils/id'

// Database schema types
interface ProjectRecord extends Omit<Project, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: number // Store as timestamp
  updatedAt: number
}

interface TaskRecord extends Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: number
  updatedAt: number
}

interface SessionRecord extends Omit<Session, 'id' | 'startedAt' | 'endedAt'> {
  id: string
  startedAt: number
  endedAt?: number
}

interface CycleRecord extends Omit<PomodoroCycle, 'id' | 'startedAt' | 'endedAt'> {
  id: string
  startedAt: number
  endedAt?: number
}

interface SettingsRecord {
  id: string // Always 'default'
  settings: AppSettings
  updatedAt: number
}

interface TokenRecord {
  id: string // provider name
  provider: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  scopes: string[]
}

export class PomoFocusDB extends Dexie {
  projects!: Table<ProjectRecord, string>
  tasks!: Table<TaskRecord, string>
  sessions!: Table<SessionRecord, string>
  cycles!: Table<CycleRecord, string>
  settings!: Table<SettingsRecord, string>
  tokens!: Table<TokenRecord, string>

  constructor() {
    super('PomoFocusDB')
    
    this.version(1).stores({
      projects: '&id, name, source, externalId, createdAt, updatedAt',
      tasks: '&id, projectId, title, targetPomodoros, completedPomodoros, completed, source, externalId, createdAt, updatedAt',
      sessions: '&id, taskId, startedAt, endedAt, status',
      cycles: '&id, sessionId, kind, startedAt, endedAt, status',
      settings: '&id',
      tokens: '&id, provider, expiresAt'
    })

    // Add hooks for automatic timestamps
    this.projects.hook('creating', (_primKey, obj, _trans) => {
      const now = Date.now()
      obj.id = generateId()
      obj.createdAt = now
      obj.updatedAt = now
    })

    this.projects.hook('updating', (modifications, _primKey, _obj, _trans) => {
      ;(modifications as any).updatedAt = Date.now()
    })

    this.tasks.hook('creating', (_primKey, obj, _trans) => {
      const now = Date.now()
      obj.id = generateId()
      obj.createdAt = now
      obj.updatedAt = now
    })

    this.tasks.hook('updating', (modifications, _primKey, _obj, _trans) => {
      ;(modifications as any).updatedAt = Date.now()
    })

    this.sessions.hook('creating', (_primKey, obj, _trans) => {
      obj.id = generateId()
    })

    this.cycles.hook('creating', (_primKey, obj, _trans) => {
      obj.id = generateId()
    })
  }

  // Utility methods to convert between domain objects and records
  projectToRecord(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: project.name,
      source: project.source,
      externalId: project.externalId,
    }
  }

  recordToProject(record: ProjectRecord): Project {
    return {
      id: record.id,
      name: record.name,
      source: record.source,
      externalId: record.externalId,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    }
  }

  taskToRecord(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      projectId: task.projectId,
      title: task.title,
      notes: task.notes,
      targetPomodoros: task.targetPomodoros,
      completedPomodoros: task.completedPomodoros,
      completed: task.completed,
      source: task.source,
      externalId: task.externalId,
    }
  }

  recordToTask(record: TaskRecord): Task {
    return {
      id: record.id,
      projectId: record.projectId,
      title: record.title,
      notes: record.notes,
      targetPomodoros: record.targetPomodoros,
      completedPomodoros: record.completedPomodoros,
      completed: record.completed,
      source: record.source,
      externalId: record.externalId,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    }
  }

  sessionToRecord(session: Omit<Session, 'id'>): Omit<SessionRecord, 'id'> {
    return {
      taskId: session.taskId,
      startedAt: session.startedAt.getTime(),
      endedAt: session.endedAt?.getTime(),
      status: session.status,
      totalFocusMs: session.totalFocusMs,
      totalBreakMs: session.totalBreakMs,
      completedCycles: session.completedCycles,
    }
  }

  recordToSession(record: SessionRecord): Session {
    return {
      id: record.id,
      taskId: record.taskId,
      startedAt: new Date(record.startedAt),
      endedAt: record.endedAt ? new Date(record.endedAt) : undefined,
      status: record.status,
      totalFocusMs: record.totalFocusMs,
      totalBreakMs: record.totalBreakMs,
      completedCycles: record.completedCycles,
    }
  }

  cycleToRecord(cycle: Omit<PomodoroCycle, 'id'>): Omit<CycleRecord, 'id'> {
    return {
      sessionId: cycle.sessionId,
      kind: cycle.kind,
      lengthMs: cycle.lengthMs,
      startedAt: cycle.startedAt.getTime(),
      endedAt: cycle.endedAt?.getTime(),
      status: cycle.status,
    }
  }

  recordToCycle(record: CycleRecord): PomodoroCycle {
    return {
      id: record.id,
      sessionId: record.sessionId,
      kind: record.kind,
      lengthMs: record.lengthMs,
      startedAt: new Date(record.startedAt),
      endedAt: record.endedAt ? new Date(record.endedAt) : undefined,
      status: record.status,
    }
  }

  tokenToRecord(token: IntegrationToken): TokenRecord {
    return {
      id: token.provider,
      provider: token.provider,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt?.getTime(),
      scopes: token.scopes,
    }
  }

  recordToToken(record: TokenRecord): IntegrationToken {
    return {
      provider: record.provider,
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
      expiresAt: record.expiresAt ? new Date(record.expiresAt) : undefined,
      scopes: record.scopes,
    }
  }

  // Initialize default settings
  async initializeSettings(): Promise<void> {
    const exists = await this.settings.get('default')
    if (!exists) {
      const defaultSettings: AppSettings = {
        pomodoro: DEFAULT_POMODORO_SETTINGS,
        theme: DEFAULT_THEME_SETTINGS,
        shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
      }

      await this.settings.add({
        id: 'default',
        settings: defaultSettings,
        updatedAt: Date.now(),
      })
    }
  }
}
