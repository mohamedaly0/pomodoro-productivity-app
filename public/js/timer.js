// Timer-specific functionality
class PomodoroTimer {
  constructor() {
    this.currentSession = null;
    this.timer = null;
    this.timeLeft = 0;
    this.isRunning = false;
    this.isPaused = false;
    
    this.sessionTypes = {
      work: { duration: 25 * 60, color: '#e74c3c', title: 'Work Session' },
      short_break: { duration: 5 * 60, color: '#27ae60', title: 'Short Break' },
      long_break: { duration: 15 * 60, color: '#3498db', title: 'Long Break' }
    };
    
    this.currentType = 'work';
    this.completedPomodoros = 0;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSettings();
    this.updateDisplay();
  }

  setupEventListeners() {
    // Timer controls
    document.addEventListener('click', (e) => {
      if (e.target.matches('#startTimerBtn')) {
        this.start();
      } else if (e.target.matches('#pauseTimerBtn')) {
        this.pause();
      } else if (e.target.matches('#resetTimerBtn')) {
        this.reset();
      } else if (e.target.matches('#skipTimerBtn')) {
        this.skip();
      }
    });

    // Session type selection
    document.addEventListener('click', (e) => {
      if (e.target.matches('.session-type-btn')) {
        this.selectSessionType(e.target.dataset.type);
      }
    });

    // Settings
    document.addEventListener('change', (e) => {
      if (e.target.matches('.timer-setting')) {
        this.updateSettings();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return; // Don't handle shortcuts when typing
      }
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.isRunning ? this.pause() : this.start();
          break;
        case 'r':
          e.preventDefault();
          this.reset();
          break;
        case 's':
          e.preventDefault();
          this.skip();
          break;
      }
    });

