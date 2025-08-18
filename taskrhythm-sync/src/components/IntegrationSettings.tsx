import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Music, CheckSquare, Calendar, ExternalLink, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntegrationSettingsProps {
  onConnect: (service: 'spotify' | 'todoist' | 'calendar') => void;
}

export const IntegrationSettings = ({ onConnect }: IntegrationSettingsProps) => {
  const [autoPlayMusic, setAutoPlayMusic] = useState(true);
  const [autoSyncTasks, setAutoSyncTasks] = useState(false);
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [workHours, setWorkHours] = useState({ start: '09:00', end: '17:00' });
  const [selectedCalendar, setSelectedCalendar] = useState('primary');

  // Mock connection states (in real app, these would come from your backend)
  const [connections] = useState({
    spotify: false,
    todoist: false,
    calendar: false,
  });

  const integrations = [
    {
      id: 'spotify',
      name: 'Spotify',
      description: 'Play focus music during Pomodoro sessions',
      icon: Music,
      color: 'bg-green-500',
      connected: connections.spotify,
      features: [
        'Auto-play focus playlists during work sessions',
        'Pause music during breaks',
        'Control playback from the timer',
        'Requires Spotify Premium'
      ]
    },
    {
      id: 'todoist',
      name: 'Todoist',
      description: 'Sync tasks and get updates in real-time',
      icon: CheckSquare,
      color: 'bg-red-500',
      connected: connections.todoist,
      features: [
        'Two-way task synchronization',
        'Real-time updates via webhooks',
        'Import existing projects and labels',
        'Automatic Pomodoro estimates'
      ]
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Auto-schedule focus blocks in your calendar',
      icon: Calendar,
      color: 'bg-blue-500',
      connected: connections.calendar,
      features: [
        'Find free time slots automatically',
        'Schedule Pomodoro blocks',
        'Respect existing meetings',
        'Create focus time events'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your favorite apps to supercharge your productivity workflow.
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", integration.color)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{integration.name}</h3>
                    {integration.connected ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Connected</Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{integration.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    {integration.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => onConnect(integration.id as any)}
                    variant={integration.connected ? "outline" : "default"}
                    className="w-full sm:w-auto"
                  >
                    {integration.connected ? (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect {integration.name}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Automation Settings</h3>
        
        <div className="space-y-6">
          {/* Spotify Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-play">Auto-play focus music</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start music when a Pomodoro session begins
                </p>
              </div>
              <Switch 
                id="auto-play"
                checked={autoPlayMusic}
                onCheckedChange={setAutoPlayMusic}
                disabled={!connections.spotify}
              />
            </div>
          </div>

          <Separator />

          {/* Todoist Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync">Auto-sync tasks</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically import and sync tasks from Todoist
                </p>
              </div>
              <Switch 
                id="auto-sync"
                checked={autoSyncTasks}
                onCheckedChange={setAutoSyncTasks}
                disabled={!connections.todoist}
              />
            </div>
          </div>

          <Separator />

          {/* Calendar Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-schedule">Auto-schedule focus blocks</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically find free time and schedule Pomodoro sessions
                </p>
              </div>
              <Switch 
                id="auto-schedule"
                checked={autoSchedule}
                onCheckedChange={setAutoSchedule}
                disabled={!connections.calendar}
              />
            </div>

            {connections.calendar && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work-start">Work hours start</Label>
                    <Input
                      id="work-start"
                      type="time"
                      value={workHours.start}
                      onChange={(e) => setWorkHours(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="work-end">Work hours end</Label>
                    <Input
                      id="work-end"
                      type="time"
                      value={workHours.end}
                      onChange={(e) => setWorkHours(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="calendar-select">Primary calendar</Label>
                  <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary Calendar</SelectItem>
                      <SelectItem value="work">Work Calendar</SelectItem>
                      <SelectItem value="personal">Personal Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Help Text */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
          <div>
            <p className="text-sm font-medium mb-1">Need backend integration?</p>
            <p className="text-sm text-muted-foreground">
              To enable full OAuth authentication and real-time sync, connect your project to Supabase 
              for secure token storage and API endpoints.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};