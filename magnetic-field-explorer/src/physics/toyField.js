/**
 * Transverse gradient field — straight field lines along z.
 *
 *   Bz(x) = B0 + alpha * x²  +  beta * x⁴
 *   Bx = 0,  By = 0
 *
 * Note: ∇×B ≠ 0 when alpha ≠ 0, so this is a model / visualisation field.
 * The growing gyro-radius seen in particle injection is a known consequence;
 * use it to visualise gradient drift direction, not orbit shape.
 */
export function toyMagneticField({ B0, alpha, beta }) {
  return ([x, _y, _z]) => {
    const Bz = B0 + alpha * x ** 2 + beta * x ** 4;
    return [0, 0, Bz];
  };
}

/**
 * Sample Bz(x) for charting.  Returns array of {x, Bz}.
 */
export function sampleBzProfile({ B0, alpha, beta }, xMin = -0.3, xMax = 0.3, nPts = 80) {
  const data = [];
  for (let i = 0; i < nPts; i++) {
    const x = xMin + (xMax - xMin) * i / (nPts - 1);
    const Bz = B0 + alpha * x ** 2 + beta * x ** 4;
    data.push({ x: +x.toFixed(3), Bz: +Bz.toFixed(6) });
  }
  return data;
}

