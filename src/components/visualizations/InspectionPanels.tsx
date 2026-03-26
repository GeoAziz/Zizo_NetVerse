'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceInspectionPanelProps {
  device: any;
  onClose?: () => void;
  onQuarantine?: (deviceId: string) => void;
  onAnalyze?: (deviceId: string) => void;
}

/**
 * Device Inspection Panel for LAN Visualization
 */
export function DeviceInspectionPanel({
  device,
  onClose,
  onQuarantine,
  onAnalyze,
}: DeviceInspectionPanelProps) {
  if (!device) return null;

  const threatColor = {
    critical: 'text-destructive',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-green-400',
  }[(device.data?.threat_level as 'critical' | 'high' | 'medium' | 'low') || 'low'];

  const statusBadgeColor = {
    online: 'bg-green-400/10 text-green-400 border-green-400/20',
    offline: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
    suspicious: 'bg-destructive/10 text-destructive border-destructive/20',
  }[(device.data?.status as 'online' | 'offline' | 'suspicious') || 'offline'];

  return (
    <Card className="w-full border-border/50 shadow-xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {device.data?.name}
              <Badge className={statusBadgeColor}>{device.data?.status}</Badge>
            </CardTitle>
            <CardDescription>{device.data?.ip}</CardDescription>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Device Type</p>
                <p className="font-semibold capitalize">{device.data?.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MAC Address</p>
                <p className="font-mono text-sm">{device.data?.mac}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Traffic In</p>
                <p className="font-semibold text-primary">{device.data?.traffic_in.toFixed(2)} Mbps</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Traffic Out</p>
                <p className="font-semibold text-primary">{device.data?.traffic_out.toFixed(2)} Mbps</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Threat Level</p>
              <div className={cn('text-lg font-bold', threatColor)}>
                {device.data?.threat_level.toUpperCase()}
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background">
                {device.data?.threat_level === 'critical' ? (
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                )}
                <span className="text-sm">
                  {device.data?.threat_level === 'critical'
                    ? 'Immediate action required'
                    : 'Device status normal'}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium">Recommended Actions</p>
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onAnalyze?.(device.id)}
                >
                  <Zap className="h-3 w-3 mr-2" />
                  Deep Analysis
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onQuarantine?.(device.id)}
                >
                  <Shield className="h-3 w-3 mr-2" />
                  Quarantine Device
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">IP Address</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => navigator.clipboard.writeText(device.data?.ip)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-mono text-sm bg-background p-2 rounded">{device.data?.ip}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">MAC Address</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => navigator.clipboard.writeText(device.data?.mac)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-mono text-sm bg-background p-2 rounded">{device.data?.mac}</p>
            </div>

            {device.data?.open_ports && device.data.open_ports.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Open Ports</p>
                <div className="flex flex-wrap gap-1">
                  {device.data.open_ports.map((port: number) => (
                    <Badge key={port} variant="secondary" className="text-xs">
                      {port}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ThreatInspectionPanelProps {
  threat: any;
  onClose?: () => void;
  onMitigate?: (threatId: string) => void;
  onReportClick?: (threatId: string) => void;
}

/**
 * Threat Inspection Panel for Threat Map
 */
export function ThreatInspectionPanel({
  threat,
  onClose,
  onMitigate,
  onReportClick,
}: ThreatInspectionPanelProps) {
  if (!threat) return null;

  const severityColor = {
    critical: 'text-destructive bg-destructive/10 border-destructive/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-green-400 bg-green-400/10 border-green-400/20',
  }[(threat.data?.severity as 'critical' | 'high' | 'medium' | 'low') || 'low'];

  return (
    <Card className="w-full border-border/50 shadow-xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {threat.data?.type}
              <Badge className={severityColor}>{threat.data?.severity.toUpperCase()}</Badge>
            </CardTitle>
            <CardDescription>{threat.data?.description}</CardDescription>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Source Country</p>
                <p className="font-semibold">{threat.data?.source_country}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target Country</p>
                <p className="font-semibold">{threat.data?.target_country}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Source IP</p>
              <p className="font-mono text-sm bg-background p-2 rounded">{threat.data?.source_ip}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Target IP</p>
              <p className="font-mono text-sm bg-background p-2 rounded">{threat.data?.target_ip}</p>
            </div>

            {threat.data?.timestamp && (
              <div>
                <p className="text-xs text-muted-foreground">Detected</p>
                <p className="text-sm">
                  {new Date(threat.data.timestamp * 1000).toLocaleString()}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-2">
            <Button
              size="sm"
              className="w-full justify-start"
              onClick={() => onMitigate?.(threat.id)}
            >
              <Shield className="h-3 w-3 mr-2" />
              Block & Mitigate
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start"
              onClick={() => onReportClick?.(threat.id)}
            >
              <Download className="h-3 w-3 mr-2" />
              Generate Report
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              View on VirusTotal
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
