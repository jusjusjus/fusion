/**
 * Biot-Savart computation.
 *
 * A coil is described by two Float32Arrays of equal length N:
 *   midpoints   Float32Array (N*3) — segment midpoints
 *   weightedDl  Float32Array (N*3) — dl * current
 *
 * fieldAtPoint uses plain JS (fast for single-point RK4 tracing).
 * fieldAtGrid uses TF.js WebGL broadcasting (fast for large batches).
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Compute B at a single point x = [x,y,z].
 * Pure JS — no TF.js overhead, safe to call thousands of times per trace.
 * Returns [Bx, By, Bz].
 */
export function fieldAtPoint(x, midpoints, weightedDl, eps = 1e-4) {
  const px = x[0], py = x[1], pz = x[2];
  const N = midpoints.length / 3;
  const eps2 = eps * eps;
  let bx = 0, by = 0, bz = 0;
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const rx = px - midpoints[i3],     ry = py - midpoints[i3 + 1], rz = pz - midpoints[i3 + 2];
    const r2 = rx * rx + ry * ry + rz * rz + eps2;
    const r3 = r2 * Math.sqrt(r2);
    const dlx = weightedDl[i3], dly = weightedDl[i3 + 1], dlz = weightedDl[i3 + 2];
    bx += (dly * rz - dlz * ry) / r3;
    by += (dlz * rx - dlx * rz) / r3;
    bz += (dlx * ry - dly * rx) / r3;
  }
  return [bx, by, bz];
}

/**
 * Compute B at M grid points using TF.js GPU broadcasting.
 * xs: Float32Array (M*3), midpoints/weightedDl: Float32Array (N*3).
 * Returns Float32Array (M*3).
 */
export function fieldAtGrid(xs, midpoints, weightedDl, eps = 1e-4) {
  return tf.tidy(() => {
    const M = xs.length / 3;
    const N = midpoints.length / 3;
    const xTensor = tf.tensor2d(xs, [M, 3]);
    const midTensor = tf.tensor2d(midpoints, [N, 3]);
    const dlTensor = tf.tensor2d(weightedDl, [N, 3]);
    // Broadcast: [M,1,3] - [1,N,3] → [M,N,3]
    const r = tf.sub(tf.expandDims(xTensor, 1), tf.expandDims(midTensor, 0));
    const r2 = tf.add(tf.sum(tf.square(r), 2, true), eps * eps);
    const r3 = tf.pow(r2, 1.5);
    const cross = crossProductBatch(tf.expandDims(dlTensor, 0), r);
    return tf.sum(tf.div(cross, r3), 1);
  }).dataSync();
}

/** Cross product where a is [1,N,3] (broadcast) and b is [M,N,3]. Returns [M,N,3]. */
function crossProductBatch(a, b) {
  const a0 = tf.slice(a, [0, 0, 0], [-1, -1, 1]);
  const a1 = tf.slice(a, [0, 0, 1], [-1, -1, 1]);
  const a2 = tf.slice(a, [0, 0, 2], [-1, -1, 1]);
  const b0 = tf.slice(b, [0, 0, 0], [-1, -1, 1]);
  const b1 = tf.slice(b, [0, 0, 1], [-1, -1, 1]);
  const b2 = tf.slice(b, [0, 0, 2], [-1, -1, 1]);
  return tf.concat([
    tf.sub(tf.mul(a1, b2), tf.mul(a2, b1)),
    tf.sub(tf.mul(a2, b0), tf.mul(a0, b2)),
    tf.sub(tf.mul(a0, b1), tf.mul(a1, b0)),
  ], 2);
}
