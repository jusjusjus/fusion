/**
 * Nuclear constants and Q values for fusion reactions.
 * All masses in atomic mass units (u), energies in MeV.
 * Reference: AME 2020 atomic mass evaluation; NRL Plasma Formulary 2019.
 */

// Atomic mass unit in MeV/c²
export const U_MEV = 931.494;
// Proton mass [u]
const M_P = 1.007276;
// Neutron mass [u]
const M_N = 1.008665;
// Deuterium nucleus [u]
const M_D = 2.013553;
// Tritium nucleus [u]
const M_T = 3.015501;
// ³He nucleus [u]
const M_HE3 = 3.014932;
// ⁴He nucleus (alpha) [u]
const M_HE4 = 4.001506;

/** Q = mass_in − mass_out, converted to MeV */
function qValue(massIn: number, massOut: number): number {
  return (massIn - massOut) * U_MEV;
}

export interface Reaction {
  label: string;
  equation: string;
  /** Kinetic energy of products in CM frame [MeV] */
  Q_MeV: number;
  /** Product 1 name and energy [MeV] */
  product1: { name: string; E_MeV: number };
  /** Product 2 name and energy [MeV] */
  product2: { name: string; E_MeV: number };
  /** Energy release per unit fuel mass [GJ/g] */
  specificEnergy_GJperg: number;
}

/**
 * D + T → ⁴He (3.52 MeV) + n (14.07 MeV)   Q = 17.59 MeV
 */
export const DT: Reaction = (() => {
  const Q = qValue(M_D + M_T, M_HE4 + M_N);
  // Momentum conservation in CM: E_He4 / E_n = M_n / M_He4
  const E_n = Q * M_HE4 / (M_HE4 + M_N);
  const E_He4 = Q - E_n;
  // Fuel mass = 1 D + 1 T = (M_D + M_T) u/reaction, convert to g
  const fuelMass_g = (M_D + M_T) * 1.6605e-24; // g
  return {
    label: 'D–T',
    equation: 'D + T → ⁴He + n',
    Q_MeV: Q,
    product1: { name: '⁴He (α)', E_MeV: E_He4 },
    product2: { name: 'n', E_MeV: E_n },
    specificEnergy_GJperg: (Q * 1e6 * 1.602e-19) / (fuelMass_g * 1e9),
  };
})();

/**
 * D + D → T (1.01 MeV) + p (3.02 MeV)   Q ≈ 4.03 MeV  (branch 1)
 * D + D → ³He (0.82 MeV) + n (2.45 MeV)  Q ≈ 3.27 MeV  (branch 2)
 */
export const DD_branch1: Reaction = (() => {
  const Q = qValue(M_D + M_D, M_T + M_P);
  const E_p = Q * M_T / (M_T + M_P);
  const E_T = Q - E_p;
  const fuelMass_g = 2 * M_D * 1.6605e-24;
  return {
    label: 'D–D (→T+p)',
    equation: 'D + D → T + p',
    Q_MeV: Q,
    product1: { name: 'T', E_MeV: E_T },
    product2: { name: 'p', E_MeV: E_p },
    specificEnergy_GJperg: (Q * 1e6 * 1.602e-19) / (fuelMass_g * 1e9),
  };
})();

export const DD_branch2: Reaction = (() => {
  const Q = qValue(M_D + M_D, M_HE3 + M_N);
  const E_n = Q * M_HE3 / (M_HE3 + M_N);
  const E_He3 = Q - E_n;
  const fuelMass_g = 2 * M_D * 1.6605e-24;
  return {
    label: 'D–D (→³He+n)',
    equation: 'D + D → ³He + n',
    Q_MeV: Q,
    product1: { name: '³He', E_MeV: E_He3 },
    product2: { name: 'n', E_MeV: E_n },
    specificEnergy_GJperg: (Q * 1e6 * 1.602e-19) / (fuelMass_g * 1e9),
  };
})();

/**
 * D + ³He → ⁴He (3.67 MeV) + p (14.68 MeV)   Q ≈ 18.35 MeV
 */
export const DHe3: Reaction = (() => {
  const Q = qValue(M_D + M_HE3, M_HE4 + M_P);
  const E_p = Q * M_HE4 / (M_HE4 + M_P);
  const E_He4 = Q - E_p;
  const fuelMass_g = (M_D + M_HE3) * 1.6605e-24;
  return {
    label: 'D–³He',
    equation: 'D + ³He → ⁴He + p',
    Q_MeV: Q,
    product1: { name: '⁴He (α)', E_MeV: E_He4 },
    product2: { name: 'p', E_MeV: E_p },
    specificEnergy_GJperg: (Q * 1e6 * 1.602e-19) / (fuelMass_g * 1e9),
  };
})();

// ── Binding energy per nucleon (for bar chart) ────────────────────────────────
// Nuclear binding energy = (Z·M_p + N·M_n − M_nucleus) × c²
// Values from AME 2020 (in MeV/nucleon)

export interface Nuclide {
  symbol: string;
  A: number;     // mass number
  BE_per_A: number; // binding energy per nucleon [MeV]
  color: string;
}

export const NUCLIDES: Nuclide[] = [
  { symbol: '¹H (p)', A: 1,  BE_per_A: 0,       color: '#888' },
  { symbol: '²H (D)', A: 2,  BE_per_A: 1.112,   color: '#4dabf7' },
  { symbol: '³H (T)', A: 3,  BE_per_A: 2.827,   color: '#74c0fc' },
  { symbol: '³He',    A: 3,  BE_per_A: 2.573,   color: '#69db7c' },
  { symbol: '⁴He',   A: 4,  BE_per_A: 7.074,   color: '#ffd43b' },
  { symbol: '⁶Li',   A: 6,  BE_per_A: 5.332,   color: '#ff6b6b' },
  { symbol: '⁷Li',   A: 7,  BE_per_A: 5.606,   color: '#fa5252' },
];
