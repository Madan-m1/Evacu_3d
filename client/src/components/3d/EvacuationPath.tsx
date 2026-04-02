import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '../../store/simulationStore';

export const EvacuationPath: React.FC = () => {
  const pathCoordinates = useSimulationStore(state => state.pathCoordinates);
  const simulationMode = useSimulationStore(state => state.simulationMode);
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const { geometry, material, color } = useMemo(() => {
    if (pathCoordinates.length < 2) return { geometry: null, material: null, color: '#facc15' };

    const points = pathCoordinates.map(n => new THREE.Vector3(n.x, n.y + 0.5, n.z));
    const curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = 'chordal';

    const pathColor = simulationMode === 'refuge' ? '#f59e0b' : '#facc15';
    const geo = new THREE.TubeGeometry(curve, pathCoordinates.length * 12, 0.12, 8, false);
    const mat = new THREE.MeshStandardMaterial({
      color: pathColor,
      emissive: pathColor,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.9,
    });

    return { geometry: geo, material: mat, color: pathColor };
  }, [pathCoordinates, simulationMode]);

  // Animate glow pulse and a point light that travels along the path
  useFrame(({ clock }) => {
    if (material) {
      (material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(clock.elapsedTime * 4) * 0.5;
    }
    if (lightRef.current && pathCoordinates.length >= 2) {
      const t = (Math.sin(clock.elapsedTime * 0.8) * 0.5 + 0.5);
      const idx = Math.floor(t * (pathCoordinates.length - 1));
      const node = pathCoordinates[Math.min(idx, pathCoordinates.length - 1)];
      lightRef.current.position.set(node.x, node.y + 1, node.z);
    }
  });

  if (!geometry || !material || pathCoordinates.length < 2) return null;

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow />
      <pointLight
        ref={lightRef}
        color={color}
        intensity={4}
        distance={4}
        position={[pathCoordinates[0].x, pathCoordinates[0].y + 1, pathCoordinates[0].z]}
      />
      {/* Start and end markers */}
      <mesh position={[pathCoordinates[0].x, pathCoordinates[0].y + 0.6, pathCoordinates[0].z]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[
        pathCoordinates[pathCoordinates.length - 1].x,
        pathCoordinates[pathCoordinates.length - 1].y + 0.6,
        pathCoordinates[pathCoordinates.length - 1].z
      ]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial 
          color={simulationMode === 'refuge' ? '#8b5cf6' : '#10b981'} 
          emissive={simulationMode === 'refuge' ? '#7c3aed' : '#10b981'} 
          emissiveIntensity={1.5} 
        />
      </mesh>
    </group>
  );
};
