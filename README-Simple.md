# 🍅 PomoFocus - Simple Pomodoro Timer

A clean, professional Pomodoro timer application focused purely on productivity and time management.

## ✨ Features

### Core Pomodoro Functionality
- **25-minute Work Sessions** with 5-minute short breaks and 15-minute long breaks
- **Visual Timer** with progress bar and countdown display
- **Auto-advance** between work and break sessions
- **Professional Design** with smooth animations and transitions

### Task Management
- **Add Tasks** to focus on during Pomodoro sessions
- **Track Progress** with pomodoro count per task
- **Complete Tasks** and mark them as done
- **Task Selection** for focused work sessions

### Statistics & Progress
- **Daily Statistics** showing completed pomodoros and focus time
- **Session History** tracking all completed sessions
- **Local Storage** for persistent data

### User Experience
- **Keyboard Shortcuts** (Space to start/pause, R to reset)
- **Responsive Design** for desktop and mobile
- **Visual Feedback** with notifications and mode-specific backgrounds
- **Professional UI** with modern design principles

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd 03-PomoFocus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and go to:
   ```
   http://localhost:3000
   ```

## 🎯 How to Use

### Starting a Pomodoro Session
1. **Add a Task** using the task input field
2. **Select the Task** you want to focus on
3. **Choose Mode**: Work (25 min), Short Break (5 min), or Long Break (15 min)
4. **Click Start** or press Space to begin
5. **Focus!** The timer will automatically advance to the next session

### Keyboard Shortcuts
- `Space` - Start/Pause timer
- `R` - Reset timer
- `Enter` - Add new task (when typing in task field)

## 🏗️ Project Structure

```
03-PomoFocus/
├── server-simple.js          # Simple Express server
├── package.json              # Dependencies and scripts
├── public/
│   ├── index.html            # Original (complex) version
│   └── index-clean.html      # Clean, focused version
└── server.js                 # Original (complex) server with auth
```

## 📚 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Sessions
- `POST /api/sessions/start` - Start a pomodoro session
- `POST /api/sessions/complete/:id` - Complete a session
- `GET /api/sessions` - Get session history

### Utility
- `GET /api/health` - Health check
- `GET /api/test` - Test endpoint

## 🎨 Design Philosophy

This simple version focuses on:

### Minimalism
- **Pure Pomodoro Functionality** without complex integrations
- **Clean UI** with essential features only
- **Professional Aesthetics** with modern design

### User Experience
- **Intuitive Interface** that's easy to understand
- **Smooth Animations** for pleasant interactions
- **Responsive Design** that works on all devices

### Performance
- **Lightweight** with minimal dependencies
- **Fast Loading** with optimized assets
- **Efficient** in-memory data storage

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restarts.

### File Structure
- **server-simple.js** - Lightweight Express server
- **public/index-clean.html** - Single-file app with embedded CSS/JS
- **Original files** kept for reference and future enhancement

## 🚀 Future Enhancements

When ready to expand the application, you can:

1. **Uncomment Authentication** in the original server.js
2. **Add Database Integration** (Supabase/PostgreSQL)
3. **Integrate with External Services**:
   - Spotify for background music
   - Calendar for scheduling
   - Notion/Todoist for task management
4. **Add User Accounts** and data synchronization
5. **Implement Advanced Analytics** and reporting

## 🎯 Key Benefits

### For Productivity
- **Proven Pomodoro Technique** implementation
- **Distraction-free Focus** on one task at a time
- **Progress Tracking** to see daily achievements

### For Development
- **Simple Codebase** easy to understand and modify
- **Modern JavaScript** with clean ES6+ syntax
- **Modular Design** ready for future enhancements

## 🏆 Best Practices Implemented

- **Clean Code** with proper separation of concerns
- **Error Handling** for robust operation
- **Responsive Design** for all screen sizes
- **Accessibility** with keyboard navigation
- **Performance** optimized for smooth operation

---

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

This is a learning project focused on simplicity. Future enhancements should maintain the clean, focused approach while adding valuable features.
