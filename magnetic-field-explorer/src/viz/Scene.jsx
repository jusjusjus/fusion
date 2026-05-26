import { useFrame } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import FirstPersonControls from './FirstPersonControls.jsx';

/** Updates cameraRef.current with the live THREE.Camera each frame. */
function CameraSync({ cameraRef }) {
  useFrame(({ camera }) => {
    if (cameraRef) cameraRef.current = camera;
  });
  return null;
}

/**
 * Shared 3D scene wrapper with orbit controls and lighting.
 *
 * When `injectionMode` is true, OrbitControls are disabled and
 * FirstPersonControls take over (arrow keys + WASD + Space).
 */
export default function Scene({
  children,
  cameraPosition = [5, 4, 5],
  controlsRef,
  cameraRef,
  injectionMode = false,
  onInject,
}) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', background: '#0d1117' }}
      camera={{ position: cameraPosition, fov: 50, near: 0.01, far: 500 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#6699ff" />

      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.1} enabled={!injectionMode} />
      {cameraRef && <CameraSync cameraRef={cameraRef} />}
      <FirstPersonControls active={injectionMode} onInject={onInject} />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ff4466', '#44ff66', '#4466ff']} labelColor="white" />
      </GizmoHelper>

      {children}
    </Canvas>
  );
}
