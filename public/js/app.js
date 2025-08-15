// Simple PomoFocus App - MVP Version
class PomoFocusApp {
  constructor() {
    this.baseURL = window.location.origin;
    this.currentSession = null;
    this.timer = null;
    this.timeLeft = 0;
    this.isRunning = false;
    this.currentMode = 'work';
    
    // Timer durations in seconds
    this.sessionDurations = {
      work: 25 * 60,
      short_break: 5 * 60,
      long_break: 15 * 60
    };
    
    this.sessionLabels = {
      work: 'Focus Time',
      short_break: 'Short Break', 
      long_break: 'Long Break'
    };

    // Spotify integration
    this.spotify = {
      isConnected: false,
      accessToken: localStorage.getItem('spotify_access_token'),
      clientId: 'ea965b31452845d5868c6499bb71b50d',
      player: null,
      deviceId: null,
      currentPlaylist: null
    };
    
    this.init();
  }

  async init() {
    console.log('🍅 PomoFocus App Starting...');
    
    // Initialize Spotify if token exists
    if (this.spotify.accessToken) {
      this.spotify.isConnected = true;
      await this.initializeSpotify();
    }
    
    // Check authentication
    if (auth.isLoggedIn()) {
      this.showUserInterface();
      await this.loadUserData();
    } else {
      this.showLoginPrompt();
    }
    
    this.setupEventListeners();
    this.resetTimer();
    
    console.log('✅ App initialized successfully');
  }

  showUserInterface() {
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('loginPrompt').style.display = 'none';
    
    const user = auth.getCurrentUser();
    if (user) {
      document.getElementById('userName').textContent = user.name;
    }
    
    // Show music controls if Spotify is connected
    this.updateSpotifyUI();
  }
  
  showLoginPrompt() {
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('loginPrompt').style.display = 'flex';
  }

  async handleUserLogin() {
    this.showUserInterface();
    await this.loadUserData();
  }

  async loadUserData() {
    try {
      await this.loadSessionStats();
      // TODO: Load tasks when Todoist integration is ready
    } catch (error) {
      console.error('Error loading user data:', error);
      this.showNotification('Failed to load user data', 'error');
    }
  }

