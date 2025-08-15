// Tasks store - manages tasks and projects with local storage

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, Project } from '@/core/domain/entities'
import { generateId } from '@/core/utils/id'

interface TasksStore {
  // State
  tasks: Task[]
  projects: Project[]
  activeTaskId: string | null

  // Task actions
  addTask: (data: CreateTaskData) => void
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskCompletion: (id: string) => void
  setActiveTask: (id: string | null) => void
  incrementTaskPomodoros: (id: string) => void

  // Project actions
  addProject: (name: string) => void
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Getters
  getActiveTask: () => Task | null
  getTasksByProject: (projectId?: string) => Task[]
  getActiveTasks: () => Task[]
  getCompletedTasks: () => Task[]
}

interface CreateTaskData {
  title: string
  notes?: string
  targetPomodoros: number
  projectId?: string
}

export const useTasksStore = create<TasksStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      projects: [],
      activeTaskId: null,

      // Task actions
      addTask: (data) => {
        const task: Task = {
          id: generateId(),
          title: data.title,
          notes: data.notes,
          targetPomodoros: data.targetPomodoros,
          projectId: data.projectId,
          completedPomodoros: 0,
          completed: false,
          source: 'local',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set(state => ({
          ...state,
          tasks: [...state.tasks, task]
        }))
      },

      updateTask: (id, data) => {
        set(state => ({
          ...state,
          tasks: state.tasks.map(task =>
            task.id === id
              ? { ...task, ...data, updatedAt: new Date() }
              : task
          )
        }))
      },

      deleteTask: (id) => {
        set(state => ({
          ...state,
          tasks: state.tasks.filter(task => task.id !== id),
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId
        }))
      },

      setActiveTask: (id) => {
        set({ activeTaskId: id })
      },

      toggleTaskCompletion: (id) => {
        set(state => ({
          ...state,
          tasks: state.tasks.map(task => 
            task.id === id 
              ? { ...task, completed: !task.completed, updatedAt: new Date() }
              : task
          )
        }))
      },

      incrementTaskPomodoros: (id) => {
        set(state => ({
          ...state,
          tasks: state.tasks.map(task => {
            if (task.id === id) {
              const newCount = task.completedPomodoros + 1
              return {
                ...task,
                completedPomodoros: newCount,
                completed: newCount >= task.targetPomodoros,
                updatedAt: new Date()
              }
            }
            return task
          })
        }))
      },

      // Project actions
      addProject: (name) => {
        const project: Project = {
          id: generateId(),
          name,
          source: 'local',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set(state => ({
          ...state,
          projects: [...state.projects, project]
        }))
      },

      updateProject: (id, data) => {
        set(state => ({
          ...state,
          projects: state.projects.map(project =>
            project.id === id
              ? { ...project, ...data, updatedAt: new Date() }
              : project
          )
        }))
      },

      deleteProject: (id) => {
        set(state => ({
          ...state,
          projects: state.projects.filter(project => project.id !== id),
          // Remove project association from tasks
          tasks: state.tasks.map(task =>
            task.projectId === id
              ? { ...task, projectId: undefined, updatedAt: new Date() }
              : task
          )
        }))
      },

      // Getters
      getActiveTask: () => {
        const state = get()
        return state.tasks.find(task => task.id === state.activeTaskId) || null
      },

      getTasksByProject: (projectId) => {
        const state = get()
        return state.tasks.filter(task => task.projectId === projectId)
      },

      getActiveTasks: () => {
        const state = get()
        return state.tasks.filter(task => !task.completed)
      },

      getCompletedTasks: () => {
        const state = get()
        return state.tasks.filter(task => task.completed)
      },
    }),
    {
      name: 'pomofocus-tasks',
      version: 1,
    }
  )
)
