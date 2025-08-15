// Spotify Integration Manager
class SpotifyManager {
  constructor() {
    this.clientId = 'ea965b31452845d5868c6499bb71b50d'; // Your Spotify Client ID
    this.redirectUri = `${window.location.origin}/callback`;
    this.scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
      'playlist-read-collaborative'
    ];
    
    this.accessToken = localStorage.getItem('spotify_access_token');
    this.refreshToken = localStorage.getItem('spotify_refresh_token');
    this.isConnected = !!this.accessToken;
    this.player = null;
    this.deviceId = null;
    this.currentPlaylist = null;
    
    // Focus playlists
    this.focusPlaylists = [
      { id: 'default', name: 'Focus Sounds', tracks: [] },
      { id: 'lofi', name: 'Lo-Fi Hip Hop', query: 'lo-fi hip hop' },
      { id: 'ambient', name: 'Ambient Focus', query: 'ambient focus music' },
      { id: 'classical', name: 'Classical Focus', query: 'classical focus study' }
    ];
  }

  async initialize() {
    console.log('🎵 Initializing Spotify...');
    
    // Check for authorization code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !this.accessToken) {
      await this.handleAuthorizationCode(code);
    }
    
    if (this.accessToken) {
      await this.initializePlayer();
      this.updateUI();
    }
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Spotify connect button
    document.getElementById('connectSpotifyBtn')?.addEventListener('click', () => {
      this.connect();
    });
    
    // Disconnect button
    document.getElementById('disconnectSpotifyBtn')?.addEventListener('click', () => {
      this.disconnect();
    });
    
    // Playlist selection
    document.getElementById('playlistSelect')?.addEventListener('change', (e) => {
      this.selectPlaylist(e.target.value);
    });
    
    // Music controls
    document.getElementById('toggleMusicBtn')?.addEventListener('click', () => {
      this.togglePlayback();
    });
  }

  connect() {
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${this.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${encodeURIComponent(this.scopes.join(' '))}&` +
      `show_dialog=true`;
    
    window.location.href = authUrl;
  }

  async handleAuthorizationCode(code) {
    try {
      // Exchange code for tokens through your backend
      const response = await fetch('/api/spotify/exchange-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify({ code, redirect_uri: this.redirectUri })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        
        localStorage.setItem('spotify_access_token', this.accessToken);
        localStorage.setItem('spotify_refresh_token', this.refreshToken);
        
        this.isConnected = true;
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        app.ui.showNotification('Spotify connected successfully! 🎵', 'success');
      }
    } catch (error) {
      console.error('Error exchanging authorization code:', error);
      app.ui.showNotification('Failed to connect Spotify', 'error');
    }
  }

  async initializePlayer() {
    if (!window.Spotify) {
      // Load Spotify Web Playback SDK
      await this.loadSpotifySDK();
    }
    
    this.player = new window.Spotify.Player({
      name: 'PomoFocus Player',
      getOAuthToken: cb => { cb(this.accessToken); },
      volume: 0.5
    });

    // Player event listeners
    this.player.addListener('ready', ({ device_id }) => {
      console.log('Spotify player ready with Device ID', device_id);
      this.deviceId = device_id;
      this.loadPlaylists();
    });

    this.player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    this.player.addListener('player_state_changed', (state) => {
      this.updatePlaybackUI(state);
    });

    // Connect the player
    this.player.connect();
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

  async loadPlaylists() {
    try {
      // Load user's playlists
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.items) {
        this.updatePlaylistUI(data.items);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  }

  updatePlaylistUI(playlists) {
    const playlistSelect = document.getElementById('playlistSelect');
    if (!playlistSelect) return;
    
    // Clear existing options
    playlistSelect.innerHTML = '<option value="">Select a playlist...</option>';
    
    // Add focus playlists
    this.focusPlaylists.forEach(playlist => {
      const option = document.createElement('option');
      option.value = playlist.id;
      option.textContent = `🎯 ${playlist.name}`;
      playlistSelect.appendChild(option);
    });
    
    // Add separator
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '─────────────────';
    playlistSelect.appendChild(separator);
    
    // Add user playlists
    playlists.forEach(playlist => {
      const option = document.createElement('option');
      option.value = playlist.id;
      option.textContent = playlist.name;
      playlistSelect.appendChild(option);
    });
  }

  async selectPlaylist(playlistId) {
    if (!playlistId) return;
    
    this.currentPlaylist = playlistId;
    
    // If it's a focus playlist, search for tracks
    const focusPlaylist = this.focusPlaylists.find(p => p.id === playlistId);
    if (focusPlaylist && focusPlaylist.query) {
      await this.searchFocusMusic(focusPlaylist.query);
    }
  }

  async searchFocusMusic(query) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.tracks && data.tracks.items.length > 0) {
        // Store tracks for this focus playlist
        const focusPlaylist = this.focusPlaylists.find(p => p.query === query);
        if (focusPlaylist) {
          focusPlaylist.tracks = data.tracks.items.map(track => track.uri);
        }
      }
    } catch (error) {
      console.error('Error searching for focus music:', error);
    }
  }

  async startPlayback() {
    if (!this.isConnected || !this.deviceId || !this.currentPlaylist) return;
    
    try {
      let uris = [];
      
      // Get tracks based on playlist type
      const focusPlaylist = this.focusPlaylists.find(p => p.id === this.currentPlaylist);
      if (focusPlaylist && focusPlaylist.tracks) {
        uris = focusPlaylist.tracks;
      } else {
        // Get tracks from Spotify playlist
        const response = await fetch(`https://api.spotify.com/v1/playlists/${this.currentPlaylist}/tracks`, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const data = await response.json();
        uris = data.items.map(item => item.track.uri);
      }
      
      if (uris.length > 0) {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: uris.slice(0, 10), // Limit to first 10 tracks
            position_ms: 0
          })
        });
        
        console.log('🎵 Music started');
      }
    } catch (error) {
      console.error('Error starting playback:', error);
    }
  }

  async pausePlayback() {
    if (!this.isConnected || !this.deviceId) return;
    
    try {
      await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      
      console.log('🎵 Music paused');
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  }

  async togglePlayback() {
    if (!this.player) return;
    
    const state = await this.player.getCurrentState();
    
    if (state && !state.paused) {
      this.pausePlayback();
    } else {
      this.startPlayback();
    }
  }

  updatePlaybackUI(state) {
    const toggleBtn = document.getElementById('toggleMusicBtn');
    const nowPlaying = document.getElementById('nowPlaying');
    
    if (!toggleBtn) return;
    
    if (state && !state.paused) {
      toggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
      toggleBtn.title = 'Pause Music';
      
      if (nowPlaying && state.track_window.current_track) {
        const track = state.track_window.current_track;
        nowPlaying.innerHTML = `
          <img src="${track.album.images[0]?.url}" alt="${track.name}" style="width: 30px; height: 30px; border-radius: 4px;">
          <div style="margin-left: 8px;">
            <div style="font-size: 12px; font-weight: 500;">${track.name}</div>
            <div style="font-size: 10px; opacity: 0.7;">${track.artists[0].name}</div>
          </div>
        `;
      }
    } else {
      toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
      toggleBtn.title = 'Play Music';
      
      if (nowPlaying) {
        nowPlaying.innerHTML = '<span style="opacity: 0.5;">No music playing</span>';
      }
    }
  }

  updateUI() {
    const connectBtn = document.getElementById('connectSpotifyBtn');
    const disconnectBtn = document.getElementById('disconnectSpotifyBtn');
    const musicControls = document.getElementById('musicControls');
    
    if (this.isConnected) {
      if (connectBtn) connectBtn.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
      if (musicControls) musicControls.style.display = 'block';
    } else {
      if (connectBtn) connectBtn.style.display = 'inline-flex';
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      if (musicControls) musicControls.style.display = 'none';
    }
  }

  disconnect() {
    this.accessToken = null;
    this.refreshToken = null;
    this.isConnected = false;
    this.currentPlaylist = null;
    
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    
    if (this.player) {
      this.player.disconnect();
      this.player = null;
    }
    
    this.updateUI();
    app.ui.showNotification('Spotify disconnected', 'info');
  }

  async refreshAccessToken() {
    if (!this.refreshToken) return false;
    
    try {
      const response = await fetch('/api/spotify/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify({ refresh_token: this.refreshToken })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.accessToken = data.access_token;
        localStorage.setItem('spotify_access_token', this.accessToken);
        return true;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
    
    return false;
  }
}
