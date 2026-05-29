import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders a coil wire as a tube.
 * midpoints: Float32Array of length N*3 (the segment midpoints from coils.js)
 * color: hex string or THREE color
 * current: current in amperes — tube radius scales as baseRadius * sqrt(|current|)
 * radius: base tube radius at 1 A (metres)
 */
export default function CoilMesh({ midpoints, color = '#ffaa00', radius = 0.003, current = 1 }) {
  const tubeRadius = radius * Math.sqrt(Math.abs(current));
  const geometry = useMemo(() => {
    const N = midpoints.length / 3;
    const points = [];
    for (let i = 0; i < N; i++) {
      points.push(new THREE.Vector3(midpoints[i * 3], midpoints[i * 3 + 1], midpoints[i * 3 + 2]));
    }
    // Close the loop
    points.push(points[0].clone());
    const curve = new THREE.CatmullRomCurve3(points, true);
    return new THREE.TubeGeometry(curve, Math.min(N * 2, 800), tubeRadius, 6, true);
  }, [midpoints, tubeRadius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
    </mesh>
  );
}
