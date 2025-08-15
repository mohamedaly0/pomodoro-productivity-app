// Task management functionality
class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all';
    this.currentSort = 'created_at';
    this.baseURL = window.location.origin;
    
    this.init();
  }

  async init() {
    // Wait for auth to be available
    while (!window.auth) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!window.auth.isAuthenticated()) {
      return;
    }

    this.setupEventListeners();
    await this.loadTasks();
  }

  setupEventListeners() {
    // Task form submission
    const taskForm = document.getElementById('newTaskForm');
    if (taskForm) {
      taskForm.addEventListener('submit', this.handleCreateTask.bind(this));
    }

    // Quick task form
    const quickTaskForm = document.getElementById('quickTaskForm');
    if (quickTaskForm) {
      quickTaskForm.addEventListener('submit', this.handleQuickCreateTask.bind(this));
    }

    // Filter buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.filter-btn')) {
        this.setFilter(e.target.dataset.filter);
      }
    });

    // Sort dropdown
    const sortSelect = document.getElementById('taskSort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.setSort(e.target.value);
      });
    }

    // Search input
    const searchInput = document.getElementById('taskSearch');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.setSearch(e.target.value);
        }, 300);
      });
    }

    // Task actions (event delegation)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.task-complete-btn')) {
        const taskId = e.target.closest('.task-item').dataset.taskId;
        this.toggleComplete(taskId);
      } else if (e.target.matches('.task-edit-btn')) {
        const taskId = e.target.closest('.task-item').dataset.taskId;
        this.editTask(taskId);
      } else if (e.target.matches('.task-delete-btn')) {
        const taskId = e.target.closest('.task-item').dataset.taskId;
        this.deleteTask(taskId);
      } else if (e.target.matches('.task-start-timer-btn')) {
        const taskId = e.target.closest('.task-item').dataset.taskId;
        this.startTimerForTask(taskId);
      }
    });

    // Task editing
    document.addEventListener('click', (e) => {
      if (e.target.matches('.save-task-btn')) {
        const taskId = e.target.closest('.task-item').dataset.taskId;
        this.saveTaskEdit(taskId);
      } else if (e.target.matches('.cancel-edit-btn')) {
        const taskId = e.target.closest('.task-item').dataset.taskId;
        this.cancelTaskEdit(taskId);
      }
    });

    // Drag and drop for reordering
    this.setupDragAndDrop();
  }

  async loadTasks() {
    try {
      const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/api/tasks`);
      const data = await response.json();
      
      if (response.ok) {
        this.tasks = data.tasks;
        this.renderTasks();
        this.updateTaskCounts();
        this.updateTaskSelects();
      } else {
        throw new Error(data.error || 'Failed to load tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.showNotification('Failed to load tasks', 'error');
    }
  }

  async handleCreateTask(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      due_date: formData.get('due_date') || null,
      labels: formData.get('labels') ? formData.get('labels').split(',').map(l => l.trim()) : []
    };

    await this.createTask(taskData);
    e.target.reset();
  }

  async handleQuickCreateTask(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const title = formData.get('title');
    
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      priority: 'medium'
    };

    await this.createTask(taskData);
    e.target.reset();
  }

  async createTask(taskData) {
    try {
      const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/api/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.tasks.unshift(data.task);
        this.renderTasks();
        this.updateTaskCounts();
        this.updateTaskSelects();
        this.showNotification('Task created successfully!', 'success');
      } else {
        throw new Error(data.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      this.showNotification('Failed to create task', 'error');
    }
  }

  async toggleComplete(taskId) {
    try {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      const endpoint = task.status === 'completed' 
        ? `/api/tasks/${taskId}`
        : `/api/tasks/${taskId}/complete`;
      
      const body = task.status === 'completed' 
        ? { status: 'pending' }
        : {};

      const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}${endpoint}`, {
        method: task.status === 'completed' ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const data = await response.json();
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        this.tasks[taskIndex] = data.task;
        
        this.renderTasks();
        this.updateTaskCounts();
        this.updateTaskSelects();
        
        const message = data.task.status === 'completed' 
          ? 'Task completed! 🎉' 
          : 'Task marked as pending';
        this.showNotification(message, 'success');
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      this.showNotification('Failed to update task', 'error');
    }
  }

  editTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;

    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Replace task content with edit form
    const editForm = this.createEditForm(task);
    taskElement.innerHTML = editForm;
    
    // Focus on title input
    const titleInput = taskElement.querySelector('.edit-title');
    if (titleInput) {
      titleInput.focus();
      titleInput.select();
    }
  }

  createEditForm(task) {
    return `
      <div class="task-edit-form">
        <div class="form-row">
          <input type="text" class="form-control edit-title" value="${this.escapeHtml(task.title)}" required>
        </div>
        <div class="form-row">
          <textarea class="form-control edit-description" placeholder="Description">${this.escapeHtml(task.description || '')}</textarea>
        </div>
        <div class="form-row">
          <select class="form-control edit-priority">
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
          </select>
          <input type="date" class="form-control edit-due-date" value="${task.due_date || ''}">
        </div>
        <div class="form-actions">
          <button class="btn btn-sm btn-success save-task-btn">Save</button>
          <button class="btn btn-sm btn-secondary cancel-edit-btn">Cancel</button>
        </div>
      </div>
    `;
  }

  async saveTaskEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;

    const title = taskElement.querySelector('.edit-title').value.trim();
    const description = taskElement.querySelector('.edit-description').value.trim();
    const priority = taskElement.querySelector('.edit-priority').value;
    const due_date = taskElement.querySelector('.edit-due-date').value || null;

    if (!title) {
      this.showNotification('Task title is required', 'error');
      return;
    }

    try {
      const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
          due_date
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        this.tasks[taskIndex] = data.task;
        
        this.renderTasks();
        this.showNotification('Task updated successfully!', 'success');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      this.showNotification('Failed to update task', 'error');
    }
  }

  cancelTaskEdit(taskId) {
    this.renderTasks(); // Just re-render to cancel edit
  }

  async deleteTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    try {
      const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.renderTasks();
        this.updateTaskCounts();
        this.updateTaskSelects();
        this.showNotification('Task deleted successfully', 'success');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      this.showNotification('Failed to delete task', 'error');
    }
  }

  startTimerForTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Set the task in timer's task select
    const taskSelect = document.getElementById('currentTaskSelect');
    if (taskSelect) {
      taskSelect.value = taskId;
    }

    // Start the timer
    if (window.pomodoroTimer) {
      window.pomodoroTimer.selectSessionType('work');
      window.pomodoroTimer.start();
    }

    this.showNotification(`Timer started for "${task.title}"`, 'success');
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    this.renderTasks();
  }

  setSort(sort) {
    this.currentSort = sort;
    this.renderTasks();
  }

  setSearch(query) {
    this.searchQuery = query;
    this.renderTasks();
  }

  getFilteredTasks() {
    let filtered = [...this.tasks];

    // Apply status filter
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(task => {
        switch (this.currentFilter) {
          case 'pending':
            return task.status !== 'completed';
          case 'completed':
            return task.status === 'completed';
          case 'today':
            const today = new Date().toISOString().split('T')[0];
            return task.due_date === today || task.created_at.split('T')[0] === today;
          case 'overdue':
            const now = new Date().toISOString().split('T')[0];
            return task.due_date && task.due_date < now && task.status !== 'completed';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.currentSort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  }

  renderTasks() {
    const container = document.getElementById('taskList');
    if (!container) return;

    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No tasks found</p>
          <small class="text-muted">
            ${this.currentFilter === 'all' ? 'Create your first task!' : 'Try changing the filter or search term.'}
          </small>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredTasks.map(task => this.renderTaskItem(task)).join('');
  }

  renderTaskItem(task) {
    const isCompleted = task.status === 'completed';
    const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && !isCompleted;
    
    return `
      <div class="task-item ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
        <div class="task-checkbox">
          <input type="checkbox" ${isCompleted ? 'checked' : ''} class="task-complete-btn">
        </div>
        <div class="task-content">
          <div class="task-header">
            <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
            <div class="task-meta">
              <span class="task-priority priority-${task.priority}">${task.priority}</span>
              ${task.due_date ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">${this.formatDate(task.due_date)}</span>` : ''}
            </div>
          </div>
          ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
          <div class="task-footer">
            <small class="text-muted">Created ${this.formatRelativeDate(task.created_at)}</small>
          </div>
        </div>
        <div class="task-actions">
          ${!isCompleted ? `<button class="btn btn-sm btn-primary task-start-timer-btn" title="Start Timer">🍅</button>` : ''}
          <button class="btn btn-sm btn-secondary task-edit-btn" title="Edit">✏️</button>
          <button class="btn btn-sm btn-danger task-delete-btn" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }

  updateTaskCounts() {
    const totalCount = this.tasks.length;
    const completedCount = this.tasks.filter(t => t.status === 'completed').length;
    const pendingCount = totalCount - completedCount;
    const todayCount = this.tasks.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.due_date === today || t.created_at.split('T')[0] === today;
    }).length;
    const overdueCount = this.tasks.filter(t => {
      const now = new Date().toISOString().split('T')[0];
      return t.due_date && t.due_date < now && t.status !== 'completed';
    }).length;

    // Update count badges
    this.updateCountBadge('all', totalCount);
    this.updateCountBadge('pending', pendingCount);
    this.updateCountBadge('completed', completedCount);
    this.updateCountBadge('today', todayCount);
    this.updateCountBadge('overdue', overdueCount);
  }

  updateCountBadge(filter, count) {
    const badge = document.querySelector(`[data-filter="${filter}"] .count-badge`);
    if (badge) {
      badge.textContent = count;
    }
  }

  updateTaskSelects() {
    const activeTasks = this.tasks.filter(t => t.status !== 'completed');
    
    // Update main task select in timer
    const taskSelect = document.getElementById('currentTaskSelect');
    if (taskSelect) {
      const currentValue = taskSelect.value;
      taskSelect.innerHTML = '<option value="">Select a task (optional)</option>' +
        activeTasks.map(task => 
          `<option value="${task.id}" ${task.id === currentValue ? 'selected' : ''}>
            ${this.escapeHtml(task.title)}
          </option>`
        ).join('');
    }

    // Update any other task selects
    document.querySelectorAll('.task-select').forEach(select => {
      if (select.id !== 'currentTaskSelect') {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select a task</option>' +
          activeTasks.map(task => 
            `<option value="${task.id}" ${task.id === currentValue ? 'selected' : ''}>
              ${this.escapeHtml(task.title)}
            </option>`
          ).join('');
      }
    });
  }

  setupDragAndDrop() {
    // Implement drag and drop for task reordering
    // This would be a more advanced feature
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  }

  formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info') {
    if (window.auth && window.auth.showNotification) {
      window.auth.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // Public API for other modules
  getTasks() {
    return this.tasks;
  }

  getTask(id) {
    return this.tasks.find(t => t.id === id);
  }

  refresh() {
    return this.loadTasks();
  }
}

// Initialize task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.taskManager = new TaskManager();
});
