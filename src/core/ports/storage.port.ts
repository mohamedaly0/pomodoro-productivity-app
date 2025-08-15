// Storage repository ports - abstracts data persistence

import type {
  Project,
  Task,
  Session,
  PomodoroCycle,
  IntegrationToken,
} from '../domain/entities'
import type { AppSettings } from '../domain/values'

/**
 * Generic repository interface with common CRUD operations
 */
export interface Repository<T> {
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, updates: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
  clear(): Promise<void>
}

/**
 * Project repository with domain-specific queries
 */
export interface ProjectRepository extends Repository<Project> {
  findBySource(source: Project['source']): Promise<Project[]>
  findByExternalId(externalId: string): Promise<Project | null>
}

/**
 * Task repository with domain-specific queries
 */
export interface TaskRepository extends Repository<Task> {
  findByProjectId(projectId: string): Promise<Task[]>
  findBySource(source: Task['source']): Promise<Task[]>
  findByExternalId(externalId: string): Promise<Task | null>
  findActive(): Promise<Task[]> // Non-completed tasks
  findCompleted(): Promise<Task[]>
  search(query: string): Promise<Task[]>
  updateCompletedPomodoros(id: string, count: number): Promise<Task>
}

/**
 * Session repository with time-based queries
 */
export interface SessionRepository extends Repository<Session> {
  findByTaskId(taskId: string): Promise<Session[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<Session[]>
  findActive(): Promise<Session | null> // Currently running session
  getTodayStats(): Promise<{
    totalSessions: number
    totalFocusMs: number
    totalBreakMs: number
    completedCycles: number
  }>
}

/**
 * Cycle repository for detailed analytics
 */
export interface CycleRepository extends Repository<PomodoroCycle> {
  findBySessionId(sessionId: string): Promise<PomodoroCycle[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<PomodoroCycle[]>
  findByKind(kind: PomodoroCycle['kind']): Promise<PomodoroCycle[]>
  getActive(): Promise<PomodoroCycle | null>
}

/**
 * Settings repository for user preferences
 */
export interface SettingsRepository {
  get(): Promise<AppSettings>
  update(settings: Partial<AppSettings>): Promise<AppSettings>
  reset(): Promise<AppSettings>
}

/**
 * Integration token repository for OAuth tokens
 */
export interface TokenRepository {
  getToken(provider: string): Promise<IntegrationToken | null>
  saveToken(token: IntegrationToken): Promise<void>
  deleteToken(provider: string): Promise<void>
  getAllTokens(): Promise<IntegrationToken[]>
  cleanup(): Promise<void> // Remove expired tokens
}

/**
 * Storage transaction interface for atomic operations
 */
export interface StorageTransaction {
  projects: ProjectRepository
  tasks: TaskRepository
  sessions: SessionRepository
  cycles: CycleRepository
  settings: SettingsRepository
  tokens: TokenRepository

  commit(): Promise<void>
  rollback(): Promise<void>
}

/**
 * Main storage interface
 */
export interface StoragePort {
  // Direct repository access
  projects: ProjectRepository
  tasks: TaskRepository
  sessions: SessionRepository
  cycles: CycleRepository
  settings: SettingsRepository
  tokens: TokenRepository

  // Transaction support
  transaction<T>(fn: (tx: StorageTransaction) => Promise<T>): Promise<T>

  // Database management
  initialize(): Promise<void>
  close(): Promise<void>
  migrate(): Promise<void>
  export(): Promise<string> // JSON export
  import(data: string): Promise<void>
}
