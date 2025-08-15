// server-simple.js - Simple Pomodoro App Server
const express = require('express');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for simple demo (replace with database later)
let tasks = [
    {
        id: 1,
        title: "Sample Task",
        description: "This is a sample task to get you started",
        completed: false,
        createdAt: new Date().toISOString(),
        pomodoroCount: 0
    }
];

let sessions = [];
let sessionCounter = 1;

// BASIC API ROUTES FOR POMODORO APP

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        port: PORT,
        timestamp: new Date().toISOString(),
        message: 'Simple Pomodoro Server is running! 🍅'
    });
});

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working! 🎉', 
        timestamp: new Date().toISOString()
    });
});

// GET all tasks
app.get('/api/tasks', (req, res) => {
    console.log('📋 Getting all tasks');
    res.json({
        success: true,
        tasks: tasks,
        message: 'Tasks retrieved successfully'
    });
});

// CREATE a new task
app.post('/api/tasks', (req, res) => {
    console.log('➕ Creating new task:', req.body);
    
    const { title, description } = req.body;
    
    // Validation
    if (!title) {
        return res.status(400).json({
            success: false,
            message: 'Task title is required'
        });
    }
    
    // Create the task object
    const newTask = {
        id: Date.now(),
        title: title,
        description: description || '',
        completed: false,
        createdAt: new Date().toISOString(),
        pomodoroCount: 0
    };
    
    // Add to our tasks array
    tasks.push(newTask);
    
    console.log('✅ Task created:', newTask);
    
    res.status(201).json({
        success: true,
        task: newTask,
        message: 'Task created successfully'
    });
});

// UPDATE a task
app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const updates = req.body;
    
    console.log(`🔄 Updating task ${taskId}:`, updates);
    
    // Find the task
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }
    
    // Update the task
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    
    console.log('✅ Task updated:', tasks[taskIndex]);
    
    res.json({
        success: true,
        task: tasks[taskIndex],
        message: 'Task updated successfully'
    });
});

// DELETE a task
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    
    console.log(`🗑️ Deleting task ${taskId}`);
    
    // Find the task
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }
    
    // Remove the task
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    console.log('✅ Task deleted:', deletedTask);
    
    res.json({
        success: true,
        task: deletedTask,
        message: 'Task deleted successfully'
    });
});

// START a pomodoro session
app.post('/api/sessions/start', (req, res) => {
    const { taskId, sessionType = 'work', duration = 25 } = req.body;
    
    console.log(`🍅 Starting ${sessionType} session for task ${taskId}`);
    
    const session = {
        id: sessionCounter++,
        taskId: taskId,
        sessionType: sessionType,
        duration: duration,
        startedAt: new Date().toISOString(),
        status: 'active'
    };
    
    sessions.push(session);
    
    console.log('✅ Session started:', session);
    
    res.status(201).json({
        success: true,
        session: session,
        message: 'Session started successfully'
    });
});

// COMPLETE a pomodoro session
app.post('/api/sessions/complete/:id', (req, res) => {
    const sessionId = parseInt(req.params.id);
    const { actualDuration } = req.body;
    
    console.log(`✅ Completing session ${sessionId}`);
    
    // Find the session
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Session not found'
        });
    }
    
    // Update the session
    sessions[sessionIndex].status = 'completed';
    sessions[sessionIndex].completedAt = new Date().toISOString();
    sessions[sessionIndex].actualDuration = actualDuration || sessions[sessionIndex].duration;
    
    // If it was a work session, increment the task's pomodoro count
    const session = sessions[sessionIndex];
    if (session.sessionType === 'work' && session.taskId) {
        const taskIndex = tasks.findIndex(task => task.id === session.taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].pomodoroCount++;
        }
    }
    
    console.log('✅ Session completed:', sessions[sessionIndex]);
    
    res.json({
        success: true,
        session: sessions[sessionIndex],
        message: 'Session completed successfully'
    });
});

// GET session history
app.get('/api/sessions', (req, res) => {
    console.log('📊 Getting session history');
    res.json({
        success: true,
        sessions: sessions,
        message: 'Sessions retrieved successfully'
    });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log('🍅 Simple Pomodoro App Server Starting...');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log('');
    console.log('🎯 Available endpoints:');
    console.log('   GET  /api/tasks          - Get all tasks');
    console.log('   POST /api/tasks          - Create new task');
    console.log('   PUT  /api/tasks/:id      - Update task');
    console.log('   DELETE /api/tasks/:id    - Delete task');
    console.log('   POST /api/sessions/start - Start session');
    console.log('   POST /api/sessions/complete/:id - Complete session');
    console.log('   GET  /api/sessions       - Get session history');
    console.log('');
    console.log('🎉 Ready to focus! Start your first Pomodoro session.');
});
