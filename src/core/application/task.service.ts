// Task management service - handles projects and tasks with provider abstraction

import type { Project, Task } from '../domain/entities'
import type { StoragePort } from '../ports/storage.port'
import type { TaskProviderPort, CreateProjectData, CreateTaskData, UpdateProjectData, UpdateTaskData } from '../ports/task-provider.port'

export interface TaskService {
  // Project management
  getProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  createProject(data: CreateProjectData): Promise<Project>
  updateProject(id: string, data: UpdateProjectData): Promise<Project>
  deleteProject(id: string): Promise<void>

  // Task management
  getTasks(projectId?: string): Promise<Task[]>
  getTask(id: string): Promise<Task | null>
  createTask(data: CreateTaskData): Promise<Task>
  updateTask(id: string, data: UpdateTaskData): Promise<Task>
  deleteTask(id: string): Promise<void>
  markTaskCompleted(id: string): Promise<Task>
  incrementTaskPomodoros(id: string): Promise<Task>

  // Search and filters
  searchTasks(query: string): Promise<Task[]>
  getActiveTasks(): Promise<Task[]>
  getCompletedTasks(): Promise<Task[]>

  // Provider management
  getConnectedProviders(): Promise<string[]>
  syncWithProvider(providerId: string): Promise<void>
  syncAllProviders(): Promise<void>
}

export class TaskServiceImpl implements TaskService {
  private providers = new Map<string, TaskProviderPort>()

  constructor(
    private storage: StoragePort,
    providers: TaskProviderPort[] = []
  ) {
    providers.forEach(provider => {
      this.providers.set(provider.id, provider)
    })
  }

  async getProjects(): Promise<Project[]> {
    return this.storage.projects.findAll()
  }

  async getProject(id: string): Promise<Project | null> {
    return this.storage.projects.findById(id)
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      source: 'local',
    }

    return this.storage.projects.create(project)
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    return this.storage.projects.update(id, data)
  }

  async deleteProject(id: string): Promise<void> {
    // Delete all tasks in this project first
    const tasks = await this.storage.tasks.findByProjectId(id)
    for (const task of tasks) {
      await this.storage.tasks.delete(task.id)
    }

    await this.storage.projects.delete(id)
  }

  async getTasks(projectId?: string): Promise<Task[]> {
    if (projectId) {
      return this.storage.tasks.findByProjectId(projectId)
    }
    return this.storage.tasks.findAll()
  }

  async getTask(id: string): Promise<Task | null> {
    return this.storage.tasks.findById(id)
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      projectId: data.projectId,
      title: data.title,
      notes: data.notes,
      targetPomodoros: data.targetPomodoros,
      completedPomodoros: 0,
      completed: false,
      source: 'local',
    }

    return this.storage.tasks.create(task)
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    // Check if marking as completed
    if (data.completed === true) {
      const task = await this.storage.tasks.findById(id)
      if (task && !task.completed) {
        // Mark as completed with timestamp
        return this.storage.tasks.update(id, {
          ...data,
          completed: true,
          updatedAt: new Date(),
        })
      }
    }

    return this.storage.tasks.update(id, data)
  }

  async deleteTask(id: string): Promise<void> {
    await this.storage.tasks.delete(id)
  }

  async markTaskCompleted(id: string): Promise<Task> {
    return this.updateTask(id, { completed: true })
  }

  async incrementTaskPomodoros(id: string): Promise<Task> {
    const task = await this.storage.tasks.findById(id)
    if (!task) throw new Error(`Task ${id} not found`)

    const newCount = task.completedPomodoros + 1
    const completed = newCount >= task.targetPomodoros

    return this.storage.tasks.update(id, {
      completedPomodoros: newCount,
      completed,
    })
  }

  async searchTasks(query: string): Promise<Task[]> {
    return this.storage.tasks.search(query)
  }

  async getActiveTasks(): Promise<Task[]> {
    return this.storage.tasks.findActive()
  }

  async getCompletedTasks(): Promise<Task[]> {
    return this.storage.tasks.findCompleted()
  }

  async getConnectedProviders(): Promise<string[]> {
    const connected: string[] = []
    
    for (const [id, provider] of this.providers) {
      if (await provider.isConnected()) {
        connected.push(id)
      }
    }

    return connected
  }

  async syncWithProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    if (!(await provider.isConnected())) {
      throw new Error(`Provider ${providerId} not connected`)
    }

    // Sync projects
    const projectsResult = await provider.listProjects()
    if (projectsResult.success) {
      for (const project of projectsResult.data) {
        // Check if project already exists
        const existing = await this.storage.projects.findByExternalId(project.externalId!)
        if (existing) {
          await this.storage.projects.update(existing.id, {
            name: project.name,
            updatedAt: new Date(),
          })
        } else {
          await this.storage.projects.create({
            name: project.name,
            source: project.source,
            externalId: project.externalId,
          })
        }
      }
    }

    // Sync tasks
    const tasksResult = await provider.listTasks()
    if (tasksResult.success) {
      for (const task of tasksResult.data) {
        // Check if task already exists
        const existing = await this.storage.tasks.findByExternalId(task.externalId!)
        if (existing) {
          await this.storage.tasks.update(existing.id, {
            title: task.title,
            notes: task.notes,
            targetPomodoros: task.targetPomodoros,
            completed: task.completed,
            updatedAt: new Date(),
          })
        } else {
          await this.storage.tasks.create({
            projectId: task.projectId,
            title: task.title,
            notes: task.notes,
            targetPomodoros: task.targetPomodoros,
            completedPomodoros: task.completedPomodoros,
            completed: task.completed,
            source: task.source,
            externalId: task.externalId,
          })
        }
      }
    }
  }

  async syncAllProviders(): Promise<void> {
    const connected = await this.getConnectedProviders()
    
    for (const providerId of connected) {
      try {
        await this.syncWithProvider(providerId)
      } catch (error) {
        console.error(`Failed to sync provider ${providerId}:`, error)
        // Continue with other providers
      }
    }
  }

  // Register a new provider
  registerProvider(provider: TaskProviderPort): void {
    this.providers.set(provider.id, provider)
  }

  // Get provider instance
  getProvider(id: string): TaskProviderPort | undefined {
    return this.providers.get(id)
  }
}
