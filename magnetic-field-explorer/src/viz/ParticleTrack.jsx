import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

/**
 * Animated particle sphere with trailing line.
 * positions: Float32Array (nsteps+1)*3
 * progress: number in [0, 1] controlling how far along the track to show
 */
export default function ParticleTrack({ positions, progress = 1, color = '#ff4466' }) {
  if (!positions || positions.length < 6) return null;

  const total = positions.length / 3;
  const end = Math.max(2, Math.floor(progress * total));

  const trailPoints = [];
  for (let i = 0; i < end; i++) {
    trailPoints.push(new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]));
  }

  const head = trailPoints[end - 1];

  return (
    <>
      <Line points={trailPoints} color={color} lineWidth={1.5} transparent opacity={0.6} />
      <mesh position={head}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}
