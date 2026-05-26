import * as THREE from 'three';
import { Line } from '@react-three/drei';

/**
 * Renders a list of particle trajectories as colored lines.
 * particles: array of Float32Array (each (nsteps+1)*3 positions)
 * Colors are spaced using the golden angle to avoid perceptual collisions.
 */
export default function ParticleTraces({ particles }) {
  if (!particles || particles.length === 0) return null;

  return (
    <>
      {particles.map((positions, idx) => {
        const n = positions.length / 3;
        const points = [];
        for (let i = 0; i < n; i++) {
          points.push(new THREE.Vector3(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
          ));
        }
        // Golden-angle hue spacing so each new trace is visually distinct
        const hue = (idx * 137.508) % 360;
        const color = new THREE.Color().setHSL(hue / 360, 1, 0.6);

        return (
          <Line
            key={idx}
            points={points}
            color={color}
            lineWidth={1.8}
            transparent
            opacity={0.85}
          />
        );
      })}
    </>
  );
}
