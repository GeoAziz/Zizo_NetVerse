'use client';

import React from 'react';
import { useWebSocketConnection } from '@/hooks/useVisualization';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function ConnectionStatus({ className, showLabel = true, compact = false }: ConnectionStatusProps) {
  const { isConnected, connectionError } = useWebSocketConnection();

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        )} />
        {showLabel && (
          <span className="text-xs font-medium text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg border',
      isConnected 
        ? 'bg-emerald-500/10 border-emerald-500/20'
        : 'bg-red-500/10 border-red-500/20',
      className
    )}>
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-600">
            WebSocket Connected
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <div className="flex-1">
            <span className="text-sm font-medium text-red-600">
              Connection Lost
            </span>
            {connectionError && (
              <p className="text-xs text-red-500 mt-1">{connectionError}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ConnectionStatusBadge() {
  const { isConnected } = useWebSocketConnection();

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-medium',
      isConnected
        ? 'bg-green-500/15 border-green-500/30 text-green-600'
        : 'bg-red-500/15 border-red-500/30 text-red-600'
    )}>
      <div className={cn(
        'w-1.5 h-1.5 rounded-full',
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      )} />
      {isConnected ? 'Live' : 'Offline'}
    </div>
  );
}
