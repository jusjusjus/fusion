import { useMemo } from 'react';
import * as THREE from 'three';

interface CoilMeshProps {
  midpoints: Float32Array;
  color?: string;
  radius?: number;
  current?: number;
  maxRadius?: number;
}

export default function CoilMesh({
  midpoints,
  color = '#ffaa00',
  radius = 0.003,
  current = 1,
  maxRadius = Infinity,
}: CoilMeshProps) {
  const tubeRadius = Math.min(radius * Math.sqrt(Math.abs(current)), maxRadius);
  const geometry = useMemo(() => {
    const N = midpoints.length / 3;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      points.push(new THREE.Vector3(midpoints[i * 3], midpoints[i * 3 + 1], midpoints[i * 3 + 2]));
    }
    points.push(points[0]!.clone());
    const curve = new THREE.CatmullRomCurve3(points, true);
    return new THREE.TubeGeometry(curve, Math.min(N * 2, 800), tubeRadius, 6, true);
  }, [midpoints, tubeRadius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
    </mesh>
  );
}
