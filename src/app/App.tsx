import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, ThemeToggle } from '@/features/theme/theme-provider'
import { TimerControls } from '@/features/timer/TimerControls'
import { TaskList } from '@/features/tasks/TaskList'

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-bg text-text-base">
            <div className="container mx-auto px-4 py-8">
              <header className="flex justify-between items-center mb-8">
                <div className="text-center flex-1">
                  <h1 className="text-4xl font-bold text-primary mb-2">
                    PomoFocus
                  </h1>
                  <p className="text-text-subtle">
                    Production-ready Pomodoro timer with task management
                  </p>
                </div>
                <ThemeToggle />
              </header>
              
              <main className="max-w-4xl mx-auto">
                <div className="card p-8 mb-8">
                  <TimerControls />
                </div>
                
                <div className="card p-6">
                  <TaskList />
                </div>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
