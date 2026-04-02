import React, { useRef } from 'react';
import { Text, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore, type NodeData } from '../../store/simulationStore';

const FloorLabel: React.FC<{ 
  position: [number, number, number]; 
  label: string; 
  isExit: boolean; 
  isRefuge: boolean; 
  isSelected: boolean;
  occupancy?: number;
  capacity?: number;
  participantCount?: number;
}> = ({
  position,
  label,
  isExit,
  isRefuge,
  isSelected,
  occupancy = 0,
  capacity = 10,
  participantCount = 0,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Crowd awareness: Red glow intensity based on participant count
  const crowdFactor = Math.min(participantCount / 5, 1); // Max intensity at 5+ people
  const baseColor = isExit ? '#10b981' : isRefuge ? '#8b5cf6' : isSelected ? '#60a5fa' : '#334155';
  
  // Mix base color with red if crowded
  const color = new THREE.Color(baseColor).lerp(new THREE.Color('#ef4444'), crowdFactor * 0.6);
  const emissive = isExit ? '#10b981' : isRefuge ? '#7c3aed' : isSelected ? '#3b82f6' : 
                   crowdFactor > 0.3 ? '#ef4444' : '#1e293b';

  useFrame(({ clock }) => {
    if (meshRef.current && isSelected) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.04);
    }
  });

  return (
    <group position={position}>
      {/* Room platform */}
      <mesh ref={meshRef} receiveShadow castShadow>
        <boxGeometry args={[2.8, 0.15, 2.8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isSelected || isExit || isRefuge ? 0.6 : 0.3}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Room marker pillar */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 1.0, 8]} />
        <meshStandardMaterial
          color={isExit ? '#10b981' : isRefuge ? '#8b5cf6' : isSelected ? '#60a5fa' : '#4a6fa5'}
          emissive={isExit ? '#10b981' : isRefuge ? '#7c3aed' : isSelected ? '#3b82f6' : '#334155'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Exit beacon sphere */}
      {isExit && (
        <Sphere args={[0.25, 12, 12]} position={[0, 1.4, 0]}>
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={1.2}
          />
        </Sphere>
      )}

      {/* Refuge beacon sphere (Shield/Star style) */}
      {isRefuge && (
        <Sphere args={[0.25, 12, 12]} position={[0, 1.4, 0]}>
          <meshStandardMaterial
            color="#a78bfa"
            emissive="#8b5cf6"
            emissiveIntensity={1.5}
          />
        </Sphere>
      )}

      {/* Selected start glow */}
      {isSelected && (
        <pointLight color="#3b82f6" intensity={3} distance={5} position={[0, 1, 0]} />
      )}

      {/* Exit/Refuge glow */}
      {(isExit || isRefuge) && (
        <pointLight color={isExit ? "#10b981" : "#8b5cf6"} intensity={2} distance={4} position={[0, 1, 0]} />
      )}

      {/* Room name label */}
      <Text
        position={[0, 1.6, 0]}
        fontSize={0.35}
        color={isExit ? '#6ee7b7' : isRefuge ? '#c4b5fd' : isSelected ? '#93c5fd' : '#94a3b8'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* Occupancy Badge for Refuges */}
      {isRefuge && (
        <Text
          position={[0, 1.25, 0]}
          fontSize={0.25}
          color={occupancy >= capacity ? '#ef4444' : '#c4b5fd'}
          anchorX="center"
          anchorY="top"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {`${occupancy} / ${capacity}`}
        </Text>
      )}
    </group>
  );
};

const CorridorEdge: React.FC<{ nodeA: NodeData; nodeB: NodeData }> = ({ nodeA, nodeB }) => {
  const start = new THREE.Vector3(nodeA.x, nodeA.y, nodeA.z);
  const end = new THREE.Vector3(nodeB.x, nodeB.y, nodeB.z);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dir = end.clone().sub(start);
  const len = dir.length();
  const isVertical = Math.abs(nodeA.y - nodeB.y) > 0.5;

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

  return (
    <mesh position={[mid.x, mid.y, mid.z]} quaternion={quaternion} receiveShadow>
      <cylinderGeometry args={[isVertical ? 0.12 : 0.08, isVertical ? 0.12 : 0.08, len, 6]} />
      <meshStandardMaterial
        color={isVertical ? '#f59e0b' : '#475569'}
        emissive={isVertical ? '#f59e0b' : '#334155'}
        emissiveIntensity={isVertical ? 0.4 : 0.15}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
};

export const LevelMap: React.FC = () => {
  const { nodes, edges, startNode, participants } = useSimulationStore();

  // Build a map for quick lookups
  const nodeMap = React.useMemo(() => {
    const m: Record<string, NodeData> = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  // Aggregate participant counts per node for crowd awareness
  const participantCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach(p => {
      counts[p.nodeId] = (counts[p.nodeId] || 0) + 1;
    });
    return counts;
  }, [participants]);

  return (
    <group>
      {/* Ground floor grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Upper floor platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 4.0, -2]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} transparent opacity={0.5} />
      </mesh>

      {/* Corridor edges */}
      {edges.map((edge, i) => {
        const a = nodeMap[edge.source];
        const b = nodeMap[edge.target];
        if (!a || !b) return null;
        return <CorridorEdge key={`edge-${i}`} nodeA={a} nodeB={b} />;
      })}
      
      {nodes.map(node => (
        <FloorLabel
          key={node.id}
          position={[node.x, node.y, node.z]}
          label={node.roomName || node.id}
          isExit={!!node.isExit}
          isRefuge={!!node.isRefuge}
          isSelected={startNode === node.id}
          capacity={node.capacity}
          occupancy={node.occupancy}
          participantCount={participantCounts[node.id] || 0}
        />
      ))}
    </group>
  );
};
