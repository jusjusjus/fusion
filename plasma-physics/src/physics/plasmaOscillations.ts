/**
 * Plasma Oscillations — 1D cold-plasma sheet model
 *
 * N electron sheets are displaced from their uniform equilibrium positions.
 * The self-consistent restoring E field gives simple harmonic motion at ωp.
 *
 * For sheet i at position xᵢ with equilibrium x₀ᵢ = i·(L/N):
 *   E(xᵢ) = (n₀·e / ε₀) · (xᵢ − x₀ᵢ)    [mean-field / cold limit]
 *   aᵢ    = −(e/mₑ) · E = −ωp² · (xᵢ − x₀ᵢ)
 *
 * ωp = √(n₀ e² / ε₀ mₑ)
 *
 * Time is advanced with a leapfrog (Störmer–Verlet) integrator.
 */

const E_CHARGE  = 1.602176634e-19; // C
const M_ELECTRON = 9.1093837015e-31; // kg
const EPS0      = 8.854187817e-12;  // F/m

export interface OscState {
  /** Current sheet positions (m) */
  positions: Float64Array;
  /** Current sheet velocities (m/s) */
  velocities: Float64Array;
  /** Equilibrium sheet positions (m) */
  equilibria: Float64Array;
  /** Angular plasma frequency (rad/s) */
  wp: number;
  /** Domain length (m) */
  L: number;
  /** Simulation time (s) */
  t: number;
  /** Stable leapfrog timestep (s): wp·dt = 0.05 */
  dt: number;
}

export interface OscParams {
  /** Electron number density (m⁻³) */
  n0: number;
  /** Initial displacement amplitude (fraction of inter-sheet spacing) */
  amplitude: number;
  /** Number of sheets */
  N: number;
  /** Domain length (m) */
  L: number;
  /** Initial spatial mode number for the perturbation */
  mode: number;
}

export function initOscillation(params: OscParams): OscState {
  const { n0, amplitude, N, L, mode } = params;
  const wp = Math.sqrt(n0 * E_CHARGE * E_CHARGE / (EPS0 * M_ELECTRON));
  const spacing = L / N;

  const dt = 0.05 / wp;  // stability: wp·dt = 0.05, well within leapfrog limit of 2

  const equilibria = new Float64Array(N);
  const positions  = new Float64Array(N);
  const velocities = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    equilibria[i] = (i + 0.5) * spacing;
    positions[i]  = equilibria[i] + amplitude * spacing * Math.sin(2 * Math.PI * mode * i / N);
    velocities[i] = 0;
  }

  return { positions, velocities, equilibria, wp, L, t: 0, dt };
}

/**
 * Advance by one leapfrog step using the stable dt stored in state.
 * Uses minimum-image convention for displacement to handle particles
 * that cross the periodic boundary.
 */
export function stepOscillation(state: OscState): OscState {
  const { positions, velocities, equilibria, wp, L, dt } = state;
  const N = positions.length;
  const wp2 = wp * wp;
  const halfL = L * 0.5;

  const newPos = new Float64Array(N);
  const newVel = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    // Minimum-image displacement: correct for particles that crossed the boundary
    let disp = positions[i] - equilibria[i];
    if (disp >  halfL) disp -= L;
    if (disp < -halfL) disp += L;

    const acc    = -wp2 * disp;
    const vHalf  = velocities[i] + 0.5 * dt * acc;
    const xNew   = positions[i] + dt * vHalf;

    let dispNew = xNew - equilibria[i];
    if (dispNew >  halfL) dispNew -= L;
    if (dispNew < -halfL) dispNew += L;

    const accNew = -wp2 * dispNew;
    newVel[i] = vHalf + 0.5 * dt * accNew;
    newPos[i] = ((xNew % L) + L) % L;
  }

  return { ...state, positions: newPos, velocities: newVel, t: state.t + dt };
}

/** Bin sheet positions into a density profile on Ng grid cells */
export function computeDensity(positions: Float64Array, L: number, Ng: number): Float64Array {
  const rho = new Float64Array(Ng);
  const dx = L / Ng;
  for (let i = 0; i < positions.length; i++) {
    const cell = Math.floor(positions[i] / dx) % Ng;
    if (cell >= 0 && cell < Ng) rho[cell]++;
  }
  return rho;
}
