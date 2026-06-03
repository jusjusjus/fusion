/**
 * Bosch-Hale thermal reactivity ⟨σv⟩(T) — minimal subset needed by the
 * fuel-cycle physics modules.
 *
 * Reference: H.-S. Bosch & G.M. Hale, Nuclear Fusion 32(4):611 (1992).
 * Equations (12)–(14); coefficients from Table VII.
 */

export interface ReactivityParams {
  B_G: number;
  m_rc2: number;
  C: [number, number, number, number, number, number, number];
  label: string;
  color: string;
}

export const REACTIVITY_REACTIONS: ReactivityParams[] = [
  {
    label: 'D–T',
    color: '#ff6b6b',
    B_G: 34.3827,
    m_rc2: 1124656,
    C: [1.17302e-9, 1.51361e-2, 7.51886e-2, 4.60643e-3, 1.35000e-2, -1.06750e-4, 1.36600e-5],
  },
  {
    label: 'D–D (one branch)',
    color: '#74c0fc',
    B_G: 31.3970,
    m_rc2: 937814,
    C: [5.43360e-12, 5.85778e-3, 7.68222e-3, 0.0, -2.96400e-6, 0.0, 0.0],
  },
];

/** Returns ⟨σv⟩ in m³/s. T in keV. */
export function reactivity_m3s(T: number, p: ReactivityParams): number {
  const [C1, C2, C3, C4, C5, C6, C7] = p.C;
  const denom = 1 - (T * (C2 + T * (C4 + T * C6))) / (1 + T * (C3 + T * (C5 + T * C7)));
  const theta = T / denom;
  const xi = Math.cbrt((p.B_G * p.B_G) / (4 * theta));
  const sv_cm3s = C1 * theta * Math.sqrt(xi / (p.m_rc2 * T * T * T)) * Math.exp(-3 * xi);
  return sv_cm3s * 1e-6;
}
