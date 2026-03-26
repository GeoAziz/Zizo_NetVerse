'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';
import { getWebSocketClient, WANTraffic, MessageHandler } from '@/lib/websocketClient';
import { geoTo3D } from '@/lib/geoEnrichment';
import { Loader2 } from 'lucide-react';
import { HopVisualizationContainer } from './HopVisualizationComponent';
import type { HopVisualization } from '@/lib/hopTracingTypes';

interface TrafficConnection {
  id: string;
  source: WANTraffic;
  pathPoints: THREE.Vector3[];
  progress: number;
  line?: THREE.Line;
}

/**
 * Earth Globe Component
 */
function EarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <Sphere ref={meshRef} args={[10, 64, 64]} position={[0, 0, 0]}>
      <meshPhongMaterial
        map={createGlobeTexture()}
        shininess={5}
      />
    </Sphere>
  );
}

/**
 * Create a procedural globe texture
 */
function createGlobeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Water
  ctx.fillStyle = '#0a2f51';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Landmasses (very simplified)
  ctx.fillStyle = '#1a5a3a';
  const countries = [
    { x: 200, y: 300, w: 100, h: 80 },   // North America
    { x: 300, y: 400, w: 150, h: 100 },  // South America
    { x: 900, y: 280, w: 200, h: 120 },  // Eurasia
    { x: 1100, y: 350, w: 100, h: 100 }, // Central Asia
    { x: 1200, y: 400, w: 80, h: 60 },   // Southeast Asia
    { x: 1300, y: 480, w: 60, h: 80 },   // Australia
    { x: 600, y: 480, w: 100, h: 120 },  // Africa
  ];

  countries.forEach(({ x, y, w, h }) => {
    ctx.fillRect(x, y, w, h);
  });

  // Convert canvas to texture
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Traffic Connection Component
 */
