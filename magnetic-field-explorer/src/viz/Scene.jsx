import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport, Grid } from '@react-three/drei';

/** Shared 3D scene wrapper with orbit controls and lighting. */
export default function Scene({ children, cameraPosition = [5, 4, 5] }) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', background: '#0d1117' }}
      camera={{ position: cameraPosition, fov: 50, near: 0.01, far: 500 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#6699ff" />

      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ff4466', '#44ff66', '#4466ff']} labelColor="white" />
      </GizmoHelper>

      {children}
    </Canvas>
  );
}
