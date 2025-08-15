const express = require('express');
const spotifyClient = require('../config/spotify');
const supabase = require('../config/supabase');
const router = express.Router();

// Get Spotify authorization URL
router.get('/connect', (req, res) => {
  try {
    const state = `user_${req.user.userId}_${Date.now()}`;
    const authUrl = spotifyClient.getAuthUrl(state);
    
    res.json({ authUrl, state });
  } catch (error) {
    console.error('Spotify connect error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Handle Spotify OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Get access token and refresh token
    const tokens = await spotifyClient.getAccessToken(code);

    // Save integration to database
    const { error } = await supabase
      .from('integrations')
      .upsert([
        {
          user_id: req.user.userId,
          service: 'spotify',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          connected_at: new Date().toISOString(),
          status: 'active'
        }
      ], { onConflict: 'user_id,service' });

    if (error) {
      throw error;
    }

    res.json({ message: 'Spotify integration connected successfully' });
  } catch (error) {
    console.error('Spotify callback error:', error);
    res.status(500).json({ error: 'Failed to connect Spotify integration' });
  }
});

// Get user's playlists
router.get('/playlists', async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.userId);
    if (!accessToken) {
      return res.status(404).json({ error: 'Spotify integration not found or expired' });
    }

    const playlists = await spotifyClient.getPlaylists(accessToken);
    res.json({ playlists });
  } catch (error) {
    console.error('Get Spotify playlists error:', error);
    res.status(500).json({ error: 'Failed to fetch Spotify playlists' });
  }
});

// Start playback
router.post('/play', async (req, res) => {
  try {
    const { playlist_uri } = req.body;

    const accessToken = await getValidAccessToken(req.user.userId);
    if (!accessToken) {
      return res.status(404).json({ error: 'Spotify integration not found or expired' });
    }

    await spotifyClient.startPlayback(accessToken, playlist_uri);
    res.json({ message: 'Playback started successfully' });
  } catch (error) {
    console.error('Start Spotify playback error:', error);
    res.status(500).json({ error: 'Failed to start playback' });
  }
});

// Pause playback
router.post('/pause', async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.userId);
    if (!accessToken) {
      return res.status(404).json({ error: 'Spotify integration not found or expired' });
    }

    await spotifyClient.pausePlayback(accessToken);
    res.json({ message: 'Playback paused successfully' });
  } catch (error) {
    console.error('Pause Spotify playback error:', error);
    res.status(500).json({ error: 'Failed to pause playback' });
  }
});

// Get current playback state
router.get('/current', async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.userId);
    if (!accessToken) {
      return res.status(404).json({ error: 'Spotify integration not found or expired' });
    }

    const playback = await spotifyClient.getCurrentPlayback(accessToken);
    res.json({ playback });
  } catch (error) {
    console.error('Get current Spotify playback error:', error);
    res.status(500).json({ error: 'Failed to get current playback state' });
  }
});

// Save user's focus playlist preference
router.post('/focus-playlist', async (req, res) => {
  try {
    const { playlist_uri, playlist_name } = req.body;

    if (!playlist_uri) {
      return res.status(400).json({ error: 'Playlist URI is required' });
    }

    // Update user preferences
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', req.user.userId)
      .single();

    if (userError) {
      throw userError;
    }

    const preferences = user.preferences || {};
    preferences.spotify_focus_playlist = {
      uri: playlist_uri,
      name: playlist_name
    };

    const { error } = await supabase
      .from('users')
      .update({ preferences })
      .eq('id', req.user.userId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Focus playlist preference saved successfully' });
  } catch (error) {
    console.error('Save focus playlist error:', error);
    res.status(500).json({ error: 'Failed to save focus playlist preference' });
  }
});

// Get user's focus playlist preference
router.get('/focus-playlist', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      throw error;
    }

    const focusPlaylist = user.preferences?.spotify_focus_playlist || null;
    res.json({ focusPlaylist });
  } catch (error) {
    console.error('Get focus playlist error:', error);
    res.status(500).json({ error: 'Failed to get focus playlist preference' });
  }
});

// Start focus session with music
router.post('/start-focus', async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.userId);
    if (!accessToken) {
      return res.status(404).json({ error: 'Spotify integration not found or expired' });
    }

    // Get user's focus playlist preference
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', req.user.userId)
      .single();

    if (userError) {
      throw userError;
    }

    const focusPlaylist = user.preferences?.spotify_focus_playlist;
    if (focusPlaylist) {
      await spotifyClient.startPlayback(accessToken, focusPlaylist.uri);
      res.json({ 
        message: 'Focus session started with music',
        playlist: focusPlaylist.name
      });
    } else {
      await spotifyClient.startPlayback(accessToken);
      res.json({ message: 'Focus session started with current music' });
    }
  } catch (error) {
    console.error('Start focus session error:', error);
    res.status(500).json({ error: 'Failed to start focus session with music' });
  }
});

// Disconnect Spotify integration
router.delete('/disconnect', async (req, res) => {
  try {
    const { error } = await supabase
      .from('integrations')
      .update({ status: 'disconnected', disconnected_at: new Date().toISOString() })
      .eq('user_id', req.user.userId)
      .eq('service', 'spotify');

    if (error) {
      throw error;
    }

    res.json({ message: 'Spotify integration disconnected successfully' });
  } catch (error) {
    console.error('Disconnect Spotify error:', error);
    res.status(500).json({ error: 'Failed to disconnect Spotify integration' });
  }
});

// Get integration status
router.get('/status', async (req, res) => {
  try {
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('status, connected_at')
      .eq('user_id', req.user.userId)
      .eq('service', 'spotify')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      connected: integration?.status === 'active',
      connectedAt: integration?.connected_at || null
    });
  } catch (error) {
    console.error('Get Spotify status error:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

// Helper function to get valid access token (refresh if needed)
async function getValidAccessToken(userId) {
  try {
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('service', 'spotify')
      .eq('status', 'active')
      .single();

    if (error || !integration) {
      return null;
    }

    // Check if token is expired
    const expiryTime = new Date(integration.token_expires_at);
    const now = new Date();

    if (now >= expiryTime) {
      // Token is expired, refresh it
      const newTokens = await spotifyClient.refreshToken(integration.refresh_token);
      
      // Update tokens in database
      await supabase
        .from('integrations')
        .update({
          access_token: newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        })
        .eq('user_id', userId)
        .eq('service', 'spotify');

      return newTokens.access_token;
    }

    return integration.access_token;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    return null;
  }
}

module.exports = router;
