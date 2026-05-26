import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MOVE_SPEED = 3;    // units per second
const LOOK_SPEED = 1.2;  // radians per second
const HALF_PI   = Math.PI / 2 - 0.01;

const _forward = new THREE.Vector3();
const _right   = new THREE.Vector3();
const _up      = new THREE.Vector3(0, 1, 0);

/**
 * First-person camera controls — active only when `active` is true.
 * Must be rendered inside a <Canvas>.
 *
 * Controls:
 *   Arrow ← / →    Yaw (look left / right)
 *   Arrow ↑ / ↓    Pitch (look up / down), clamped to ±89°
 *   W / S          Move forward / backward
 *   A / D          Strafe left / right
 *   Space          Inject particle — calls onInject(camera)
 */
export default function FirstPersonControls({ active, onInject }) {
  const { camera } = useThree();
  const keys = useRef({});

  useEffect(() => {
    if (!active) return;

    const onDown = (e) => {
      keys.current[e.code] = true;
      if (e.code === 'Space' && onInject) {
        e.preventDefault();
        onInject(camera);
      }
    };
    const onUp = (e) => { keys.current[e.code] = false; };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
      keys.current = {};
    };
  }, [active, camera, onInject]);

  useFrame((_, dt) => {
    if (!active) return;
    const k = keys.current;

    // ── Rotation ────────────────────────────────────────────────────
    const yawDelta   = ((k['ArrowLeft']  ? 1 : 0) - (k['ArrowRight'] ? 1 : 0)) * LOOK_SPEED * dt;
    const pitchDelta = ((k['ArrowUp']    ? 1 : 0) - (k['ArrowDown']  ? 1 : 0)) * LOOK_SPEED * dt;

    if (yawDelta !== 0) {
      camera.rotateOnWorldAxis(_up, yawDelta);
    }
    if (pitchDelta !== 0) {
      // Clamp pitch so camera doesn't flip over
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      euler.x = Math.max(-HALF_PI, Math.min(HALF_PI, euler.x + pitchDelta));
      camera.quaternion.setFromEuler(euler);
    }

    // ── Translation ─────────────────────────────────────────────────
    const fwd  = (k['KeyW'] ? 1 : 0) - (k['KeyS'] ? 1 : 0);
    const strafe = (k['KeyD'] ? 1 : 0) - (k['KeyA'] ? 1 : 0);

    if (fwd !== 0 || strafe !== 0) {
      camera.getWorldDirection(_forward);
      _right.crossVectors(_forward, _up).normalize();
      camera.position.addScaledVector(_forward, fwd    * MOVE_SPEED * dt);
      camera.position.addScaledVector(_right,   strafe * MOVE_SPEED * dt);
    }
  });

  return null;
}
