'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface GestureState {
  initialDistance: number;
  currentDistance: number;
  initialScale: number;
  currentScale: number;
  rotationX: number;
  rotationY: number;
}

/**
 * Hook for handling touch gestures on 3D visualizations
 */
export function useMobileGestures() {
  const { camera, gl } = useThree();
  const gestureRef = useRef<GestureState>({
    initialDistance: 0,
    currentDistance: 0,
    initialScale: 1,
    currentScale: 1,
    rotationX: 0,
    rotationY: 0,
  });

  const touchStartRef = useRef<{ x: number; y: number }[]>([]);

  // Calculate distance between two touch points
  const getDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Get midpoint between two touch points
  const getMidpoint = useCallback(
    (touches: TouchList): [number, number] => {
      if (touches.length < 2) return [0, 0];
      return [
        (touches[0].clientX + touches[1].clientX) / 2,
        (touches[0].clientY + touches[1].clientY) / 2,
      ];
    },
    []
  );

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      touchStartRef.current = Array.from(e.touches).map((t) => ({ x: t.clientX, y: t.clientY }));

      if (e.touches.length === 2) {
        gestureRef.current.initialDistance = getDistance(e.touches);
      }
    },
    [getDistance]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1) {
        // Single finger - rotate
        const touch = e.touches[0];
        const start = touchStartRef.current[0];

        if (start) {
          const deltaX = touch.clientX - start.x;
          const deltaY = touch.clientY - start.y;

          gestureRef.current.rotationY = deltaX * 0.005;
          gestureRef.current.rotationX = deltaY * 0.005;

          // Apply rotation to camera
          camera.position.applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            gestureRef.current.rotationY
          );
          const rightVector = new THREE.Vector3().crossVectors(camera.up, camera.position).normalize();
          camera.position.applyAxisAngle(
            rightVector,
            gestureRef.current.rotationX
          );
          camera.lookAt(0, 0, 0);
        }
      } else if (e.touches.length === 2) {
        // Two fingers - pinch to zoom
        const currentDistance = getDistance(e.touches);
        gestureRef.current.currentDistance = currentDistance;

        const zoomSpeed = 0.01;
        const distanceChange = currentDistance - gestureRef.current.initialDistance;
        const zoomFactor = 1 - distanceChange * zoomSpeed;

        const cameraDistance = camera.position.length();
        const newDistance = cameraDistance * zoomFactor;

        // Clamp zoom distance
        if (newDistance > 5 && newDistance < 200) {
          camera.position.normalize().multiplyScalar(newDistance);
        }

        gestureRef.current.currentScale = zoomFactor;
      } else if (e.touches.length === 3) {
        // Three fingers - pan
        const midpoint = getMidpoint(e.touches);
        const startMidpoint = [
          (touchStartRef.current[0]?.x || 0 + touchStartRef.current[1]?.x || 0) / 2,
          (touchStartRef.current[0]?.y || 0 + touchStartRef.current[1]?.y || 0) / 2,
        ];

        const deltaX = midpoint[0] - startMidpoint[0];
        const deltaY = midpoint[1] - startMidpoint[1];

        const panSpeed = 0.01;
        camera.position.x -= deltaX * panSpeed;
        camera.position.z -= deltaY * panSpeed;
      }
    },
    [camera, getDistance, getMidpoint]
  );

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchStartRef.current = Array.from(e.touches).map((t) => ({ x: t.clientX, y: t.clientY }));
  }, []);

  // Handle mouse wheel for desktop zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const zoomSpeed = 0.1;
      const direction = e.deltaY > 0 ? 1 : -1;
      const cameraDistance = camera.position.length();
      const newDistance = cameraDistance * (1 + direction * zoomSpeed);

      if (newDistance > 5 && newDistance < 200) {
        camera.position.normalize().multiplyScalar(newDistance);
      }
    },
    [camera]
  );

  // Attach event listeners
  useEffect(() => {
    const canvas = gl.domElement;

    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gl.domElement, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

  return gestureRef.current;
}

/**
 * Gesture recognizer for common patterns
 */
export class GestureRecognizer {
  private lastTap: number = 0;
  private touchStartTime: number = 0;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private tapThreshold: number = 300; // ms
  private distanceThreshold: number = 20; // pixels

  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void;

  handleTouchStart(e: TouchEvent): void {
    this.touchStartTime = Date.now();
    this.touchStartPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }

  handleTouchEnd(e: TouchEvent): void {
    const tapDuration = Date.now() - this.touchStartTime;
    const touchPos = this.touchStartPos;

    // Long press
    if (tapDuration > 500) {
      this.onLongPress?.(touchPos.x, touchPos.y);
      return;
    }

    // Double tap
    const now = Date.now();
    if (now - this.lastTap < this.tapThreshold) {
      this.onDoubleTap?.(touchPos.x, touchPos.y);
      this.lastTap = 0;
      return;
    }
    this.lastTap = now;
  }

  handleTouchMove(e: TouchEvent): void {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartPos.x;
    const deltaY = touch.clientY - this.touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Swipe
    if (distance > this.distanceThreshold) {
      const duration = Date.now() - this.touchStartTime;
      const velocity = distance / duration; // pixels per ms

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        this.onSwipe?.(deltaX > 0 ? 'right' : 'left', velocity);
      } else {
        // Vertical swipe
        this.onSwipe?.(deltaY > 0 ? 'down' : 'up', velocity);
      }
    }
  }
}

/**
 * Responsive canvas configuration
 */
export function getCanvasConfig(screenWidth: number) {
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth < 1024;

  return {
    isMobile,
    isTablet,
    pixelRatio: isMobile ? 1 : window.devicePixelRatio,
    antialias: !isMobile,
    dpr: [1, isTablet ? 1.5 : 2],
  };
}
