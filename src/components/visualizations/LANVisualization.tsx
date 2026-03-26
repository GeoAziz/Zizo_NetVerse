'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { getWebSocketClient, DeviceUpdate, ConnectionUpdate, MessageHandler } from '@/lib/websocketClient';
import { generateMockDeviceLocation } from '@/lib/geoEnrichment';
import { Loader2 } from 'lucide-react';

interface DeviceNode {
  id: string;
  position: THREE.Vector3;
  data: DeviceUpdate;
  mesh?: THREE.Mesh;
}

interface Connection {
  source: string;
  target: string;
  data: ConnectionUpdate;
  line?: THREE.Line;
}

/**
 * 3D Device Node Component
 */
function DeviceNode({ device, onClick }: { device: DeviceNode; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Determine color based on status
  const getNodeColor = (status: string, threatLevel: string): string => {
    if (threatLevel === 'critical') return '#ef4444';
    if (threatLevel === 'high') return '#f97316';
    if (threatLevel === 'medium') return '#eab308';
    if (status === 'online') return '#10b981';
    if (status === 'offline') return '#6b7280';
    return '#a78bfa';
  };

  const color = getNodeColor(device.data.status, device.data.threat_level);

  // Pulsing animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(isHovered ? 1.5 : 1, isHovered ? 1.5 : 1, isHovered ? 1.5 : 1),
        0.1
      );
      meshRef.current.rotation.x += 0.002;
      meshRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef} position={[device.position.x, device.position.y, device.position.z]}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          wireframe={device.data.status === 'suspicious'}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh>
        <torusGeometry args={[0.6, 0.05, 16, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Pulsing aura */}
      <group>
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            transparent
            opacity={isHovered ? 0.3 : 0.1}
          />
        </mesh>
      </group>

      {/* Label */}
      {isHovered && (
        <Text
          position={[0, 1, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {device.data.name}
        </Text>
      )}
    </group>
  );
}

/**
 * Connection Line Component
 */
function ConnectionLine({
  source,
  target,
  data,
}: {
  source: DeviceNode;
  target: DeviceNode;
  data: ConnectionUpdate;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const [animationOffset, setAnimationOffset] = useState(0);

  // Animate data flow along the line
  useFrame(() => {
    if (lineRef.current) {
      setAnimationOffset((offset) => (offset + 0.02) % 1);
    }
  });

  // Determine line color by threat level
  const getLineColor = (status: string): string => {
    if (status === 'suspicious') return '#ef4444';
    if (status === 'idle') return '#6b7280';
    return '#06b6d4';
  };

  const color = getLineColor(data.status);

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              source.position.x, source.position.y, source.position.z,
              target.position.x, target.position.y, target.position.z,
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={2} />
      </line>

      {/* Animated data particles */}
      {data.status === 'active' && (
        <mesh
          position={[
            source.position.x + (target.position.x - source.position.x) * animationOffset,
            source.position.y + (target.position.y - source.position.y) * animationOffset,
            source.position.z + (target.position.z - source.position.z) * animationOffset,
          ]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Scene Component
 */
function LANScene({
  devices,
  connections,
  selectedDevice,
  onSelectDevice,
}: {
  devices: Map<string, DeviceNode>;
  connections: Map<string, Connection>;
  selectedDevice?: string;
  onSelectDevice: (id: string) => void;
}) {
  const { camera } = useThree();

  // Auto-fit camera
  useEffect(() => {
    if (devices.size > 0) {
      const positions = Array.from(devices.values()).map((d) => d.position);
      const center = new THREE.Vector3();
      positions.forEach((p) => center.add(p));
      center.divideScalar(positions.length);

      const box = new THREE.Box3();
      positions.forEach((p) => box.expandByPoint(p));
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      if (camera instanceof THREE.PerspectiveCamera) {
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

        camera.position.copy(center);
        camera.position.z += cameraZ;
        camera.lookAt(center);
      }
    }
  }, [devices, camera]);

  return (
    <group>
      {/* Render connections first (background) */}
      {Array.from(connections.values()).map((conn) => {
        const source = devices.get(conn.source);
        const target = devices.get(conn.target);
        if (source && target) {
          return <ConnectionLine key={`${conn.source}-${conn.target}`} source={source} target={target} data={conn.data} />;
        }
        return null;
      })}

      {/* Render devices on top */}
      {Array.from(devices.values()).map((device) => (
        <DeviceNode
          key={device.id}
          device={device}
          onClick={() => onSelectDevice(device.id)}
        />
      ))}

      {/* Grid helper */}
      <gridHelper args={[20, 20]} position={[0, -2, 0]} />
    </group>
  );
}

/**
 * LAN View 3D Visualization Component
 */
export default function LANVisualization({
  onDeviceSelect,
}: {
  onDeviceSelect?: (device: DeviceUpdate) => void;
}) {
  const [devices, setDevices] = useState<Map<string, DeviceNode>>(new Map());
  const [connections, setConnections] = useState<Map<string, Connection>>(new Map());
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<ReturnType<typeof getWebSocketClient> | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = getWebSocketClient();

    if (!wsRef.current.isConnected()) {
      setIsLoading(true);
      wsRef.current.connect()
        .then(() => {
          // Subscribe to device updates
          const unsubDevice = wsRef.current!.subscribe('device_update', ((message) => {
            const device = message.data as DeviceUpdate;
            setDevices((prevDevices) => {
              const newDevices = new Map(prevDevices);
              
              if (!newDevices.has(device.id)) {
                const index = newDevices.size;
                const position = device.position
                  ? new THREE.Vector3(device.position.x, device.position.y, device.position.z)
                  : new THREE.Vector3(
                    ...Object.values(generateMockDeviceLocation(index))
                  );

                newDevices.set(device.id, {
                  id: device.id,
                  position,
                  data: device,
                });
              } else {
                const existing = newDevices.get(device.id)!;
                existing.data = device;
              }

              return newDevices;
            });
          }) as MessageHandler);

          // Subscribe to connection updates
          const unsubConn = wsRef.current!.subscribe('connection_update', ((message) => {
            const connection = message.data as ConnectionUpdate;
            setConnections((prevConns) => {
              const newConns = new Map(prevConns);
              const key = `${connection.source_id}-${connection.target_id}`;
              newConns.set(key, {
                source: connection.source_id,
                target: connection.target_id,
                data: connection,
              });
              return newConns;
            });
          }) as MessageHandler);

          unsubscribersRef.current = [unsubDevice, unsubConn];
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to connect WebSocket:', error);
          setIsLoading(false);
          
          // Generate mock data for demo
          setTimeout(() => {
            generateMockData();
          }, 1000);
        });
    } else {
      generateMockData();
    }

    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
    };
  }, []);

  const generateMockData = () => {
    const mockDevices = new Map<string, DeviceNode>();
    const mockConnections = new Map<string, Connection>();

    // Generate mock devices
    const deviceTypes: Array<'router' | 'pc' | 'server' | 'mobile' | 'iot'> = ['router', 'pc', 'server', 'mobile', 'iot'];
    const deviceCount = 12;

    for (let i = 0; i < deviceCount; i++) {
      const id = `device-${i}`;
      const type = deviceTypes[i % deviceTypes.length];
      const position = new THREE.Vector3(...Object.values(generateMockDeviceLocation(i)));

      mockDevices.set(id, {
        id,
        position,
        data: {
          id,
          name: `${type}-${i}`,
          ip: `192.168.1.${i + 10}`,
          mac: `00:11:22:33:44:${String(i).padStart(2, '0')}`,
          status: Math.random() > 0.1 ? 'online' : 'offline',
          type,
          traffic_in: Math.random() * 1000,
          traffic_out: Math.random() * 1000,
          threat_level: (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)],
        },
      });
    }

    // Generate mock connections
    for (let i = 0; i < deviceCount - 1; i++) {
      if (Math.random() > 0.3) {
        const targetIdx = i + 1 + Math.floor(Math.random() * 2);
        if (targetIdx < deviceCount) {
          const key = `device-${i}-device-${targetIdx}`;
          mockConnections.set(key, {
            source: `device-${i}`,
            target: `device-${targetIdx}`,
            data: {
              source_id: `device-${i}`,
              target_id: `device-${targetIdx}`,
              bandwidth: Math.random() * 1000,
              packets: Math.random() * 10000,
              status: (['active', 'idle', 'suspicious'] as const)[Math.floor(Math.random() * 3)],
            },
          });
        }
      }
    }

    setDevices(mockDevices);
    setConnections(mockConnections);
  };

  const handleDeviceSelect = (id: string) => {
    setSelectedDevice(id);
    const device = devices.get(id);
    if (device && onDeviceSelect) {
      onDeviceSelect(device.data);
    }
  };

  if (isLoading && devices.size === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading 3D LAN visualization...</p>
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
      <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
      <OrbitControls autoRotate autoRotateSpeed={0.5} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#a78bfa" />
      <pointLight position={[10, -10, 10]} intensity={0.5} color="#f472b6" />

      {/* Scene */}
      <LANScene
        devices={devices}
        connections={connections}
        selectedDevice={selectedDevice || undefined}
        onSelectDevice={handleDeviceSelect}
      />

      {/* Background */}
      <color attach="background" args={['#0a0a0a']} />
      <fog attach="fog" args={['#0a0a0a', 0, 50]} />
    </Canvas>
  );
}
