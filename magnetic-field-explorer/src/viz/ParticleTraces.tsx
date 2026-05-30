import * as THREE from 'three';
import { Line } from '@react-three/drei';

interface ParticleTracesProps {
  particles: Float32Array[];
}

export default function ParticleTraces({ particles }: ParticleTracesProps) {
  if (!particles || particles.length === 0) return null;

  return (
    <>
      {particles.map((positions, idx) => {
        const n = positions.length / 3;
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < n; i++) {
          points.push(new THREE.Vector3(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2],
          ));
        }
        const hue = (idx * 137.508) % 360;
        const color = new THREE.Color().setHSL(hue / 360, 1, 0.6);

        return (
          <Line
            key={idx}
            points={points}
            color={color}
            lineWidth={1.8 as number}
            transparent
            opacity={0.85}
          />
        );
      })}
    </>
  );
}
