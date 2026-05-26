import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Translucent sphere + crosshair that tracks the OrbitControls orbit target.
 * Visible only when `active` is true.
 * The orbit target is what the user controls by panning — it serves as the
 * particle injection point.
 */
export default function InjectionMarker({ controlsRef, active }) {
  const groupRef = useRef();

  useFrame(() => {
    if (!active || !controlsRef?.current || !groupRef.current) return;
    const t = controlsRef.current.target;
    groupRef.current.position.set(t.x, t.y, t.z);
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
