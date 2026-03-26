'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ExportPanel } from './ExportPanel';
import { useWebSocketConnection, useVisualizationDataCapture } from '@/hooks/useVisualization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConnectionUpdate, ThreatEvent } from '@/lib/websocketClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { getTraceForVisualization, convertTracerouteToVisualization } from '@/lib/hopTracingApi';
import type { HopVisualization } from '@/lib/hopTracingTypes';

const WANVisualization = dynamic(() => import('./WANVisualization'), { ssr: false });

interface WANViewContainerProps {
  enableExport?: boolean;
  showStats?: boolean;
}

export function WANViewContainer({ enableExport = true, showStats = true }: WANViewContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { subscribe, isConnected } = useWebSocketConnection();
  const { updateSnapshot } = useVisualizationDataCapture();
  const trafficRef = useRef<any[]>([]);
  const threatsRef = useRef<any[]>([]);
  const [stats, setStats] = useState({ traffic: 0, threats: 0 });
  
  // Hop tracing state
  const [traceTarget, setTraceTarget] = useState<string>('');
  const [isTracing, setIsTracing] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traceSuccess, setTraceSuccess] = useState(false);
  const [hopVisualizations, setHopVisualizations] = useState<HopVisualization[]>([]);

  // Track visualization data from WebSocket
  useEffect(() => {
    if (!subscribe) return;

    // Subscribe to traffic updates
    const unsubTraffic = subscribe('connection_update', (message) => {
      const traffic = message.data as ConnectionUpdate;
      trafficRef.current = [traffic, ...trafficRef.current].slice(0, 500);
      updateSnapshot({ traffic: trafficRef.current });
      setStats((prev) => ({ ...prev, traffic: trafficRef.current.length }));
    });

    // Subscribe to threat updates
    const unsubThreat = subscribe('threat_event', (message) => {
      const threat = message.data as ThreatEvent;
      threatsRef.current = [threat, ...threatsRef.current].slice(0, 100);
      updateSnapshot({ threats: threatsRef.current });
      setStats((prev) => ({ ...prev, threats: threatsRef.current.length }));
    });

    return () => {
      unsubTraffic?.();
      unsubThreat?.();
    };
  }, [subscribe, updateSnapshot]);

  // Handle traceroute request
  const handleTraceRoute = async () => {
    if (!traceTarget.trim()) {
      setTraceError('Please enter a destination IP or hostname');
      return;
    }

    setIsTracing(true);
    setTraceError(null);
    setTraceSuccess(false);

    try {
      const traceData = await getTraceForVisualization(traceTarget);
      const visualization = convertTracerouteToVisualization(traceData);
      
      setHopVisualizations((prev) => [...prev, visualization]);
      setTraceSuccess(true);
      setTraceTarget('');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setTraceSuccess(false);
      }, 3000);
    } catch (error: any) {
      setTraceError(
        error?.message || 'Failed to trace route. Check the destination and try again.'
      );
    } finally {
      setIsTracing(false);
    }
  };

  return (
    <div className="relative space-y-4">
      {/* Export Panel & Hop Tracing */}
      {enableExport && (
        <Card>
          <CardHeader className="pb-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>WAN Visualization Controls</CardTitle>
                  <CardDescription>
                    {isConnected ? 'Connected to live data' : 'Using mock data'}
                  </CardDescription>
                </div>
                <ExportPanel
                  traffic={trafficRef.current}
                  threats={threatsRef.current}
                  canvasRef={canvasRef.current}
                  title="WAN-View"
                />
              </div>

              {/* Hop Tracing Control */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Trace Route to Destination</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter IP address or hostname (e.g., 8.8.8.8)"
                    value={traceTarget}
                    onChange={(e) => setTraceTarget(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTraceRoute();
                      }
                    }}
                    disabled={isTracing}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTraceRoute}
                    disabled={isTracing || !traceTarget.trim()}
                    size="sm"
                  >
                    {isTracing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Tracing...
                      </>
                    ) : (
                      'Trace'
                    )}
                  </Button>
                </div>

                {/* Status messages */}
                {traceError && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {traceError}
                  </div>
                )}

                {traceSuccess && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Route traced successfully! Now visualizing on globe...
                  </div>
                )}

                {/* Active traces info */}
                {hopVisualizations.length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    {hopVisualizations.length} active hop visualization{hopVisualizations.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Visualization */}
      <Card className="min-h-[600px]">
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            {isConnected !== undefined ? (
              <WANVisualization hopVisualizations={hopVisualizations} />
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
            <CardTitle className="text-sm">WAN Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Active Traffic</p>
                <p className="text-2xl font-semibold">{stats.traffic}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-semibold">{stats.threats}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hop Traces</p>
                <p className="text-2xl font-semibold">{hopVisualizations.length}</p>
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
