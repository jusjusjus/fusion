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
export interface ToyFieldParams {
  B0: number;
  alpha: number;
  beta: number;
}

export interface BzSample {
  x: number;
  Bz: number;
}

export function toyMagneticField({ B0, alpha, beta }: ToyFieldParams): (pos: number[]) => number[] {
  return (pos: number[]): number[] => {
    const x = pos[0];
    const Bz = B0 + alpha * x ** 2 + beta * x ** 4;
    return [0, 0, Bz];
  };
}

/**
 * Sample Bz(x) for charting.  Returns array of {x, Bz}.
 */
export function sampleBzProfile(
  { B0, alpha, beta }: ToyFieldParams,
  xMin = -0.3,
  xMax = 0.3,
  nPts = 80,
): BzSample[] {
  const data: BzSample[] = [];
  for (let i = 0; i < nPts; i++) {
    const x = xMin + ((xMax - xMin) * i) / (nPts - 1);
    const Bz = B0 + alpha * x ** 2 + beta * x ** 4;
    data.push({ x: +x.toFixed(3), Bz: +Bz.toFixed(6) });
  }
  return data;
}
