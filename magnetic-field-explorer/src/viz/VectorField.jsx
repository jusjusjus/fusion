import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Renders a 3D vector field as instanced arrow cones.
 * gridData: { positions: Float32Array(M*3), vectors: Float32Array(M*3) }
 */
export default function VectorField({ gridData, scale = 0.3, color = '#44aaff' }) {
  const meshRef = useRef();

  const { matrices, count } = useMemo(() => {
    if (!gridData) return { matrices: [], count: 0 };
    const { positions, vectors } = gridData;
    const M = positions.length / 3;
    const dummy = new THREE.Object3D();
    const mats = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < M; i++) {
      const bx = vectors[i * 3], by = vectors[i * 3 + 1], bz = vectors[i * 3 + 2];
      const mag = Math.sqrt(bx * bx + by * by + bz * bz);
      if (mag < 1e-14) continue;
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.quaternion.setFromUnitVectors(up, new THREE.Vector3(bx / mag, by / mag, bz / mag));
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
    }
    return { matrices: mats, count: mats.length };
  }, [gridData, scale]);

  useEffect(() => {
    if (!meshRef.current || count === 0) return;
    matrices.forEach((mat, i) => meshRef.current.setMatrixAt(i, mat));
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <coneGeometry args={[0.04, 0.25, 6]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </instancedMesh>
  );
}
