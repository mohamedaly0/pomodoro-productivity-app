-- Sample data for PomoFocus application
-- This file contains sample data for testing and development

-- Insert sample users (passwords are hashed for 'password123')
INSERT INTO users (id, email, password, name, preferences) VALUES
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'demo@pomofocus.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye7fZoX6F1.G/KgpMzm6.Z8kKDQH9o1pO',
    'Demo User',
    '{
        "workDuration": 25,
        "shortBreakDuration": 5,
        "longBreakDuration": 15,
        "autoStartBreaks": false,
        "soundEnabled": true,
        "notificationEnabled": true,
        "theme": "default",
        "pomodoroGoal": 8
    }'
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'alice@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye7fZoX6F1.G/KgpMzm6.Z8kKDQH9o1pO',
    'Alice Johnson',
    '{
        "workDuration": 30,
        "shortBreakDuration": 5,
        "longBreakDuration": 20,
        "autoStartBreaks": true,
        "soundEnabled": true,
        "notificationEnabled": true,
        "theme": "dark"
    }'
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    'bob@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye7fZoX6F1.G/KgpMzm6.Z8kKDQH9o1pO',
    'Bob Smith',
    '{
        "workDuration": 25,
        "shortBreakDuration": 3,
        "longBreakDuration": 15,
        "autoStartBreaks": false,
        "soundEnabled": false,
        "notificationEnabled": true
    }'
);

-- Insert sample projects
INSERT INTO projects (id, user_id, name, description, color) VALUES
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Personal Development',
    'Tasks related to personal growth and learning',
    '#e74c3c'
),
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d480',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Work Projects',
    'Professional work and client projects',
    '#3498db'
),
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d481',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Health & Fitness',
    'Exercise, diet, and wellness goals',
    '#27ae60'
),
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d482',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'Learning JavaScript',
    'Front-end development course',
    '#f39c12'
),
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d483',
    'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    'Home Improvement',
    'Renovating the house',
    '#9b59b6'
);

-- Insert sample tasks
INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, project_id, labels, pomodoros_completed, estimated_pomodoros) VALUES
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Complete project proposal',
    'Write and review the Q4 project proposal document',
    'in_progress',
    'high',
    CURRENT_DATE + INTERVAL '2 days',
    'a47ac10b-58cc-4372-a567-0e02b2c3d480',
    ARRAY['urgent', 'client-work'],
    3,
    6
),
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d480',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Read "Atomic Habits" chapter 5',
    'Continue reading the book on habit formation',
    'pending',
    'medium',
    CURRENT_DATE,
    'a47ac10b-58cc-4372-a567-0e02b2c3d479',
    ARRAY['reading', 'self-improvement'],
    0,
    2
),
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d481',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Plan weekly meals',
    'Create a healthy meal plan for next week',
    'pending',
    'low',
    CURRENT_DATE + INTERVAL '1 day',
    'a47ac10b-58cc-4372-a567-0e02b2c3d481',
    ARRAY['health', 'planning'],
    0,
    1
),
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d482',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Review code submissions',
    'Review pull requests from team members',
    'completed',
    'high',
    CURRENT_DATE - INTERVAL '1 day',
    'a47ac10b-58cc-4372-a567-0e02b2c3d480',
    ARRAY['code-review', 'team'],
    4,
    4
),
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d483',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Morning workout',
    '30-minute cardio session',
    'completed',
    'medium',
    CURRENT_DATE,
    'a47ac10b-58cc-4372-a567-0e02b2c3d481',
    ARRAY['exercise', 'cardio'],
    2,
    2
),
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d484',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'Learn React hooks',
    'Study useState and useEffect hooks',
    'in_progress',
    'high',
    CURRENT_DATE + INTERVAL '3 days',
    'a47ac10b-58cc-4372-a567-0e02b2c3d482',
    ARRAY['react', 'javascript', 'learning'],
    2,
    5
),
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d485',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'Build todo app',
    'Create a simple todo application using React',
    'pending',
    'medium',
    CURRENT_DATE + INTERVAL '7 days',
    'a47ac10b-58cc-4372-a567-0e02b2c3d482',
    ARRAY['react', 'project', 'practice'],
    0,
    8
),
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d486',
    'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    'Paint living room',
    'Apply primer and paint to living room walls',
    'pending',
    'low',
    CURRENT_DATE + INTERVAL '14 days',
    'a47ac10b-58cc-4372-a567-0e02b2c3d483',
    ARRAY['painting', 'diy'],
    0,
    6
);

-- Insert sample pomodoro sessions
INSERT INTO pomodoro_sessions (id, user_id, task_id, session_type, duration_minutes, actual_duration_minutes, status, started_at, completed_at) VALUES
(
    'c47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    'work',
    25,
    25,
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - INTERVAL '1 hour 35 minutes'
),
(
    'c47ac10b-58cc-4372-a567-0e02b2c3d480',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    NULL,
    'short_break',
    5,
    5,
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '1 hour 35 minutes',
    CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes'
),
(
    'c47ac10b-58cc-4372-a567-0e02b2c3d481',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    'work',
    25,
    22,
    'interrupted',
    CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes',
    CURRENT_TIMESTAMP - INTERVAL '1 hour 8 minutes'
),
(
    'c47ac10b-58cc-4372-a567-0e02b2c3d482',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'b47ac10b-58cc-4372-a567-0e02b2c3d483',
    'work',
    25,
    25,
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '45 minutes',
    CURRENT_TIMESTAMP - INTERVAL '20 minutes'
),
(
    'c47ac10b-58cc-4372-a567-0e02b2c3d483',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'b47ac10b-58cc-4372-a567-0e02b2c3d484',
    'work',
    30,
    30,
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '3 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 hours 30 minutes'
),
(
    'c47ac10b-58cc-4372-a567-0e02b2c3d484',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'b47ac10b-58cc-4372-a567-0e02b2c3d484',
    'work',
    30,
    25,
    'interrupted',
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP - INTERVAL '35 minutes'
);

