import { describe, it, expect } from 'vitest';
import { toyMagneticField, sampleBzProfile } from '../toyField';

describe('toyMagneticField', () => {
  it('returns B0 everywhere when alpha = beta = 0', () => {
    const B0 = 0.005;
    const field = toyMagneticField({ B0, alpha: 0, beta: 0 });
    expect(field([0, 0, 0])[2]).toBeCloseTo(B0, 10);
    expect(field([1, 2, 3])[2]).toBeCloseTo(B0, 10);
    expect(field([-0.5, 0, 0])[2]).toBeCloseTo(B0, 10);
  });

  it('Bx and By are always zero (field is purely axial)', () => {
    const field = toyMagneticField({ B0: 0.001, alpha: 0.05, beta: 0.01 });
    const points = [[0, 0, 0], [0.3, -0.1, 1], [-0.2, 0.5, -0.4]];
    for (const p of points) {
      const B = field(p);
      expect(B[0]).toBe(0);
      expect(B[1]).toBe(0);
    }
  });

  it('Bz is symmetric in x: Bz(x) = Bz(-x)', () => {
    const field = toyMagneticField({ B0: 0.001, alpha: 0.05, beta: 0.02 });
    const xs = [0.1, 0.2, 0.5, 1.0];
    for (const x of xs) {
      const Bpos = field([+x, 0, 0])[2];
      const Bneg = field([-x, 0, 0])[2];
      expect(Bpos).toBeCloseTo(Bneg, 12);
    }
  });

  it('applies quadratic alpha term: Bz(x) = B0 + alpha * x²', () => {
    const B0 = 0.001, alpha = 2.0;
    const field = toyMagneticField({ B0, alpha, beta: 0 });
    const x = 0.3;
    expect(field([x, 0, 0])[2]).toBeCloseTo(B0 + alpha * x ** 2, 10);
    expect(field([0.5, 0, 0])[2]).toBeCloseTo(B0 + alpha * 0.25, 10);
  });

  it('applies quartic beta term: Bz(x) = B0 + alpha * x² + beta * x⁴', () => {
    const B0 = 0, alpha = 0, beta = 3.0;
    const field = toyMagneticField({ B0, alpha, beta });
    const x = 0.5;
    expect(field([x, 0, 0])[2]).toBeCloseTo(beta * x ** 4, 10);
  });

  it('Bz does not depend on y or z', () => {
    const field = toyMagneticField({ B0: 0.001, alpha: 0.1, beta: 0 });
    const x = 0.2;
    const Bref = field([x, 0, 0])[2];
    expect(field([x, 1, 0])[2]).toBeCloseTo(Bref, 10);
    expect(field([x, 0, 5])[2]).toBeCloseTo(Bref, 10);
    expect(field([x, -3, 7])[2]).toBeCloseTo(Bref, 10);
  });
});

describe('sampleBzProfile', () => {
  it('returns the requested number of points', () => {
    const data = sampleBzProfile({ B0: 0.001, alpha: 0, beta: 0 }, -0.3, 0.3, 80);
    expect(data).toHaveLength(80);
  });

  it('first point is at xMin and last is at xMax', () => {
    const data = sampleBzProfile({ B0: 0.001, alpha: 0, beta: 0 }, -0.5, 0.5, 50);
    expect(data[0].x).toBeCloseTo(-0.5, 5);
    expect(data[49].x).toBeCloseTo(0.5, 5);
  });

  it('Bz values match the toy field formula at each sample', () => {
    const params = { B0: 0.002, alpha: 0.1, beta: 0.05 };
    const data = sampleBzProfile(params, -0.3, 0.3, 20);
    for (const { x, Bz } of data) {
      const expected = params.B0 + params.alpha * x ** 2 + params.beta * x ** 4;
      // sampleBzProfile rounds x to 3 decimal places before computing Bz,
      // so comparing stored Bz against formula(rounded x) has ~2.5e-5 error → precision 3
      expect(Bz).toBeCloseTo(expected, 3);
    }
  });

  it('profile is symmetric: Bz(x) = Bz(-x)', () => {
    const data = sampleBzProfile({ B0: 0.001, alpha: 0.05, beta: 0 }, -1, 1, 100);
    // With an odd number of samples the midpoint is exactly x=0.
    // We check pairs around the centre.
    for (let i = 0; i < 50; i++) {
      expect(data[i].Bz).toBeCloseTo(data[99 - i].Bz, 5);
    }
  });

  it('uses default range and 80 points when not specified', () => {
    const data = sampleBzProfile({ B0: 0.001, alpha: 0, beta: 0 });
    expect(data).toHaveLength(80);
    expect(data[0].x).toBeCloseTo(-0.3, 2);
    expect(data[79].x).toBeCloseTo(0.3, 2);
  });
});
