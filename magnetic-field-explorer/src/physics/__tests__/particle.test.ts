/**
 * Tests for the Boris particle integrator.
 *
 * The Boris algorithm is a symplectic integrator: it exactly conserves |v|²
 * in a pure magnetic field (each step is an exact Rodrigues rotation of the
 * velocity vector). Tests verify this mathematically and physically.
 */
import { describe, it, expect } from 'vitest';
import { traceParticle, kineticEnergy } from '../particle';

// Electron constants (SI)
const Q_ELECTRON = -1.602176634e-19;  // C
const M_ELECTRON =  9.109383702e-31;  // kg

// Proton constants (SI)
const Q_PROTON = +1.602176634e-19;   // C
const M_PROTON =  1.672621923e-27;   // kg

function speed(v: number[]): number {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
}

describe('Boris integrator — speed conservation', () => {
  // Uniform 1-T field along z; particle starts moving in x.
  const bFunc = () => [0, 0, 1];
  const v0 = [1e6, 0, 0];  // 1 Mm/s (non-relativistic)
  const speed0 = speed(v0);

  it('|v| is conserved exactly (to machine precision) for a single step', () => {
    const { velocities } = traceParticle([0, 0, 0], v0, Q_ELECTRON, M_ELECTRON, bFunc, {
      dt: 1e-12,
      nsteps: 1,
    });
    const vAfter = [velocities[3], velocities[4], velocities[5]];
    const relErr = Math.abs(speed(vAfter) - speed0) / speed0;
    // velocities are stored in Float32Array (~7 digits); tolerance matches float32 precision
    expect(relErr).toBeLessThan(1e-6);
  });

  it('|v| is conserved after 10 000 steps', () => {
    const { velocities } = traceParticle([0, 0, 0], v0, Q_ELECTRON, M_ELECTRON, bFunc, {
      dt: 1e-12,
      nsteps: 10000,
    });
    const n = velocities.length - 3;
    const vLast = [velocities[n], velocities[n + 1], velocities[n + 2]];
    const relErr = Math.abs(speed(vLast) - speed0) / speed0;
    expect(relErr).toBeLessThan(1e-6);
  });

  it('speed conservation holds for a proton at low energy', () => {
    const vp = [1e4, 0, 0]; // 10 km/s
    const { velocities } = traceParticle([0, 0, 0], vp, Q_PROTON, M_PROTON, bFunc, {
      dt: 1e-9,
      nsteps: 5000,
    });
    const n = velocities.length - 3;
    const vLast = [velocities[n], velocities[n + 1], velocities[n + 2]];
    const relErr = Math.abs(speed(vLast) - speed(vp)) / speed(vp);
    expect(relErr).toBeLessThan(1e-6);
  });
});

describe('Boris integrator — trajectory physics', () => {
  const Bz = 1.0;  // T
  const bFunc = () => [0, 0, Bz];

  it('electron stays in the xy plane when injected horizontally (Bz field)', () => {
    const { positions } = traceParticle(
      [0, 0, 0], [1e5, 0, 0],
      Q_ELECTRON, M_ELECTRON, bFunc,
      { dt: 1e-12, nsteps: 500 },
    );
    // z-coordinate of every point should remain 0 (no force along B)
    for (let i = 0; i <= 500; i++) {
      expect(Math.abs(positions[i * 3 + 2])).toBeLessThan(1e-12);
    }
  });

  it('gyration radius matches analytical r_c = mv/(|q|B)', () => {
    // For an electron at v = 1e6 m/s in B = 1 T:
    // r_c = m|v| / (|q||B|) = 9.109e-31 × 1e6 / (1.602e-19 × 1) ≈ 5.686e-6 m
    const vMag = 1e6;
    const v0 = [vMag, 0, 0];
    const rExpected = M_ELECTRON * vMag / (Math.abs(Q_ELECTRON) * Bz);

    // Need to cover ≥1.5 full cyclotron orbits to see both x extremes.
    // T_c = 2π m / (|q| B) ≈ 3.57e-11 s → 357 steps/orbit at dt=1e-13 → use 1000 steps (~2.8 orbits)
    const { positions } = traceParticle(
      [0, 0, 0], v0, Q_ELECTRON, M_ELECTRON, bFunc,
      { dt: 1e-13, nsteps: 1000 },
    );

    // Measure the x-extent (approximately diameter) of the trajectory
    let xMin = Infinity, xMax = -Infinity;
    for (let i = 0; i <= 1000; i++) {
      xMin = Math.min(xMin, positions[i * 3]);
      xMax = Math.max(xMax, positions[i * 3]);
    }
    const rMeasured = (xMax - xMin) / 2;
    const relErr = Math.abs(rMeasured - rExpected) / rExpected;
    // Allow 5% tolerance due to discrete orbit sampling
    expect(relErr).toBeLessThan(0.05);
  });

  it('electron and positron in same field curve in opposite senses', () => {
    const dt = 1e-12, nsteps = 200;
    const v0 = [1e5, 0, 0];
    const bFn = () => [0, 0, 0.1];

    const { positions: posNeg } = traceParticle([0, 0, 0], v0, Q_ELECTRON, M_ELECTRON, bFn, { dt, nsteps });
    const { positions: posPos } = traceParticle([0, 0, 0], v0, -Q_ELECTRON, M_ELECTRON, bFn, { dt, nsteps });

    // After a small arc, y-displacements should be opposite in sign
    const yNeg = posNeg[nsteps * 3 + 1];
    const yPos = posPos[nsteps * 3 + 1];
    expect(yNeg * yPos).toBeLessThan(0);
  });

  it('particle in zero field travels in a straight line', () => {
    const zeroB = () => [0, 0, 0];
    const v0 = [1e4, 2e4, 3e4];
    const { positions } = traceParticle([1, 2, 3], v0, Q_PROTON, M_PROTON, zeroB, {
      dt: 1e-9,
      nsteps: 100,
    });

    // After 100 steps of dt = 1ns, expected displacement:
    const dt = 1e-9;
    for (let i = 0; i <= 100; i++) {
      expect(positions[i * 3 + 0]).toBeCloseTo(1 + v0[0] * i * dt, 3);
      expect(positions[i * 3 + 1]).toBeCloseTo(2 + v0[1] * i * dt, 3);
      expect(positions[i * 3 + 2]).toBeCloseTo(3 + v0[2] * i * dt, 3);
    }
  });
});

describe('kineticEnergy', () => {
  it('computes ½mv² correctly', () => {
    const v = [3, 4, 0];   // |v| = 5
    const m = 2;
    const ke = kineticEnergy(v, m);
    expect(ke).toBeCloseTo(0.5 * m * 25, 10);
  });

  it('returns 0 for a stationary particle', () => {
    expect(kineticEnergy([0, 0, 0], M_ELECTRON)).toBe(0);
  });
});
