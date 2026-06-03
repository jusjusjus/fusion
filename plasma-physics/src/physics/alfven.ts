/**
 * Alfvén Waves — 1D ideal MHD transverse perturbation
 *
 * A uniform background field B₀ along z supports transverse (y) waves:
 *
 *   ∂b_y/∂t = −B₀ · ∂v_y/∂x            [frozen-in law]
 *   ρ ∂v_y/∂t = −(B₀/μ₀) · ∂b_y/∂x     [Lorentz tension]
 *
 * Combined: ∂²b_y/∂t² = vA² ∂²b_y/∂x²  where vA = B₀/√(μ₀ρ).
 *
 * We advance b_y and v_y on a staggered leapfrog:
 *   b_y is defined at full steps (n = 0, 1, 2, …)
 *   v_y is defined at half steps (n = 1/2, 3/2, …)
 *
 * Boundary conditions: periodic.
 */

const MU0 = 4 * Math.PI * 1e-7; // H/m

export interface AlfvenState {
  /** Transverse magnetic perturbation b_y(x) at time t (T) */
  by: Float64Array;
  /** Transverse velocity v_y(x) at time t+Δt/2 (m/s) — staggered */
  vy: Float64Array;
  /** Alfvén speed (m/s) */
  vA: number;
  /** Grid spacing (m) */
  dx: number;
  /** Number of grid points */
  Ng: number;
  /** Domain length (m) */
  L: number;
  /** Simulation time of b_y (s) */
  t: number;
  /** CFL dt (s) — chosen to give ~0.5 CFL */
  dt: number;
}

export interface AlfvenParams {
  /** Background field (T) */
  B0: number;
  /** Mass density of plasma (kg/m³) */
  rho: number;
  /** Number of grid points */
  Ng: number;
  /** Domain length (m) */
  L: number;
  /** Initial pulse amplitude (T) */
  amplitude: number;
  /** Initial pulse width (m) — Gaussian σ */
  width: number;
}

export function initAlfven(params: AlfvenParams): AlfvenState {
  const { B0, rho, Ng, L, amplitude, width } = params;
  const vA = B0 / Math.sqrt(MU0 * rho);
  const dx = L / Ng;
  const dt = 0.4 * dx / vA; // CFL = 0.4 for stability

  const by = new Float64Array(Ng);
  const vy = new Float64Array(Ng);

  // Gaussian pulse at x = L/4, right-moving: vy = +by/√(μ₀ρ)
  const x0 = L / 4;
  for (let j = 0; j < Ng; j++) {
    const xj = (j + 0.5) * dx;
    const pulse = amplitude * Math.exp(-0.5 * ((xj - x0) / width) ** 2);
    by[j] = pulse;
    vy[j] = pulse / Math.sqrt(MU0 * rho); // right-moving: vy = +by/√(μ₀ρ)
  }

  // Advance vy by -dt/2 to stagger (leapfrog initialisation)
  const vyHalf = new Float64Array(Ng);
  for (let j = 0; j < Ng; j++) {
    const jm1 = (j - 1 + Ng) % Ng;
    const dby = (by[j] - by[jm1]) / dx;
    vyHalf[j] = vy[j] - 0.5 * dt * (B0 / (MU0 * rho)) * dby;
  }

  return { by, vy: vyHalf, vA, dx, Ng, L, t: 0, dt };
}

/**
 * Advance one staggered leapfrog step.
 *
 * Step 1: update b_y from v_y (half-step behind):
 *   b_y[j] ← b_y[j] − B₀ · Δt · (v_y[j+1] − v_y[j]) / Δx
 *
 * Step 2: update v_y from b_y (now at the same time as b_y):
 *   v_y[j] ← v_y[j] − (B₀/μ₀ρ) · Δt · (b_y[j] − b_y[j−1]) / Δx
 */
export function stepAlfven(_state: AlfvenState): never {
  throw new Error('Use stepAlfvenFull from alfven.ts');
}

export interface AlfvenStateWithB0 extends AlfvenState {
  B0: number;
  rho: number;
}

export function initAlfvenFull(params: AlfvenParams): AlfvenStateWithB0 {
  const base = initAlfven(params);
  return { ...base, B0: params.B0, rho: params.rho };
}

export function stepAlfvenFull(state: AlfvenStateWithB0): AlfvenStateWithB0 {
  const { by, vy, dt, dx, Ng, t, B0, rho } = state;

  // Step 1: advance b_y (uses v_y at t−Δt/2, producing b_y at t+Δt)
  //   b_y[j] ← b_y[j] − B₀ · (Δt/Δx) · (v_y[j+1] − v_y[j])
  const newBy = new Float64Array(Ng);
  for (let j = 0; j < Ng; j++) {
    const jp1 = (j + 1) % Ng;
    newBy[j] = by[j] - B0 * (dt / dx) * (vy[jp1] - vy[j]);
  }

  // Step 2: advance v_y (uses b_y at t+Δt, producing v_y at t+Δt/2)
  //   v_y[j] ← v_y[j] − (B₀/μ₀ρ) · (Δt/Δx) · (b_y[j] − b_y[j−1])
  const newVy = new Float64Array(Ng);
  const coeff = B0 / (MU0 * rho);
  for (let j = 0; j < Ng; j++) {
    const jm1 = (j - 1 + Ng) % Ng;
    newVy[j] = vy[j] - coeff * (dt / dx) * (newBy[j] - newBy[jm1]);
  }

  return { ...state, by: newBy, vy: newVy, t: t + dt };
}

/** Re-initialise with new parameters, carrying no old state */
export function resetAlfven(params: AlfvenParams): AlfvenStateWithB0 {
  return initAlfvenFull(params);
}
