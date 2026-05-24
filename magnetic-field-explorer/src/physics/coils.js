/**
 * Coil geometry generators.
 *
 * Each function returns { midpoints: Float32Array(N*3), weightedDl: Float32Array(N*3) }
 * where weightedDl = dl * current.
 */

/** Discretized circular loop in the XY plane at height z. */
export function circularLoop({ radius = 1, z = 0, n = 200, current = 1 } = {}) {
  const midpoints = new Float32Array(n * 3);
  const weightedDl = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const phi0 = (2 * Math.PI * i) / n;
    const phi1 = (2 * Math.PI * (i + 1)) / n;
    const x0 = radius * Math.cos(phi0), y0 = radius * Math.sin(phi0);
    const x1 = radius * Math.cos(phi1), y1 = radius * Math.sin(phi1);
    midpoints[i * 3 + 0] = 0.5 * (x0 + x1);
    midpoints[i * 3 + 1] = 0.5 * (y0 + y1);
    midpoints[i * 3 + 2] = z;
    weightedDl[i * 3 + 0] = (x1 - x0) * current;
    weightedDl[i * 3 + 1] = (y1 - y0) * current;
    weightedDl[i * 3 + 2] = 0;
  }
  return { midpoints, weightedDl };
}

/** Two coaxial circular loops — Helmholtz configuration when separation = radius. */
export function helmholtzPair({ radius = 1, separation = 1, n = 200, current = 1 } = {}) {
  const top = circularLoop({ radius, z: separation / 2, n, current });
  const bot = circularLoop({ radius, z: -separation / 2, n, current });
  return mergeCoils([top, bot]);
}

/**
 * N vertical circular coils arranged toroidally.
 * Each coil sits in a radial plane at toroidal angle phi_k = 2π k / N.
 */
export function toroidalSet({ N = 8, R0 = 2, a = 0.6, n = 200, current = 1 } = {}) {
  const coils = [];
  for (let k = 0; k < N; k++) {
    const phi0 = (2 * Math.PI * k) / N;
    coils.push(verticalCircularCoil({ phi0, R0, a, n, current }));
  }
  return mergeCoils(coils);
}

/** Single circular coil in a vertical plane at toroidal angle phi0. */
export function verticalCircularCoil({ phi0 = 0, R0 = 2, a = 0.6, n = 200, current = 1 } = {}) {
  const midpoints = new Float32Array(n * 3);
  const weightedDl = new Float32Array(n * 3);
  const eRx = Math.cos(phi0), eRy = Math.sin(phi0);
  const Cx = R0 * eRx, Cy = R0 * eRy;
  for (let i = 0; i < n; i++) {
    const theta0 = (2 * Math.PI * i) / n;
    const theta1 = (2 * Math.PI * (i + 1)) / n;
    const r0x = Cx + a * Math.cos(theta0) * eRx, r0y = Cy + a * Math.cos(theta0) * eRy, r0z = a * Math.sin(theta0);
    const r1x = Cx + a * Math.cos(theta1) * eRx, r1y = Cy + a * Math.cos(theta1) * eRy, r1z = a * Math.sin(theta1);
    midpoints[i * 3 + 0] = 0.5 * (r0x + r1x);
    midpoints[i * 3 + 1] = 0.5 * (r0y + r1y);
    midpoints[i * 3 + 2] = 0.5 * (r0z + r1z);
    weightedDl[i * 3 + 0] = (r1x - r0x) * current;
    weightedDl[i * 3 + 1] = (r1y - r0y) * current;
    weightedDl[i * 3 + 2] = (r1z - r0z) * current;
  }
  return { midpoints, weightedDl };
}

/** Helical coil wound on a torus surface (stellarator-like). */
export function helicalCoil({ R0 = 2, a = 0.5, nfp = 3, phase = 0, n = 1200, current = 1 } = {}) {
  const pts = new Float32Array((n + 1) * 3);
  for (let i = 0; i <= n; i++) {
    const phi = (2 * Math.PI * i) / n;
    const angle = nfp * phi + phase;
    const R = R0 + a * Math.cos(angle);
    pts[i * 3 + 0] = R * Math.cos(phi);
    pts[i * 3 + 1] = R * Math.sin(phi);
    pts[i * 3 + 2] = a * Math.sin(angle);
  }
  const midpoints = new Float32Array(n * 3);
  const weightedDl = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      midpoints[i * 3 + c] = 0.5 * (pts[i * 3 + c] + pts[(i + 1) * 3 + c]);
      weightedDl[i * 3 + c] = (pts[(i + 1) * 3 + c] - pts[i * 3 + c]) * current;
    }
  }
  return { midpoints, weightedDl };
}

/** Merge an array of { midpoints, weightedDl } coils into one. */
export function mergeCoils(coils) {
  const totalN = coils.reduce((s, c) => s + c.midpoints.length / 3, 0);
  const midpoints = new Float32Array(totalN * 3);
  const weightedDl = new Float32Array(totalN * 3);
  let offset = 0;
  for (const c of coils) {
    midpoints.set(c.midpoints, offset * 3);
    weightedDl.set(c.weightedDl, offset * 3);
    offset += c.midpoints.length / 3;
  }
  return { midpoints, weightedDl };
}

/** Return just the wire path as a Float32Array of 3*(n+1) values (for rendering). */
export function coilWirePath(midpoints) {
  return midpoints;
}
