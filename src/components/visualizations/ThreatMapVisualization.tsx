'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { getWebSocketClient, ThreatEvent, MessageHandler } from '@/lib/websocketClient';
import { geoTo3D } from '@/lib/geoEnrichment';
import { Loader2 } from 'lucide-react';

interface ThreatMarker {
  id: string;
  position: THREE.Vector3;
  data: ThreatEvent;
  timestamp: number;
  age: number; // in milliseconds
}

/**
 * Threat Marker Component
 */
function ThreatMarkerComponent({
  threat,
  isActive,
  onSelect,
}: {
  threat: ThreatMarker;
  isActive: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Pulsing and fading animation
  useFrame(() => {
    if (groupRef.current) {
      const fadeProgress = Math.min(threat.age / 30000, 1); // Fade over 30 seconds
      const opacity = 1 - fadeProgress;

      // Pulse if recent
      if (threat.age < 5000) {
        groupRef.current.scale.lerp(
          new THREE.Vector3(
            1 + Math.sin(Date.now() * 0.005) * 0.3,
            1 + Math.sin(Date.now() * 0.005) * 0.3,
            1 + Math.sin(Date.now() * 0.005) * 0.3
          ),
          0.1
        );
      }

      // Update material opacity
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
          (child.material as any).opacity = opacity;
        }
      });
    }
  });

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      default:
        return '#06b6d4';
    }
  };

  const color = getSeverityColor(threat.data.severity);
  const scale = isHovered ? 1.5 : 1;

  return (
    <group
      ref={groupRef}
      position={[threat.position.x, threat.position.y, threat.position.z]}
      onClick={onSelect}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          transparent
        />
      </mesh>

      {/* Expanding rings */}
      <mesh>
        <torusGeometry args={[0.5, 0.05, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Outer aura */}
      <mesh>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          transparent
          opacity={isHovered ? 0.4 : 0.1}
        />
      </mesh>

      {/* Label */}
      {isHovered && (
        <Text
          position={[0, 1, 0]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="bottom"
          maxWidth={2}
        >
          {threat.data.type}
        </Text>
      )}

      {/* Severity indicator line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, 1, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={2} />
      </line>
    </group>
  );
}

/**
 * Attack arrow component
 */
function AttackArrow({
  source,
  target,
  severity,
  progress,
}: {
  source: THREE.Vector3;
  target: THREE.Vector3;
  severity: string;
  progress: number;
}) {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      default:
        return '#06b6d4';
    }
  };

  const color = getSeverityColor(severity);
  const currentPos = new THREE.Vector3().lerpVectors(source, target, progress);

  return (
    <group>
      {/* Attack line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              source.x, source.y, source.z,
              target.x, target.y, target.z,
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={1} transparent opacity={0.3} />
      </line>

      {/* Attack head */}
      <mesh position={[currentPos.x, currentPos.y, currentPos.z]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

/**
 * Threat Map Scene
 */
function ThreatMapScene({
  threats,
  selectedThreat,
  onSelectThreat,
}: {
  threats: ThreatMarker[];
  selectedThreat?: ThreatMarker;
  onSelectThreat: (threat: ThreatMarker) => void;
}) {
  const [attackAnimations, setAttackAnimations] = useState<Array<{
    source: THREE.Vector3;
    target: THREE.Vector3;
    severity: string;
    progress: number;
  }>>([]);

  // Animate attacks
  useFrame(() => {
    setAttackAnimations((prev) =>
      prev
        .map((attack) => ({
          ...attack,
          progress: attack.progress + 0.015,
        }))
        .filter((attack) => attack.progress < 1)
    );
  });

  return (
    <group>
      {/* Earth background */}
      <Sphere args={[12, 32, 32]} position={[0, 0, 0]}>
        <meshPhongMaterial
          color="#0a2f51"
          shininess={5}
        />
      </Sphere>

      {/* Atmosphere */}
      <Sphere args={[12.1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#06b6d4"
          transparent
          opacity={0.05}
          emissive="#06b6d4"
          emissiveIntensity={0.05}
        />
      </Sphere>

      {/* Threat markers */}
      {threats.map((threat) => (
        <ThreatMarkerComponent
          key={threat.id}
          threat={threat}
          isActive={selectedThreat?.id === threat.id}
          onSelect={() => onSelectThreat(threat)}
        />
      ))}

      {/* Attack animations */}
      {attackAnimations.map((attack, idx) => (
        <AttackArrow
          key={idx}
          source={attack.source}
          target={attack.target}
          severity={attack.severity}
          progress={attack.progress}
        />
      ))}
    </group>
  );
}

/**
 * Threat Map 3D Visualization with Timeline
 */
export default function ThreatMapVisualization({
  onThreatSelect,
}: {
  onThreatSelect?: (threat: ThreatEvent) => void;
}) {
  const [threats, setThreats] = useState<ThreatMarker[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<ThreatMarker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timelineSlider, setTimelineSlider] = useState(100);
  const wsRef = useRef<ReturnType<typeof getWebSocketClient> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Age threats and remove expired ones
    const updateThreats = () => {
      setThreats((prev) => {
        return prev
          .map((threat) => ({
            ...threat,
            age: threat.age + 100,
          }))
          .filter((threat) => threat.age < 30000);
      });

      animationFrameRef.current = requestAnimationFrame(updateThreats);
    };

    animationFrameRef.current = requestAnimationFrame(updateThreats);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Initialize WebSocket
    wsRef.current = getWebSocketClient();

    if (!wsRef.current.isConnected()) {
      setIsLoading(true);
      wsRef.current.connect()
        .then(() => {
          // Subscribe to threat events
          const unsubscribe = wsRef.current!.subscribe('threat_event', ((message) => {
            const threat = message.data as ThreatEvent;

            // Convert to 3D position on globe
            const position = geoTo3D(threat.source_lat, threat.source_lon, 12.5);

            setThreats((prev) => [...prev, {
              id: threat.id,
              position: new THREE.Vector3(...position),
              data: threat,
              timestamp: threat.timestamp,
              age: 0,
            }]);

            if (onThreatSelect) {
              onThreatSelect(threat);
            }
          }) as MessageHandler);

          unsubscribeRef.current = unsubscribe;
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to connect WebSocket:', error);
          setIsLoading(false);
          
          // Generate mock data for demo
          setTimeout(() => {
            generateMockThreats();
          }, 1000);
        });
    } else {
      generateMockThreats();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onThreatSelect]);

  const generateMockThreats = () => {
    const threatTypes = ['DDoS', 'Malware', 'Phishing', 'Zero-Day', 'RCE', 'SQLi'];
    const countries = [
      { name: 'CN', lat: 35.8617, lon: 104.1954 },
      { name: 'RU', lat: 61.5240, lon: 105.3188 },
      { name: 'IRAN', lat: 32.4279, lon: 53.6880 },
      { name: 'US', lat: 37.0902, lon: -95.7129 },
    ];

    const generateThreat = (index: number) => {
      const source = countries[Math.floor(Math.random() * countries.length)];
      const dest = countries[Math.floor(Math.random() * countries.length)];

      const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      
      const threat: ThreatEvent = {
        id: `threat-${index}`,
        type: threatType,
        severity: (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)],
        source_ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        source_country: source.name,
        source_lat: source.lat,
        source_lon: source.lon,
        target_ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        target_country: dest.name,
        target_lat: dest.lat,
        target_lon: dest.lon,
        description: `${threatType} attack from ${source.name} detected`,
        timestamp: Date.now(),
      };

      const position = geoTo3D(source.lat, source.lon, 12.5);

      setThreats((prev) => [...prev, {
        id: threat.id,
        position: new THREE.Vector3(...position),
        data: threat,
        timestamp: threat.timestamp,
        age: 0,
      }]);

      if (onThreatSelect) {
        onThreatSelect(threat);
      }
    };

    for (let i = 0; i < 8; i++) {
      setTimeout(() => generateThreat(i), i * 500);
    }
  };

  if (isLoading && threats.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading threat map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 3D Canvas */}
      <Canvas
        className="flex-1 w-full"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={60} />
        <OrbitControls autoRotate autoRotateSpeed={0.15} enableZoom />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[15, 10, 15]} intensity={1.2} />
        <pointLight position={[-20, -10, -15]} intensity={0.4} color="#ef4444" />

        {/* Scene */}
        <ThreatMapScene
          threats={threats}
          selectedThreat={selectedThreat || undefined}
          onSelectThreat={setSelectedThreat}
        />

        {/* Background */}
        <color attach="background" args={['#0c0a09']} />
        <fog attach="fog" args={['#0c0a09', 0, 100]} />
      </Canvas>

      {/* Timeline Control */}
      <div className="bg-background/95 backdrop-blur-sm border-t border-border/50 p-4">
        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-muted-foreground">Timeline Replay:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={timelineSlider}
            onChange={(e) => setTimelineSlider(Number(e.target.value))}
            className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${timelineSlider}%, hsl(var(--border)) ${timelineSlider}%, hsl(var(--border)) 100%)`
            }}
          />
          <span className="text-xs text-muted-foreground">{timelineSlider}%</span>
        </div>

        {/* Active Threat Info */}
        {selectedThreat && (
          <div className="mt-4 p-3 bg-background border border-border/50 rounded-lg text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-semibold">{selectedThreat.data.type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Severity:</span>
                <p className={`font-semibold ${
                  selectedThreat.data.severity === 'critical' ? 'text-destructive' :
                  selectedThreat.data.severity === 'high' ? 'text-orange-400' :
                  selectedThreat.data.severity === 'medium' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {selectedThreat.data.severity.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Source:</span>
                <p className="font-semibold text-primary">{selectedThreat.data.source_country}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Target:</span>
                <p className="font-semibold text-accent">{selectedThreat.data.target_country}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>
                <p className="font-semibold">{selectedThreat.data.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
