const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Start a new pomodoro session
router.post('/start', async (req, res) => {
  try {
    const { task_id, duration = 25, session_type = 'work' } = req.body;

    // Check if there's an active session
    const { data: activeSession } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', req.user.userId)
      .eq('status', 'active')
      .single();

    if (activeSession) {
      return res.status(400).json({ error: 'There is already an active session' });
    }

    const newSession = {
      user_id: req.user.userId,
      task_id: task_id || null,
      duration_minutes: duration,
      session_type,
      status: 'active',
      started_at: new Date().toISOString()
    };

    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .insert([newSession])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Pomodoro session started',
      session
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete/Stop current session
router.post('/complete', async (req, res) => {
  try {
    const { completed = true, notes = null } = req.body;

    // Find active session
    const { data: activeSession, error: findError } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', req.user.userId)
      .eq('status', 'active')
      .single();

    if (findError || !activeSession) {
      return res.status(404).json({ error: 'No active session found' });
    }

    const endTime = new Date();
    const startTime = new Date(activeSession.started_at);
    const actualDuration = Math.round((endTime - startTime) / 60000); // minutes

    const updates = {
      status: completed ? 'completed' : 'interrupted',
      completed_at: endTime.toISOString(),
      actual_duration_minutes: actualDuration,
      notes: notes
    };

    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .update(updates)
      .eq('id', activeSession.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If session was for a specific task and completed, update task progress
    if (completed && session.task_id) {
      await supabase
        .from('tasks')
        .update({
          pomodoros_completed: supabase.rpc('increment_pomodoros', { task_id: session.task_id }),
          updated_at: new Date().toISOString()
        })
        .eq('id', session.task_id);
    }

    res.json({
      message: `Session ${completed ? 'completed' : 'stopped'}`,
      session
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current active session
router.get('/current', async (req, res) => {
  try {
    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .select(`
        *,
        tasks (
          id,
          title,
          description
        )
      `)
      .eq('user_id', req.user.userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    res.json({ session: session || null });
  } catch (error) {
    console.error('Get current session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session history
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = null } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('pomodoro_sessions')
      .select(`
        *,
        tasks (
          id,
          title,
          description
        )
      `)
      .eq('user_id', req.user.userId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ sessions });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
    }

    const { data: sessions, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', req.user.userId)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());

    if (error) {
      throw error;
    }

    const stats = {
      total_sessions: sessions.length,
      completed_sessions: sessions.filter(s => s.status === 'completed').length,
      interrupted_sessions: sessions.filter(s => s.status === 'interrupted').length,
      total_focus_time: sessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0),
      average_session_duration: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) / sessions.length 
        : 0,
      completion_rate: sessions.length > 0 
        ? (sessions.filter(s => s.status === 'completed').length / sessions.length * 100).toFixed(2)
        : 0
    };

    res.json({ stats, period });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pause current session
router.post('/pause', async (req, res) => {
  try {
    const { data: activeSession, error: findError } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', req.user.userId)
      .eq('status', 'active')
      .single();

    if (findError || !activeSession) {
      return res.status(404).json({ error: 'No active session found' });
    }

    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Session paused',
      session
    });
  } catch (error) {
    console.error('Pause session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resume paused session
router.post('/resume', async (req, res) => {
  try {
    const { data: pausedSession, error: findError } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', req.user.userId)
      .eq('status', 'paused')
      .single();

    if (findError || !pausedSession) {
      return res.status(404).json({ error: 'No paused session found' });
    }

    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .update({ status: 'active', resumed_at: new Date().toISOString() })
      .eq('id', pausedSession.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Session resumed',
      session
    });
  } catch (error) {
    console.error('Resume session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
