'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Copy, Share2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceUpdate, WANTraffic, ThreatEvent } from '@/lib/websocketClient';

interface InspectionPanelProps {
  title: string;
  onClose: () => void;
  data?: any;
  children?: React.ReactNode;
}

export function InspectionPanel({ title, onClose, data, children }: InspectionPanelProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="absolute bottom-0 right-0 w-96 shadow-2xl border-border/50 bg-background/95 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{data?.id || 'No ID'}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="pb-4">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <ScrollArea className="h-96 pr-4">
              {children || (
                <div className="space-y-4">
                  {data && Object.entries(data).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1 text-sm">
                      <p className="font-medium text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-foreground break-all font-mono text-xs bg-background/50 p-2 rounded border border-border/50">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="raw">
            <ScrollArea className="h-96 pr-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-background/50 p-3 rounded border border-border/50">
                {JSON.stringify(data, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DeviceInspectionPanelProps {
  device: DeviceUpdate;
  onClose: () => void;
}

export function DeviceInspectionPanel({ device, onClose }: DeviceInspectionPanelProps) {
  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-green-500/20 text-green-700 border-green-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-600' : status === 'suspicious' ? 'text-red-600' : 'text-gray-600';
  };

  return (
    <InspectionPanel title={device.name} onClose={onClose} data={device}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={cn('font-semibold capitalize', getStatusColor(device.status))}>
              {device.status}
            </p>
          </div>
          <Badge className={getThreatColor(device.threat_level)}>
            {device.threat_level.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">IP Address</p>
            <p className="font-mono bg-background/50 p-2 rounded mt-1 text-xs">{device.ip}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">MAC Address</p>
            <p className="font-mono bg-background/50 p-2 rounded mt-1 text-xs">{device.mac}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Device Type</p>
            <p className="font-semibold capitalize mt-1">{device.type}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">OS</p>
            <p className="font-semibold mt-1">{device.type}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <p className="text-muted-foreground">Traffic In</p>
            <p className="font-mono font-semibold">{(device.traffic_in / 1024).toFixed(2)} KB/s</p>
          </div>
          <div className="h-2 bg-background/50 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500/50"
              style={{ width: `${Math.min((device.traffic_in / 1000) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <p className="text-muted-foreground">Traffic Out</p>
            <p className="font-mono font-semibold">{(device.traffic_out / 1024).toFixed(2)} KB/s</p>
          </div>
          <div className="h-2 bg-background/50 rounded overflow-hidden">
            <div
              className="h-full bg-green-500/50"
              style={{ width: `${Math.min((device.traffic_out / 1000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </InspectionPanel>
  );
}

interface ThreatInspectionPanelProps {
  threat: ThreatEvent;
  onClose: () => void;
}

export function ThreatInspectionPanel({ threat, onClose }: ThreatInspectionPanelProps) {
  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return '🔴';
    if (severity === 'high') return '🟠';
    if (severity === 'medium') return '🟡';
    return '🟢';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-700';
      case 'high':
        return 'bg-orange-500/20 text-orange-700';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700';
      default:
        return 'bg-green-500/20 text-green-700';
    }
  };

  return (
    <InspectionPanel title={`${threat.type} - ${threat.source_country}`} onClose={onClose} data={threat}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-semibold text-lg">{threat.type}</p>
          </div>
          <Badge className={getSeverityColor(threat.severity)}>
            {getSeverityIcon(threat.severity)} {threat.severity.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="text-sm bg-background/50 p-3 rounded border border-border/50">
            {threat.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <p className="text-muted-foreground font-medium">Source</p>
            <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
              <p className="font-semibold text-red-600">{threat.source_country}</p>
              <p className="font-mono text-red-600">{threat.source_ip}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground font-medium">Target</p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
              <p className="font-semibold text-blue-600">{threat.target_country}</p>
              <p className="font-mono text-blue-600">{threat.target_ip}</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Time: {new Date(threat.timestamp * 1000).toLocaleString()}</p>
          <p>Coordinates: ({threat.source_lat.toFixed(2)}, {threat.source_lon.toFixed(2)})</p>
        </div>

        <div className="pt-2 border-t border-border/50">
          <Button variant="destructive" size="sm" className="w-full">
            <AlertCircle className="h-4 w-4 mr-2" />
            Create Incident
          </Button>
        </div>
      </div>
    </InspectionPanel>
  );
}
