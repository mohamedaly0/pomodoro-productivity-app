// Calendar provider port - abstracts calendar systems for busy time blocking

export interface CalendarProviderPort {
  readonly id: CalendarProviderId
  readonly name: string
  readonly requiresAuth: boolean

  // Authentication
  connect(): Promise<CalendarProviderResult<void>>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>

  // Calendar management
  ensureCalendar(name: string): Promise<CalendarProviderResult<Calendar>>
  listCalendars(): Promise<CalendarProviderResult<Calendar[]>>

  // Event management for focus blocks
  createEvent(data: CreateEventData): Promise<CalendarProviderResult<CalendarEvent>>
  updateEvent(
    eventId: string,
    data: UpdateEventData
  ): Promise<CalendarProviderResult<CalendarEvent>>
  deleteEvent(eventId: string): Promise<CalendarProviderResult<void>>
  getEvent(eventId: string): Promise<CalendarProviderResult<CalendarEvent>>
}

export type CalendarProviderId = 'google' | 'ms_graph' | 'ics'

export interface Calendar {
  id: string
  name: string
  primary: boolean
  canWrite: boolean
}

export interface CalendarEvent {
  id: string
  calendarId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  showAs: 'free' | 'busy' | 'tentative' | 'outOfOffice'
  location?: string
}

export interface CreateEventData {
  calendarId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  showAs?: 'free' | 'busy' | 'tentative' | 'outOfOffice'
  location?: string
}

export interface UpdateEventData {
  title?: string
  description?: string
  endTime?: Date // Most common update: shortening focus block
  showAs?: 'free' | 'busy' | 'tentative' | 'outOfOffice'
}

// Result type with error handling
export type CalendarProviderResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: CalendarProviderError
}

export interface CalendarProviderError {
  code: CalendarProviderErrorCode
  message: string
  retryable: boolean
  retryAfterMs?: number
}

export type CalendarProviderErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CALENDAR_READONLY'
  | 'TIMEZONE_ERROR'
  | 'UNKNOWN_ERROR'