    // Page visibility change (pause timer when tab is not visible)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isRunning) {
        this.handleVisibilityChange();
      }
    });
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      // Update session durations
      Object.keys(this.sessionTypes).forEach(type => {
        if (settings[type]) {
          this.sessionTypes[type].duration = settings[type] * 60;
        }
      });
      
      // Update UI
      this.updateSettingsUI(settings);
    }
  }

  updateSettings() {
    const settings = {};
    
    // Get duration settings
    const workInput = document.getElementById('workDuration');
    const shortBreakInput = document.getElementById('shortBreakDuration');
    const longBreakInput = document.getElementById('longBreakDuration');
    
    if (workInput) {
      settings.work = parseInt(workInput.value) || 25;
      this.sessionTypes.work.duration = settings.work * 60;
    }
    
    if (shortBreakInput) {
      settings.short_break = parseInt(shortBreakInput.value) || 5;
      this.sessionTypes.short_break.duration = settings.short_break * 60;
    }
    
    if (longBreakInput) {
      settings.long_break = parseInt(longBreakInput.value) || 15;
      this.sessionTypes.long_break.duration = settings.long_break * 60;
    }
    
    // Get notification settings
    const soundEnabled = document.getElementById('soundEnabled');
    const notificationEnabled = document.getElementById('notificationEnabled');
    const autoStartBreaks = document.getElementById('autoStartBreaks');
    
    if (soundEnabled) settings.soundEnabled = soundEnabled.checked;
    if (notificationEnabled) settings.notificationEnabled = notificationEnabled.checked;
    if (autoStartBreaks) settings.autoStartBreaks = autoStartBreaks.checked;
    
    // Save settings
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    
    // Update current timer if not running
    if (!this.isRunning) {
      this.timeLeft = this.sessionTypes[this.currentType].duration;
      this.updateDisplay();
    }
    
    this.showNotification('Settings saved!', 'success');
  }

  updateSettingsUI(settings) {
    const workInput = document.getElementById('workDuration');
    const shortBreakInput = document.getElementById('shortBreakDuration');
    const longBreakInput = document.getElementById('longBreakDuration');
    const soundEnabled = document.getElementById('soundEnabled');
    const notificationEnabled = document.getElementById('notificationEnabled');
    const autoStartBreaks = document.getElementById('autoStartBreaks');
    
    if (workInput) workInput.value = settings.work || 25;
    if (shortBreakInput) shortBreakInput.value = settings.short_break || 5;
    if (longBreakInput) longBreakInput.value = settings.long_break || 15;
    if (soundEnabled) soundEnabled.checked = settings.soundEnabled !== false;
    if (notificationEnabled) notificationEnabled.checked = settings.notificationEnabled !== false;
    if (autoStartBreaks) autoStartBreaks.checked = settings.autoStartBreaks || false;
  }

  selectSessionType(type) {
    if (this.isRunning) {
      this.showNotification('Cannot change session type while timer is running', 'warning');
      return;
    }
    
    this.currentType = type;
    this.timeLeft = this.sessionTypes[type].duration;
    
    // Update UI
    document.querySelectorAll('.session-type-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    this.updateDisplay();
    this.updateBodyClass();
  }

  async start() {
    if (this.isPaused) {
      // Resume paused session
      this.isPaused = false;
      this.isRunning = true;
      this.startCountdown();
      this.updateControls();
      this.showNotification('Timer resumed', 'info');
      return;
    }
    
    // Start new session
    try {
      const taskSelect = document.getElementById('currentTaskSelect');
      const taskId = taskSelect ? taskSelect.value || null : null;
      
      if (window.auth) {
        const response = await window.auth.makeAuthenticatedRequest('/api/pomodoro/start', {
          method: 'POST',
          body: JSON.stringify({
            session_type: this.currentType,
            duration: Math.ceil(this.sessionTypes[this.currentType].duration / 60),
            task_id: taskId
          })
        });
        
        const data = await response.json();
        if (response.ok) {
          this.currentSession = data.session;
        }
      }
      
      this.isRunning = true;
      this.startCountdown();
      this.updateControls();
      this.updateBodyClass();
      this.showNotification(`${this.sessionTypes[this.currentType].title} started!`, 'success');
      
    } catch (error) {
      console.error('Error starting session:', error);
      // Start local timer even if API fails
      this.isRunning = true;
      this.startCountdown();
      this.updateControls();
    }
  }

  pause() {
    this.isRunning = false;
    this.isPaused = true;
    this.stopCountdown();
    this.updateControls();
    this.showNotification('Timer paused', 'warning');
  }

  async reset() {
    if (this.isRunning && !confirm('Are you sure you want to reset the timer?')) {
      return;
    }
    
    this.stop();
    this.timeLeft = this.sessionTypes[this.currentType].duration;
    this.updateDisplay();
    this.showNotification('Timer reset', 'info');
  }

  async skip() {
    if (!this.isRunning && !confirm('Skip to next session?')) {
      return;
    }
    
    if (this.isRunning) {
      await this.complete(false); // Mark as interrupted
    }
    
    this.nextSession();
    this.showNotification('Skipped to next session', 'info');
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.stopCountdown();
    this.updateControls();
    this.updateBodyClass();
    
    if (this.currentSession && window.auth) {
      // Mark session as interrupted
      window.auth.makeAuthenticatedRequest('/api/pomodoro/complete', {
        method: 'POST',
        body: JSON.stringify({
          completed: false,
          notes: 'Timer stopped manually'
        })
      }).catch(console.error);
    }
    
    this.currentSession = null;
  }

  startCountdown() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      
      if (this.timeLeft <= 0) {
        this.complete(true);
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async complete(successful = true) {
    this.stop();
    
    if (successful) {
      if (this.currentType === 'work') {
        this.completedPomodoros++;
        this.updatePomodoroCount();
      }
      
      this.showCompletionNotification();
      this.playCompletionSound();
      
      // Save to API
      if (this.currentSession && window.auth) {
        try {
          await window.auth.makeAuthenticatedRequest('/api/pomodoro/complete', {
            method: 'POST',
            body: JSON.stringify({
              completed: true
            })
          });
        } catch (error) {
          console.error('Error saving session:', error);
        }
      }
      
      // Auto-start next session if enabled
      const settings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
      if (settings.autoStartBreaks) {
        setTimeout(() => {
          this.nextSession();
          this.start();
        }, 3000);
      } else {
        this.nextSession();
      }
    }
    
    this.currentSession = null;
  }

  nextSession() {
    // Determine next session type
    if (this.currentType === 'work') {
      // After work, take a break
      if (this.completedPomodoros % 4 === 0) {
        this.selectSessionType('long_break');
      } else {
        this.selectSessionType('short_break');
      }
    } else {
      // After break, work
      this.selectSessionType('work');
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update timer display
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
      timerDisplay.textContent = display;
    }
    
    // Update document title
    if (this.isRunning) {
      document.title = `${display} - ${this.sessionTypes[this.currentType].title} - PomoFocus`;
    } else {
      document.title = 'PomoFocus - Productivity Timer';
    }
    
    // Update progress circle if exists
    this.updateProgressCircle();
  }

  updateProgressCircle() {
    const progressCircle = document.querySelector('.progress-circle');
    if (!progressCircle) return;
    
    const totalTime = this.sessionTypes[this.currentType].duration;
    const progress = (totalTime - this.timeLeft) / totalTime;
    const circumference = 2 * Math.PI * 45; // radius = 45
    const offset = circumference - (progress * circumference);
    
    const circle = progressCircle.querySelector('circle');
    if (circle) {
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = offset;
    }
  }

  updateControls() {
    const startBtn = document.getElementById('startTimerBtn');
    const pauseBtn = document.getElementById('pauseTimerBtn');
    const resetBtn = document.getElementById('resetTimerBtn');
    const skipBtn = document.getElementById('skipTimerBtn');
    
    if (this.isRunning) {
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (resetBtn) resetBtn.disabled = false;
      if (skipBtn) skipBtn.disabled = false;
    } else {
      if (startBtn) {
        startBtn.style.display = 'inline-flex';
        startBtn.textContent = this.isPaused ? '▶ Resume' : '▶ Start';
      }
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resetBtn) resetBtn.disabled = false;
      if (skipBtn) skipBtn.disabled = this.timeLeft === this.sessionTypes[this.currentType].duration;
    }
  }

  updateBodyClass() {
    document.body.className = document.body.className.replace(/timer-\w+/g, '');
    document.body.classList.add(`timer-${this.currentType}`);
    
    if (this.isRunning) {
      document.body.classList.add('timer-running');
    } else {
      document.body.classList.remove('timer-running');
    }
  }

  updatePomodoroCount() {
    const countDisplay = document.getElementById('pomodoroCount');
    if (countDisplay) {
      countDisplay.textContent = this.completedPomodoros;
    }
    
    // Save to localStorage
    localStorage.setItem('completedPomodoros', this.completedPomodoros.toString());
  }

  showCompletionNotification() {
    const type = this.currentType;
    const messages = {
      work: 'Great work! Time for a break 🎉',
      short_break: 'Break over! Ready to focus? 💪',
      long_break: 'Long break complete! Let\'s get back to work! 🚀'
    };
    
    this.showNotification(messages[type], 'success');
    
    // Show browser notification if permission granted
    this.showBrowserNotification(messages[type]);
  }

  showBrowserNotification(message) {
    const settings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
    if (settings.notificationEnabled === false) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PomoFocus', {
        body: message,
        icon: '/favicon.ico',
        tag: 'pomodoro-completion'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('PomoFocus', {
            body: message,
            icon: '/favicon.ico',
            tag: 'pomodoro-completion'
          });
        }
      });
    }
  }

  playCompletionSound() {
    const settings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
    if (settings.soundEnabled === false) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      // Play a second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 1);
      }, 200);
      
    } catch (error) {
      console.log('Could not play completion sound:', error);
    }
  }

  handleVisibilityChange() {
    // Optionally pause timer when tab becomes hidden
    // or show notification about background timer
    console.log('Tab visibility changed, timer still running in background');
  }

  showNotification(message, type = 'info') {
    if (window.auth && window.auth.showNotification) {
      window.auth.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // Initialize timer with saved pomodoro count
  loadPomodoroCount() {
    const saved = localStorage.getItem('completedPomodoros');
    if (saved) {
      this.completedPomodoros = parseInt(saved) || 0;
      this.updatePomodoroCount();
    }
  }

  // Reset daily stats (call this at midnight)
  resetDailyStats() {
    this.completedPomodoros = 0;
    localStorage.removeItem('completedPomodoros');
    this.updatePomodoroCount();
  }
}

// Initialize timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pomodoroTimer = new PomodoroTimer();
  window.pomodoroTimer.loadPomodoroCount();
});
