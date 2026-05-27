import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MOVE_SPEED = 3;    // units per second
const LOOK_SPEED = 1.5;  // radians per second

// Reusable scratch objects
const _rotQuat = new THREE.Quaternion();
const _forward = new THREE.Vector3();
const _right   = new THREE.Vector3();

// Fixed local-space unit axes.
// camera.quaternion.multiply(q) applies q in the camera's own frame,
// so these never need to be transformed.
const _axisX = new THREE.Vector3(1, 0, 0); // local right  → pitch
const _axisY = new THREE.Vector3(0, 1, 0); // local up     → yaw
const _axisZ = new THREE.Vector3(0, 0, 1); // local back   → roll  (+Z = -view dir)

/**
 * First-person / airplane camera controls.
 * All rotations operate in the camera's local frame so pitch, yaw, and roll
 * are fully independent regardless of current orientation.
 *
 *   Arrow ↑ / ↓    Pitch up / down   (local X axis)
 *   Arrow ← / →    Yaw  left / right (local Y axis)
 *   Q / E          Roll left / right  (local Z axis)
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

    // ── Pitch (Arrow ↑/↓) — local X ─────────────────────────────────
    const pitchDelta = ((k['ArrowUp']   ? 1 : 0) - (k['ArrowDown']  ? 1 : 0)) * LOOK_SPEED * dt;
    if (pitchDelta !== 0) {
      _rotQuat.setFromAxisAngle(_axisX, pitchDelta);
      camera.quaternion.multiply(_rotQuat);
    }

    // ── Yaw (Arrow ←/→) — local Y ────────────────────────────────────
    const yawDelta = ((k['ArrowLeft']  ? 1 : 0) - (k['ArrowRight'] ? 1 : 0)) * LOOK_SPEED * dt;
    if (yawDelta !== 0) {
      _rotQuat.setFromAxisAngle(_axisY, yawDelta);
      camera.quaternion.multiply(_rotQuat);
    }

    // ── Roll (Q/E) — local Z (= camera back = –view direction) ───────
    const rollDelta = ((k['KeyQ'] ? 1 : 0) - (k['KeyE'] ? 1 : 0)) * LOOK_SPEED * dt;
    if (rollDelta !== 0) {
      _rotQuat.setFromAxisAngle(_axisZ, rollDelta);
      camera.quaternion.multiply(_rotQuat);
    }

    // ── Translation (WASD) ────────────────────────────────────────────
    const fwd    = (k['KeyW'] ? 1 : 0) - (k['KeyS'] ? 1 : 0);
    const strafe = (k['KeyD'] ? 1 : 0) - (k['KeyA'] ? 1 : 0);
    if (fwd !== 0 || strafe !== 0) {
      // Derive axes from the camera's actual quaternion so they stay
      // correct after any combination of pitch, yaw, and roll.
      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion); // local -Z = view dir
      _right.set(1, 0, 0).applyQuaternion(camera.quaternion);    // local +X = right
      camera.position.addScaledVector(_forward, fwd    * MOVE_SPEED * dt);
      camera.position.addScaledVector(_right,   strafe * MOVE_SPEED * dt);
    }
  });

  return null;
}


