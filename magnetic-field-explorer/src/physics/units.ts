/**
 * Physical constants for SI Biot-Savart computation.
 *
 * MU0_OVER_4PI  = μ₀/(4π)  used in the Biot-Savart kernel:
 *   B(r) = (μ₀/4π) ∫ (I dl × r̂) / r²
 *
 * MU0_OVER_2PI  = μ₀/(2π)  used in Ampère's law for a long straight
 *   current (toroidal plasma current approximation):
 *   B_θ = (μ₀/2π) I / r
 *
 * All values in SI (T·m/A).
 */
export const MU0_OVER_4PI = 1e-7;
export const MU0_OVER_2PI = 2e-7;