-- Insert sample integrations
INSERT INTO integrations (id, user_id, service, status, settings, connected_at) VALUES
(
    'd47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'spotify',
    'active',
    '{
        "focus_playlist_id": "37i9dQZF1DX0XUsuxWHRQd",
        "auto_play": true,
        "volume": 0.7
    }',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    'd47ac10b-58cc-4372-a567-0e02b2c3d480',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'todoist',
    'active',
    '{
        "auto_import": false,
        "sync_completed": true
    }',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
),
(
    'd47ac10b-58cc-4372-a567-0e02b2c3d481',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'google_calendar',
    'active',
    '{
        "create_events": true,
        "calendar_id": "primary"
    }',
    CURRENT_TIMESTAMP - INTERVAL '7 days'
);

-- Insert sample settings
INSERT INTO settings (id, user_id, category, key, value) VALUES
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'timer',
    'work_duration',
    '25'
),
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d480',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'timer',
    'short_break_duration',
    '5'
),
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d481',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'timer',
    'long_break_duration',
    '15'
),
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d482',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'notifications',
    'sound_enabled',
    'true'
),
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d483',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'notifications',
    'browser_notifications',
    'true'
),
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d484',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'timer',
    'work_duration',
    '30'
),
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d485',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'timer',
    'auto_start_breaks',
    'true'
);

-- Insert sample session history
INSERT INTO session_history (id, user_id, date, total_sessions, completed_sessions, total_focus_time, completed_tasks, average_session_duration, productivity_score) VALUES
(
    'g47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    CURRENT_DATE - INTERVAL '2 days',
    8,
    6,
    150,
    3,
    25.0,
    75.5
),
(
    'g47ac10b-58cc-4372-a567-0e02b2c3d480',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    CURRENT_DATE - INTERVAL '1 day',
    6,
    5,
    125,
    2,
    25.0,
    68.2
),
(
    'g47ac10b-58cc-4372-a567-0e02b2c3d481',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    CURRENT_DATE,
    4,
    3,
    72,
    1,
    24.0,
    52.8
),
(
    'g47ac10b-58cc-4372-a567-0e02b2c3d482',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    CURRENT_DATE - INTERVAL '1 day',
    5,
    4,
    120,
    1,
    30.0,
    65.0
),
(
    'g47ac10b-58cc-4372-a567-0e02b2c3d483',
    'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    CURRENT_DATE - INTERVAL '3 days',
    3,
    2,
    50,
    1,
    25.0,
    35.5
);

-- Insert sample activity log
INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, metadata) VALUES
(
    'h47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'task_created',
    'task',
    'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    '{"title": "Complete project proposal", "priority": "high"}'
),
(
    'h47ac10b-58cc-4372-a567-0e02b2c3d480',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'session_completed',
    'pomodoro_session',
    'c47ac10b-58cc-4372-a567-0e02b2c3d479',
    '{"duration": 25, "session_type": "work"}'
),
(
    'h47ac10b-58cc-4372-a567-0e02b2c3d481',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'task_completed',
    'task',
    'b47ac10b-58cc-4372-a567-0e02b2c3d482',
    '{"title": "Review code submissions", "pomodoros": 4}'
),
(
    'h47ac10b-58cc-4372-a567-0e02b2c3d482',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'integration_connected',
    'integration',
    'd47ac10b-58cc-4372-a567-0e02b2c3d479',
    '{"service": "spotify"}'
),
(
    'h47ac10b-58cc-4372-a567-0e02b2c3d483',
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'project_created',
    'project',
    'a47ac10b-58cc-4372-a567-0e02b2c3d482',
    '{"name": "Learning JavaScript", "color": "#f39c12"}'
);

-- Update completed_at for completed tasks
UPDATE tasks SET completed_at = CURRENT_TIMESTAMP - INTERVAL '1 day' 
WHERE status = 'completed';

-- Update last_login for users
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '30 minutes';

-- Create some realistic time variations for sessions
UPDATE pomodoro_sessions 
SET started_at = started_at - INTERVAL '1 day',
    completed_at = completed_at - INTERVAL '1 day'
WHERE id IN ('c47ac10b-58cc-4372-a567-0e02b2c3d483', 'c47ac10b-58cc-4372-a567-0e02b2c3d484');

-- Add some more realistic task due dates
UPDATE tasks SET due_date = CURRENT_DATE + INTERVAL '1 day' 
WHERE id = 'b47ac10b-58cc-4372-a567-0e02b2c3d480';

UPDATE tasks SET due_date = CURRENT_DATE + INTERVAL '5 days' 
WHERE id = 'b47ac10b-58cc-4372-a567-0e02b2c3d485';

-- Set some tasks as overdue for demo purposes
UPDATE tasks SET due_date = CURRENT_DATE - INTERVAL '2 days',
                 status = 'pending'
WHERE id = 'b47ac10b-58cc-4372-a567-0e02b2c3d481';
