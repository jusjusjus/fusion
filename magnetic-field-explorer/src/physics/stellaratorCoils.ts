import { mergeCoils, type Coil } from './coils';

interface StellaratorData {
  polylines: Array<{
    id: string;
    points: number[][];
  }>;
}

function polylineToCoil(points: number[][], current: number): Coil {
  const n = points.length - 1;
  const midpoints = new Float32Array(n * 3);
  const weightedDl = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    midpoints[i * 3] = (p0[0] + p1[0]) / 2;
    midpoints[i * 3 + 1] = (p0[1] + p1[1]) / 2;
    midpoints[i * 3 + 2] = (p0[2] + p1[2]) / 2;
    weightedDl[i * 3] = (p1[0] - p0[0]) * current;
    weightedDl[i * 3 + 1] = (p1[1] - p0[1]) * current;
    weightedDl[i * 3 + 2] = (p1[2] - p0[2]) * current;
  }
  return { midpoints, weightedDl };
}

function unifyWinding(coils: Coil[], coilPointsArray: number[][][]): void {
  for (let c = 0; c < coils.length; c++) {
    const points = coilPointsArray[c];
    let cx = 0, cy = 0, cz = 0;
    for (const p of points) {
      cx += p[0]; cy += p[1]; cz += p[2];
    }
    cx /= points.length;
    cy /= points.length;
    cz /= points.length;

    const tLen = Math.sqrt(cy * cy + cx * cx);
    if (tLen < 1e-10) continue;

    const coil = coils[c];
    const N = coil.midpoints.length / 3;
    let bx = 0, by = 0;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const rx = cx - coil.midpoints[i3];
      const ry = cy - coil.midpoints[i3 + 1];
      const rz = cz - coil.midpoints[i3 + 2];
      const r2 = rx * rx + ry * ry + rz * rz + 1e-8;
      const r3 = r2 * Math.sqrt(r2);
      bx += (coil.weightedDl[i3 + 1] * rz - coil.weightedDl[i3 + 2] * ry) / r3;
      by += (coil.weightedDl[i3 + 2] * rx - coil.weightedDl[i3] * rz) / r3;
    }

    const tx = -cy / tLen;
    const ty = cx / tLen;
    if (bx * tx + by * ty < 0) {
      for (let i = 0; i < N * 3; i++) {
        coil.weightedDl[i] *= -1;
      }
    }
  }
}

const COIL_PATH = '/fusion/magnetic-explorer/models/stellarators/proxima-scaled-w7x.json';

let cachedPromise: Promise<{ merged: Coil; perCoil: Coil[]; perCoilPoints: number[][][] }> | null = null;

export function loadStellaratorCoils(scale = 0.1): Promise<{ merged: Coil; perCoil: Coil[]; perCoilPoints: number[][][] }> {
  const cacheKey = `scale:${scale}` as string;
  if (cachedPromise && (cachedPromise as any)._key === cacheKey) return cachedPromise;

  const promise = fetch(COIL_PATH)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load stellarator coils: ${res.status}`);
      return res.json() as Promise<StellaratorData>;
    })
    .then((data) => {
      const perCoilCoils: Coil[] = [];
      const perCoilPoints: number[][][] = [];

      for (const pl of data.polylines) {
        const pts = pl.points.map((p) => [p[0] * scale, p[1] * scale, p[2] * scale]);
        perCoilPoints.push(pts);
        perCoilCoils.push(polylineToCoil(pts, 1));
      }

      unifyWinding(perCoilCoils, perCoilPoints);

      const merged = mergeCoils(perCoilCoils);
      return { merged, perCoil: perCoilCoils, perCoilPoints };
    });

  (promise as any)._key = cacheKey;
  cachedPromise = promise;
  return cachedPromise;
}
