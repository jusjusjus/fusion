/**
 * Tests for fieldAtPoint (Biot-Savart single-point evaluation).
 *
 * TF.js is only used by fieldAtGrid; we mock it to prevent import errors
 * and focus entirely on the pure-JS fieldAtPoint function.
 */
import { vi, describe, it, expect } from 'vitest';

vi.mock('@tensorflow/tfjs', () => ({
  tidy: (fn: () => unknown) => fn(),
  tensor2d: vi.fn().mockReturnValue({}),
  sub: vi.fn().mockReturnValue({}),
  expandDims: vi.fn().mockReturnValue({}),
  sum: vi.fn().mockReturnValue({}),
  square: vi.fn().mockReturnValue({}),
  add: vi.fn().mockReturnValue({}),
  pow: vi.fn().mockReturnValue({}),
  mul: vi.fn().mockReturnValue({}),
  div: vi.fn().mockReturnValue({}),
  slice: vi.fn().mockReturnValue({}),
  concat: vi.fn().mockReturnValue({ dataSync: vi.fn().mockReturnValue(new Float32Array()) }),
}));

import { fieldAtPoint } from '../biotSavart';
import { circularLoop } from '../coils';
import { MU0_OVER_4PI } from '../units';

// Analytic on-axis field of a circular loop:
//   Bz(z) = (μ₀/4π) · 2π I a² / (a² + z²)^(3/2)
//         = MU0_OVER_4PI · 2π I a² / (a² + z²)^(3/2)
// At centre (z=0): Bz = MU0_OVER_4PI · 2π I / a
function analyticBzOnAxis(I: number, a: number, z: number): number {
  return MU0_OVER_4PI * 2 * Math.PI * I * a * a / Math.pow(a * a + z * z, 1.5);
}

describe('fieldAtPoint — circular loop', () => {
  const a = 1.0;   // 1 m radius
  const I = 1.0;   // 1 A
  const n = 2000;  // high segment count for accurate integration

  const { midpoints, weightedDl } = circularLoop({ radius: a, z: 0, n, current: I });

  it('on-axis Bz at centre matches analytic μ₀I/(2a) to 0.01%', () => {
    const B = fieldAtPoint([0, 0, 0], midpoints, weightedDl);
    const expected = analyticBzOnAxis(I, a, 0);           // ≈ 6.2832×10⁻⁷ T
    const relErr = Math.abs(B[2] - expected) / expected;
    expect(relErr).toBeLessThan(1e-4);
  });

  it('Bx and By are zero at the symmetry axis', () => {
    const B = fieldAtPoint([0, 0, 0], midpoints, weightedDl);
    expect(Math.abs(B[0])).toBeLessThan(1e-20);
    expect(Math.abs(B[1])).toBeLessThan(1e-20);
  });

  it('on-axis Bz at z = a/2 matches analytic formula to 0.01%', () => {
    const z = a / 2;
    const B = fieldAtPoint([0, 0, z], midpoints, weightedDl);
    const expected = analyticBzOnAxis(I, a, z);
    const relErr = Math.abs(B[2] - expected) / Math.abs(expected);
    expect(relErr).toBeLessThan(1e-4);
  });

  it('reversing current reverses the field direction', () => {
    const neg = circularLoop({ radius: a, z: 0, n, current: -I });
    const Bpos = fieldAtPoint([0, 0, 0], midpoints, weightedDl);
    const Bneg = fieldAtPoint([0, 0, 0], neg.midpoints, neg.weightedDl);
    expect(Bneg[2]).toBeCloseTo(-Bpos[2], 14);
  });

  it('doubling current doubles the field', () => {
    const double = circularLoop({ radius: a, z: 0, n, current: 2 * I });
    const B1 = fieldAtPoint([0, 0, 0], midpoints, weightedDl);
    const B2 = fieldAtPoint([0, 0, 0], double.midpoints, double.weightedDl);
    expect(B2[2] / B1[2]).toBeCloseTo(2.0, 10);
  });

  it('field magnitude decreases with axial distance', () => {
    const mag = (B: number[]) => Math.sqrt(B[0] ** 2 + B[1] ** 2 + B[2] ** 2);
    const B1 = fieldAtPoint([0, 0, 1], midpoints, weightedDl);
    const B2 = fieldAtPoint([0, 0, 5], midpoints, weightedDl);
    expect(mag(B1)).toBeGreaterThan(mag(B2));
  });

  it('satisfies far-field 1/r³ dipole scaling', () => {
    // For a magnetic dipole, |B| ∝ 1/r³ along the axis at large r.
    const B10 = fieldAtPoint([0, 0, 10], midpoints, weightedDl);
    const B20 = fieldAtPoint([0, 0, 20], midpoints, weightedDl);
    const ratio = Math.abs(B10[2]) / Math.abs(B20[2]);
    // Expect 8 ± 20% (exact dipole gives 8 = (20/10)^3)
    expect(ratio).toBeGreaterThan(6.5);
    expect(ratio).toBeLessThan(9.5);
  });
});

describe('fieldAtPoint — Helmholtz pair', () => {
  it('uniform field region at midplane is flatter than single loop', () => {
    const a = 0.1;
    const I = 1.0;
    const n = 500;
    const top = circularLoop({ radius: a, z: +a / 2, n, current: I });
    const bot = circularLoop({ radius: a, z: -a / 2, n, current: I });

    // Merge coil segments
    const mp = new Float32Array([...top.midpoints, ...bot.midpoints]);
    const wdl = new Float32Array([...top.weightedDl, ...bot.weightedDl]);

    const Bcenter = fieldAtPoint([0, 0, 0], mp, wdl)[2];
    const Boff    = fieldAtPoint([0, 0, 0.02 * a], mp, wdl)[2];

    // In the Helmholtz configuration, dBz/dz ≈ 0 at midplane — field is uniform.
    // The relative variation over 2% of the radius should be < 0.1%.
    const relVar = Math.abs(Boff - Bcenter) / Bcenter;
    expect(relVar).toBeLessThan(1e-3);
  });
});
