import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FirstPersonControlsProps {
  active: boolean;
  onInject?: (camera: THREE.Camera) => void;
}

interface Speeds {
  fwd: number;
  strafe: number;
  pitch: number;
  yaw: number;
  roll: number;
}

const MOVE_MAX = 0.5;
const LOOK_MAX = 1.2;
const RAMP_TIME = 0.8;

const MOVE_ACCEL = MOVE_MAX / RAMP_TIME;
const LOOK_ACCEL = LOOK_MAX / RAMP_TIME;

const _rotQuat = new THREE.Quaternion();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();

const _axisX = new THREE.Vector3(1, 0, 0);
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisZ = new THREE.Vector3(0, 0, 1);

export default function FirstPersonControls({ active, onInject }: FirstPersonControlsProps): null {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const spd = useRef<Speeds>({ fwd: 0, strafe: 0, pitch: 0, yaw: 0, roll: 0 });

  useEffect(() => {
    if (!active) return;

    const onDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'Space' && onInject) {
        e.preventDefault();
        onInject(camera);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      const s = spd.current;
      if (e.code === 'KeyW' || e.code === 'KeyS') s.fwd = 0;
      if (e.code === 'KeyA' || e.code === 'KeyD') s.strafe = 0;
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') s.pitch = 0;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') s.yaw = 0;
      if (e.code === 'KeyQ' || e.code === 'KeyE') s.roll = 0;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      keys.current = {};
      spd.current = { fwd: 0, strafe: 0, pitch: 0, yaw: 0, roll: 0 };
    };
  }, [active, camera, onInject]);

  useFrame((_, dt) => {
    if (!active) return;
    const k = keys.current;
    const s = spd.current;

    const ramp = (held: boolean, cur: number, accel: number, max: number): number => (
      held ? Math.min(cur + accel * dt, max) : 0
    );

    const pitchHeld = Boolean(k.ArrowUp || k.ArrowDown);
    s.pitch = ramp(pitchHeld, s.pitch, LOOK_ACCEL, LOOK_MAX);
    if (s.pitch > 0) {
      const sign = (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0);
      _rotQuat.setFromAxisAngle(_axisX, sign * s.pitch * dt);
      camera.quaternion.multiply(_rotQuat);
    }

    const yawHeld = Boolean(k.ArrowLeft || k.ArrowRight);
    s.yaw = ramp(yawHeld, s.yaw, LOOK_ACCEL, LOOK_MAX);
    if (s.yaw > 0) {
      const sign = (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0);
      _rotQuat.setFromAxisAngle(_axisY, sign * s.yaw * dt);
      camera.quaternion.multiply(_rotQuat);
    }

    const rollHeld = Boolean(k.KeyQ || k.KeyE);
    s.roll = ramp(rollHeld, s.roll, LOOK_ACCEL, LOOK_MAX);
    if (s.roll > 0) {
      const sign = (k.KeyQ ? 1 : 0) - (k.KeyE ? 1 : 0);
      _rotQuat.setFromAxisAngle(_axisZ, sign * s.roll * dt);
      camera.quaternion.multiply(_rotQuat);
    }

    const fwdHeld = Boolean(k.KeyW || k.KeyS);
    const strafeHeld = Boolean(k.KeyA || k.KeyD);
    s.fwd = ramp(fwdHeld, s.fwd, MOVE_ACCEL, MOVE_MAX);
    s.strafe = ramp(strafeHeld, s.strafe, MOVE_ACCEL, MOVE_MAX);

    if (s.fwd > 0 || s.strafe > 0) {
      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      if (s.fwd > 0) {
        const sign = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
        camera.position.addScaledVector(_forward, sign * s.fwd * dt);
      }
      if (s.strafe > 0) {
        const sign = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
        camera.position.addScaledVector(_right, sign * s.strafe * dt);
      }
    }
  });

  return null;
}
