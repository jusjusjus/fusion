/**
 * 1D Particle-in-Cell (PIC) simulation for the two-stream instability
 *
 * Two equal electron beams stream at ±v₀ through a uniform ion background.
 * The charge-neutral equilibrium is unstable to electrostatic perturbations;
 * waves near the beam frequency grow exponentially until nonlinear trapping
 * saturates them (cat's-eye vortices in phase space).
 *
 * Algorithm:
 *  1. Deposit electron charge: ρ_e[j]  (negative, CIC weighting)
 *  2. Add uniform ion background:  ρ_net[j] = ρ_e[j] + n₀·e
 *  3. Spectral Poisson solve: d²φ/dx² = −ρ_net/ε₀
 *  4. Compute E = −dφ/dx
 *  5. Leapfrog push: v ← v + (q/m)·E·Δt,  x ← x + v·Δt
 */

const E_CHARGE   = 1.602176634e-19;
const M_ELECTRON = 9.1093837015e-31;
const EPS0       = 8.854187817e-12;

export const QM_ELECTRON = -E_CHARGE / M_ELECTRON; // C/kg  (negative for electrons)

export interface PICState {
  /** Particle positions (m), periodic on [0, L) */
  x: Float64Array;
  /** Particle velocities (m/s) */
  v: Float64Array;
  /** Electric field at each grid node (V/m) */
  Egrid: Float64Array;
  /** Electric field energy ε₀/2 · Σ E²·Δx  (J/m²) */
  fieldEnergy: number;
  /** Domain length (m) */
  L: number;
  /** Number of grid cells */
  Ng: number;
  /** Simulation time (s) */
  t: number;
}

export interface TwoStreamParams {
  /** Number of macro-particles per beam */
  N: number;
  /** Beam velocity (m/s) */
  v0: number;
  /** Thermal velocity spread (m/s) */
  vth: number;
  /** Domain length (m) */
  L: number;
  /** Number of grid cells */
  Ng: number;
  /** Background ion density (m⁻³) */
  n0: number;
}

