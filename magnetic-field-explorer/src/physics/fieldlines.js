/**
 * Field-line tracing via fixed-step RK4 along arc length.
 * bFunc(x) returns [Bx, By, Bz] synchronously (plain JS array).
 */

/** Trace a single field line. Returns Float32Array of shape (nsteps+1)*3. */
export function traceFieldline(x0, bFunc, { length = 20, nsteps = 800 } = {}) {
  const dt = length / nsteps;
  const traj = new Float32Array((nsteps + 1) * 3);
  let x = [...x0];
  traj[0] = x[0]; traj[1] = x[1]; traj[2] = x[2];

  for (let i = 0; i < nsteps; i++) {
    const k1 = normalizedB(bFunc(x));
    if (k1 === null) break;

    const x2 = [x[0] + 0.5 * dt * k1[0], x[1] + 0.5 * dt * k1[1], x[2] + 0.5 * dt * k1[2]];
    const k2 = normalizedB(bFunc(x2)) ?? k1;

    const x3 = [x[0] + 0.5 * dt * k2[0], x[1] + 0.5 * dt * k2[1], x[2] + 0.5 * dt * k2[2]];
    const k3 = normalizedB(bFunc(x3)) ?? k2;

    const x4 = [x[0] + dt * k3[0], x[1] + dt * k3[1], x[2] + dt * k3[2]];
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

/** Trace multiple field lines. Returns array of Float32Arrays. */
export function traceFieldlines(x0s, bFunc, opts = {}) {
  return x0s.map(x0 => traceFieldline(x0, bFunc, opts));
}

/** Returns B/|B| or null if |B| < threshold. */
function normalizedB(B, minB = 1e-12) {
  const mag = Math.sqrt(B[0] ** 2 + B[1] ** 2 + B[2] ** 2);
  if (mag < minB) return null;
  return [B[0] / mag, B[1] / mag, B[2] / mag];
}

/** Convert Float32Array (nsteps+1)*3 to array of [x,y,z] for Three.js. */
export function trajToPoints(traj) {
  const n = traj.length / 3;
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push([traj[i * 3], traj[i * 3 + 1], traj[i * 3 + 2]]);
  }
  return pts;
}
