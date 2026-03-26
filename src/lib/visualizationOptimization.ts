'use client';

import { useEffect, useRef, useState } from 'react';

interface TouchGestureHandlers {
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
}

/**
 * Hook for handling touch gestures on 3D visualizations
 */
export function useTouchGestures(handlers: TouchGestureHandlers) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchesRef = useRef<TouchList | null>(null);
  const lastDistanceRef = useRef<number>(0);
  const lastAngleRef = useRef<number>(0);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchesRef.current = e.touches;
      if (e.touches.length === 1) {
        startPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastDistanceRef.current = distance;

        const angle = Math.atan2(
          e.touches[1].clientY - e.touches[0].clientY,
          e.touches[1].clientX - e.touches[0].clientX
        );
        lastAngleRef.current = angle;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchesRef.current) return;

      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - startPosRef.current.x;
        const deltaY = e.touches[0].clientY - startPosRef.current.y;
        handlers.onPan?.(deltaX, deltaY);
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = distance / lastDistanceRef.current;
        handlers.onPinch?.(scale);

        // Rotate
        const angle = Math.atan2(
          e.touches[1].clientY - e.touches[0].clientY,
          e.touches[1].clientX - e.touches[0].clientX
        );
        const deltaAngle = angle - lastAngleRef.current;
        handlers.onRotate?.(deltaAngle);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchesRef.current || touchesRef.current.length === 0) return;

      const deltaX = startPosRef.current.x - (e.changedTouches[0]?.clientX || 0);
      const deltaY = startPosRef.current.y - (e.changedTouches[0]?.clientY || 0);
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > 50) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          handlers.onSwipe?.(deltaX > 0 ? 'left' : 'right');
        } else {
          handlers.onSwipe?.(deltaY > 0 ? 'up' : 'down');
        }
      }

      touchesRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers]);

  return containerRef;
}

/**
 * Performance monitoring utilities
 */
export interface PerformanceStats {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  meshCount: number;
  triangleCount: number;
}

export function usePerformanceOptimization() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    meshCount: 0,
    triangleCount: 0,
  });

  const [lod, setLod] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    // Monitor performance and adjust LOD
    const checkPerformance = () => {
      if ((performance as any).memory) {
        const usedMemory =
          ((performance as any).memory.usedJSHeapSize /
            (performance as any).memory.jsHeapSizeLimit) *
          100;
        setStats((prev) => ({
          ...prev,
          memoryUsage: usedMemory,
        }));

        // Auto-reduce LOD if memory usage > 80%
        if (usedMemory > 80) {
          setLod('low');
        } else if (usedMemory > 60) {
          setLod('medium');
        } else {
          setLod('high');
        }
      }
    };

    const interval = setInterval(checkPerformance, 1000);
    return () => clearInterval(interval);
  }, []);

  return { stats, lod, setLod };
}

/**
 * LOD (Level of Detail) utilities
 */
export interface LODConfig {
  high: { meshDetail: 32; maxGeometries: 100; textureSize: 2048 };
  medium: { meshDetail: 16; maxGeometries: 50; textureSize: 1024 };
  low: { meshDetail: 8; maxGeometries: 20; textureSize: 512 };
}

export const LOD_CONFIG: LODConfig = {
  high: { meshDetail: 32, maxGeometries: 100, textureSize: 2048 },
  medium: { meshDetail: 16, maxGeometries: 50, textureSize: 1024 },
  low: { meshDetail: 8, maxGeometries: 20, textureSize: 512 },
};

/**
 * Calculate LOD based on object count and distance
 */
export function calculateLOD(
  distanceFromCamera: number,
  totalObjectCount: number,
  currentLOD: 'high' | 'medium' | 'low'
): 'high' | 'medium' | 'low' {
  if (totalObjectCount > LOD_CONFIG[currentLOD].maxGeometries) {
    if (distanceFromCamera > 100) return 'low';
    if (distanceFromCamera > 50) return 'medium';
  }
  return currentLOD;
}

/**
 * Frustum culling - skip rendering objects outside camera view
 */
export function isBoundingBoxVisible(
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  },
  cameraFrustum: any
): boolean {
  // Simplified frustum check - in production use THREE.Frustum
  return true;
}
