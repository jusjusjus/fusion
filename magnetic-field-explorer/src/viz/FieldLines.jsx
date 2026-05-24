import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

/**
 * Renders an array of field line trajectories.
 * lines: array of Float32Array (each (nsteps+1)*3)
 * colormap: function (t in [0,1]) → THREE.Color
 */
export default function FieldLines({ lines, colormap, lineWidth = 1, opacity = 0.7 }) {
  if (!lines || lines.length === 0) return null;

  return (
    <>
      {lines.map((traj, idx) => {
        const color = colormap
          ? colormap(idx / Math.max(lines.length - 1, 1))
          : new THREE.Color('#ff4466');
        const n = traj.length / 3;
        const points = [];
        for (let i = 0; i < n; i++) {
          points.push(new THREE.Vector3(traj[i * 3], traj[i * 3 + 1], traj[i * 3 + 2]));
        }
        return (
          <Line
            key={idx}
            points={points}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
          />
        );
      })}
    </>
  );
}
