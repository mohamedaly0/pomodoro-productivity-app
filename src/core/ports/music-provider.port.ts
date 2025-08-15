// Music provider port - abstracts music playback systems

export interface MusicProviderPort {
  readonly id: MusicProviderId
  readonly name: string
  readonly requiresAuth: boolean

  // Authentication & Connection
  connect(): Promise<MusicProviderResult<void>>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>

  // Device Management
  getAvailableDevices(): Promise<MusicProviderResult<PlaybackDevice[]>>
  setActiveDevice(deviceId: string): Promise<MusicProviderResult<void>>

  // Playback Control
  play(context?: PlaybackContext): Promise<MusicProviderResult<void>>
  pause(): Promise<MusicProviderResult<void>>
  next(): Promise<MusicProviderResult<void>>
  previous(): Promise<MusicProviderResult<void>>
  setVolume(volume: number): Promise<MusicProviderResult<void>> // 0-100

  // State
  getCurrentTrack(): Promise<MusicProviderResult<Track | null>>
  getPlaybackState(): Promise<MusicProviderResult<PlaybackState>>

  // Playlists & Context
  searchPlaylists(query: string): Promise<MusicProviderResult<Playlist[]>>
  getPlaylist(id: string): Promise<MusicProviderResult<Playlist>>
  getUserPlaylists(): Promise<MusicProviderResult<Playlist[]>>
}

export type MusicProviderId = 'spotify' | 'local'

export interface PlaybackDevice {
  id: string
  name: string
  type: 'computer' | 'smartphone' | 'speaker' | 'tv' | 'unknown'
  active: boolean
  volumePercent: number
  supportsVolume: boolean
}

export interface Track {
  id: string
  name: string
  artists: string[]
  album: string
  durationMs: number
  previewUrl?: string
  imageUrl?: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  trackCount: number
  imageUrl?: string
  owner: string
  public: boolean
}

export interface PlaybackContext {
  type: 'playlist' | 'album' | 'track'
  uri: string // Spotify URI or local file path
  shuffle?: boolean
  repeatMode?: 'off' | 'track' | 'context'
}

export interface PlaybackState {
  isPlaying: boolean
  track: Track | null
  positionMs: number
  volumePercent: number
  shuffle: boolean
  repeatMode: 'off' | 'track' | 'context'
  device: PlaybackDevice | null
}

// Result type with error handling
export type MusicProviderResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: MusicProviderError
}

export interface MusicProviderError {
  code: MusicProviderErrorCode
  message: string
  retryable: boolean
  retryAfterMs?: number
}

export type MusicProviderErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'NO_ACTIVE_DEVICE'
  | 'PREMIUM_REQUIRED'
  | 'PLAYBACK_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Music settings for different cycle types
 */
export interface MusicSettings {
  enabled: boolean
  focusPlaylist?: string
  breakPlaylist?: string
  volume: number // 0-100
  autoPlay: boolean
}

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  enabled: false,
  volume: 50,
  autoPlay: false,
}
