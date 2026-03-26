'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  error?: string | null;
  connectionTime?: number | null;
  compact?: boolean;
}

/**
 * Connection Status Indicator Component
 */
export function ConnectionStatus({
  isConnected,
  error,
  connectionTime,
  compact = false,
}: ConnectionStatusProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="h-3 w-3 text-green-400 animate-pulse" />
        ) : (
          <WifiOff className="h-3 w-3 text-destructive" />
        )}
        <span className="text-xs text-muted-foreground">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse" />
                  <div className="absolute inset-1 bg-green-400 rounded-full" />
                </div>
                <span className="text-sm font-medium text-green-400">Connected</span>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {connectionTime && isConnected && (
        <div className="text-xs text-muted-foreground">
          Connection established in {connectionTime}ms
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/50">
          <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-yellow-500">{error}</span>
        </div>
      )}
    </div>
  );
}

interface DataStatsProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

/**
 * Data Statistics Widget
 */
export function DataStat({
  label,
  value,
  unit,
  trend = 'stable',
  color = 'default',
}: DataStatsProps) {
  const trendColor = {
    up: 'text-destructive',
    down: 'text-green-400',
    stable: 'text-muted-foreground',
  }[trend];

  const badgeColor = {
    default: '',
    success: 'bg-green-400/10 text-green-400 border-green-400/20',
    warning: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  }[color];

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-lg font-semibold', badgeColor && 'rounded px-2 py-1')}>
          {value}
          {unit && <span className="text-xs ml-1">{unit}</span>}
        </span>
        {trend !== 'stable' && (
          <span className={cn('text-xs font-medium', trendColor)}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  );
}

interface VisualizationStatsProps {
  deviceCount?: number;
  connectionCount?: number;
  threatCount?: number;
  activeTraffic?: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

/**
 * Visualization Statistics Dashboard
 */
export function VisualizationStats({
  deviceCount = 0,
  connectionCount = 0,
  threatCount = 0,
  activeTraffic = 0,
  cpuUsage = 0,
  memoryUsage = 0,
}: VisualizationStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <DataStat
        label="Devices"
        value={deviceCount}
        color={deviceCount > 10 ? 'success' : 'default'}
      />
      <DataStat
        label="Connections"
        value={connectionCount}
        color={connectionCount > 0 ? 'success' : 'default'}
      />
      <DataStat
        label="Threats"
        value={threatCount}
        color={threatCount > 5 ? 'destructive' : threatCount > 0 ? 'warning' : 'default'}
        trend={threatCount > 0 ? 'up' : 'stable'}
      />
      <DataStat
        label="Traffic"
        value={activeTraffic}
        unit="Mbps"
        color={activeTraffic > 100 ? 'warning' : 'default'}
      />
      <DataStat
        label="CPU"
        value={cpuUsage.toFixed(1)}
        unit="%"
        color={cpuUsage > 75 ? 'destructive' : cpuUsage > 50 ? 'warning' : 'default'}
      />
      <DataStat
        label="Memory"
        value={memoryUsage.toFixed(1)}
        unit="%"
        color={memoryUsage > 85 ? 'destructive' : memoryUsage > 70 ? 'warning' : 'default'}
      />
    </div>
  );
}

interface LegendItemProps {
  label: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Legend Item for visualizations
 */
export function LegendItem({ label, color, size = 'md' }: LegendItemProps) {
  const sizeClass = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn('rounded-full', sizeClass)}
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Visualization Legend
 */
export function VisualizationLegend() {
  return (
    <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold">Legend</h3>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">Device Status</h4>
        <div className="space-y-1">
          <LegendItem label="Online" color="#10b981" />
          <LegendItem label="Offline" color="#6b7280" />
          <LegendItem label="Suspicious" color="#f97316" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">Threat Level</h4>
        <div className="space-y-1">
          <LegendItem label="Critical" color="#ef4444" />
          <LegendItem label="High" color="#f97316" />
          <LegendItem label="Medium" color="#eab308" />
          <LegendItem label="Low" color="#10b981" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">Connection Status</h4>
        <div className="space-y-1">
          <LegendItem label="Active" color="#06b6d4" />
          <LegendItem label="Idle" color="#6b7280" />
          <LegendItem label="Suspicious" color="#ef4444" />
        </div>
      </div>
    </div>
  );
}
