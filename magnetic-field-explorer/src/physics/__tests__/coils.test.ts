import { describe, it, expect } from 'vitest';
import {
  circularLoop,
  helmholtzPair,
  toroidalSet,
  verticalCircularCoil,
  helicalCoil,
  mergeCoils,
} from '../coils';

describe('circularLoop', () => {
  const n = 100;
  const radius = 0.5;
  const z = 0.3;
  const current = 2.5;
  const { midpoints, weightedDl } = circularLoop({ radius, z, n, current });

  it('produces exactly n segment midpoints', () => {
    expect(midpoints.length).toBe(n * 3);
    expect(weightedDl.length).toBe(n * 3);
  });

  it('all midpoints lie on a circle of the specified radius', () => {
    // Midpoints are averages of consecutive polygon vertices: their radius is r*cos(π/n)
    const expectedMidRadius = radius * Math.cos(Math.PI / n);
    for (let i = 0; i < n; i++) {
      const x = midpoints[i * 3];
      const y = midpoints[i * 3 + 1];
      const r = Math.sqrt(x * x + y * y);
      expect(r).toBeCloseTo(expectedMidRadius, 5);
    }
  });

  it('all midpoints are at the specified z', () => {
    // Float32Array storage has ~7 significant digits; use precision 7
    for (let i = 0; i < n; i++) {
      expect(midpoints[i * 3 + 2]).toBeCloseTo(z, 7);
    }
  });

  it('sum of weighted dl vectors is zero (closed loop)', () => {
    let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < n; i++) {
      sx += weightedDl[i * 3];
      sy += weightedDl[i * 3 + 1];
      sz += weightedDl[i * 3 + 2];
    }
    // Telescoping sum of a closed polygon is exactly zero
    expect(Math.abs(sx)).toBeLessThan(1e-10);
    expect(Math.abs(sy)).toBeLessThan(1e-10);
    expect(Math.abs(sz)).toBeLessThan(1e-10);
  });

  it('weightedDl magnitude per segment equals current × arc_length', () => {
    // Each segment arc ≈ 2π r / n; weightedDl = current × dl
    const expectedArc = current * (2 * Math.PI * radius) / n;
    for (let i = 0; i < n; i++) {
      const dx = weightedDl[i * 3], dy = weightedDl[i * 3 + 1];
      const segLen = Math.sqrt(dx * dx + dy * dy);
      expect(segLen).toBeCloseTo(expectedArc, 4);
    }
  });

  it('all weightedDl z-components are zero for a flat loop', () => {
    for (let i = 0; i < n; i++) {
      expect(weightedDl[i * 3 + 2]).toBeCloseTo(0, 15);
    }
  });
});

describe('helmholtzPair', () => {
  it('returns 2n segments', () => {
    const n = 80;
    const { midpoints } = helmholtzPair({ radius: 0.1, separation: 0.1, n, current: 1 });
    expect(midpoints.length / 3).toBe(2 * n);
  });

  it('loops are symmetrically placed above and below z=0', () => {
    const sep = 0.2;
    const n = 200;
    const { midpoints } = helmholtzPair({ radius: 0.1, separation: sep, n, current: 1 });
    // First n midpoints from top coil (z > 0), next n from bottom (z < 0)
    const zTop = midpoints[2];                // z of first point in top coil
    const zBot = midpoints[n * 3 + 2];        // z of first point in bottom coil
    expect(zTop).toBeCloseTo(sep / 2, 7);
    expect(zBot).toBeCloseTo(-sep / 2, 7);
  });
});

describe('toroidalSet', () => {
  it('returns N × n segment midpoints', () => {
    const N = 6, n = 50;
    const { midpoints } = toroidalSet({ N, R0: 1, a: 0.3, n, current: 1 });
    expect(midpoints.length / 3).toBe(N * n);
  });

  it('midpoints are distributed at all N toroidal angles', () => {
    const N = 4, n = 100, R0 = 1.0;
    const { midpoints } = toroidalSet({ N, R0, a: 0.3, n, current: 1 });
    // Collect the toroidal angle of the first midpoint of each coil
    const angles: number[] = [];
    for (let k = 0; k < N; k++) {
      const idx = k * n;
      const x = midpoints[idx * 3];
      const y = midpoints[idx * 3 + 1];
      angles.push(Math.atan2(y, x));
    }
    // Sort and check even spacing of ~π/2 ≈ 1.5708
    angles.sort((a, b) => a - b);
    for (let i = 1; i < angles.length; i++) {
      const gap = angles[i] - angles[i - 1];
      expect(gap).toBeCloseTo(2 * Math.PI / N, 2);
    }
  });
});

