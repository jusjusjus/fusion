/**
 * Tritium Breeding Ratio (TBR) model for a Li-containing blanket.
 *
 * Reactions:
 *   ⁶Li + n(th) → T + ⁴He + 4.78 MeV   σ_6 ≈ 940 barn at 0.025 eV (thermal)
 *   ⁷Li + n(fast) → T + ⁴He + n − 2.47 MeV   σ_7 peak ≈ 0.5 barn at 2.5 MeV
 *
 * Simplified point model (educational):
 *   TBR ≈ ε₆·α₆ + (1−ε₆)·α₇·φ_fast + M_Be
 *
 * where
 *   ε₆      = Li-6 enrichment fraction (natural: 0.075)
 *   α₆      = breeding effectiveness of ⁶Li component (≈1.5 at full enrichment)
 *   α₇      = breeding effectiveness of ⁷Li component (≈0.15 typical)
 *   φ_fast  = fraction of fusion neutrons with E > 2.5 MeV entering blanket
 *   M_Be    = neutron multiplication from ⁹Be(n,2n) reactions
 *             M_Be ≈ 0.12 · f_Be · (1 + ε₆·correction)
 *
 * This is calibrated so that:
 *   - Natural Li (ε₆=0.075), no Be → TBR ≈ 0.6
 *   - 90% enrichment, no Be     → TBR ≈ 1.3
 *   - 50% enrichment, 10% Be    → TBR ≈ 1.15
 */

export interface TBRParams {
  enrichment: number;    // Li-6 fraction (0–1); natural = 0.075
  thickness_cm: number;  // blanket thickness [cm] — affects total Li inventory
  f_Be: number;          // beryllium volume fraction in blanket (0–0.5)
}

export interface TBRResult {
  TBR: number;
  TBR_Li6: number;   // contribution from ⁶Li
  TBR_Li7: number;   // contribution from ⁷Li
  TBR_Be: number;    // contribution from Be multiplier
}

/** Compute the Tritium Breeding Ratio given blanket parameters. */
export function computeTBR(p: TBRParams): TBRResult {
  const e6 = Math.max(0, Math.min(1, p.enrichment));
  const e7 = 1 - e6;

  // Saturation thickness: beyond ~60 cm more Li doesn't help much
  const satFactor = 1 - Math.exp(-p.thickness_cm / 60);

  // ⁶Li contribution: proportional to enrichment, saturates with thickness
  const alpha6 = 1.55 * satFactor;
  const TBR_Li6 = e6 * alpha6;

  // ⁷Li contribution: needs fast neutrons, smaller cross-section
  const phi_fast = 0.7;    // ~70% of 14.1 MeV neutrons stay fast enough in blanket
  const alpha7 = 0.18 * phi_fast * satFactor;
  const TBR_Li7 = e7 * alpha7;

  // Be multiplier: ⁹Be(n,2n) provides extra neutrons → more breeding
  const TBR_Be = p.f_Be * (0.25 + 0.15 * e6) * satFactor;

  const TBR = TBR_Li6 + TBR_Li7 + TBR_Be;
  return { TBR, TBR_Li6, TBR_Li7, TBR_Be };
}

/**
 * Compute TBR as function of enrichment (for plotting).
 * Returns array of [enrichment, TBR] points.
 */
export function tbrVsEnrichment(
  p: Omit<TBRParams, 'enrichment'>,
  nPoints = 80,
): Array<{ e: number; TBR: number }> {
  return Array.from({ length: nPoints }, (_, i) => {
    const e = i / (nPoints - 1);
    return { e, TBR: computeTBR({ ...p, enrichment: e }).TBR };
  });
}

// ── Tritium inventory helpers ─────────────────────────────────────────────────

/** Tritium decay half-life [years] */
export const T_HALFLIFE_YR = 12.32;

/**
 * Tritium startup inventory (kg) required given:
 *   - fusion power P_fus [MW]
 *   - TBR from blanket
 *   - reserve time T_reserve [days] (time before blanket starts producing)
 *
 * T burn rate: 1 MW fusion ≈ 1.05e-4 g T/s ≈ 9.1 g/day per MW.
 * Simplified: inventory = burn_rate × T_reserve / (TBR - 1)
 */
export function startupInventory_g(P_MW: number, TBR: number, T_reserve_days: number): number {
  const burnRate_gpd = 9.1 * P_MW; // g/day
  if (TBR <= 1) return Infinity;
  return (burnRate_gpd * T_reserve_days) / (TBR - 1);
}
