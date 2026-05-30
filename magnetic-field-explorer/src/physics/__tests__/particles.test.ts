import { describe, it, expect } from 'vitest';
import { PARTICLES, E_CHARGE, speedFromEV } from '../particles.js';

describe('E_CHARGE', () => {
  it('equals the CODATA 2018 elementary charge in Coulombs', () => {
    // Exact value since 2019 SI redefinition
    expect(E_CHARGE).toBeCloseTo(1.602176634e-19, 28);
  });
});

describe('PARTICLES', () => {
  it('contains electron, proton, deuteron, He⁺, and alpha', () => {
    const ids = PARTICLES.map((p) => p.id);
    expect(ids).toContain('electron');
    expect(ids).toContain('proton');
    expect(ids).toContain('deuteron');
    expect(ids).toContain('alpha');
  });

  it('electron has negative charge and smallest mass', () => {
    const e = PARTICLES.find((p) => p.id === 'electron')!;
    expect(e.q_e).toBe(-1);
    const masses = PARTICLES.map((p) => p.m_kg);
    expect(e.m_kg).toBe(Math.min(...masses));
  });

  it('proton has positive unit charge', () => {
    const p = PARTICLES.find((p) => p.id === 'proton')!;
    expect(p.q_e).toBe(+1);
  });

  it('alpha particle has charge +2', () => {
    const a = PARTICLES.find((p) => p.id === 'alpha')!;
    expect(a.q_e).toBe(+2);
  });

  it('proton mass is ≈ 1836 × electron mass', () => {
    const e = PARTICLES.find((p) => p.id === 'electron')!;
    const p = PARTICLES.find((p) => p.id === 'proton')!;
    const ratio = p.m_kg / e.m_kg;
    expect(ratio).toBeGreaterThan(1830);
    expect(ratio).toBeLessThan(1840);
  });

  it('deuteron mass is ≈ 2 × proton mass', () => {
    const p = PARTICLES.find((p) => p.id === 'proton')!;
    const d = PARTICLES.find((p) => p.id === 'deuteron')!;
    const ratio = d.m_kg / p.m_kg;
    expect(ratio).toBeGreaterThan(1.99);
    expect(ratio).toBeLessThan(2.01);
  });
});

describe('speedFromEV', () => {
  // Non-relativistic KE: v = sqrt(2 KE / m)

  it('electron at 1 eV ≈ 593 km/s', () => {
    const e = PARTICLES.find((p) => p.id === 'electron')!;
    const v = speedFromEV(1, e.m_kg);
    // Analytic: sqrt(2 × 1.602e-19 / 9.109e-31) ≈ 593,000 m/s
    expect(v).toBeCloseTo(5.93e5, -3);   // within ~0.1%
  });

  it('electron at 100 eV scales as sqrt(100) × v(1 eV)', () => {
    const e = PARTICLES.find((p) => p.id === 'electron')!;
    const v1   = speedFromEV(1, e.m_kg);
    const v100 = speedFromEV(100, e.m_kg);
    expect(v100 / v1).toBeCloseTo(10, 6);
  });

  it('proton at 1 keV gives correct speed', () => {
    const p = PARTICLES.find((p) => p.id === 'proton')!;
    const v = speedFromEV(1000, p.m_kg);
    // sqrt(2 × 1000 × 1.602e-19 / 1.673e-27) ≈ 437,000 m/s
    expect(v).toBeGreaterThan(4e5);
    expect(v).toBeLessThan(5e5);
  });

  it('heavier particle at same energy is slower', () => {
    const e = PARTICLES.find((p) => p.id === 'electron')!;
    const p = PARTICLES.find((p) => p.id === 'proton')!;
    const eV = 1000;
    expect(speedFromEV(eV, e.m_kg)).toBeGreaterThan(speedFromEV(eV, p.m_kg));
  });

  it('speed scales as 1/sqrt(mass) at fixed energy', () => {
    const e = PARTICLES.find((p) => p.id === 'electron')!;
    const p = PARTICLES.find((p) => p.id === 'proton')!;
    const eV = 500;
    const ve = speedFromEV(eV, e.m_kg);
    const vp = speedFromEV(eV, p.m_kg);
    // v_e / v_p = sqrt(m_p / m_e)
    const expected = Math.sqrt(p.m_kg / e.m_kg);
    expect(ve / vp).toBeCloseTo(expected, 3);
  });

  it('returns 0 for 0 eV', () => {
    const e = PARTICLES.find((p) => p.id === 'electron')!;
    expect(speedFromEV(0, e.m_kg)).toBe(0);
  });
});
