import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const _dir = new THREE.Vector3();

/**
 * Translucent sphere + crosshair placed slightly in front of the camera along
 * the view direction — giving visual feedback of where the particle will start.
 * Visible only when `active` is true.
 */
export default function InjectionMarker({ active }) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (!active || !groupRef.current) return;
    camera.getWorldDirection(_dir);
    groupRef.current.position
      .copy(camera.position)
      .addScaledVector(_dir, 0.5);
  });

  if (!active) return null;

  const armLen = 0.4;
  const armR   = 0.015;

  return (
    <group ref={groupRef}>
      {/* Central sphere */}
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#ff4466" transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* X arm */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[armR, armR, armLen, 8]} />
        <meshBasicMaterial color="#ff4466" transparent opacity={0.6} depthWrite={false} />
      </mesh>

      {/* Y arm */}
      <mesh>
        <cylinderGeometry args={[armR, armR, armLen, 8]} />
        <meshBasicMaterial color="#ff4466" transparent opacity={0.6} depthWrite={false} />
      </mesh>

      {/* Z arm */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[armR, armR, armLen, 8]} />
        <meshBasicMaterial color="#ff4466" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}