  async loadSessionStats() {
    try {
      const response = await fetch('/api/sessions/stats', {
        headers: { 'Authorization': `Bearer ${auth.getToken()}` }
      });
      
      if (response.ok) {
        const stats = await response.json();
        document.getElementById('sessionCount').textContent = stats.totalSessions || '0';
        document.getElementById('focusTime').textContent = `${Math.floor((stats.totalMinutes || 0) / 60)}h`;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  setupEventListeners() {
    // Timer mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });
    
    // Timer controls
    document.getElementById('startBtn')?.addEventListener('click', () => this.startTimer());
    document.getElementById('pauseBtn')?.addEventListener('click', () => this.pauseTimer());
    document.getElementById('resetBtn')?.addEventListener('click', () => this.resetTimer());
    
    // Spotify controls
    document.getElementById('connectSpotifyBtn')?.addEventListener('click', () => this.connectSpotify());
    document.getElementById('disconnectSpotifyBtn')?.addEventListener('click', () => this.disconnectSpotify());
    document.getElementById('toggleMusicBtn')?.addEventListener('click', () => this.toggleMusic());
    
    // Auth forms
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
    
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.resetTimer();
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
    
    document.getElementById('timerLabel').textContent = this.sessionLabels[mode];
    
    // Update background color based on mode
    document.body.className = `mode-${mode}`;
  }

  resetTimer() {
    this.isRunning = false;
    this.timeLeft = this.sessionDurations[this.currentMode];
    this.updateTimerDisplay();
    this.updateControls();
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async startTimer() {
    if (!auth.isLoggedIn()) {
      this.showNotification('Please login to start a session', 'warning');
      showLoginModal();
      return;
    }
    
    this.isRunning = true;
    this.updateControls();
    
    // Start music if connected
    if (this.spotify.isConnected) {
      await this.startSpotifyPlayback();
    }
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();
      this.updateProgressRing();
      
      if (this.timeLeft <= 0) {
        this.completeSession();
      }
    }, 1000);
    
    await this.startBackendSession();
  }

  pauseTimer() {
    this.isRunning = false;
    this.updateControls();
    
    // Pause music
    if (this.spotify.isConnected) {
      this.pauseSpotifyPlayback();
    }
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async startBackendSession() {
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify({
          session_type: this.currentMode,
          duration_minutes: this.sessionDurations[this.currentMode] / 60
        })
      });
      
      const result = await response.json();
      if (result.success) {
        this.currentSession = result.session;
        console.log('Session started:', this.currentSession.id);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  async completeSession() {
    this.pauseTimer();
    this.resetTimer();
    
    // Play notification
    this.playNotificationSound();
    
    // Show completion message
    const message = this.currentMode === 'work' 
      ? '🎉 Great job! Time for a break.' 
      : '✨ Break finished! Ready to focus?';
    
    this.showNotification(message, 'success');
    
    // Complete session in backend
    if (this.currentSession) {
      try {
        await fetch(`/api/sessions/${this.currentSession.id}/complete`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
    
    this.autoSwitchMode();
  }

  autoSwitchMode() {
    if (this.currentMode === 'work') {
      this.switchMode('short_break');
    } else {
      this.switchMode('work');
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timerDisplay').textContent = display;
    document.title = `${display} - PomoFocus`;
  }

  updateProgressRing() {
    const circle = document.querySelector('.progress-ring-circle');
    if (!circle) return;
    
    const total = this.sessionDurations[this.currentMode];
    const progress = ((total - this.timeLeft) / total) * 100;
    const circumference = 2 * Math.PI * 110;
    const offset = circumference - (progress / 100) * circumference;
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
  }

  updateControls() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (this.isRunning) {
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
    } else {
      if (startBtn) startBtn.style.display = 'inline-flex';
      if (pauseBtn) pauseBtn.style.display = 'none';
    }
  }

  playNotificationSound() {
    try {
      document.getElementById('notificationSound')?.play();
    } catch (error) {
      console.log('Audio not available');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.getElementById('notifications')?.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Spotify Integration Functions
  async initializeSpotify() {
    if (!window.Spotify) {
      await this.loadSpotifySDK();
    }
    
    this.spotify.player = new window.Spotify.Player({
      name: 'PomoFocus Player',
      getOAuthToken: cb => { cb(this.spotify.accessToken); },
      volume: 0.5
    });

    this.spotify.player.addListener('ready', ({ device_id }) => {
      console.log('🎵 Spotify player ready');
      this.spotify.deviceId = device_id;
      this.updateSpotifyUI();
    });

    this.spotify.player.addListener('player_state_changed', (state) => {
      this.updateMusicUI(state);
    });

    this.spotify.player.connect();
  }

  async loadSpotifySDK() {
    return new Promise((resolve) => {
      if (window.Spotify) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.onload = resolve;
      document.head.appendChild(script);
      
      window.onSpotifyWebPlaybackSDKReady = resolve;
    });
  }

  connectSpotify() {
    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state'
    ];
    
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${this.spotify.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `show_dialog=true`;
    
    window.location.href = authUrl;
  }

  disconnectSpotify() {
    this.spotify.accessToken = null;
    this.spotify.isConnected = false;
    localStorage.removeItem('spotify_access_token');
    
    if (this.spotify.player) {
      this.spotify.player.disconnect();
      this.spotify.player = null;
    }
    
    this.updateSpotifyUI();
    this.showNotification('Spotify disconnected', 'info');
  }

  async startSpotifyPlayback() {
    if (!this.spotify.isConnected || !this.spotify.deviceId) return;
    
    try {
      // Search for focus music
      const response = await fetch(`https://api.spotify.com/v1/search?q=lo-fi%20hip%20hop%20study&type=track&limit=10`, {
        headers: { 'Authorization': `Bearer ${this.spotify.accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.tracks && data.tracks.items.length > 0) {
        const trackUris = data.tracks.items.map(track => track.uri);
        
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.spotify.deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.spotify.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: trackUris
          })
        });
        
        console.log('🎵 Focus music started');
      }
    } catch (error) {
      console.error('Error starting music:', error);
    }
  }

  async pauseSpotifyPlayback() {
    if (!this.spotify.isConnected || !this.spotify.deviceId) return;
    
    try {
      await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${this.spotify.deviceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.spotify.accessToken}` }
      });
      
      console.log('🎵 Music paused');
    } catch (error) {
      console.error('Error pausing music:', error);
    }
  }

  async toggleMusic() {
    if (!this.spotify.player) return;
    
    const state = await this.spotify.player.getCurrentState();
    
    if (state && !state.paused) {
      this.pauseSpotifyPlayback();
    } else {
      this.startSpotifyPlayback();
    }
  }

  updateSpotifyUI() {
    const connectBtn = document.getElementById('connectSpotifyBtn');
    const disconnectBtn = document.getElementById('disconnectSpotifyBtn');
    const musicControls = document.getElementById('musicControls');
    
    if (this.spotify.isConnected) {
      if (connectBtn) connectBtn.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
      if (musicControls) musicControls.style.display = 'block';
    } else {
      if (connectBtn) connectBtn.style.display = 'inline-flex';
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      if (musicControls) musicControls.style.display = 'none';
    }
  }

  updateMusicUI(state) {
    const toggleBtn = document.getElementById('toggleMusicBtn');
    const nowPlaying = document.getElementById('nowPlaying');
    
    if (!toggleBtn) return;
    
    if (state && !state.paused) {
      toggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
      
      if (nowPlaying && state.track_window.current_track) {
        const track = state.track_window.current_track;
        nowPlaying.innerHTML = `
          <div style="display: flex; align-items: center;">
            <img src="${track.album.images[0]?.url}" alt="${track.name}" style="width: 30px; height: 30px; border-radius: 4px;">
            <div style="margin-left: 8px;">
              <div style="font-size: 12px; font-weight: 500;">${track.name}</div>
              <div style="font-size: 10px; opacity: 0.7;">${track.artists[0].name}</div>
            </div>
          </div>
        `;
      }
    } else {
      toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
      
      if (nowPlaying) {
        nowPlaying.innerHTML = '<span style="opacity: 0.5;">Ready to play focus music</span>';
      }
    }
  }
}

  // Authentication Handlers
  async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const success = await auth.login(email, password);
      if (success) {
        closeModal('loginModal');
        await this.handleUserLogin();
        this.showNotification('Welcome back! 🎉', 'success');
      }
    } catch (error) {
      this.showNotification('Login failed. Please try again.', 'error');
    }
  }

  async handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
      const success = await auth.register(name, email, password);
      if (success) {
        closeModal('loginModal');
        await this.handleUserLogin();
        this.showNotification('Account created successfully! Welcome! 🎉', 'success');
      }
    } catch (error) {
      this.showNotification('Registration failed. Please try again.', 'error');
    }
  }

  logout() {
    auth.logout();
    this.showLoginPrompt();
    this.disconnectSpotify();
    this.showNotification('Logged out successfully', 'info');
  }
}

// Global app instance
let app;

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
  app = new PomoFocusApp();
});

// Global functions for modal controls
function showLoginModal() {
  document.getElementById('loginModal').style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="switchAuthTab('${tab}')"]`)?.classList.add('active');
  
  if (tab === 'login') {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
  } else {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  }
}

function logout() {
  app.logout();
}