const axios = require('axios');

class SpotifyClient {
  constructor() {
    this.baseURL = 'https://api.spotify.com/v1';
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  }

  // Get authorization URL
  getAuthUrl(state) {
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      state: state
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Exchange code for access token
  async getAccessToken(code) {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          code: code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code'
        }), {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to get Spotify access token');
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }), {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to refresh Spotify token');
    }
  }

  // Get user's playlists
  async getPlaylists(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me/playlists`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data.items;
    } catch (error) {
      throw new Error('Failed to fetch Spotify playlists');
    }
  }

  // Start/Resume playback
  async startPlayback(accessToken, playlistUri = null) {
    try {
      const body = playlistUri ? { context_uri: playlistUri } : {};
      
      await axios.put(`${this.baseURL}/me/player/play`, body, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return true;
    } catch (error) {
      throw new Error('Failed to start Spotify playback');
    }
  }

  // Pause playback
  async pausePlayback(accessToken) {
    try {
      await axios.put(`${this.baseURL}/me/player/pause`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return true;
    } catch (error) {
      throw new Error('Failed to pause Spotify playback');
    }
  }

  // Get current playback state
  async getCurrentPlayback(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me/player`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      return null; // No active device or playback
    }
  }
}

module.exports = new SpotifyClient();
