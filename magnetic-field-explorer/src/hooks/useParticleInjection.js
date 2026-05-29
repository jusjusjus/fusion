import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { traceParticle } from '../physics/particle.js';
import { PARTICLES, E_CHARGE, speedFromEV } from '../physics/particles.js';

const _dir = new THREE.Vector3();

/**
 * Per-lesson hook that manages the particle injection state.
 * Particles are launched from the camera position in the camera's view direction.
 *
 * @param {function} bFunc  - (x: number[3]) => [Bx, By, Bz] in Tesla
 * @returns injection state + actions
 *
 * Species and energy (eV) determine the velocity magnitude using the
 * non-relativistic relation v = sqrt(2 KE / m).  The Boris timestep is
 * auto-scaled to 1/200 of the cyclotron period at the injection point,
 * and 10 complete orbits are traced (capped at 5000 steps).
 */
export function useParticleInjection(bFunc) {
  const [injectionMode, setInjectionMode] = useState(false);
  const [particles, setParticles] = useState([]);

  const [speciesId, setSpeciesId] = useState('electron');
  const [energyEV,  setEnergyEV]  = useState(100);        // eV

  const toggleInjectionMode = useCallback(() => setInjectionMode(m => !m), []);

  /**
   * Inject a particle at the camera position, flying in the camera's view direction.
   * Pass the THREE.Camera object (from cameraRef.current).
   */
  const injectAt = useCallback((camera) => {
    if (!camera || !bFunc) return;

    const particle = PARTICLES.find(p => p.id === speciesId);
    const charge   = particle.q_e * E_CHARGE;           // C (signed)
    const mass_kg  = particle.m_kg;                      // kg
    const speed    = speedFromEV(energyEV, mass_kg);     // m/s

    const pos = [camera.position.x, camera.position.y, camera.position.z];
    camera.getWorldDirection(_dir);
    const v0 = [_dir.x * speed, _dir.y * speed, _dir.z * speed];

    // Fix spatial step to 1 mm regardless of speed or local B strength.
    // This guarantees smooth trajectories and avoids the huge-dt problem when
    // B ≈ 0 at the injection point (weak B → large T_c → enormous time steps).
    const STEP_M   = 1e-3;                               // 1 mm spatial step
    const TRACE_M  = 5.0;                                // 5 m total path
    const dt       = STEP_M / speed;                     // s per step
    const nsteps   = Math.ceil(TRACE_M / STEP_M);        // 5000

    const result = traceParticle(pos, v0, charge, mass_kg, bFunc, { dt, nsteps });
    setParticles(prev => [...prev, result.positions]);
  }, [bFunc, speciesId, energyEV]);

  const clearParticles = useCallback(() => setParticles([]), []);

  return {
    injectionMode,
    toggleInjectionMode,
    particles,
    injectAt,
    clearParticles,
    speciesId, setSpeciesId,
    energyEV,  setEnergyEV,
  };
}
