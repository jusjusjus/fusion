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
const _rollQuat = new THREE.Quaternion();

/**
 * First-person camera controls — active only when `active` is true.
 * Must be rendered inside a <Canvas>.
 *
 * Controls:
 *   W / S          Move forward / backward (along camera look direction)
 *   A / D          Strafe left / right
 *   Arrow ← / →    Yaw  (look left / right, pure world-Y rotation, no roll drift)
 *   Arrow ↑ / ↓    Pitch (look up / down, unclamped — camera can flip)
 *   Q / E          Roll  (rotate around camera's forward axis)
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

    // ── Yaw + Pitch (arrows) ─────────────────────────────────────────────
    const yawDelta   = ((k['ArrowLeft']  ? 1 : 0) - (k['ArrowRight'] ? 1 : 0)) * LOOK_SPEED * dt;
    const pitchDelta = ((k['ArrowUp']    ? 1 : 0) - (k['ArrowDown']  ? 1 : 0)) * LOOK_SPEED * dt;

    if (yawDelta !== 0 || pitchDelta !== 0) {
      // YXZ Euler: Y = world yaw, X = pitch; force Z=0 to prevent roll drift
      _euler.setFromQuaternion(camera.quaternion, 'YXZ');
      _euler.y += yawDelta;
      _euler.x += pitchDelta;
      _euler.z = 0;
      camera.quaternion.setFromEuler(_euler);
    }

    // ── Roll (Q/E) — rotate around camera's own forward axis ────────────
    const rollDelta = ((k['KeyQ'] ? 1 : 0) - (k['KeyE'] ? 1 : 0)) * LOOK_SPEED * dt;
    if (rollDelta !== 0) {
      camera.getWorldDirection(_forward);
      _rollQuat.setFromAxisAngle(_forward, rollDelta);
      camera.quaternion.premultiply(_rollQuat);
    }

    // ── Translation (WASD) ──────────────────────────────────────────────
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

