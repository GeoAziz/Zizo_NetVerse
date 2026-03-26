'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ExportPanel } from './ExportPanel';
import { useWebSocketConnection, useVisualizationDataCapture } from '@/hooks/useVisualization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThreatEvent } from '@/lib/websocketClient';
import { Skeleton } from '@/components/ui/skeleton';

const ThreatMapVisualization = dynamic(() => import('./ThreatMapVisualization'), { ssr: false });

interface ThreatMapContainerProps {
  enableExport?: boolean;
  showStats?: boolean;
}

export function ThreatMapContainer({ enableExport = true, showStats = true }: ThreatMapContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { subscribe, isConnected } = useWebSocketConnection();
  const { updateSnapshot } = useVisualizationDataCapture();
  const threatsRef = useRef<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  // Track threat data from WebSocket
  useEffect(() => {
    if (!subscribe) return;

    const unsubThreat = subscribe('threat_event', (message) => {
      const threat = message.data as ThreatEvent;
      threatsRef.current = [threat, ...threatsRef.current].slice(0, 200);
      updateSnapshot({ threats: threatsRef.current });

      // Calculate severity distribution
      const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
      threatsRef.current.forEach((t) => {
        distribution[t.data.severity as keyof typeof distribution]++;
      });

      setStats({
        total: threatsRef.current.length,
        ...distribution,
      });
    });

    return () => {
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
                <CardTitle>Threat Intelligence Map</CardTitle>
                <CardDescription>
                  {isConnected ? 'Connected to live threats' : 'Using mock threat data'}
                </CardDescription>
              </div>
              <ExportPanel
                threats={threatsRef.current}
                canvasRef={canvasRef.current}
                title="Threat-Map"
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
              <ThreatMapVisualization />
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
            <CardTitle className="text-sm">Threat Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div>
                <p className="text-xs text-muted-foreground">Total Threats</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Critical</Badge>
                  <span className="text-lg font-semibold">{stats.critical}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-orange-500">
                    High
                  </Badge>
                  <span className="text-lg font-semibold">{stats.high}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Medium</Badge>
                  <span className="text-lg font-semibold">{stats.medium}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Low</Badge>
                  <span className="text-lg font-semibold">{stats.low}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
