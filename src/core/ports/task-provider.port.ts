// Port interfaces for external providers - defines contracts

import type { Project, Task } from '../domain/entities'

/**
 * Task provider port - abstracts task/project management systems
 * Implementations: local, Todoist, Microsoft To Do, Microsoft Planner
 */
export interface TaskProviderPort {
  readonly id: TaskProviderId
  readonly name: string
  readonly requiresAuth: boolean

  // Authentication
  connect(): Promise<TaskProviderResult<void>>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>

  // Projects
  listProjects(): Promise<TaskProviderResult<Project[]>>
  createProject(data: CreateProjectData): Promise<TaskProviderResult<Project>>
  updateProject(
    id: string,
    data: UpdateProjectData
  ): Promise<TaskProviderResult<Project>>
  deleteProject(id: string): Promise<TaskProviderResult<void>>

  // Tasks
  listTasks(projectId?: string): Promise<TaskProviderResult<Task[]>>
  createTask(data: CreateTaskData): Promise<TaskProviderResult<Task>>
  updateTask(id: string, data: UpdateTaskData): Promise<TaskProviderResult<Task>>
  deleteTask(id: string): Promise<TaskProviderResult<void>>

  // Synchronization
  sync(deltaToken?: string): Promise<TaskProviderResult<SyncResult>>
}

export type TaskProviderId = 'local' | 'todoist' | 'ms_todo' | 'planner'

export interface CreateProjectData {
  name: string
}

export interface UpdateProjectData {
  name?: string
}

export interface CreateTaskData {
  projectId?: string
  title: string
  notes?: string
  targetPomodoros: number
}

export interface UpdateTaskData {
  title?: string
  notes?: string
  targetPomodoros?: number
  completedPomodoros?: number
  completed?: boolean
}

export interface SyncResult {
  deltaToken?: string
  hasMoreChanges: boolean
  changedProjects: Project[]
  changedTasks: Task[]
  deletedProjectIds: string[]
  deletedTaskIds: string[]
}

// Result type with error handling
export type TaskProviderResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: TaskProviderError
}

export interface TaskProviderError {
  code: TaskProviderErrorCode
  message: string
  retryable: boolean
  retryAfterMs?: number
}

export type TaskProviderErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SYNC_CONFLICT'
  | 'UNKNOWN_ERROR'
