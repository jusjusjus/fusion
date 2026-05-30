import * as THREE from 'three';
import { Line } from '@react-three/drei';

interface FieldLinesProps {
  lines: Float32Array[];
  colormap?: (t: number) => THREE.Color;
  lineWidth?: number;
  opacity?: number;
}

export default function FieldLines({
  lines,
  colormap,
  lineWidth = 1,
  opacity = 0.7,
}: FieldLinesProps) {
  if (!lines || lines.length === 0) return null;

  return (
    <>
      {lines.map((traj, idx) => {
        const color = colormap
          ? colormap(idx / Math.max(lines.length - 1, 1))
          : new THREE.Color('#ff4466');
        const n = traj.length / 3;
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < n; i++) {
          points.push(new THREE.Vector3(traj[i * 3], traj[i * 3 + 1], traj[i * 3 + 2]));
        }
        return (
          <Line
            key={idx}
            points={points}
            color={color}
            lineWidth={lineWidth as number}
            transparent
            opacity={opacity}
          />
        );
      })}
    </>
  );
}
