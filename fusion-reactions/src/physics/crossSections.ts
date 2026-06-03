/**
 * Bosch-Hale fusion cross-section and thermal reactivity parameterization.
 * Reference: H.-S. Bosch & G.M. Hale, Nuclear Fusion 32(4):611–631 (1992).
 *
 * Cross-section: Table I coefficients.
 * Reactivity:    Table IV / Table VII, equations (12)–(14).
 */

// ── Cross-section σ(E) ────────────────────────────────────────────────────────
// σ(E) [mb] = S(E) / (E [keV] × exp(B_G / √E))
// S(E) [mb·keV] = (A1 + E(A2 + E(A3 + E(A4 + E·A5)))) / (1 + E(B1 + E(B2 + E(B3 + E·B4))))

interface CrossSectionParams {
  B_G: number;           // Gamow constant [keV^(1/2)]
  A: [number, number, number, number, number];
  B: [number, number, number, number];
  label: string;
  color: string;
  Emin: number;          // validity range [keV]
  Emax: number;
}

export const CROSS_SECTION_REACTIONS: CrossSectionParams[] = [
  {
    label: 'D–T',
    color: '#ff6b6b',
    B_G: 34.3827,
    A: [6.927e4, 7.454e8, 2.050e6, 5.2002e4, 0],
    B: [6.38e1, -9.95e-1, 6.981e-5, 1.728e-4],
    Emin: 0.5,
    Emax: 550,
  },
  {
    // D(d,n)³He branch 1 coefficients (branch 2 added in crossSectionDDtotal)
    label: 'D–D',
    color: '#74c0fc',
    B_G: 31.3970,
    A: [5.3701e4, 3.3027e2, -1.2706e-1, 2.9327e-5, -2.5151e-9],
    B: [0, 0, 0, 0],
    Emin: 0.5,
    Emax: 4900,
  },
  {
    label: 'D–³He',
    color: '#69db7c',
    B_G: 68.7508,
    A: [5.7501e6, 2.5226e3, 4.5566e1, 0, 0],
    B: [-3.1995e-3, -8.5530e-6, 5.9014e-8, 0],
    Emin: 0.3,
    Emax: 900,
  },
];

/** Returns σ(E) in millibarns. E in keV. */
export function crossSectionMb(E: number, p: CrossSectionParams): number {
  if (E <= 0) return 0;
  const [A1, A2, A3, A4, A5] = p.A;
  const [B1, B2, B3, B4] = p.B;
  const S =
    (A1 + E * (A2 + E * (A3 + E * (A4 + E * A5)))) /
    (1 + E * (B1 + E * (B2 + E * (B3 + E * B4))));
  const gamow = Math.exp(p.B_G / Math.sqrt(E));
  return S / (E * gamow);
}

/**
 * D(d,p)T branch 2 — separate params for total D-D cross section.
 * B_G and m_rc2 same as branch 1.
 */
const DD_BRANCH2: CrossSectionParams = {
  label: 'D–D branch 2',
  color: '#74c0fc',
  B_G: 31.3970,
  A: [5.5576e4, 2.1054e2, -3.2638e-2, 1.4987e-6, 1.8181e-10],
  B: [0, 0, 0, 0],
  Emin: 0.5,
  Emax: 4900,
};

/** σ_D-T(E) in millibarns. */
export const crossSectionDT = (E: number): number =>
  crossSectionMb(E, CROSS_SECTION_REACTIONS[0]);

/** σ_D-D total (both branches) in millibarns. */
export function crossSectionDDtotal(E: number): number {
  return (
    crossSectionMb(E, CROSS_SECTION_REACTIONS[1]) +
    crossSectionMb(E, DD_BRANCH2)
  );
}

/** σ_D-³He(E) in millibarns. */
export const crossSectionDHe3 = (E: number): number =>
  crossSectionMb(E, CROSS_SECTION_REACTIONS[2]);
// Equations (12)–(14) of Bosch & Hale.
//   θ   = T / (1 − T(C2+T(C4+TC6)) / (1+T(C3+T(C5+TC7))))
//   ξ   = (B_G² / (4θ))^(1/3)
//   ⟨σv⟩ = C1 · θ · √(ξ/(m_rc2·T³)) · exp(−3ξ)   [cm³/s]

interface ReactivityParams {
  B_G: number;
  m_rc2: number;   // reduced mass × c² [keV]
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
    // Bosch-Hale Table VII, T(d,n)4He, range 0.2–100 keV
    C: [1.17302e-9, 1.51361e-2, 7.51886e-2, 4.60643e-3, 1.35000e-2, -1.06750e-4, 1.36600e-5],
  },
  {
    // D(d,n)³He branch only (≈ ½ total D-D); use below for D-D total ≈ 2×
    label: 'D–D (one branch)',
    color: '#74c0fc',
    B_G: 31.3970,
    m_rc2: 937814,
    // Bosch-Hale Table VII, D(d,n)3He, range 0.2–100 keV
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
  return sv_cm3s * 1e-6; // cm³/s → m³/s
}

/**
 * Compute D-D total reactivity ⟨σv⟩ ≈ 2 × (one branch).
 * (Both branches are approximately equal.)
 */
export function reactivityDD_m3s(T: number): number {
  return 2 * reactivity_m3s(T, REACTIVITY_REACTIONS[1]);
}