function TrafficPath({ traffic, onComplete }: { traffic: TrafficConnection; onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [pathProgress, setPathProgress] = useState(0);

  // Animate the data packet along the path
  useFrame(() => {
    if (groupRef.current) {
      setPathProgress((prev) => {
        const next = prev + 0.002;
        if (next >= 1) {
          onComplete();
          return 0;
        }
        return next;
      });
    }
  });

  const getColor = (threatScore: number): string => {
    if (threatScore > 0.8) return '#ef4444';
    if (threatScore > 0.6) return '#f97316';
    if (threatScore > 0.4) return '#eab308';
    return '#10b981';
  };

  const color = getColor(traffic.source.threat_score);

  // Calculate position along path
  let currentPos = new THREE.Vector3(0, 0, 0);
  if (traffic.pathPoints.length > 0) {
    const segment = pathProgress * (traffic.pathPoints.length - 1);
    const segmentIndex = Math.floor(segment);
    const segmentProgress = segment - segmentIndex;

    if (segmentIndex < traffic.pathPoints.length - 1) {
      currentPos.lerpVectors(
        traffic.pathPoints[segmentIndex],
        traffic.pathPoints[segmentIndex + 1],
        segmentProgress
      );
    }
  }

  return (
    <group ref={groupRef}>
      {/* Line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(traffic.pathPoints.flatMap((p) => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.4} linewidth={1} />
      </line>

      {/* Data packet */}
      <mesh position={[currentPos.x, currentPos.y, currentPos.z]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Glow effect */}
      <mesh position={[currentPos.x, currentPos.y, currentPos.z]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}

/**
 * Marker for source/destination
 */
function GeoMarker({
  position,
  label,
  color,
  scale = 1,
}: {
  position: THREE.Vector3;
  label?: string;
  color: string;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        0.1
      );
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.03;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>

      {label && (
        <Text position={[position.x, position.y + 0.5, position.z]} fontSize={0.3} color="white">
          {label}
        </Text>
      )}
    </group>
  );
}

/**
 * WAN Scene Component
 */
function WANScene({ 
  trafficConnections,
  hopVisualizations = [] 
}: { 
  trafficConnections: TrafficConnection[];
  hopVisualizations?: HopVisualization[];
}) {
  const [activeConnections, setActiveConnections] = useState<Map<string, TrafficConnection>>(new Map());

  return (
    <group>
      {/* Earth */}
      <EarthGlobe />

      {/* Atmosphere glow */}
      <Sphere args={[10.1, 64, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#06b6d4"
          transparent
          opacity={0.1}
          emissive="#06b6d4"
          emissiveIntensity={0.1}
        />
      </Sphere>

      {/* Hop visualizations (traceroute paths) */}
      {hopVisualizations && (
        <HopVisualizationContainer 
          visualizations={hopVisualizations}
          globeRadius={10.5}
        />
      )}

      {/* Traffic paths */}
      {Array.from(activeConnections.values()).map((traffic) => (
        <TrafficPath
          key={traffic.id}
          traffic={traffic}
          onComplete={() => {
            setActiveConnections((prev) => {
              const next = new Map(prev);
              next.delete(traffic.id);
              return next;
            });
          }}
        />
      ))}

      {/* New incoming traffic */}
      {trafficConnections?.map((traffic) => {
        // Defensive: skip if traffic or traffic.id is undefined
        if (!traffic?.id) return null;
        
        if (!activeConnections.has(traffic.id)) {
          setActiveConnections((prev) => new Map(prev).set(traffic.id, traffic));
        }
        return null;
      })}
    </group>
  );
}

/**
 * WAN View 3D Globe Visualization
 */
export default function WANVisualization({
  onTrafficSelect,
  hopVisualizations = [],
}: {
  onTrafficSelect?: (traffic: WANTraffic) => void;
  hopVisualizations?: HopVisualization[];
}) {
  const [trafficConnections, setTrafficConnections] = useState<TrafficConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<ReturnType<typeof getWebSocketClient> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Skip if already initialized to prevent double-initialization
    if (hasInitialized) return;
    
    // Initialize WebSocket
    wsRef.current = getWebSocketClient();

    if (!wsRef.current.isConnected()) {
      setIsLoading(true);
      wsRef.current.connect()
        .then(() => {
          // Subscribe to WAN traffic
          const unsubscribe = wsRef.current!.subscribe('wan_traffic', ((message) => {
            const traffic = message.data as WANTraffic;

            // Convert geo coordinates to 3D positions
            const sourcePos = geoTo3D(traffic.source_lat, traffic.source_lon, 10.5);
            const destPos = geoTo3D(traffic.dest_lat, traffic.dest_lon, 10.5);

            // Create bezier curve for path (arc over globe)
            const pathPoints = createArcPath(
              new THREE.Vector3(...sourcePos),
              new THREE.Vector3(...destPos),
              30
            );

            setTrafficConnections((prev) => [...prev, {
              id: traffic.id,
              source: traffic,
              pathPoints,
              progress: 0,
            }].slice(-50)); // Keep last 50 connections

            if (onTrafficSelect) {
              onTrafficSelect(traffic);
            }
          }) as MessageHandler);

          unsubscribeRef.current = unsubscribe;
          setIsLoading(false);
          setHasInitialized(true);
        })
        .catch((error) => {
          console.error('Failed to connect WebSocket:', error);
          setIsLoading(false);
          setHasInitialized(true);
          
          // Generate mock data for demo
          setTimeout(() => {
            generateMockTraffic();
          }, 1000);
        });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onTrafficSelect, hasInitialized]);

  const createArcPath = (start: THREE.Vector3, end: THREE.Vector3, segments: number): THREE.Vector3[] => {
    const points: THREE.Vector3[] = [];
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const heightOffset = 3;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      
      // Create arc by pushing point away from center
      const heightFactor = Math.sin(t * Math.PI) * heightOffset;
      point.normalize().multiplyScalar(10.5 + heightFactor);

      points.push(point);
    }

    return points;
  };

  const generateMockTraffic = () => {
    const trafficData: TrafficConnection[] = [];
    const countries = [
      { name: 'US', lat: 37.0902, lon: -95.7129, threat: 0.3 },
      { name: 'CN', lat: 35.8617, lon: 104.1954, threat: 0.7 },
      { name: 'RU', lat: 61.5240, lon: 105.3188, threat: 0.8 },
      { name: 'GB', lat: 55.3781, lon: -3.4360, threat: 0.2 },
      { name: 'DE', lat: 51.1657, lon: 10.4515, threat: 0.2 },
      { name: 'IRAN', lat: 32.4279, lon: 53.6880, threat: 0.9 },
      { name: 'NKOR', lat: 40.3399, lon: 127.5101, threat: 0.95 },
    ];

    for (let i = 0; i < 15; i++) {
      const source = countries[Math.floor(Math.random() * countries.length)];
      const dest = countries[Math.floor(Math.random() * countries.length)];

      if (source !== dest) {
        const sourcePos = geoTo3D(source.lat, source.lon, 10.5);
        const destPos = geoTo3D(dest.lat, dest.lon, 10.5);
        const pathPoints = createArcPath(
          new THREE.Vector3(...sourcePos),
          new THREE.Vector3(...destPos),
          30
        );

        trafficData.push({
          id: `traffic-${i}`,
          source: {
            id: `traffic-${i}`,
            source_ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
            source_country: source.name,
            source_lat: source.lat,
            source_lon: source.lon,
            dest_ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
            dest_country: dest.name,
            dest_lat: dest.lat,
            dest_lon: dest.lon,
            bytes: Math.random() * 1000000,
            protocol: ['TCP', 'UDP', 'ICMP'][Math.floor(Math.random() * 3)],
            threat_score: Math.random(),
            timestamp: Date.now(),
          },
          pathPoints,
          progress: 0,
        });
      }

      setTimeout(() => {
        setTrafficConnections((prev) => [...prev, trafficData[i]].slice(-50));
      }, i * 200);
    }
  };

  if (isLoading && trafficConnections.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading 3D WAN globe...</p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      className="w-full h-full"
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={60} />
      <OrbitControls autoRotate autoRotateSpeed={0.2} enableZoom enablePan />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[15, 10, 15]} intensity={1.5} />
      <pointLight position={[-20, -10, -15]} intensity={0.5} color="#06b6d4" />

      {/* Scene */}
      <WANScene 
        trafficConnections={trafficConnections}
        hopVisualizations={hopVisualizations}
      />

      {/* Background */}
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 0, 100]} />
    </Canvas>
  );
}
