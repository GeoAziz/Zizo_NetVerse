/**
 * Custom hooks for 3D visualization management
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketClient, WebSocketClient, MessageHandler, MessageType } from '@/lib/websocketClient';

/**
 * Hook for managing WebSocket connection with auto-reconnect
 */
export function useWebSocketConnection() {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    const initConnection = async () => {
      try {
        clientRef.current = getWebSocketClient();
        
        if (!clientRef.current.isConnected()) {
          await clientRef.current.connect();
          reconnectAttemptRef.current = 0;
          setConnectionError(null);
        }
        
        setIsConnected(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setConnectionError(errorMessage);
        setIsConnected(false);
        
        // Schedule reconnect with exponential backoff
        reconnectAttemptRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current - 1), 30000);
        
        setTimeout(() => {
          initConnection();
        }, delay);
      }
    };

    initConnection();

    return () => {
      // Don't disconnect on unmount - maintain connection for other components
    };
  }, []);

  const subscribe = useCallback((type: MessageType, handler: MessageHandler): (() => void) | null => {
    if (!clientRef.current) return null;
    return clientRef.current.subscribe(type, handler);
  }, []);

  const send = useCallback((type: string, data: any) => {
    if (clientRef.current) {
      clientRef.current.send(type, data);
    }
  }, []);

  return {
    isConnected,
    connectionError,
    subscribe,
    send,
    client: clientRef.current,
  };
}

/**
 * Hook for managing visualization data with filtering and aggregation
 */
export function useVisualizationData<T>(
  subscribe: ((type: MessageType, handler: MessageHandler) => (() => void) | null) | null,
  messageType: MessageType,
  maxItems: number = 100
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!subscribe) return;

    setIsLoading(true);

    const unsubscribe = subscribe(messageType, ((message) => {
      setData((prev) => {
        const newData = [message.data as T, ...prev];
        return newData.slice(0, maxItems);
      });
      setIsLoading(false);
    }) as MessageHandler);

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [subscribe, messageType, maxItems]);

  const clearData = useCallback(() => {
    setData([]);
  }, []);

  const filterData = useCallback((predicate: (item: T) => boolean): T[] => {
    return data.filter(predicate);
  }, [data]);

  const aggregateData = useCallback((key: keyof T): Map<any, T[]> => {
    const map = new Map<any, T[]>();
    data.forEach((item) => {
      const keyValue = item[key];
      if (!map.has(keyValue)) {
        map.set(keyValue, []);
      }
      map.get(keyValue)!.push(item);
    });
    return map;
  }, [data]);

  return {
    data,
    isLoading,
    clearData,
    filterData,
    aggregateData,
  };
}

/**
 * Hook for managing selected item in visualization
 */
export function useVisualizationSelection<T>(initialValue?: T) {
  const [selected, setSelected] = useState<T | null>(initialValue || null);
  const [selectionHistory, setSelectionHistory] = useState<T[]>([]);

  const selectItem = useCallback((item: T) => {
    setSelected(item);
    setSelectionHistory((prev) => [item, ...prev].slice(0, 20));
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const goToPrevious = useCallback(() => {
    if (selectionHistory.length > 1) {
      setSelected(selectionHistory[1]);
      setSelectionHistory((prev) => prev.slice(1));
    }
  }, [selectionHistory]);

  return {
    selected,
    selectionHistory,
    selectItem,
    clearSelection,
    goToPrevious,
  };
}

/**
 * Hook for managing visualization settings and filters
 */
export function useVisualizationSettings() {
  const [settings, setSettings] = useState({
    autoRotate: true,
    showLabels: true,
    showConnections: true,
    threatLevelFilter: 'all' as 'all' | 'low' | 'medium' | 'high' | 'critical',
    animationSpeed: 1,
  });

  const updateSetting = useCallback(<K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({
      autoRotate: true,
      showLabels: true,
      showConnections: true,
      threatLevelFilter: 'all',
      animationSpeed: 1,
    });
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const metricsRef = useRef({
    frameCount: 0,
    fps: 0,
    lastTime: Date.now(),
    memoryUsage: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - metricsRef.current.lastTime) / 1000;
      
      if (deltaTime >= 1) {
        metricsRef.current.fps = Math.round(metricsRef.current.frameCount / deltaTime);
        metricsRef.current.frameCount = 0;
        metricsRef.current.lastTime = now;

        // Memory monitoring (only in browser)
        if (typeof window !== 'undefined' && (performance as any).memory) {
          metricsRef.current.memoryUsage = Math.round(
            ((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100
          );
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const recordFrame = useCallback(() => {
    metricsRef.current.frameCount++;
  }, []);

  const getMetrics = useCallback(() => ({
    fps: metricsRef.current.fps,
    memoryUsage: metricsRef.current.memoryUsage,
  }), []);

  return { recordFrame, getMetrics };
}

/**
 * Hook for managing canvas references in 3D visualizations
 */
export function useVisualizationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  return { canvasRef: canvasRef.current, setCanvasRef };
}

/**
 * Hook for managing visualization data collection for export
 */
export interface VisualizationDataSnapshot {
  devices: Map<string, any>;
  traffic: any[];
  threats: any[];
  timestamp: Date;
}

export function useVisualizationDataCapture() {
  const dataRef = useRef<VisualizationDataSnapshot>({
    devices: new Map(),
    traffic: [],
    threats: [],
    timestamp: new Date(),
  });

  const updateSnapshot = useCallback((data: Partial<VisualizationDataSnapshot>) => {
    dataRef.current = {
      ...dataRef.current,
      ...data,
      timestamp: new Date(),
    };
  }, []);

  const getSnapshot = useCallback(() => dataRef.current, []);

  return { updateSnapshot, getSnapshot };
}

/**
 * Hook for managing live stats from visualization
 */
export interface LiveStats {
  deviceCount: number;
  threatCount: number;
  trafficRate: number; // packets per second
  avgThreatLevel: number; // 0-1
  connectionHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export function useLiveStats() {
  const statsRef = useRef<LiveStats>({
    deviceCount: 0,
    threatCount: 0,
    trafficRate: 0,
    avgThreatLevel: 0,
    connectionHealth: 'excellent',
  });

  const updateStats = useCallback((stats: Partial<LiveStats>) => {
    statsRef.current = {
      ...statsRef.current,
      ...stats,
    };
  }, []);

  const getStats = useCallback(() => statsRef.current, []);

  return { updateStats, getStats };
}
