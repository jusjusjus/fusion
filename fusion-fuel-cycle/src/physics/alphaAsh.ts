/**
 * Alpha-particle ash accumulation model.
 *
 * A burning D-T plasma produces He²⁺ (alpha) ash at 3.5 MeV.  The ash
 * thermalises and dilutes the fuel unless pumped away.  This module
 * integrates a simple 0-D rate equation for the ash fraction f_ash.
 *
 * Model:
 *   df_ash/dt = S_alpha - f_ash / tau_He
 *
 * where:
 *   S_alpha = (n_fuel/2)² · ⟨σv⟩(T) / n_total
 *           ≈ (1 − 2·f_ash)² · sigma_v0 / 4     (dimensionless source rate)
 *   sigma_v0 = ⟨σv⟩_DT(T) · n_total             (s⁻¹)
 *   n_fuel   = n_total · (1 − 2·f_ash)            (dilution by ash ions)
 *   tau_He   = tau_mult · tau_E                   (helium particle time)
 *   tau_E    = 1 s (reference; scale n by density)
 *
 * Normalised (in units of tau_E):
 *   d(f_ash)/d(t/tau_E) = R · (1 − 2·f_ash)² / 4 − f_ash / tau_mult
 *
 *   R = ⟨σv⟩_DT(T) · n_total · tau_E  (dimensionless fusion rate parameter)
 *
 * Fusion power dilution: P_fus / P₀ = (1 − 2·f_ash)²
 */

import { reactivity_m3s, REACTIVITY_REACTIONS } from './crossSections';

/** State of the ash accumulation ODE */
export interface AshState {
  t: number;        // time [normalised: units of τ_E]
  f_ash: number;    // helium ash fraction (0–1)
  P_rel: number;    // relative fusion power = (1-2·f_ash)²
}

export interface AshParams {
  T_keV: number;       // plasma temperature [keV]
  n_m3: number;        // total electron density [m⁻³]
  tau_E_s: number;     // energy confinement time [s]
  tau_mult: number;    // τ_He / τ_E (typical: 5–10)
}

function dtReactivity(T_keV: number): number {
  return reactivity_m3s(T_keV, REACTIVITY_REACTIONS[0]);
}

/** Initialise the ash state. */
export function initAsh(f_ash0 = 0.0): AshState {
  return { t: 0, f_ash: f_ash0, P_rel: (1 - 2 * f_ash0) ** 2 };
}

/**
 * Advance the ash ODE by one step using 4th-order Runge-Kutta.
 * dt is in units of τ_E.
 */
export function stepAsh(state: AshState, params: AshParams, dt_norm: number): AshState {
  const sv = dtReactivity(params.T_keV);
  // Dimensionless fusion rate parameter R = ⟨σv⟩ · n · τ_E
  const R = sv * params.n_m3 * params.tau_E_s;

  const deriv = (f: number): number => {
    const fuel = Math.max(0, 1 - 2 * f);
    return (R * fuel * fuel) / 4 - f / params.tau_mult;
  };

  const k1 = deriv(state.f_ash);
  const k2 = deriv(state.f_ash + 0.5 * dt_norm * k1);
  const k3 = deriv(state.f_ash + 0.5 * dt_norm * k2);
  const k4 = deriv(state.f_ash + dt_norm * k3);

  const f_new = Math.max(0, Math.min(0.5, state.f_ash + (dt_norm / 6) * (k1 + 2*k2 + 2*k3 + k4)));
  const P_rel = Math.max(0, (1 - 2 * f_new) ** 2);
  return { t: state.t + dt_norm, f_ash: f_new, P_rel };
}

/** Analytical equilibrium ash fraction (implicit solution): */
export function ashEquilibrium(params: AshParams): number {
  const sv = dtReactivity(params.T_keV);
  const R = sv * params.n_m3 * params.tau_E_s;
  // f_eq satisfies: R(1-2f)²/4 = f/tau_mult
  // Quadratic in f: R·tau_mult·(1-2f)²/4 = f
  // Let A = R·tau_mult/4; then A(1-4f+4f²) = f
  // 4A·f² - (4A+1)·f + A = 0
  const A = (R * params.tau_mult) / 4;
  const disc = (4 * A + 1) ** 2 - 16 * A * A;
  if (disc < 0) return 0.5;
  const f = ((4 * A + 1) - Math.sqrt(disc)) / (8 * A);
  return Math.max(0, Math.min(0.5, f));
}
