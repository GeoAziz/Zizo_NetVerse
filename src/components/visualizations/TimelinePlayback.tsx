'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'device_update' | 'threat_event' | 'connection_update';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  data: any;
}

interface TimelinePlaybackProps {
  events: TimelineEvent[];
  onEventPlay?: (event: TimelineEvent) => void;
  onTimeChange?: (timestamp: number) => void;
  duration?: number; // in seconds
}

export function TimelinePlayback({
  events,
  onEventPlay,
  onTimeChange,
  duration = 300,
}: TimelinePlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(Date.now());

  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  // Get current event
  const currentEvent = sortedEvents.find((e) => {
    const eventProgress = (e.timestamp / (sortedEvents[sortedEvents.length - 1]?.timestamp || 1)) * 100;
    return eventProgress <= (currentTime / duration) * 100;
  });

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000 * speed;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const newTime = Math.min(prev + deltaTime, duration);
        onTimeChange?.(newTime);

        // Play event sound if not muted (simulated)
        if (currentEvent && !isMuted) {
          onEventPlay?.(currentEvent);
        }

        if (newTime >= duration) {
          setIsPlaying(false);
          return duration;
        }

        return newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, isMuted, duration, onTimeChange, onEventPlay, currentEvent]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    lastTimeRef.current = Date.now();
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    onTimeChange?.(0);
  }, [onTimeChange]);

  const handleSkip = useCallback((amount: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(prev + amount, duration)));
  }, [duration]);

  const handleSliderChange = useCallback((value: number[]) => {
    setCurrentTime(value[0]);
    onTimeChange?.(value[0]);
  }, [onTimeChange]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const eventDensity = sortedEvents.length / (duration / 60); // events per minute

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Timeline Playback</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{sortedEvents.length} events</Badge>
            <Badge variant="secondary">
              {eventDensity.toFixed(2)} evt/min
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline Slider */}
        <div className="space-y-2">
          <Slider
            min={0}
            max={duration}
            step={0.1}
            value={[currentTime]}
            onValueChange={handleSliderChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Event Marker Track */}
        <div className="space-y-2">
          <div className="text-xs font-semibold">Events ({sortedEvents.length})</div>
          <div className="relative h-8 bg-muted rounded flex items-center overflow-hidden">
            {sortedEvents.map((event, idx) => {
              const progress = (event.timestamp / (sortedEvents[sortedEvents.length - 1]?.timestamp || 1)) * 100;
              const color = {
                device_update: 'bg-blue-500',
                threat_event: 'bg-red-500',
                connection_update: 'bg-green-500',
              }[event.type];

              return (
                <div
                  key={event.id}
                  className={`absolute h-full w-1 ${color} opacity-75 hover:opacity-100 cursor-pointer transition-opacity`}
                  style={{ left: `${progress}%` }}
                  title={event.description}
                />
              );
            })}
          </div>
        </div>

        {/* Current Event Info */}
        {currentEvent && (
          <div className="p-2 rounded bg-accent text-sm space-y-1">
            <div className="font-semibold flex items-center gap-2">
              <Badge variant="secondary">{currentEvent.type}</Badge>
              {currentEvent.severity && (
                <Badge variant={currentEvent.severity === 'critical' ? 'destructive' : 'default'}>
                  {currentEvent.severity}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{currentEvent.description}</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(currentEvent.timestamp)}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkip(-10)}
            title="Skip back 10s"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handlePlayPause}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause ({speed}x)
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play ({speed}x)
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkip(10)}
            title="Skip forward 10s"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            title="Reset to start"
          >
            Reset
          </Button>
        </div>

        {/* Speed Control */}
        <div className="space-y-2">
          <label className="text-xs font-semibold">Playback Speed</label>
          <div className="flex gap-2">
            {[0.5, 1, 1.5, 2].map((s) => (
              <Button
                key={s}
                variant={speed === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSpeed(s)}
                className="flex-1"
              >
                {s}x
              </Button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs">
          <div className="font-semibold">Event Types</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Device Update</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Threat Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Connection</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
