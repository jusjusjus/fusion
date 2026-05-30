import { describe, it, expect } from 'vitest';
import { traceFieldline, traceFieldlines, trajToPoints } from '../fieldlines';

type BFunc = (x: number[]) => number[];

describe('traceFieldline — uniform field', () => {
  // B = (0, 0, 1): field lines travel straight along +z
  const uniformBz: BFunc = () => [0, 0, 1];

  it('traces in +z direction from the starting point', () => {
    const x0 = [0.5, 0.3, 0];
    const traj = traceFieldline(x0, uniformBz, { length: 5, nsteps: 100 });
    // x and y should be constant; z should increase to +length
    // float32(0.5) = 0.5 exactly; float32(0.3) has ~1e-8 error → use precision 7
    for (let i = 0; i <= 100; i++) {
      expect(traj[i * 3 + 0]).toBeCloseTo(0.5, 8);
      expect(traj[i * 3 + 1]).toBeCloseTo(0.3, 7);
    }
    expect(traj[100 * 3 + 2]).toBeCloseTo(5, 4);
  });

  it('first point equals the seed', () => {
    const x0 = [1, 2, 3];
    const traj = traceFieldline(x0, uniformBz, { length: 1, nsteps: 10 });
    expect(traj[0]).toBeCloseTo(x0[0], 10);
    expect(traj[1]).toBeCloseTo(x0[1], 10);
    expect(traj[2]).toBeCloseTo(x0[2], 10);
  });

  it('output length is (nsteps + 1) * 3', () => {
    const nsteps = 250;
    const traj = traceFieldline([0, 0, 0], uniformBz, { length: 1, nsteps });
    expect(traj.length).toBe((nsteps + 1) * 3);
  });

  it('step size equals length / nsteps', () => {
    const length = 4, nsteps = 400;
    const traj = traceFieldline([0, 0, 0], uniformBz, { length, nsteps });
    const expectedStep = length / nsteps;
    for (let i = 0; i < nsteps; i++) {
      const dz = traj[(i + 1) * 3 + 2] - traj[i * 3 + 2];
      expect(dz).toBeCloseTo(expectedStep, 6);
    }
  });
});

describe('traceFieldline — bidirectional', () => {
  const uniformBz: BFunc = () => [0, 0, 1];

  it('produces a symmetric arc: equal extents in +z and −z', () => {
    const x0 = [0, 0, 0];
    const length = 10, nsteps = 200;
    const traj = traceFieldline(x0, uniformBz, { length, nsteps, bidirectional: true });

    // The midpoint index is halfSteps = nsteps/2 = 100
    const half = Math.floor(nsteps / 2);
    const zStart = traj[0 * 3 + 2];              // should be ≈ -length/2
    const zSeed  = traj[half * 3 + 2];           // should be ≈ 0
    const zEnd   = traj[(half + half) * 3 + 2];  // last point ≈ +length/2

    expect(zSeed).toBeCloseTo(0, 4);
    expect(zStart).toBeCloseTo(-length / 2, 2);
    expect(zEnd).toBeCloseTo(+length / 2, 2);
  });
});

describe('traceFieldline — zero field', () => {
  it('stops tracing when B is below the threshold', () => {
    const zeroB: BFunc = () => [0, 0, 0];
    // normalizedB returns null → trace stops at first step
    const traj = traceFieldline([1, 2, 3], zeroB, { length: 5, nsteps: 50 });
    // All subsequent points remain at the seed position
    for (let i = 1; i <= 50; i++) {
      expect(traj[i * 3 + 0]).toBe(0);  // Float32Array is zero-initialised
      expect(traj[i * 3 + 1]).toBe(0);
      expect(traj[i * 3 + 2]).toBe(0);
    }
  });
});

describe('traceFieldlines', () => {
  it('returns one trajectory per seed point', () => {
    const bFunc: BFunc = () => [1, 0, 0];
    const seeds = [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
    const lines = traceFieldlines(seeds, bFunc, { length: 1, nsteps: 10 });
    expect(lines.length).toBe(seeds.length);
    lines.forEach(l => expect(l.length).toBe(11 * 3));
  });
});

describe('trajToPoints', () => {
  it('converts a Float32Array trajectory to an array of [x,y,z] tuples', () => {
    const traj = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const pts = trajToPoints(traj);
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual([1, 2, 3]);
    expect(pts[1]).toEqual([4, 5, 6]);
    expect(pts[2]).toEqual([7, 8, 9]);
  });

  it('handles empty trajectory', () => {
    expect(trajToPoints(new Float32Array(0))).toHaveLength(0);
  });
});

describe('traceFieldline — radial field (convergence test)', () => {
  // B ∝ (x, y, 0): diverging field in xy plane.
  // A line starting on the x-axis stays on the x-axis.
  it('stays on x-axis when seed is on x-axis and B is radial outward', () => {
    const radialB: BFunc = ([x, y, z]) => {
      const r = Math.sqrt(x * x + y * y) || 1e-12;
      return [x / r, y / r, 0];
    };
    const traj = traceFieldline([1, 0, 0], radialB, { length: 2, nsteps: 100 });
    for (let i = 0; i <= 100; i++) {
      expect(traj[i * 3 + 1]).toBeCloseTo(0, 5);  // y stays 0
      expect(traj[i * 3 + 2]).toBeCloseTo(0, 5);  // z stays 0
    }
  });
});
