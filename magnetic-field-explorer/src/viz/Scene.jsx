import { useCallback, useRef } from 'react';
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

/** Writes camera xyz directly to a DOM element — no React re-renders. */
function CameraCoords({ domRef }) {
  useFrame(({ camera }) => {
    if (!domRef.current) return;
    const { x, y, z } = camera.position;
    domRef.current.textContent =
      `x ${x >= 0 ? ' ' : ''}${x.toFixed(2)}  ` +
      `y ${y >= 0 ? ' ' : ''}${y.toFixed(2)}  ` +
      `z ${z >= 0 ? ' ' : ''}${z.toFixed(2)}`;
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
  const coordsRef = useRef(null);
  const internalControlsRef = useRef(null);
  const resolvedControlsRef = controlsRef ?? internalControlsRef;

  const resetCamera = useCallback(() => {
    // OrbitControls reset restores initial camera position + target
    resolvedControlsRef.current?.reset();
  }, [resolvedControlsRef]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        style={{ width: '100%', height: '100%', background: '#0d1117' }}
        camera={{ position: cameraPosition, fov: 50, near: 0.01, far: 500 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#6699ff" />

        <OrbitControls ref={resolvedControlsRef} makeDefault enableDamping dampingFactor={0.1} enabled={!injectionMode} />
        {cameraRef && <CameraSync cameraRef={cameraRef} />}
        <CameraCoords domRef={coordsRef} />
        <FirstPersonControls active={injectionMode} onInject={onInject} />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ff4466', '#44ff66', '#4466ff']} labelColor="white" />
        </GizmoHelper>

        {children}
      </Canvas>

      <div
        ref={coordsRef}
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          fontFamily: 'monospace',
          fontSize: 12,
          color: 'rgba(180,210,255,0.75)',
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.04em',
        }}
      />

      <button
        onClick={resetCamera}
        title="Reset camera"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(30,40,60,0.75)',
          border: '1px solid rgba(100,140,200,0.35)',
          borderRadius: 6,
          color: 'rgba(180,210,255,0.85)',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: '4px 7px',
          userSelect: 'none',
        }}
      >
        ⌂
      </button>
    </div>
  );
}

