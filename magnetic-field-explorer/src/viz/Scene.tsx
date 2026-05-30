import { useCallback, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import FirstPersonControls from './FirstPersonControls';

interface SceneProps {
  children?: ReactNode;
  cameraPosition?: [number, number, number];
  controlsRef?: RefObject<any>;
  cameraRef?: RefObject<THREE.Camera | null>;
  injectionMode?: boolean;
  onInject?: (camera: THREE.Camera) => void;
}

interface CameraSyncProps {
  cameraRef: RefObject<THREE.Camera | null>;
}

interface CameraCoordsProps {
  domRef: RefObject<HTMLDivElement | null>;
}

function CameraSync({ cameraRef }: CameraSyncProps): null {
  useFrame(({ camera }) => {
    cameraRef.current = camera;
  });
  return null;
}

function CameraCoords({ domRef }: CameraCoordsProps): null {
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

const gradientVert = /* glsl */`
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const gradientFrag = /* glsl */`
  varying vec3 vWorldPos;
  void main() {
    float t = clamp((vWorldPos.y + 30.0) / 60.0, 0.0, 1.0);
    vec3 colNeg = vec3(0.038, 0.055, 0.102);
    vec3 colPos = vec3(0.038, 0.102, 0.120);
    gl_FragColor = vec4(mix(colNeg, colPos, t), 1.0);
  }
`;

function GradientSky() {
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[200, 32, 16]} />
      <shaderMaterial
        vertexShader={gradientVert}
        fragmentShader={gradientFrag}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function Scene({
  children,
  cameraPosition = [0.5, 0.4, 0.5],
  controlsRef,
  cameraRef,
  injectionMode = false,
  onInject,
}: SceneProps) {
  const coordsRef = useRef<HTMLDivElement | null>(null);
  const internalControlsRef = useRef<any>(null);
  const resolvedControlsRef = controlsRef ?? internalControlsRef;

  const resetCamera = useCallback(() => {
    resolvedControlsRef.current?.reset?.();
  }, [resolvedControlsRef]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: cameraPosition, fov: 50, near: 0.01, far: 500 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[0.5, 1.0, 0.5]} intensity={0.8} />
        <pointLight position={[-0.5, -0.5, -0.5]} intensity={0.3} color="#6699ff" />

        <GradientSky />

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
