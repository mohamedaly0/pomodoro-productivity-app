// Utility functions for ID generation

/**
 * Generate a UUID v4 string
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Generate a short alphanumeric ID (for non-persistent IDs)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 15)
}
