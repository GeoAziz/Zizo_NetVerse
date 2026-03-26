'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ExportPanel } from './ExportPanel';
import { useWebSocketConnection, useVisualizationDataCapture, useLiveStats } from '@/hooks/useVisualization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DeviceUpdate, ConnectionUpdate, ThreatEvent } from '@/lib/websocketClient';
import { Skeleton } from '@/components/ui/skeleton';

const LANVisualization = dynamic(() => import('./LANVisualization'), { ssr: false });

interface LANViewContainerProps {
  enableExport?: boolean;
  showStats?: boolean;
}

export function LANViewContainer({ enableExport = true, showStats = true }: LANViewContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { subscribe, isConnected } = useWebSocketConnection();
  const { updateSnapshot, getSnapshot } = useVisualizationDataCapture();
  const { updateStats, getStats } = useLiveStats();
  const devicesRef = useRef<Map<string, any>>(new Map());
  const trafficRef = useRef<any[]>([]);
  const threatsRef = useRef<any[]>([]);
  const [stats, setStats] = useState({ devices: 0, threats: 0 });

  // Track visualization data from WebSocket
  useEffect(() => {
    if (!subscribe) return;

    // Subscribe to device updates
    const unsubDevice = subscribe('device_update', (message) => {
      const device = message.data as DeviceUpdate;
      devicesRef.current.set(device.id, device);
      updateSnapshot({ devices: devicesRef.current });
      setStats((prev) => ({ ...prev, devices: devicesRef.current.size }));
    });

    // Subscribe to traffic updates
    const unsubTraffic = subscribe('connection_update', (message) => {
      const traffic = message.data as ConnectionUpdate;
      trafficRef.current = [traffic, ...trafficRef.current].slice(0, 1000);
      updateSnapshot({ traffic: trafficRef.current });
    });

    // Subscribe to threat updates
    const unsubThreat = subscribe('threat_event', (message) => {
      const threat = message.data as ThreatEvent;
      threatsRef.current = [threat, ...threatsRef.current].slice(0, 100);
      updateSnapshot({ threats: threatsRef.current });
      setStats((prev) => ({ ...prev, threats: threatsRef.current.length }));
    });

    return () => {
      unsubDevice?.();
      unsubTraffic?.();
      unsubThreat?.();
    };
  }, [subscribe, updateSnapshot]);

  return (
    <div className="relative space-y-4">
      {/* Export Panel */}
      {enableExport && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Visualization Controls</CardTitle>
                <CardDescription>
                  {isConnected ? 'Connected to live data' : 'Using mock data'}
                </CardDescription>
              </div>
              <ExportPanel
                devices={devicesRef.current}
                traffic={trafficRef.current}
                threats={threatsRef.current}
                canvasRef={canvasRef.current}
                title="LAN-View"
              />
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Visualization */}
      <Card className="min-h-[600px]">
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            {isConnected !== undefined ? (
              <LANVisualization />
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Panel */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Live Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Devices</p>
                <p className="text-2xl font-semibold">{stats.devices}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Threats</p>
                <p className="text-2xl font-semibold">{stats.threats}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Traffic Events</p>
                <p className="text-2xl font-semibold">{trafficRef.current.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Connection</p>
                <p className={`text-2xl font-semibold ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isConnected ? 'Online' : 'Mock'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
