/**
 * Charged particle (ion) trajectory via Boris integrator.
 *
 * The Boris integrator is symplectic (energy-conserving) and handles the
 * cyclotron rotation exactly regardless of step size, making it ideal for
 * magnetic confinement physics.
 *
 * Equation of motion: m dv/dt = q (v × B),  dx/dt = v
 */

import type { BFunc } from './fieldlines';

type Vec3 = [number, number, number];

interface TraceParticleOptions {
  dt?: number;
  nsteps?: number;
}

/**
 * Trace a charged particle trajectory.
 *
 * @param {number[]} x0    Initial position [x,y,z]
 * @param {number[]} v0    Initial velocity [vx,vy,vz]  (m/s or normalized)
 * @param {number}   q     Charge (C, can be negative for electrons)
 * @param {number}   m     Mass (kg)
 * @param {Function} bFunc B(x) → [Bx,By,Bz]
 * @param {number}   dt    Time step
 * @param {number}   nsteps
 * @returns {{ positions: Float32Array, velocities: Float32Array }}
 *   positions: (nsteps+1)*3, velocities: (nsteps+1)*3
 */
export function traceParticle(
  x0: ArrayLike<number>,
  v0: ArrayLike<number>,
  q: number,
  m: number,
  bFunc: BFunc,
  { dt = 0.01, nsteps = 1000 }: TraceParticleOptions = {},
): { positions: Float32Array; velocities: Float32Array } {
  const positions = new Float32Array((nsteps + 1) * 3);
  const velocities = new Float32Array((nsteps + 1) * 3);

  let x: Vec3 = [x0[0], x0[1], x0[2]];
  let v: Vec3 = [v0[0], v0[1], v0[2]];
  positions.set(x, 0);
  velocities.set(v, 0);

  for (let i = 0; i < nsteps; i++) {
    const B = bFunc(x);
    [x, v] = borisStep(x, v, B, q, m, dt);
    positions.set(x, (i + 1) * 3);
    velocities.set(v, (i + 1) * 3);
  }
  return { positions, velocities };
}

/**
 * Single Boris push step.
 * Reference: Birdsall & Langdon, "Plasma Physics via Computer Simulation".
 */
function borisStep(x: Vec3, v: Vec3, B: ArrayLike<number>, q: number, m: number, dt: number): [Vec3, Vec3] {
  const c = (q / m) * (dt / 2);
  const t: Vec3 = [c * B[0], c * B[1], c * B[2]];
  const tMag2 = t[0] ** 2 + t[1] ** 2 + t[2] ** 2;
  const s: Vec3 = [
    (2 * t[0]) / (1 + tMag2),
    (2 * t[1]) / (1 + tMag2),
    (2 * t[2]) / (1 + tMag2),
  ];

  const vMinus: Vec3 = [
    v[0] + (v[1] * t[2] - v[2] * t[1]),
    v[1] + (v[2] * t[0] - v[0] * t[2]),
    v[2] + (v[0] * t[1] - v[1] * t[0]),
  ];

  const vPrime: Vec3 = [
    vMinus[1] * s[2] - vMinus[2] * s[1],
    vMinus[2] * s[0] - vMinus[0] * s[2],
    vMinus[0] * s[1] - vMinus[1] * s[0],
  ];

  const vPlus: Vec3 = [
    v[0] + vPrime[0],
    v[1] + vPrime[1],
    v[2] + vPrime[2],
  ];

  const xNew: Vec3 = [x[0] + vPlus[0] * dt, x[1] + vPlus[1] * dt, x[2] + vPlus[2] * dt];
  return [xNew, vPlus];
}

/** Kinetic energy (arbitrary units when v is normalized). */
export function kineticEnergy(v: ArrayLike<number>, m: number): number {
  return 0.5 * m * (v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
}
