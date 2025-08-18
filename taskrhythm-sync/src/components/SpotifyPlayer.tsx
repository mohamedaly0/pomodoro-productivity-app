import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, Volume2, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: any) => any;
    };
  }
}

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
  duration_ms: number;
}

interface SpotifyPlayerProps {
  isTimerRunning: boolean;
  timerMode: 'focus' | 'short-break' | 'long-break';
  onConnect?: () => void;
}

export const SpotifyPlayer = ({ isTimerRunning, timerMode, onConnect }: SpotifyPlayerProps) => {
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolume] = useState(30);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [deviceId, setDeviceId] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [hasSpotifyPremium, setHasSpotifyPremium] = useState<boolean | null>(null);
  
  const playerRef = useRef<any>(null);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (window.Spotify) {
      initializePlayer();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = initializePlayer;

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializePlayer = async () => {
    // In a real app, you'd fetch this from your backend API
    // For now, we'll show the UI without actual connectivity
    console.log('Spotify SDK ready - would initialize player here');
    setIsReady(true);
    
    // Mock data for demo purposes
    setCurrentTrack({
      id: 'demo',
      name: 'Lo-Fi Study Beats',
      artists: [{ name: 'Focus Music' }],
      album: { 
        name: 'Concentration Sounds', 
        images: [{ url: '/placeholder.svg' }] 
      },
      duration_ms: 180000
    });
  };

  // Handle timer state changes
  useEffect(() => {
    if (!isReady) return;

    if (timerMode === 'focus' && isTimerRunning && isPaused) {
      // Auto-play focus music when timer starts
      handlePlay();
    } else if (timerMode !== 'focus' && !isPaused) {
      // Pause music during breaks (optional)
      handlePause();
    }
  }, [isTimerRunning, timerMode, isReady]);

  const handlePlay = () => {
    setIsPaused(false);
    // In real implementation: player.resume()
  };

  const handlePause = () => {
    setIsPaused(true);
    // In real implementation: player.pause()
  };

  const handleNext = () => {
    // In real implementation: player.nextTrack()
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
    // In real implementation: player.setVolume(newVolume[0] / 100)
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show connection prompt if not ready
  if (!isReady || hasSpotifyPremium === false) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Connect Spotify</h3>
            <p className="text-sm text-muted-foreground">
              {hasSpotifyPremium === false 
                ? 'Spotify Premium required for music control'
                : 'Play focus music during your sessions'
              }
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onConnect}
            disabled={hasSpotifyPremium === false}
          >
            Connect
          </Button>
        </div>
      </Card>
    );
  }

  // Show mini player when ready
  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Track Info */}
        {currentTrack && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-focus rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{currentTrack.name}</div>
              <div className="text-sm text-muted-foreground truncate">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {timerMode === 'focus' ? '🎵 Focus' : '🎵 Break'}
            </Badge>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? handlePlay : handlePause}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleNext}>
            <SkipForward className="w-4 h-4" />
          </Button>

          <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTime(position)}</span>
            <div className="flex-1 h-1 bg-muted rounded">
              <div 
                className="h-full bg-primary rounded transition-all duration-300"
                style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>

        {/* Auto-play indicator */}
        {timerMode === 'focus' && (
          <div className="text-xs text-muted-foreground text-center">
            🎵 Auto-playing focus music during Pomodoro sessions
          </div>
        )}
      </div>
    </Card>
  );
};