# PomoFocus - Production Pomodoro Timer

A web-first Pomodoro productivity app with task management and integrations.

## 🎯 Features

- **Accurate Timer**: Resilient to backgrounding/sleep with monotonic time
- **Task Management**: Local tasks + integrations (Todoist, MS To Do, Planner)
- **Music Integration**: Spotify focus/break playlists
- **Calendar Sync**: Mark busy blocks in Google/Outlook calendars
- **Session Summaries**: Track productivity with optional sharing

## 🏗️ Architecture

Clean architecture with ports & adapters:
- **Domain**: Pure business logic (timer, tasks, sessions)
- **Application**: Use cases and services
- **Ports**: Provider interfaces
- **Infrastructure**: External adapters (APIs, storage)
- **UI**: React components and features

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 📱 Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind
- **State**: Zustand + TanStack Query
- **Storage**: IndexedDB (Dexie)
- **Testing**: Vitest + React Testing Library + Playwright
- **Integrations**: Todoist, Microsoft Graph, Spotify APIs

## 🔧 Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run unit tests
npm run test:e2e     # Run e2e tests
npm run lint         # Lint code
npm run format       # Format code
```

## 📖 Documentation

- [Architecture Decision Records](docs/adrs/)
- [OAuth Setup Guide](docs/oauth-setup.md)
- [API Integration Guide](docs/integrations.md)

## 📝 TODO

- [ ] Remove focus mode buttons as functionality is handled in the background.
- [ ] Ensure skip exits focus mode properly.
- [ ] Clean up unused variables and optimize code.
- [ ] Add more tests for edge cases.
- [ ] Improve documentation for new contributors.
