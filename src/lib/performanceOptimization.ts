/**
 * Performance optimization utilities for 3D visualizations
 */

import { useEffect, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  objectCount: number;
  triangleCount: number;
}

/**
 * Level of Detail configuration
 */
export interface LODConfig {
  distance: number;
  maxObjects: number;
  triangleLimit: number;
  particleLimit: number;
}

// LOD presets for different device capability levels
export const LOD_PRESETS = {
  high: {
    distance: 1000,
    maxObjects: 5000,
    triangleLimit: 2000000,
    particleLimit: 50000,
  } as LODConfig,
  medium: {
    distance: 500,
    maxObjects: 1000,
    triangleLimit: 500000,
    particleLimit: 10000,
  } as LODConfig,
  low: {
    distance: 200,
    maxObjects: 200,
    triangleLimit: 100000,
    particleLimit: 1000,
  } as LODConfig,
};

/**
 * Detect device capability
 */
export function detectDeviceCapability(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium';

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) return 'low';

  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS);

  // Check device memory
  const memory = (navigator as any).deviceMemory;

  if (maxTextureSize >= 8192 && maxVaryings >= 16 && memory >= 8) {
    return 'high';
  } else if (maxTextureSize >= 4096 && maxVaryings >= 8 && memory >= 4) {
    return 'medium';
  }
  return 'low';
}

/**
 * Object pooling for efficient memory management
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 100) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      obj = this.factory();
    }

    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.reset(obj);
      this.available.push(obj);
    }
  }

  releaseAll(): void {
    this.inUse.forEach((obj) => {
      this.reset(obj);
      this.available.push(obj);
    });
    this.inUse.clear();
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    };
  }
}

/**
 * Spatial partitioning for culling
 */
export class Octree {
  private root: OctreeNode;

  constructor(bounds: { min: [number, number, number]; max: [number, number, number] }) {
    this.root = new OctreeNode(bounds, 0);
  }

  insert(obj: any, position: [number, number, number]): void {
    this.root.insert(obj, position);
  }

  retrieve(position: [number, number, number], radius: number): any[] {
    return this.root.retrieve(position, radius);
  }

  clear(): void {
    this.root.clear();
  }
}

class OctreeNode {
  private children: OctreeNode[] = [];
  private objects: Array<{ obj: any; pos: [number, number, number] }> = [];
  private bounds: { min: [number, number, number]; max: [number, number, number] };
  private depth: number;
  private maxDepth = 8;
  private maxObjects = 4;

  constructor(
    bounds: { min: [number, number, number]; max: [number, number, number] },
    depth: number
  ) {
    this.bounds = bounds;
    this.depth = depth;
  }

  insert(obj: any, position: [number, number, number]): void {
    if (this.depth < this.maxDepth && this.children.length === 0 && this.objects.length >= this.maxObjects) {
      this.split();
    }

    if (this.children.length > 0) {
      const childIndex = this.getChildIndex(position);
      this.children[childIndex].insert(obj, position);
    } else {
      this.objects.push({ obj, pos: position });
    }
  }

  retrieve(position: [number, number, number], radius: number): any[] {
    const result: any[] = [];

    if (this.isIntersecting(position, radius)) {
      this.objects.forEach((item) => {
        if (this.distance(position, item.pos) <= radius) {
          result.push(item.obj);
        }
      });

      this.children.forEach((child) => {
        result.push(...child.retrieve(position, radius));
      });
    }

    return result;
  }

  clear(): void {
    this.objects = [];
    this.children = [];
  }

  private split(): void {
    const mid = [
      (this.bounds.min[0] + this.bounds.max[0]) / 2,
      (this.bounds.min[1] + this.bounds.max[1]) / 2,
      (this.bounds.min[2] + this.bounds.max[2]) / 2,
    ];

    for (let i = 0; i < 8; i++) {
      const min = [
        i & 1 ? mid[0] : this.bounds.min[0],
        i & 2 ? mid[1] : this.bounds.min[1],
        i & 4 ? mid[2] : this.bounds.min[2],
      ];
      const max = [
        i & 1 ? this.bounds.max[0] : mid[0],
        i & 2 ? this.bounds.max[1] : mid[1],
        i & 4 ? this.bounds.max[2] : mid[2],
      ];

      this.children.push(
        new OctreeNode(
          {
            min: min as [number, number, number],
            max: max as [number, number, number],
          },
          this.depth + 1
        )
      );
    }
  }

  private getChildIndex(position: [number, number, number]): number {
    const mid = [
      (this.bounds.min[0] + this.bounds.max[0]) / 2,
      (this.bounds.min[1] + this.bounds.max[1]) / 2,
      (this.bounds.min[2] + this.bounds.max[2]) / 2,
    ];

    let index = 0;
    if (position[0] > mid[0]) index |= 1;
    if (position[1] > mid[1]) index |= 2;
    if (position[2] > mid[2]) index |= 4;

    return index;
  }

  private isIntersecting(position: [number, number, number], radius: number): boolean {
    const closest = [
      Math.max(this.bounds.min[0], Math.min(position[0], this.bounds.max[0])),
      Math.max(this.bounds.min[1], Math.min(position[1], this.bounds.max[1])),
      Math.max(this.bounds.min[2], Math.min(position[2], this.bounds.max[2])),
    ];

    const dx = position[0] - closest[0];
    const dy = position[1] - closest[1];
    const dz = position[2] - closest[2];

    return dx * dx + dy * dy + dz * dz <= radius * radius;
  }

  private distance(
    a: [number, number, number],
    b: [number, number, number]
  ): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceOptimization() {
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    objectCount: 0,
    triangleCount: 0,
  });

  const capability = useRef(detectDeviceCapability());
  const lodConfig = useRef(LOD_PRESETS[capability.current]);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = Date.now();

    const measureFrame = () => {
      frameCount++;
      const now = Date.now();

      if (now - lastTime >= 1000) {
        metricsRef.current.fps = frameCount;
        frameCount = 0;
        lastTime = now;

        // Memory usage
        if ((performance as any).memory) {
          metricsRef.current.memoryUsage = Math.round(
            ((performance as any).memory.usedJSHeapSize /
              (performance as any).memory.jsHeapSizeLimit) *
              100
          );
        }
      }

      requestAnimationFrame(measureFrame);
    };

    const id = requestAnimationFrame(measureFrame);
    return () => cancelAnimationFrame(id);
  }, []);

  const updateMetrics = useCallback((partial: Partial<PerformanceMetrics>) => {
    metricsRef.current = { ...metricsRef.current, ...partial };
  }, []);

  const getMetrics = useCallback(() => metricsRef.current, []);

  return {
    metrics: metricsRef.current,
    updateMetrics,
    getMetrics,
    capability: capability.current,
    lodConfig: lodConfig.current,
  };
}

/**
 * Batch render optimization
 */
export class BatchRenderer {
  private batches: Map<Material, Batch[]> = new Map();

  addToBatch(geometry: any, material: any, position: any): void {
    if (!this.batches.has(material)) {
      this.batches.set(material, []);
    }

    const batch = this.batches.get(material)!;
    batch.push({ geometry, position });
  }

  render(): void {
    // Implementation depends on THREE.js context
    // This is a placeholder for batch rendering logic
  }

  clear(): void {
    this.batches.clear();
  }
}

interface Material {}
interface Batch {
  geometry: any;
  position: any;
}