function randn(): number {
  const u = Math.random() + 1e-300;
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function initTwoStream(params: TwoStreamParams): PICState {
  const { N, v0, vth, L, Ng } = params;
  const total = 2 * N;
  const x = new Float64Array(total);
  const v = new Float64Array(total);

  for (let i = 0; i < N; i++) {
    // Slightly perturbed uniform spatial loading to seed the instability
    x[i]     = (L / N) * i * (1 + 0.005 * (Math.random() - 0.5));
    v[i]     = v0  + vth * randn();   // beam 1: +v0
    x[N + i] = (L / N) * (i + 0.5) * (1 + 0.005 * (Math.random() - 0.5));
    v[N + i] = -v0 + vth * randn();  // beam 2: −v0
  }
  for (let i = 0; i < total; i++) x[i] = ((x[i] % L) + L) % L;

  return { x, v, Egrid: new Float64Array(Ng), fieldEnergy: 0, L, Ng, t: 0 };
}

/** CIC charge deposition. Returns electron charge density (negative values). */
function depositCharge(
  x: Float64Array,
  L: number,
  Ng: number,
  qPerParticle: number,  // negative for electrons
): Float64Array {
  const rho = new Float64Array(Ng);
  const dx  = L / Ng;
  for (let i = 0; i < x.length; i++) {
    const xNorm = x[i] / dx;
    const j     = Math.floor(xNorm) % Ng;
    const jj    = (j + 1) % Ng;
    const frac  = xNorm - Math.floor(xNorm);
    rho[j]  += qPerParticle * (1 - frac) / dx;
    rho[jj] += qPerParticle * frac       / dx;
  }
  return rho;
}

/**
 * Spectral periodic Poisson solver.
 *
 * Solves  d²φ/dx² = −ρ_net/ε₀  on a periodic domain via DFT:
 *   φ̂_k = −ρ̂_net_k / (λ_k · ε₀)
 * where λ_k = (2·cos(2πk/N) − 2) / Δx²  (Laplacian eigenvalue, Ng × Ng matrix)
 * φ̂_0 = 0  (gauge: zero mean potential).
 *
 * Then  E = −dφ/dx  via centred differences.
 */
function solvePoisson(
  rho_electrons: Float64Array,
  L: number,
  Ng: number,
  n0_ion_charge: number,  // = n0 * E_CHARGE  (positive)
): Float64Array {
  const dx = L / Ng;

  // Net charge density: electrons (negative) + ions (positive background)
  const rho_net = new Float64Array(Ng);
  for (let j = 0; j < Ng; j++) {
    rho_net[j] = rho_electrons[j] + n0_ion_charge;
  }

  // Forward DFT of rho_net
  const reRho = new Float64Array(Ng);
  const imRho = new Float64Array(Ng);
  for (let k = 0; k < Ng; k++) {
    for (let j = 0; j < Ng; j++) {
      const angle = (2 * Math.PI * k * j) / Ng;
      reRho[k] += rho_net[j] * Math.cos(angle);
      imRho[k] -= rho_net[j] * Math.sin(angle);
    }
  }

  // Solve in spectral space: φ̂_k = -ρ̂_k / (λ_k · ε₀)
  const rePhi = new Float64Array(Ng);
  const imPhi = new Float64Array(Ng);
  // k=0: set to zero (gauge)
  for (let k = 1; k < Ng; k++) {
    const lambda = (2 * Math.cos((2 * Math.PI * k) / Ng) - 2) / (dx * dx);
    rePhi[k] = -reRho[k] / (lambda * EPS0);
    imPhi[k] = -imRho[k] / (lambda * EPS0);
  }

  // Inverse DFT → phi(x)
  const phi = new Float64Array(Ng);
  for (let j = 0; j < Ng; j++) {
    for (let k = 0; k < Ng; k++) {
      const angle = (2 * Math.PI * k * j) / Ng;
      phi[j] += (rePhi[k] * Math.cos(angle) - imPhi[k] * Math.sin(angle)) / Ng;
    }
  }

  // E = −dφ/dx via centred differences
  const E = new Float64Array(Ng);
  for (let j = 0; j < Ng; j++) {
    const jp1 = (j + 1) % Ng;
    const jm1 = (j - 1 + Ng) % Ng;
    E[j] = -(phi[jp1] - phi[jm1]) / (2 * dx);
  }
  return E;
}

/** Interpolate grid E to particle positions (CIC). */
function interpolateE(E: Float64Array, x: Float64Array, L: number, Ng: number): Float64Array {
  const dx = L / Ng;
  const Ep = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const xNorm = x[i] / dx;
    const j     = Math.floor(xNorm) % Ng;
    const jj    = (j + 1) % Ng;
    const frac  = xNorm - Math.floor(xNorm);
    Ep[i] = E[j] * (1 - frac) + E[jj] * frac;
  }
  return Ep;
}

/**
 * Advance one leapfrog step.
 * @param qm  charge-to-mass ratio (C/kg); use QM_ELECTRON for electrons
 * @param n0  background ion density (m⁻³)
 */
export function stepPIC(state: PICState, dt: number, qm: number, n0: number): PICState {
  const { x, v, L, Ng } = state;
  const N = x.length;
  const dx = L / Ng;

  // Charge per macro-particle: negative for electrons
  // Each particle represents n0·L/N physical particles in 1D
  const qSign = Math.sign(qm);  // -1 for electrons
  const qPerParticle = qSign * n0 * E_CHARGE * L / N;

  // 1. Deposit electron charge (negative)
  const rho_e = depositCharge(x, L, Ng, qPerParticle);

  // 2. Poisson solve: net = electrons + ions
  const Egrid = solvePoisson(rho_e, L, Ng, n0 * E_CHARGE);

  // 3. Interpolate E to particles
  const Ep = interpolateE(Egrid, x, L, Ng);

  // 4. Leapfrog push (kick-drift)
  const newX = new Float64Array(N);
  const newV = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    newV[i] = v[i] + qm * Ep[i] * dt;
    newX[i] = ((x[i] + newV[i] * dt) % L + L) % L;
  }

  // Field energy: ε₀/2 · Σ E²·Δx
  let fieldEnergy = 0;
  for (let j = 0; j < Ng; j++) fieldEnergy += Egrid[j] * Egrid[j] * dx;
  fieldEnergy *= 0.5 * EPS0;

  return { x: newX, v: newV, Egrid, fieldEnergy, L, Ng, t: state.t + dt };
}
