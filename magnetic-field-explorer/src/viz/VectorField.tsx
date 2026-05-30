import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface GridData {
  positions: Float32Array;
  vectors: Float32Array;
}

interface VectorFieldProps {
  gridData?: GridData;
  scale?: number;
  color?: string;
}

export default function VectorField({ gridData, scale = 0.3, color = '#44aaff' }: VectorFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  const { matrices, count } = useMemo(() => {
    if (!gridData) return { matrices: [] as THREE.Matrix4[], count: 0 };
    const { positions, vectors } = gridData;
    const M = positions.length / 3;
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < M; i++) {
      const bx = vectors[i * 3];
      const by = vectors[i * 3 + 1];
      const bz = vectors[i * 3 + 2];
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
    matrices.forEach((mat, i) => meshRef.current?.setMatrixAt(i, mat));
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <coneGeometry args={[0.04, 0.25, 6]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </instancedMesh>
  );
}
