# Pomodoro Productivity App

A comprehensive productivity application that combines the Pomodoro technique with task management and integrations with popular services like Todoist, Spotify, and Google Calendar.

## Features

- 🍅 **Pomodoro Timer**: Focus sessions with customizable work and break intervals
- ✅ **Task Management**: Create, organize, and track your tasks
- 🎵 **Spotify Integration**: Play focus music during work sessions
- 📅 **Calendar Integration**: Sync with Google Calendar
- 📋 **Todoist Sync**: Import and sync tasks from Todoist
- 🤖 **n8n Automation**: Automated workflows for productivity
- 📊 **Analytics**: Track your productivity patterns

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pomodoro-productivity-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Set up the database**
   ```bash
   # Run the database schema
   npm run db:setup
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Environment Setup

### Required API Keys

1. **Supabase**: Database and authentication
   - Create a project at [supabase.com](https://supabase.com)
   - Get your URL and anon key from project settings

2. **Todoist**: Task integration
   - Create an app at [todoist.com/app_consoles](https://todoist.com/app_consoles)
   - Get your client ID and secret

3. **Spotify**: Music integration
   - Create an app at [developer.spotify.com](https://developer.spotify.com)
   - Get your client ID and secret

4. **Google Calendar**: Calendar integration
   - Set up a project in [Google Cloud Console](https://console.cloud.google.com)
   - Enable Calendar API and get credentials

### Database Schema

The app uses Supabase (PostgreSQL) with the following main tables:
- `users`: User accounts and preferences
- `tasks`: Task management
- `pomodoro_sessions`: Timer session tracking
- `integrations`: Third-party service connections

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Tasks
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Pomodoro
- `POST /api/pomodoro/start` - Start timer session
- `POST /api/pomodoro/complete` - Complete session
- `GET /api/pomodoro/stats` - Get session statistics

### Integrations
- `GET /api/todoist/connect` - Connect Todoist account
- `GET /api/spotify/connect` - Connect Spotify account
- `GET /api/calendar/connect` - Connect Google Calendar

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT, OAuth 2.0
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Automation**: n8n workflows
- **APIs**: Todoist, Spotify Web API, Google Calendar API

## Project Structure

```
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── config/                # Configuration files
├── routes/                # API endpoints
├── middleware/            # Custom middleware
├── public/                # Frontend files
├── database/              # Database schemas
├── n8n-workflows/         # Automation workflows
└── utils/                 # Helper functions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help setting up the project, please open an issue or contact the maintainers.
