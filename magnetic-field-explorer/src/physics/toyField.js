/**
 * Analytical toy gradient magnetic field.
 *
 * The on-axis z-component is parameterised as:
 *   Bz(z) = B0 + alpha * z² + beta * z⁴
 *
 * The transverse components Bx, By are derived from ∇·B = 0
 * assuming axial symmetry (Br = -r/2 · ∂Bz/∂z):
 *   Bx = -x · (alpha·z + 2·beta·z³)
 *   By = -y · (alpha·z + 2·beta·z³)
 *
 * Configurations:
 *   alpha=0, beta=0          → uniform field
 *   alpha>0, beta=0          → magnetic mirror  (field stronger at |z|>0, lines converge)
 *   alpha<0, beta>0          → magnetic well    (field minimum at |z|>0, anti-mirror / saddle)
 */
export function toyMagneticField({ B0, alpha, beta }) {
  return ([x, y, z]) => {
    const g = alpha * z + 2 * beta * z ** 3;          // ½ ∂Bz/∂z (axisymmetric correction)
    const Bz = B0 + alpha * z ** 2 + beta * z ** 4;
    return [-x * g, -y * g, Bz];
  };
}

/**
 * Sample Bz(z) on the z-axis for a given parameter set.
 * Returns array of {z, Bz} for charting.
 */
export function sampleBzProfile({ B0, alpha, beta }, zMin = -4, zMax = 4, nPts = 80) {
  const data = [];
  for (let i = 0; i < nPts; i++) {
    const z = zMin + (zMax - zMin) * i / (nPts - 1);
    const Bz = B0 + alpha * z ** 2 + beta * z ** 4;
    data.push({ z: +z.toFixed(2), Bz: +Bz.toFixed(4) });
  }
  return data;
}
