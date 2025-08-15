// server.js - Your main server file
const express = require('express');
const cors = require('cors');
const path = require('path');
// COMMENTED OUT FOR SIMPLE POMODORO VERSION - Uncomment when adding auth features
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// COMMENTED OUT FOR SIMPLE POMODORO VERSION - Uncomment when adding database features
// Initialize Supabase client
// const supabase = createClient(
//     process.env.SUPABASE_URL,
//     process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// COMMENTED OUT FOR SIMPLE POMODORO VERSION - Uncomment when adding authentication
// Authentication middleware
/*
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        req.user = user;
        next();
    });
}
*/

// COMMENTED OUT FOR SIMPLE POMODORO VERSION - Uncomment when adding user registration
// AUTH ROUTES
// Register
/*
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, password, and name are required' 
            });
        }

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{ email, password_hash: passwordHash, name }])
            .select('id, email, name')
            .single();

        if (error) {
            throw error;
        }

        // Generate token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed' 
        });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password required' 
            });
        }

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, password_hash')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed' 
        });
    }
});

// Get profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, total_pomodoros, total_focus_time, streak_days')
            .eq('id', req.user.userId)
            .single();

        if (error) {
            throw error;
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get profile' });
    }
});

// TASK ROUTES
// Get tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get tasks' });
    }
});

// Create task
app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, description, priority = 'medium' } = req.body;

        if (!title) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title is required' 
            });
        }

        const { data: task, error } = await supabase
            .from('tasks')
            .insert([{
                user_id: req.user.userId,
                title,
                description,
                priority,
                status: 'todo'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create task' });
    }
});

// Update task
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data: task, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update task' });
    }
});

// POMODORO ROUTES
// Start session
app.post('/api/sessions/start', authenticateToken, async (req, res) => {
    try {
        const { task_id, duration_minutes = 25, session_type = 'work' } = req.body;

        const { data: session, error } = await supabase
            .from('pomodoro_sessions')
            .insert([{
                user_id: req.user.userId,
                task_id,
                duration_minutes,
                session_type,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to start session' });
    }
});

// Complete session
app.put('/api/sessions/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: session, error } = await supabase
            .from('pomodoro_sessions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to complete session' });
    }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            return res.status(500).json({ 
                success: false, 
                error: 'Database connection failed',
                details: error.message 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Database connected successfully!',
            user_count: count,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: 'Database error',
            details: err.message 
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    const health = {
        status: 'ok',
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        checks: {
            supabase_url: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
            supabase_anon_key: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing', 
            supabase_service_role: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
            jwt_secret: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
            spotify_client_id: process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing',
            spotify_client_secret: process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
            todoist_token: process.env.TODOIST_API_TOKEN ? '✅ Set' : '❌ Missing'
        }
    };
    res.json(health);
});

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working! 🎉', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log('🍅 Pomodoro App Server Starting...');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🗄️  Database test: http://localhost:${PORT}/api/test-db`);
    console.log('');
    console.log('📋 Configuration Status:');
    console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
    console.log(`   Supabase Keys: ${process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`);
    console.log(`   JWT Secret: ${process.env.JWT_SECRET ? '✅' : '❌'}`);
    console.log(`   Spotify: ${process.env.SPOTIFY_CLIENT_ID ? '✅' : '❌'}`);
    console.log(`   Todoist: ${process.env.TODOIST_API_TOKEN ? '✅' : '❌'}`);
    console.log('');
    console.log('🚀 Available API Endpoints:');
    console.log('   POST /api/auth/register   - Register new user');
    console.log('   POST /api/auth/login      - Login user');
    console.log('   GET  /api/auth/profile    - Get user profile');
    console.log('   GET  /api/tasks           - Get user tasks');
    console.log('   POST /api/tasks           - Create new task');
    console.log('   PUT  /api/tasks/:id       - Update task');
    console.log('   POST /api/sessions/start  - Start pomodoro session');
    console.log('   PUT  /api/sessions/:id/complete - Complete session');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// API ROUTES (these handle data requests)

// GET all tasks for a user
app.get('/api/tasks', (req, res) => {
    // For now, return all tasks (we'll add user filtering later)
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
    
    // Validation (checking if the data is good)
    if (!title) {
        return res.status(400).json({
            success: false,
            message: 'Task title is required'
        });
    }
    
    // Create the task object
    const newTask = {
        id: Date.now(),                    // Simple ID (we'll improve this)
        title: title,
        description: description || '',
        completed: false,
        createdAt: new Date().toISOString(),
        pomodoroCount: 0,
        notionPageId: null,               // We'll fill this when we connect Notion
        calendarEventId: null             // We'll fill this when we connect Calendar
    };
    
    // Add to our "database" (memory for now)
    tasks.push(newTask);
    
    // TODO: Here we'll add Notion integration later
    // createNotionTask(newTask);
    
    // Send response back
    res.json({
        success: true,
        task: newTask,
        message: 'Task created successfully'
    });
});

// UPDATE a task (mark complete/incomplete)
app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const { completed } = req.body;
    
    console.log(`🔄 Updating task ${taskId}:`, { completed });
    
    // Find the task
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }
    
    // Update the task
    tasks[taskIndex] = {
        ...tasks[taskIndex],
        completed: completed,
        updatedAt: new Date().toISOString()
    };
    
    // TODO: Update Notion when we integrate
    // updateNotionTask(tasks[taskIndex]);
    
    res.json({
        success: true,
        task: tasks[taskIndex],
        message: 'Task updated successfully'
    });
});

// START a pomodoro session
app.post('/api/sessions/start', (req, res) => {
    const { taskId } = req.body;
    
    console.log('▶️ Starting pomodoro session for task:', taskId);
    
    // Find the task
    const task = tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }
    
    // Create session
    const session = {
        id: Date.now(),
        taskId: parseInt(taskId),
        startTime: new Date().toISOString(),
        endTime: null,
        completed: false,
        duration: 25 * 60 // 25 minutes in seconds
    };
    
    sessions.push(session);
    
    // TODO: Start Spotify playlist here
    // startSpotifyPlayback();
    
    res.json({
        success: true,
        session: session,
        message: 'Pomodoro session started'
    });
});

// COMPLETE a pomodoro session
app.post('/api/sessions/complete/:id', (req, res) => {
    const sessionId = parseInt(req.params.id);
    
    console.log('✅ Completing pomodoro session:', sessionId);
    
    // Find and update session
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Session not found'
        });
    }
    
    sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        endTime: new Date().toISOString(),
        completed: true
    };
    
    // Update task pomodoro count
    const taskId = sessions[sessionIndex].taskId;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].pomodoroCount++;
    }
    
    res.json({
        success: true,
        session: sessions[sessionIndex],
        message: 'Pomodoro session completed'
    });
});

// NOTION INTEGRATION ENDPOINTS (we'll build these step by step)
app.get('/api/notion/status', (req, res) => {
    res.json({
        success: true,
        connected: false,
        message: 'Notion integration not yet configured'
    });
});

// Start the server (like opening the restaurant)
app.listen(PORT, () => {
    console.log('🚀 Server running on port', PORT);
    console.log('📱 Open your browser to: http://localhost:' + PORT);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /                     - Main app');
    console.log('  GET  /api/tasks           - Get all tasks');
    console.log('  POST /api/tasks           - Create new task');
    console.log('  PUT  /api/tasks/:id       - Update task');
    console.log('  POST /api/sessions/start  - Start pomodoro');
    console.log('  POST /api/sessions/complete/:id - Complete pomodoro');
});

// Graceful shutdown (clean up when server stops)
process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down gracefully...');
    process.exit(0);
});