const express = require('express');
const todoistClient = require('../config/todoist');
const supabase = require('../config/supabase');
const router = express.Router();

// Get Todoist authorization URL
router.get('/connect', (req, res) => {
  try {
    const state = `user_${req.user.userId}_${Date.now()}`;
    const authUrl = todoistClient.getAuthUrl(state);
    
    res.json({ authUrl, state });
  } catch (error) {
    console.error('Todoist connect error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Handle Todoist OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Get access token
    const accessToken = await todoistClient.getAccessToken(code);

    // Save integration to database
    const { error } = await supabase
      .from('integrations')
      .upsert([
        {
          user_id: req.user.userId,
          service: 'todoist',
          access_token: accessToken,
          connected_at: new Date().toISOString(),
          status: 'active'
        }
      ], { onConflict: 'user_id,service' });

    if (error) {
      throw error;
    }

    res.json({ message: 'Todoist integration connected successfully' });
  } catch (error) {
    console.error('Todoist callback error:', error);
    res.status(500).json({ error: 'Failed to connect Todoist integration' });
  }
});

// Get Todoist tasks
router.get('/tasks', async (req, res) => {
  try {
    // Get user's Todoist integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', req.user.userId)
      .eq('service', 'todoist')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Todoist integration not found' });
    }

    // Fetch tasks from Todoist
    const tasks = await todoistClient.getTasks(integration.access_token);

    res.json({ tasks });
  } catch (error) {
    console.error('Get Todoist tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch Todoist tasks' });
  }
});

// Import Todoist task to local tasks
router.post('/import/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get user's Todoist integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', req.user.userId)
      .eq('service', 'todoist')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Todoist integration not found' });
    }

    // Get all tasks from Todoist to find the specific one
    const todoistTasks = await todoistClient.getTasks(integration.access_token);
    const todoistTask = todoistTasks.find(task => task.id === taskId);

    if (!todoistTask) {
      return res.status(404).json({ error: 'Todoist task not found' });
    }

    // Check if task is already imported
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', req.user.userId)
      .eq('todoist_id', taskId)
      .single();

    if (existingTask) {
      return res.status(409).json({ error: 'Task already imported' });
    }

    // Import task to local database
    const newTask = {
      user_id: req.user.userId,
      title: todoistTask.content,
      description: todoistTask.description || null,
      priority: todoistTask.priority === 4 ? 'high' : todoistTask.priority >= 2 ? 'medium' : 'low',
      due_date: todoistTask.due?.date || null,
      todoist_id: taskId,
      labels: todoistTask.labels || [],
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Task imported successfully',
      task
    });
  } catch (error) {
    console.error('Import Todoist task error:', error);
    res.status(500).json({ error: 'Failed to import Todoist task' });
  }
});

// Sync completed task back to Todoist
router.post('/sync/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get the local task with Todoist ID
    const { data: localTask, error: taskError } = await supabase
      .from('tasks')
      .select('todoist_id')
      .eq('id', taskId)
      .eq('user_id', req.user.userId)
      .single();

    if (taskError || !localTask || !localTask.todoist_id) {
      return res.status(404).json({ error: 'Task not found or not linked to Todoist' });
    }

    // Get user's Todoist integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', req.user.userId)
      .eq('service', 'todoist')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Todoist integration not found' });
    }

    // Complete task in Todoist
    await todoistClient.completeTask(integration.access_token, localTask.todoist_id);

    res.json({ message: 'Task completed in Todoist successfully' });
  } catch (error) {
    console.error('Sync Todoist task completion error:', error);
    res.status(500).json({ error: 'Failed to sync task completion to Todoist' });
  }
});

// Create task in Todoist
router.post('/create', async (req, res) => {
  try {
    const { title, description, priority, due_date, project_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Get user's Todoist integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', req.user.userId)
      .eq('service', 'todoist')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Todoist integration not found' });
    }

    // Prepare task data for Todoist
    const taskData = {
      content: title,
      description: description || undefined,
      priority: priority === 'high' ? 4 : priority === 'medium' ? 2 : 1,
      due_string: due_date || undefined,
      project_id: project_id || undefined
    };

    // Create task in Todoist
    const todoistTask = await todoistClient.createTask(integration.access_token, taskData);

    // Also create in local database
    const newTask = {
      user_id: req.user.userId,
      title,
      description: description || null,
      priority: priority || 'medium',
      due_date: due_date || null,
      todoist_id: todoistTask.id,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Task created in Todoist successfully',
      task,
      todoistTask
    });
  } catch (error) {
    console.error('Create Todoist task error:', error);
    res.status(500).json({ error: 'Failed to create task in Todoist' });
  }
});

// Disconnect Todoist integration
router.delete('/disconnect', async (req, res) => {
  try {
    const { error } = await supabase
      .from('integrations')
      .update({ status: 'disconnected', disconnected_at: new Date().toISOString() })
      .eq('user_id', req.user.userId)
      .eq('service', 'todoist');

    if (error) {
      throw error;
    }

    res.json({ message: 'Todoist integration disconnected successfully' });
  } catch (error) {
    console.error('Disconnect Todoist error:', error);
    res.status(500).json({ error: 'Failed to disconnect Todoist integration' });
  }
});

// Get integration status
router.get('/status', async (req, res) => {
  try {
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('status, connected_at')
      .eq('user_id', req.user.userId)
      .eq('service', 'todoist')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      connected: integration?.status === 'active',
      connectedAt: integration?.connected_at || null
    });
  } catch (error) {
    console.error('Get Todoist status error:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

module.exports = router;
