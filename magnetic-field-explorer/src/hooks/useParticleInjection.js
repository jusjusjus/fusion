import { useState, useCallback } from 'react';
import { traceParticle } from '../physics/particle.js';

/**
 * Per-lesson hook that manages the particle injection state.
 *
 * @param {function} bFunc  - (x: number[3]) => [Bx, By, Bz]
 * @returns injection state + actions
 */
export function useParticleInjection(bFunc) {
  const [injectionMode, setInjectionMode] = useState(false);
  const [particles, setParticles] = useState([]);

  // Velocity parameters
  const [speed,  setSpeed]  = useState(1);
  const [theta,  setTheta]  = useState(Math.PI / 4);
  const [phi,    setPhi]    = useState(0);
  const [charge, setCharge] = useState(1);
  const [mass,   setMass]   = useState(1);

  const toggleInjectionMode = useCallback(() => setInjectionMode(m => !m), []);

  /**
   * Inject a particle at the camera's current position.
   * Pass the THREE.Camera object (from cameraRef.current).
   */
  const injectAt = useCallback((camera) => {
    if (!camera || !bFunc) return;
    const pos = [camera.position.x, camera.position.y, camera.position.z];
    const v0 = [
      speed * Math.sin(theta) * Math.cos(phi),
      speed * Math.cos(theta),
      speed * Math.sin(theta) * Math.sin(phi),
    ];
    const result = traceParticle(pos, v0, charge, mass, bFunc, { dt: 0.005, nsteps: 3000 });
    setParticles(prev => [...prev, result.positions]);
  }, [bFunc, speed, theta, phi, charge, mass]);

  const clearParticles = useCallback(() => setParticles([]), []);

  return {
    injectionMode,
    toggleInjectionMode,
    particles,
    injectAt,
    clearParticles,
    speed,  setSpeed,
    theta,  setTheta,
    phi,    setPhi,
    charge, setCharge,
    mass,   setMass,
  };
}
