const express = require('express');
const calendarClient = require('../config/calendar');
const supabase = require('../config/supabase');
const router = express.Router();

// Get Google Calendar authorization URL
router.get('/connect', (req, res) => {
  try {
    const state = `user_${req.user.userId}_${Date.now()}`;
    const authUrl = calendarClient.getAuthUrl(state);
    
    res.json({ authUrl, state });
  } catch (error) {
    console.error('Calendar connect error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Handle Google Calendar OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Get tokens
    const tokens = await calendarClient.getTokens(code);

    // Save integration to database
    const { error } = await supabase
      .from('integrations')
      .upsert([
        {
          user_id: req.user.userId,
          service: 'google_calendar',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          connected_at: new Date().toISOString(),
          status: 'active'
        }
      ], { onConflict: 'user_id,service' });

    if (error) {
      throw error;
    }

    res.json({ message: 'Google Calendar integration connected successfully' });
  } catch (error) {
    console.error('Calendar callback error:', error);
    res.status(500).json({ error: 'Failed to connect Google Calendar integration' });
  }
});

// Get calendar events
router.get('/events', async (req, res) => {
  try {
    const { timeMin, timeMax, maxResults = 50 } = req.query;

    // Get user's Calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', req.user.userId)
      .eq('service', 'google_calendar')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Google Calendar integration not found' });
    }

    const tokens = {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : null
    };

    // Get events from Google Calendar
    const events = await calendarClient.getEvents(tokens, timeMin, timeMax);

    res.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Create calendar event for pomodoro session
router.post('/create-session-event', async (req, res) => {
  try {
    const { session_id, start_time, duration_minutes, task_title } = req.body;

    if (!session_id || !start_time || !duration_minutes) {
      return res.status(400).json({ error: 'Session ID, start time, and duration are required' });
    }

    // Get user's Calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', req.user.userId)
      .eq('service', 'google_calendar')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Google Calendar integration not found' });
    }

    const tokens = {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : null
    };

    // Calculate end time
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + duration_minutes * 60000);

    // Create event data
    const eventData = {
      summary: `🍅 Pomodoro Session${task_title ? `: ${task_title}` : ''}`,
      description: `Pomodoro focus session${task_title ? ` for task: ${task_title}` : ''}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC'
      },
      colorId: '11', // Red color for focus sessions
      extendedProperties: {
        private: {
          pomodoroSessionId: session_id.toString()
        }
      }
    };

    // Create event in Google Calendar
    const event = await calendarClient.createEvent(tokens, eventData);

    // Update session with calendar event ID
    await supabase
      .from('pomodoro_sessions')
      .update({ calendar_event_id: event.id })
      .eq('id', session_id)
      .eq('user_id', req.user.userId);

    res.status(201).json({
      message: 'Calendar event created successfully',
      event: {
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        htmlLink: event.htmlLink
      }
    });
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// Update calendar event when session is completed
router.put('/update-session-event/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { completed, actual_duration } = req.body;

    // Get session with calendar event ID
    const { data: session, error: sessionError } = await supabase
      .from('pomodoro_sessions')
      .select('calendar_event_id, started_at, task_id, tasks(title)')
      .eq('id', sessionId)
      .eq('user_id', req.user.userId)
      .single();

    if (sessionError || !session || !session.calendar_event_id) {
      return res.status(404).json({ error: 'Session or calendar event not found' });
    }

    // Get user's Calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', req.user.userId)
      .eq('service', 'google_calendar')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Google Calendar integration not found' });
    }

    const tokens = {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : null
    };

    // Update event data
    const status = completed ? 'Completed' : 'Interrupted';
    const taskTitle = session.tasks?.title || '';
    
    const eventData = {
      summary: `🍅 Pomodoro Session - ${status}${taskTitle ? `: ${taskTitle}` : ''}`,
      description: `Pomodoro session ${status.toLowerCase()}${taskTitle ? ` for task: ${taskTitle}` : ''}\nActual duration: ${actual_duration} minutes`,
      colorId: completed ? '10' : '6' // Green for completed, orange for interrupted
    };

    // Update event in Google Calendar
    await calendarClient.updateEvent(tokens, session.calendar_event_id, eventData);

    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// Create calendar event for task due date
router.post('/create-task-event', async (req, res) => {
  try {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .eq('user_id', req.user.userId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.due_date) {
      return res.status(400).json({ error: 'Task must have a due date' });
    }

    // Get user's Calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', req.user.userId)
      .eq('service', 'google_calendar')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Google Calendar integration not found' });
    }

    const tokens = {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : null
    };

    // Create event data
    const eventData = {
      summary: `📋 Task Due: ${task.title}`,
      description: task.description || `Task: ${task.title}`,
      start: {
        date: task.due_date
      },
      end: {
        date: task.due_date
      },
      colorId: '9', // Blue color for task due dates
      extendedProperties: {
        private: {
          pomodoroTaskId: task_id.toString()
        }
      }
    };

    // Create event in Google Calendar
    const event = await calendarClient.createEvent(tokens, eventData);

    // Update task with calendar event ID
    await supabase
      .from('tasks')
      .update({ calendar_event_id: event.id })
      .eq('id', task_id)
      .eq('user_id', req.user.userId);

    res.status(201).json({
      message: 'Task due date event created successfully',
      event: {
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        htmlLink: event.htmlLink
      }
    });
  } catch (error) {
    console.error('Create task event error:', error);
    res.status(500).json({ error: 'Failed to create task due date event' });
  }
});

// Get today's events
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // Get user's Calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', req.user.userId)
      .eq('service', 'google_calendar')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Google Calendar integration not found' });
    }

    const tokens = {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : null
    };

    // Get today's events
    const events = await calendarClient.getEvents(tokens, timeMin, timeMax);

    res.json({ events, date: today.toISOString().split('T')[0] });
  } catch (error) {
    console.error('Get today events error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s events' });
  }
});

// Disconnect Google Calendar integration
router.delete('/disconnect', async (req, res) => {
  try {
    const { error } = await supabase
      .from('integrations')
      .update({ status: 'disconnected', disconnected_at: new Date().toISOString() })
      .eq('user_id', req.user.userId)
      .eq('service', 'google_calendar');

    if (error) {
      throw error;
    }

    res.json({ message: 'Google Calendar integration disconnected successfully' });
  } catch (error) {
    console.error('Disconnect Calendar error:', error);
    res.status(500).json({ error: 'Failed to disconnect Google Calendar integration' });
  }
});

// Get integration status
router.get('/status', async (req, res) => {
  try {
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('status, connected_at')
      .eq('user_id', req.user.userId)
      .eq('service', 'google_calendar')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      connected: integration?.status === 'active',
      connectedAt: integration?.connected_at || null
    });
  } catch (error) {
    console.error('Get Calendar status error:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

module.exports = router;
