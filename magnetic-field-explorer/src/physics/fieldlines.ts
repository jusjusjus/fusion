/**
 * Field-line tracing via fixed-step RK4 along arc length.
 * bFunc(x) returns [Bx, By, Bz] synchronously (plain JS array).
 */

type Vec3 = [number, number, number];

export type BFunc = (x: number[]) => number[];

interface TraceFieldlineOptions {
  length?: number;
  nsteps?: number;
  bidirectional?: boolean;
}

/** Trace a single field line. Returns Float32Array of shape (nsteps+1)*3. */
export function traceFieldline(
  x0: ArrayLike<number>,
  bFunc: BFunc,
  { length = 20, nsteps = 800, bidirectional = false }: TraceFieldlineOptions = {},
): Float32Array {
  if (bidirectional) {
    return traceFieldlineBidirectional(x0, bFunc, { length, nsteps });
  }
  return traceFieldlineForward(x0, bFunc, length, nsteps);
}

function traceFieldlineForward(x0: ArrayLike<number>, bFunc: BFunc, length: number, nsteps: number): Float32Array {
  const dt = length / nsteps;
  const traj = new Float32Array((nsteps + 1) * 3);
  let x: Vec3 = [x0[0], x0[1], x0[2]];
  traj[0] = x[0];
  traj[1] = x[1];
  traj[2] = x[2];

  for (let i = 0; i < nsteps; i++) {
    const k1 = normalizedB(bFunc(x));
    if (k1 === null) break;

    const x2: Vec3 = [x[0] + 0.5 * dt * k1[0], x[1] + 0.5 * dt * k1[1], x[2] + 0.5 * dt * k1[2]];
    const k2 = normalizedB(bFunc(x2)) ?? k1;

    const x3: Vec3 = [x[0] + 0.5 * dt * k2[0], x[1] + 0.5 * dt * k2[1], x[2] + 0.5 * dt * k2[2]];
    const k3 = normalizedB(bFunc(x3)) ?? k2;

    const x4: Vec3 = [x[0] + dt * k3[0], x[1] + dt * k3[1], x[2] + dt * k3[2]];
    const k4 = normalizedB(bFunc(x4)) ?? k3;

    x = [
      x[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      x[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
      x[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    ];
    traj[(i + 1) * 3 + 0] = x[0];
    traj[(i + 1) * 3 + 1] = x[1];
    traj[(i + 1) * 3 + 2] = x[2];
  }
  return traj;
}

/**
 * Bidirectional trace: half-arc backward + half-arc forward from the seed.
 * Produces a continuous line: [backward_terminus ... seed ... forward_terminus].
 * Total output length is (nsteps + 1) * 3, same as a forward-only trace.
 */
function traceFieldlineBidirectional(
  x0: ArrayLike<number>,
  bFunc: BFunc,
  { length, nsteps }: { length: number; nsteps: number },
): Float32Array {
  const halfSteps = Math.floor(nsteps / 2);
  const halfLen = length / 2;

  const negBFunc: BFunc = (x) => {
    const b = bFunc(x);
    return [-b[0], -b[1], -b[2]];
  };
  const backward = traceFieldlineForward(x0, negBFunc, halfLen, halfSteps);
  const forward = traceFieldlineForward(x0, bFunc, halfLen, halfSteps);

  const totalPts = halfSteps + 1 + halfSteps;
  const result = new Float32Array(totalPts * 3);

  for (let i = 0; i <= halfSteps; i++) {
    const src = halfSteps - i;
    result[i * 3 + 0] = backward[src * 3 + 0];
    result[i * 3 + 1] = backward[src * 3 + 1];
    result[i * 3 + 2] = backward[src * 3 + 2];
  }
  for (let i = 1; i <= halfSteps; i++) {
    const dest = halfSteps + i;
    result[dest * 3 + 0] = forward[i * 3 + 0];
    result[dest * 3 + 1] = forward[i * 3 + 1];
    result[dest * 3 + 2] = forward[i * 3 + 2];
  }
  return result;
}

/** Trace multiple field lines. Returns array of Float32Arrays. */
export function traceFieldlines(
  x0s: ArrayLike<number>[],
  bFunc: BFunc,
  opts: TraceFieldlineOptions = {},
): Float32Array[] {
  return x0s.map((x0) => traceFieldline(x0, bFunc, opts));
}

/** Returns B/|B| or null if |B| < threshold. */
function normalizedB(B: ArrayLike<number>, minB = 1e-12): Vec3 | null {
  const mag = Math.sqrt(B[0] ** 2 + B[1] ** 2 + B[2] ** 2);
  if (mag < minB) return null;
  return [B[0] / mag, B[1] / mag, B[2] / mag];
}

/** Convert Float32Array (nsteps+1)*3 to array of [x,y,z] for Three.js. */
export function trajToPoints(traj: Float32Array): [number, number, number][] {
  const n = traj.length / 3;
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    pts.push([traj[i * 3], traj[i * 3 + 1], traj[i * 3 + 2]]);
  }
  return pts;
}
