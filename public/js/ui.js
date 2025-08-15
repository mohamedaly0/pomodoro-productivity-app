// UI Manager - Handles all user interface interactions
class UIManager {
  constructor() {
    this.app = null;
    this.notifications = [];
  }

  init(appInstance) {
    this.app = appInstance;
    this.setupGlobalEventListeners();
  }

  setupGlobalEventListeners() {
    // Auth forms
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      await this.app.handleLogin(email, password);
    });
    
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      await this.app.handleRegister(name, email, password);
    });

    // Task form
    document.getElementById('addTaskForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleAddTask();
    });

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  handleKeyboardShortcuts(e) {
    // Space bar to start/pause timer
    if (e.code === 'Space' && !this.isInputFocused()) {
      e.preventDefault();
      if (this.app.isRunning) {
        this.app.pauseTimer();
      } else {
        this.app.startTimer();
      }
    }
    
    // Escape to close modals
    if (e.code === 'Escape') {
      this.closeAllModals();
    }
    
    // Number keys to switch modes
    if (e.code === 'Digit1') this.app.switchMode('work');
    if (e.code === 'Digit2') this.app.switchMode('short_break');
    if (e.code === 'Digit3') this.app.switchMode('long_break');
  }

  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  }

  showUserInterface() {
    const userInfo = document.getElementById('userInfo');
    const loginPrompt = document.getElementById('loginPrompt');
    
    if (userInfo) userInfo.style.display = 'flex';
    if (loginPrompt) loginPrompt.style.display = 'none';
    
    const user = auth.getCurrentUser();
    if (user) {
      const userName = document.getElementById('userName');
      if (userName) userName.textContent = user.name;
    }

    // Show app features
    this.showAppFeatures();
  }

  showLoginPrompt() {
    const userInfo = document.getElementById('userInfo');
    const loginPrompt = document.getElementById('loginPrompt');
    
    if (userInfo) userInfo.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'flex';

    // Hide app features
    this.hideAppFeatures();
  }

  showAppFeatures() {
    const features = [
      'musicControls',
      'taskSection',
      'statsSection',
      'integrationSettings'
    ];
    
    features.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'block';
    });
  }

  hideAppFeatures() {
    const features = [
      'musicControls',
      'taskSection', 
      'statsSection',
      'integrationSettings'
    ];
    
    features.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });
  }

  updateModeUI(mode, label) {
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Update timer label
    const timerLabel = document.getElementById('timerLabel');
    if (timerLabel) timerLabel.textContent = label;
    
    // Update body class for theming
    document.body.className = `mode-${mode}`;
    
    // Update page title
    document.title = `${label} - PomoFocus`;
  }

  updateTimerDisplay(timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
      timerDisplay.textContent = display;
    }
    
    // Update page title with time
    document.title = `${display} - PomoFocus`;
  }

  updateProgressRing(timeLeft, totalTime) {
    const circle = document.querySelector('.progress-ring-circle');
    if (!circle) return;
    
    const circumference = 2 * Math.PI * 110; // radius = 110
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    const offset = circumference - (progress / 100) * circumference;
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
  }

  updateControls(isRunning) {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (isRunning) {
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
    } else {
      if (startBtn) startBtn.style.display = 'inline-flex';
      if (pauseBtn) pauseBtn.style.display = 'none';
    }
  }

  showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }

  async handleAddTask() {
    const title = document.getElementById('taskTitle')?.value;
    const description = document.getElementById('taskDescription')?.value;
    const priority = document.getElementById('taskPriority')?.value;
    const estimatedPomodoros = document.getElementById('estimatedPomodoros')?.value;
    
    if (!title) {
      this.showNotification('Task title is required', 'warning');
      return;
    }
    
    try {
      await this.app.todoist.createTask({
        title,
        description,
        priority,
        estimated_pomodoros: parseInt(estimatedPomodoros) || 1
      });
      
      this.closeModal('addTaskModal');
      document.getElementById('addTaskForm')?.reset();
      this.showNotification('Task added successfully! 📝', 'success');
    } catch (error) {
      this.showNotification('Failed to add task. Please try again.', 'error');
    }
  }

  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type} notification-enter`;
    
    // Create notification content
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">
          ${this.getNotificationIcon(type)}
        </span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add to notifications container
    const container = document.getElementById('notifications');
    if (container) {
      container.appendChild(notification);
      
      // Trigger enter animation
      setTimeout(() => {
        notification.classList.remove('notification-enter');
      }, 10);
      
      // Auto remove
      setTimeout(() => {
        notification.classList.add('notification-exit');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, duration);
    }
    
    // Add to notifications array for management
    this.notifications.push({
      element: notification,
      type,
      message,
      timestamp: Date.now()
    });
    
    // Limit number of notifications
    if (this.notifications.length > 5) {
      const oldest = this.notifications.shift();
      oldest.element.remove();
    }
  }

  getNotificationIcon(type) {
    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>'
    };
    
    return icons[type] || icons.info;
  }

  playNotificationSound() {
    const audio = document.getElementById('notificationSound');
    if (audio) {
      audio.play().catch(error => {
        console.log('Could not play notification sound:', error);
      });
    }
  }

  showLoadingState(element, isLoading = true) {
    if (!element) return;
    
    if (isLoading) {
      element.classList.add('loading');
      element.disabled = true;
      const originalText = element.textContent;
      element.dataset.originalText = originalText;
      element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
      element.classList.remove('loading');
      element.disabled = false;
      if (element.dataset.originalText) {
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
      }
    }
  }

  updateTasksList(tasks) {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    if (tasks.length === 0) {
      tasksList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-tasks"></i>
          <p>No tasks yet. Add your first task to get started!</p>
          <button onclick="showAddTaskModal()" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add Task
          </button>
        </div>
      `;
      return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
      <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-content">
          <div class="task-header">
            <h4>${task.title}</h4>
            <div class="task-priority priority-${task.priority}">
              ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </div>
          </div>
          ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
          <div class="task-meta">
            <span class="task-pomodoros">
              <i class="fas fa-clock"></i> ${task.completed_pomodoros || 0}/${task.estimated_pomodoros} pomodoros
            </span>
            <span class="task-date">
              <i class="fas fa-calendar"></i> ${new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div class="task-actions">
          <button onclick="app.todoist.toggleTaskStatus('${task.id}')" class="btn btn-sm">
            <i class="fas fa-${task.status === 'completed' ? 'undo' : 'check'}"></i>
          </button>
          <button onclick="app.todoist.deleteTask('${task.id}')" class="btn btn-sm btn-danger">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  updateStats(stats) {
    const elements = {
      totalSessions: document.getElementById('totalSessions'),
      totalFocusTime: document.getElementById('totalFocusTime'),
      todayFocus: document.getElementById('todayFocus'),
      weekStreak: document.getElementById('weekStreak')
    };
    
    if (elements.totalSessions) elements.totalSessions.textContent = stats.totalSessions || 0;
    if (elements.totalFocusTime) elements.totalFocusTime.textContent = `${Math.floor((stats.totalMinutes || 0) / 60)}h`;
    if (elements.todayFocus) elements.todayFocus.textContent = `${stats.todayMinutes || 0}m`;
    if (elements.weekStreak) elements.weekStreak.textContent = `${stats.weekStreak || 0} days`;
  }

  showSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'flex';
  }

  showIntegrationStatus(service, isConnected, details = {}) {
    const statusElement = document.getElementById(`${service}Status`);
    if (!statusElement) return;
    
    if (isConnected) {
      statusElement.innerHTML = `
        <div class="integration-status connected">
          <i class="fas fa-check-circle"></i>
          <span>Connected</span>
          ${details.account ? `<small>${details.account}</small>` : ''}
        </div>
      `;
    } else {
      statusElement.innerHTML = `
        <div class="integration-status disconnected">
          <i class="fas fa-times-circle"></i>
          <span>Not Connected</span>
        </div>
      `;
    }
  }
}
