import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders a set of cone arrows evenly spaced around a coil wire,
 * pointing in the direction of current flow (derived from weightedDl tangents).
 *
 * Props:
 *   midpoints   Float32Array(N*3)  - segment midpoint positions
 *   weightedDl  Float32Array(N*3)  - segment tangent × current (direction sign encodes current polarity)
 *   color       string             - arrow color
 *   nArrows     number             - how many arrows to show
 *   coneRadius  number             - cone base radius (world units)
 *   coneHeight  number             - cone height (world units)
 */
export default function CurrentArrows({
  midpoints,
  weightedDl,
  color = '#ff6600',
  nArrows = 8,
  coneRadius = 0.06,
  coneHeight = 0.18,
}) {
  const meshRef = useRef();

  // Shared geometry (cone pointing along +Y by default in Three.js)
  const geometry = useMemo(
    () => new THREE.ConeGeometry(coneRadius, coneHeight, 10),
    [coneRadius, coneHeight]
  );

  const UP = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const N = midpoints.length / 3;
    if (N === 0) return;

    const step = N / nArrows;
    const pos = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const mat = new THREE.Matrix4();

    for (let a = 0; a < nArrows; a++) {
      const i = Math.floor(a * step) % N;
      pos.set(midpoints[i * 3], midpoints[i * 3 + 1], midpoints[i * 3 + 2]);

      const dx = weightedDl[i * 3], dy = weightedDl[i * 3 + 1], dz = weightedDl[i * 3 + 2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 1e-10) continue;

      dir.set(dx / len, dy / len, dz / len);
      // Avoid degenerate rotation when dir is anti-parallel to UP
      if (dir.dot(UP) < -0.9999) {
        quat.set(1, 0, 0, 0); // 180° around X
      } else {
        quat.setFromUnitVectors(UP, dir);
      }
      mat.compose(pos, quat, scale);
      mesh.setMatrixAt(a, mat);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [midpoints, weightedDl, nArrows, UP]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, nArrows]}>
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
    </instancedMesh>
  );
}
