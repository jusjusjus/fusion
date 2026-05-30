import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { traceParticle } from '../physics/particle';
import { PARTICLES, E_CHARGE, speedFromEV } from '../physics/particles';
import type { BFunc } from '../physics/fieldlines';

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
 * auto-scaled to 1/100 of the Larmor orbit at the injection point (r_c / 100 / v),
 * and 200 complete orbits are traced (or at least 100 m), capped at 100 000 steps.
 */
export function useParticleInjection(bFunc: BFunc) {
  const [injectionMode, setInjectionMode] = useState(false);
  const [particles, setParticles] = useState<Float32Array[]>([]);

  const [speciesId, setSpeciesId] = useState('electron');
  const [energyEV, setEnergyEV] = useState(100);

  const toggleInjectionMode = useCallback(() => setInjectionMode((mode) => !mode), []);

  /**
   * Inject a particle at the camera position, flying in the camera's view direction.
   * Pass the THREE.Camera object (from cameraRef.current).
   */
  const injectAt = useCallback((camera: THREE.Camera | null | undefined) => {
    if (!camera || !bFunc) return;

    const particle = PARTICLES.find((p) => p.id === speciesId) ?? PARTICLES[0];
    const charge = particle.q_e * E_CHARGE;
    const mass_kg = particle.m_kg;
    const speed = speedFromEV(energyEV, mass_kg);

    const pos = [camera.position.x, camera.position.y, camera.position.z];
    camera.getWorldDirection(_dir);
    const v0 = [_dir.x * speed, _dir.y * speed, _dir.z * speed];

    const B0 = bFunc(pos);
    const Bmag = Math.sqrt(B0[0] ** 2 + B0[1] ** 2 + B0[2] ** 2);
    const r_c = Bmag > 1e-10
      ? (mass_kg * speed) / (Math.abs(charge) * Bmag)
      : 1.0;

    const STEP_M = Math.min(Math.max(r_c / 100, 5e-4), 0.5);
    const TRACE_M = Math.max(200 * r_c, 100);
    const dt = STEP_M / speed;
    const nsteps = Math.min(Math.ceil(TRACE_M / STEP_M), 100000);

    const result = traceParticle(pos, v0, charge, mass_kg, bFunc, { dt, nsteps });
    setParticles((prev) => [...prev, result.positions]);
  }, [bFunc, speciesId, energyEV]);

  const clearParticles = useCallback(() => setParticles([]), []);

  return {
    injectionMode,
    toggleInjectionMode,
    particles,
    injectAt,
    clearParticles,
    speciesId,
    setSpeciesId,
    energyEV,
    setEnergyEV,
  };
}
