/** Elementary charge in Coulombs. */
export const E_CHARGE = 1.602176634e-19;

export interface ParticleSpec {
  id: string;
  label: string;
  m_kg: number;
  q_e: number;
}

/**
 * Common charged particles for injection experiments.
 * q_e is the charge number (signed integer multiples of e).
 * m_kg is the rest mass in kilograms.
 */
export const PARTICLES: ParticleSpec[] = [
  { id: 'electron', label: 'e⁻',   m_kg: 9.109383702e-31, q_e: -1 },
  { id: 'proton',   label: 'H⁺',   m_kg: 1.672621923e-27, q_e: +1 },
  { id: 'deuteron', label: 'D⁺',   m_kg: 3.343583772e-27, q_e: +1 },
  { id: 'helium1',  label: 'He⁺',  m_kg: 6.644657230e-27, q_e: +1 },
  { id: 'alpha',    label: 'He²⁺', m_kg: 6.644657230e-27, q_e: +2 },
];

/**
 * Speed (m/s) corresponding to a given kinetic energy (eV) for a particle.
 * Non-relativistic: KE = ½mv² → v = sqrt(2 KE / m).
 */
export function speedFromEV(energyEV: number, m_kg: number): number {
  return Math.sqrt((2 * energyEV * E_CHARGE) / m_kg);
}