describe('mergeCoils', () => {
  it('concatenates midpoints and weightedDl from all input coils', () => {
    const c1 = circularLoop({ radius: 0.1, z: 0,   n: 50, current: 1 });
    const c2 = circularLoop({ radius: 0.2, z: 0.1, n: 100, current: 2 });
    const merged = mergeCoils([c1, c2]);
    expect(merged.midpoints.length / 3).toBe(150);
    expect(merged.weightedDl.length / 3).toBe(150);
    // First 50 segments should match c1
    expect(merged.midpoints[0]).toBeCloseTo(c1.midpoints[0], 10);
    // Segments 50–149 should match c2
    expect(merged.midpoints[50 * 3]).toBeCloseTo(c2.midpoints[0], 10);
  });

  it('merging a single coil is a no-op', () => {
    const c = circularLoop({ radius: 0.1, n: 60, current: 3 });
    const merged = mergeCoils([c]);
    expect(merged.midpoints.length).toBe(c.midpoints.length);
    for (let i = 0; i < c.midpoints.length; i++) {
      expect(merged.midpoints[i]).toBe(c.midpoints[i]);
    }
  });

  it('empty merge returns zero-length arrays', () => {
    const merged = mergeCoils([]);
    expect(merged.midpoints.length).toBe(0);
    expect(merged.weightedDl.length).toBe(0);
  });
});

describe('verticalCircularCoil', () => {
  it('midpoints lie in the correct radial plane at phi0 = 0', () => {
    const n = 50, R0 = 1.5, a = 0.4;
    const { midpoints } = verticalCircularCoil({ phi0: 0, R0, a, n, current: 1 });
    // For phi0=0, the coil lies in the x-z plane, so all y should be ~0
    for (let i = 0; i < n; i++) {
      expect(midpoints[i * 3 + 1]).toBeCloseTo(0, 5);
    }
  });

  it('all midpoints lie on a torus at the correct major and minor radius', () => {
    const n = 50, R0 = 1.5, a = 0.4;
    const { midpoints } = verticalCircularCoil({ phi0: 0, R0, a, n, current: 1 });
    for (let i = 0; i < n; i++) {
      const x = midpoints[i * 3], y = midpoints[i * 3 + 1], z = midpoints[i * 3 + 2];
      // Distance from z-axis minus R0 should be ≤ a
      const rho = Math.sqrt(x * x + y * y);
      const dr = rho - R0;                        // radial deviation from R0
      const dist = Math.sqrt(dr * dr + z * z);    // distance from torus centreline
      // Midpoints are averages of polygon vertices → dist = a * cos(π/n)
      const expectedDist = a * Math.cos(Math.PI / n);
      expect(dist).toBeCloseTo(expectedDist, 5);
    }
  });
});

describe('helicalCoil', () => {
  it('produces exactly n segment midpoints', () => {
    const n = 360;
    const { midpoints } = helicalCoil({ R0: 1, a: 0.3, nfp: 3, n, current: 1 });
    expect(midpoints.length / 3).toBe(n);
  });

  it('sum of dl vectors is approximately zero (nearly closed path)', () => {
    const n = 1200;
    const { weightedDl } = helicalCoil({ R0: 1, a: 0.3, nfp: 3, n, current: 1 });
    let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < n; i++) {
      sx += weightedDl[i * 3];
      sy += weightedDl[i * 3 + 1];
      sz += weightedDl[i * 3 + 2];
    }
    // nfp=3 wraps exactly 3 times → path closes → dl sum ≈ 0
    expect(Math.abs(sx)).toBeLessThan(1e-10);
    expect(Math.abs(sy)).toBeLessThan(1e-10);
    expect(Math.abs(sz)).toBeLessThan(1e-10);
  });
});
