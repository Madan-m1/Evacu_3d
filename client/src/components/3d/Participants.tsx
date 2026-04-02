import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ParticipantData, NodeData } from '../../store/simulationStore';

const ParticipantMarker: React.FC<{ participant: ParticipantData; node: NodeData }> = ({ participant, node }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Color based on status
  const color = participant.status === 'evacuating' ? '#3b82f6' : 
                participant.status === 'refuge_mode' ? '#a855f7' : 
                participant.status === 'reached_exit' ? '#10b981' : '#6b7280';

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Gentle bounce animation
      meshRef.current.position.y = 0.8 + Math.sin(clock.elapsedTime * 3) * 0.1;
      meshRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={[node.x, 0, node.z]}>
      {/* Participant Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Label */}
      <Html position={[0, 1.5, 0]} center distanceFactor={10}>
        <div className="flex flex-col items-center">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 px-2 py-0.5 rounded shadow-lg">
            <span className="text-[10px] font-bold text-white whitespace-nowrap">{participant.name}</span>
          </div>
          <div className="w-0.5 h-1.5 bg-gray-700"></div>
        </div>
      </Html>
    </group>
  );
};

export const Participants: React.FC<{ participants: ParticipantData[]; nodes: NodeData[]; localId: string }> = ({ 
  participants, 
  nodes,
  localId 
}) => {
  return (
    <group>
      {participants
        .filter(p => p.id !== localId) // Don't show local user as a marker (they already see their path/selection)
        .map(p => {
          const node = nodes.find(n => n.id === p.nodeId);
          if (!node) return null;
          return <ParticipantMarker key={p.id} participant={p} node={node} />;
        })}
    </group>
  );
};
