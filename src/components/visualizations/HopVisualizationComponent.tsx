// src/components/visualizations/HopVisualizationComponent.tsx
/**
 * Hop Visualization Component
 * Renders traceroute hop paths on 3D globe
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  HopLocationData,
  HopVisualization,
  HOP_COLOR_SCHEME,
} from '@/lib/hopTracingTypes';

interface HopPathProps {
  hop: HopLocationData;
  prevHop: HopLocationData | null;
  globeRadius: number;
  isAnimating: boolean;
}

/**
 * Component to render a single hop marker
 */
export function HopMarker({
  hop,
  globeRadius,
  isSelected,
}: {
  hop: HopLocationData;
  globeRadius: number;
  isSelected?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(isSelected ? 1.5 : 1);

  // Convert lat/lon to 3D position on globe
  const position = latLonTo3D(hop.latitude, hop.longitude, globeRadius);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.03;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  const avgRTT = hop.rtts.length > 0
    ? hop.rtts.reduce((a, b) => a + b) / hop.rtts.length
    : 0;

  return (
    <group>
      {/* Main hop marker */}
      <mesh ref={meshRef} position={position}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={hop.color}
          emissive={hop.color}
          emissiveIntensity={0.7}
          wireframe={isSelected}
        />
      </mesh>

      {/* Glow effect for unhealthy hops */}
      {hop.packetLoss > 10 && (
        <mesh position={position}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial
            color={hop.color}
            emissive={hop.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}

      {/* Info label (show on hover) */}
      {isSelected && (
        <group position={position}>
          {/* Background for label */}
          <mesh position={[0, 0.8, 0]}>
            <planeGeometry args={[1.5, 0.4]} />
            <meshStandardMaterial color="black" transparent opacity={0.7} />
          </mesh>

          {/* Hop info text (simplified - Three.js Text would need drei) */}
          <group position={[0, 0.8, 0.01]}>
            {/* This would be replaced with proper text rendering */}
          </group>
        </group>
      )}
    </group>
  );
}

/**
 * Component to render a path between two hops
 */
export function HopSegment({
  fromHop,
  toHop,
  globeRadius,
  animationProgress,
}: {
  fromHop: HopLocationData;
  toHop: HopLocationData;
  globeRadius: number;
  animationProgress: number;
}) {
  const avgPacketLoss = (fromHop.packetLoss + toHop.packetLoss) / 2;

  // Get positions
  const fromPos = latLonTo3D(
    fromHop.latitude,
    fromHop.longitude,
    globeRadius + 0.1
  );
  const toPos = latLonTo3D(
    toHop.latitude,
    toHop.longitude,
    globeRadius + 0.1
  );

  // Create arc path between hops
  const pathPoints = createHopArc(
    new THREE.Vector3(...fromPos),
    new THREE.Vector3(...toPos),
    20,
    globeRadius
  );

  // Only show portion based on animation progress
  const visiblePoints = pathPoints.slice(
    0,
    Math.ceil(pathPoints.length * animationProgress)
  );

  // Color based on health
  const color =
    avgPacketLoss > 10
      ? HOP_COLOR_SCHEME.critical
      : avgPacketLoss > 5
        ? HOP_COLOR_SCHEME.warning
        : HOP_COLOR_SCHEME.healthy;

  if (visiblePoints.length < 2) {
    return null;
  }

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[
            new Float32Array(
              visiblePoints.flatMap((p) => [p.x, p.y, p.z])
            ),
            3,
          ]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.6 + animationProgress * 0.4}
        linewidth={2}
      />
    </line>
  );
}

/**
 * Complete hop path visualization
 */
export function HopPath({
  visualization,
  globeRadius,
  isAnimating,
}: {
  visualization: HopVisualization;
  globeRadius: number;
  isAnimating?: boolean;
}) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [selectedHopIndex, setSelectedHopIndex] = useState<number | null>(null);

  useFrame(() => {
    if (isAnimating && animationProgress < 1) {
      setAnimationProgress((prev) => Math.min(prev + 0.01, 1));
    }
  });

  if (visualization.hops.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Draw arcs between consecutive hops */}
      {visualization.hops.map((hop, idx) => {
        if (idx === 0) return null;
        const prevHop = visualization.hops[idx - 1];

        return (
          <HopSegment
            key={`hop-segment-${visualization.id}-${idx}`}
            fromHop={prevHop}
            toHop={hop}
            globeRadius={globeRadius}
            animationProgress={animationProgress}
          />
        );
      })}

      {/* Render all hop markers */}
      {visualization.hops.map((hop, idx) => (
        <HopMarker
          key={`hop-marker-${visualization.id}-${idx}`}
          hop={hop}
          globeRadius={globeRadius}
          isSelected={selectedHopIndex === idx}
        />
      ))}

      {/* Source and destination markers */}
      <mesh
        position={[
          visualization.sourceLon * (globeRadius / 180),
          0,
          visualization.sourceLat * (globeRadius / 180),
        ]}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={HOP_COLOR_SCHEME.healthy}
          emissive={HOP_COLOR_SCHEME.healthy}
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh
        position={[
          visualization.destLon * (globeRadius / 180),
          0,
          visualization.destLat * (globeRadius / 180),
        ]}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={HOP_COLOR_SCHEME.critical}
          emissive={HOP_COLOR_SCHEME.critical}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

/**
 * Convert latitude/longitude to 3D position on globeRadius
 */
export function latLonTo3D(
  lat: number,
  lon: number,
  radius: number
): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);

  return [x, y, z];
}

/**
 * Create an arc path between two points on the globe
 */
function createHopArc(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments: number,
  globeRadius: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const heightOffset = globeRadius * 0.3;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(start, end, t);

    // Create arc by pushing point away from center
    const heightFactor = Math.sin(t * Math.PI) * heightOffset;
    point.normalize().multiplyScalar(globeRadius + heightFactor);

    points.push(point);
  }

  return points;
}

/**
 * Container for multiple hop visualizations
 */
export function HopVisualizationContainer({
  visualizations,
  globeRadius = 10.5,
}: {
  visualizations: HopVisualization[];
  globeRadius?: number;
}) {
  return (
    <group>
      {visualizations.map((viz) => (
        <HopPath
          key={viz.id}
          visualization={viz}
          globeRadius={globeRadius}
          isAnimating={viz.status === 'tracing'}
        />
      ))}
    </group>
  );
}
