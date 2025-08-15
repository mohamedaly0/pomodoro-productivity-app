// Task list component - displays and manages tasks with completion

import { useState } from 'react'
import { Plus, Edit, Trash2, Target, Check } from 'lucide-react'
import { useTasksStore } from './tasks-store'

export function TaskList() {
  const {
    projects,
    activeTaskId,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    setActiveTask,
    getActiveTasks,
    getCompletedTasks
  } = useTasksStore()

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    targetPomodoros: 4,
    projectId: ''
  })

  const activeTasks = getActiveTasks()
  const completedTasks = getCompletedTasks()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    if (editingTask) {
      updateTask(editingTask, {
        title: formData.title,
        notes: formData.notes,
        targetPomodoros: formData.targetPomodoros,
        projectId: formData.projectId || undefined
      })
    } else {
      addTask({
        title: formData.title,
        notes: formData.notes,
        targetPomodoros: formData.targetPomodoros,
        projectId: formData.projectId || undefined
      })
    }

    setFormData({ title: '', notes: '', targetPomodoros: 4, projectId: '' })
    setShowForm(false)
    setEditingTask(null)
  }

  const handleEdit = (task: any) => {
    setFormData({
      title: task.title,
      notes: task.notes || '',
      targetPomodoros: task.targetPomodoros,
      projectId: task.projectId || ''
    })
    setEditingTask(task.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setFormData({ title: '', notes: '', targetPomodoros: 4, projectId: '' })
    setShowForm(false)
    setEditingTask(null)
  }

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null
    const project = projects.find(p => p.id === projectId)
    return project?.name
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-text-base">Today's Tasks</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Task form */}
      {showForm && (
        <div className="card p-4 border-primary/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-base mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                placeholder="What needs to be done?"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-base mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input w-full h-20 resize-none"
                placeholder="Additional details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-base mb-1">
                  Target Pomodoros
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.targetPomodoros}
                  onChange={(e) => setFormData({ ...formData, targetPomodoros: parseInt(e.target.value) || 1 })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-base mb-1">
                  Project
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">No project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-3">
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-8 text-text-subtle">
            <Target size={48} className="mx-auto mb-4 opacity-50" />
            <p>No tasks yet. Add one to get started!</p>
          </div>
        ) : (
          <>
            {/* Active Tasks */}
            {activeTasks.map((task) => {
              const isActive = task.id === activeTaskId
              const projectName = getProjectName(task.projectId)
              const progress = task.completedPomodoros / task.targetPomodoros

              return (
                <div
                  key={task.id}
                  className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                    isActive ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setActiveTask(isActive ? null : task.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTaskCompletion(task.id)
                        }}
                        className="w-4 h-4 border-2 rounded flex items-center justify-center hover:bg-primary/10 transition-colors"
                        style={{
                          borderColor: task.completed ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          backgroundColor: task.completed ? 'var(--color-primary)' : 'transparent'
                        }}
                      >
                        {task.completed && (
                          <Check size={10} color="white" strokeWidth={3} />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium truncate ${
                            isActive ? 'text-primary' : 'text-text-base'
                          }`}>
                            {task.title}
                          </h3>
                          {task.notes && (
                            <p className="text-sm text-text-subtle mt-1 line-clamp-2">
                              {task.notes}
                            </p>
                          )}
                          {projectName && (
                            <div className="flex items-center gap-1 mt-2">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              <span className="text-xs text-text-subtle">
                                {projectName}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(task)
                            }}
                            className="p-1 text-text-muted hover:text-text-base transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteTask(task.id)
                            }}
                            className="p-1 text-text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-text-subtle">
                            {task.completedPomodoros}/{task.targetPomodoros} pomodoros
                          </span>
                          <span className="text-text-muted">
                            {Math.round(progress * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-surface rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Completed Tasks
                  </h3>
                </div>
                {completedTasks.map((task) => {
                  const projectName = getProjectName(task.projectId)
                  const progress = task.completedPomodoros / task.targetPomodoros

                  return (
                    <div
                      key={task.id}
                      className="card p-4 opacity-50 transition-all cursor-pointer"
                      onClick={() => setActiveTask(task.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleTaskCompletion(task.id)
                            }}
                            className="w-4 h-4 border-2 rounded flex items-center justify-center hover:bg-primary/10 transition-colors"
                            style={{
                              borderColor: 'var(--color-primary)',
                              backgroundColor: 'var(--color-primary)'
                            }}
                          >
                            <Check size={10} color="white" strokeWidth={3} />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate text-text-base line-through">
                                {task.title}
                              </h3>
                              {task.notes && (
                                <p className="text-sm text-text-subtle mt-1 line-clamp-2">
                                  {task.notes}
                                </p>
                              )}
                              {projectName && (
                                <div className="flex items-center gap-1 mt-2">
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                  <span className="text-xs text-text-subtle">
                                    {projectName}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-start gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteTask(task.id)
                                }}
                                className="p-1 text-text-muted hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-text-subtle">
                                {task.completedPomodoros}/{task.targetPomodoros} pomodoros
                              </span>
                              <span className="text-text-muted">
                                {Math.round(progress * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-surface rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progress * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
