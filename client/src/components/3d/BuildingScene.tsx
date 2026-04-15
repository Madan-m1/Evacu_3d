import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { LevelMap } from './LevelMap';
import { EvacuationPath } from './EvacuationPath';
import { HazardZones } from './HazardZones';
import { Participants } from './Participants';
import { useSimulationStore } from '../../store/simulationStore';

export const BuildingScene: React.FC = () => {
  const { nodes, participants, localParticipantId } = useSimulationStore();
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: [0, 15, 20], fov: 45 }} shadows style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#0f172a']} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />

        <Suspense fallback={null}>
          <Environment preset="city" background blur={0.8} />
          
          <group position={[0, -2, 0]}>
            <LevelMap />
            <EvacuationPath />
            <HazardZones />
            <Participants participants={participants} nodes={nodes} localId={localParticipantId} />
          </group>
          
          <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={40} blur={2} far={10} />
        </Suspense>

        <OrbitControls 
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2 - 0.1}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
};

