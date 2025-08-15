import '@testing-library/jest-dom'

// Mock browser APIs that might not be available in test environment
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  },
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: () => Promise.resolve('granted'),
  },
})

// Mock performance.now for timer tests
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now(),
  },
})
