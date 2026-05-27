import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MOVE_SPEED = 3;    // units per second
const LOOK_SPEED = 1.5;  // radians per second

// Reusable scratch objects — never re-allocated per frame
const _euler   = new THREE.Euler(0, 0, 0, 'YXZ');
const _forward = new THREE.Vector3();
const _right   = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);

/**
 * First-person camera controls — active only when `active` is true.
 * Must be rendered inside a <Canvas>.
 *
 * Controls:
 *   Arrow ← / →    Yaw  (look left / right, pure world-Y rotation, no roll)
 *   Arrow ↑ / ↓    Pitch (look up / down, unclamped — camera can flip)
 *   W / S          Move forward / backward
 *   A / D          Strafe left / right
 *   Space          Inject particle — calls onInject(camera)
 *
 * The key insight for correct FPS look: extract the camera quaternion into
 * a YXZ Euler, modify Y (yaw) and X (pitch) independently, then force Z=0
 * to eliminate any roll accumulation.  Never use rotateOnWorldAxis for yaw
 * because it produces roll when the camera is already pitched.
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

    // ── Rotation ────────────────────────────────────────────────────────
    const yawDelta   = ((k['ArrowLeft']  ? 1 : 0) - (k['ArrowRight'] ? 1 : 0)) * LOOK_SPEED * dt;
    const pitchDelta = ((k['ArrowUp']    ? 1 : 0) - (k['ArrowDown']  ? 1 : 0)) * LOOK_SPEED * dt;

    if (yawDelta !== 0 || pitchDelta !== 0) {
      // Extract into YXZ Euler: Y = world yaw (applied first), X = pitch, Z = roll
      _euler.setFromQuaternion(camera.quaternion, 'YXZ');
      _euler.y += yawDelta;    // pure horizontal turn, independent of pitch
      _euler.x += pitchDelta;  // look up / down; unclamped so camera can flip
      _euler.z = 0;            // kill any roll that may have crept in
      camera.quaternion.setFromEuler(_euler);
    }

    // ── Translation ─────────────────────────────────────────────────────
    const fwd    = (k['KeyW'] ? 1 : 0) - (k['KeyS'] ? 1 : 0);
    const strafe = (k['KeyD'] ? 1 : 0) - (k['KeyA'] ? 1 : 0);

    if (fwd !== 0 || strafe !== 0) {
      camera.getWorldDirection(_forward);
      _right.crossVectors(_forward, _worldUp).normalize();
      camera.position.addScaledVector(_forward, fwd    * MOVE_SPEED * dt);
      camera.position.addScaledVector(_right,   strafe * MOVE_SPEED * dt);
    }
  });

  return null;
}

