/**
 * Analytical toy gradient magnetic field.
 *
 * The z-component varies in the x-direction:
 *   Bz(x) = B0 + alpha * x² + beta * x⁴
 *   Bx = 0,  By = 0
 *
 * This satisfies ∇·B = 0 trivially because ∂Bz/∂z = 0.
 * Field lines are straight lines parallel to z; the field strength
 * (and thus field-line density) varies across the x-axis.
 *
 * Configurations:
 *   alpha=0, beta=0   → uniform field (straight parallel lines)
 *   alpha>0, beta=0   → field stronger near x=0, weaker at edges
 *   alpha<0, beta=0   → field weaker near x=0, stronger at edges (gradient trap)
 *   beta≠0            → quartic modulation (double-well profile)
 */
export function toyMagneticField({ B0, alpha, beta }) {
  return ([x, _y, _z]) => {
    const Bz = B0 + alpha * x ** 2 + beta * x ** 4;
    return [0, 0, Bz];
  };
}

/**
 * Sample Bz(x) across the x-axis for a given parameter set.
 * Returns array of {x, Bz} for charting.
 */
export function sampleBzProfile({ B0, alpha, beta }, xMin = -3, xMax = 3, nPts = 80) {
  const data = [];
  for (let i = 0; i < nPts; i++) {
    const x = xMin + (xMax - xMin) * i / (nPts - 1);
    const Bz = B0 + alpha * x ** 2 + beta * x ** 4;
    data.push({ x: +x.toFixed(2), Bz: +Bz.toFixed(4) });
  }
  return data;
}

