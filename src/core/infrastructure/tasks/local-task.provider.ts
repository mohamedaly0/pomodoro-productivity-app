// Local task provider - handles tasks stored locally (no external API)

import type {
  TaskProviderPort,
  TaskProviderResult,
  CreateProjectData,
  CreateTaskData,
  UpdateProjectData,
  UpdateTaskData,
  SyncResult,
} from '../../ports/task-provider.port'
import type { Project, Task } from '../../domain/entities'
import type { StoragePort } from '../../ports/storage.port'

export class LocalTaskProvider implements TaskProviderPort {
  readonly id = 'local' as const
  readonly name = 'Local Storage'
  readonly requiresAuth = false

  constructor(private storage: StoragePort) {}

  async connect(): Promise<TaskProviderResult<void>> {
    return { success: true, data: undefined }
  }

  async disconnect(): Promise<void> {
    // No-op for local provider
  }

  async isConnected(): Promise<boolean> {
    return true // Always connected
  }

  async listProjects(): Promise<TaskProviderResult<Project[]>> {
    try {
      const projects = await this.storage.projects.findBySource('local')
      return { success: true, data: projects }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: false,
        },
      }
    }
  }

  async createProject(data: CreateProjectData): Promise<TaskProviderResult<Project>> {
    try {
      const project = await this.storage.projects.create({
        name: data.name,
        source: 'local',
      })
      return { success: true, data: project }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create project',
          retryable: false,
        },
      }
    }
  }

  async updateProject(
    id: string,
    data: UpdateProjectData
  ): Promise<TaskProviderResult<Project>> {
    try {
      const project = await this.storage.projects.update(id, data)
      return { success: true, data: project }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error instanceof Error ? error.message : 'Project not found',
          retryable: false,
        },
      }
    }
  }

  async deleteProject(id: string): Promise<TaskProviderResult<void>> {
    try {
      await this.storage.projects.delete(id)
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error instanceof Error ? error.message : 'Project not found',
          retryable: false,
        },
      }
    }
  }

  async listTasks(projectId?: string): Promise<TaskProviderResult<Task[]>> {
    try {
      const tasks = projectId
        ? await this.storage.tasks.findByProjectId(projectId)
        : await this.storage.tasks.findBySource('local')
      return { success: true, data: tasks }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: false,
        },
      }
    }
  }

  async createTask(data: CreateTaskData): Promise<TaskProviderResult<Task>> {
    try {
      const task = await this.storage.tasks.create({
        projectId: data.projectId,
        title: data.title,
        notes: data.notes,
        targetPomodoros: data.targetPomodoros,
        completedPomodoros: 0,
        completed: false,
        source: 'local',
      })
      return { success: true, data: task }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create task',
          retryable: false,
        },
      }
    }
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<TaskProviderResult<Task>> {
    try {
      const task = await this.storage.tasks.update(id, data)
      return { success: true, data: task }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error instanceof Error ? error.message : 'Task not found',
          retryable: false,
        },
      }
    }
  }

  async deleteTask(id: string): Promise<TaskProviderResult<void>> {
    try {
      await this.storage.tasks.delete(id)
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error instanceof Error ? error.message : 'Task not found',
          retryable: false,
        },
      }
    }
  }

  async sync(): Promise<TaskProviderResult<SyncResult>> {
    // Local provider doesn't need sync - return empty result
    return {
      success: true,
      data: {
        hasMoreChanges: false,
        changedProjects: [],
        changedTasks: [],
        deletedProjectIds: [],
        deletedTaskIds: [],
      },
    }
  }
}
