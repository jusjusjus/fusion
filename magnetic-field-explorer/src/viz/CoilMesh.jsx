import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders a coil wire as a tube.
 * midpoints: Float32Array of length N*3 (the segment midpoints from coils.js)
 * color: hex string or THREE color
 */
export default function CoilMesh({ midpoints, color = '#ffaa00', radius = 0.03 }) {
  const geometry = useMemo(() => {
    const N = midpoints.length / 3;
    const points = [];
    for (let i = 0; i < N; i++) {
      points.push(new THREE.Vector3(midpoints[i * 3], midpoints[i * 3 + 1], midpoints[i * 3 + 2]));
    }
    // Close the loop
    points.push(points[0].clone());
    const curve = new THREE.CatmullRomCurve3(points, true);
    return new THREE.TubeGeometry(curve, Math.min(N * 2, 800), radius, 6, true);
  }, [midpoints, radius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
    </mesh>
  );
}
