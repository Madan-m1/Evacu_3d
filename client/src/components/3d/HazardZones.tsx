import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/simulationStore';

const HazardNode: React.FC<{ node: any; hazard: any }> = ({ node, hazard }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const isAdmin = hazard.reportedBy === 'admin';
  const color = isAdmin ? '#ef4444' : '#f59e0b';
  const secondaryColor = isAdmin ? '#b91c1c' : '#d97706';

  useFrame(({ clock }) => {
    const pulseSpeed = isAdmin ? 12 : 6;
    if (meshRef.current) {
      const scale = 0.8 + Math.sin(clock.elapsedTime * pulseSpeed) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = (isAdmin ? 3.0 : 1.5) + Math.sin(clock.elapsedTime * pulseSpeed * 1.2) * 1;
    }
  });

  return (
    <group position={[node.x, node.y + 0.5, node.z]}>
      {/* Core hazard sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isAdmin ? 1.5 : 0.8} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Outer Glow / Smoke sphere */}
      <mesh scale={[1.4, 1.4, 1.4]}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial 
          color={secondaryColor} 
          emissive={secondaryColor} 
          emissiveIntensity={0.5} 
          transparent 
          opacity={0.3} 
          wireframe
        />
      </mesh>
      
      <pointLight ref={lightRef} color={color} distance={6} />
    </group>
  );
};

export const HazardZones: React.FC = () => {
  const { nodes, hazards, activeHazards } = useSimulationStore();
  
  return (
    <group>
      {activeHazards.map(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        const hazard = hazards.find(h => h.nodeId === nodeId);
        if (!node || !hazard) return null;
        return <HazardNode key={`hazard-${nodeId}`} node={node} hazard={hazard} />;
      })}
    </group>
  );
};
