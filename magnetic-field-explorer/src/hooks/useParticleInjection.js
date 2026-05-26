import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { traceParticle } from '../physics/particle.js';

const _dir = new THREE.Vector3();

/**
 * Per-lesson hook that manages the particle injection state.
 * Particles are launched from the camera position in the camera's view direction.
 *
 * @param {function} bFunc  - (x: number[3]) => [Bx, By, Bz]
 * @returns injection state + actions
 */
export function useParticleInjection(bFunc) {
  const [injectionMode, setInjectionMode] = useState(false);
  const [particles, setParticles] = useState([]);

  const [speed,  setSpeed]  = useState(1);
  const [charge, setCharge] = useState(1);
  const [mass,   setMass]   = useState(1);

  const toggleInjectionMode = useCallback(() => setInjectionMode(m => !m), []);

  /**
   * Inject a particle at the camera position, flying in the camera's view direction.
   * Pass the THREE.Camera object (from cameraRef.current).
   */
  const injectAt = useCallback((camera) => {
    if (!camera || !bFunc) return;
    const pos = [camera.position.x, camera.position.y, camera.position.z];
    camera.getWorldDirection(_dir);
    const v0 = [_dir.x * speed, _dir.y * speed, _dir.z * speed];
    const result = traceParticle(pos, v0, charge, mass, bFunc, { dt: 0.005, nsteps: 3000 });
    setParticles(prev => [...prev, result.positions]);
  }, [bFunc, speed, charge, mass]);

  const clearParticles = useCallback(() => setParticles([]), []);

  return {
    injectionMode,
    toggleInjectionMode,
    particles,
    injectAt,
    clearParticles,
    speed,  setSpeed,
    charge, setCharge,
    mass,   setMass,
  };
}
