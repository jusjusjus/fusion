/**
 * Reactivity & Ignition lesson
 *
 * Shows:
 *   1. Log-log plot of ⟨σv⟩(T) for D-T and D-D over 1–100 keV.
 *   2. Power-balance panel: alpha heating P_α vs bremsstrahlung P_brem
 *      as function of T for a given density, with ignition crossover marked.
 *   3. Lawson criterion gauge: n·τ_E vs target 10²⁰ m⁻³s.
 */
import { useEffect, useRef, useState } from 'react';
import {
  REACTIVITY_REACTIONS,
  reactivity_m3s,
  reactivityDD_m3s,
} from '../physics/crossSections';
import NumericControl from '../components/NumericControl';

const T_MIN = 1;
const T_MAX = 100;
const N_PTS = 200;
const T_GRID = Array.from({ length: N_PTS }, (_, i) => {
  const t = i / (N_PTS - 1);
  return T_MIN * Math.pow(T_MAX / T_MIN, t);
});

// Physical constants
const EV_TO_J = 1.602e-19;
const E_ALPHA_J = 3.52e6 * EV_TO_J;  // 3.52 MeV alpha energy

/** Alpha heating power density [W/m³] */
function alphaHeating(T_keV: number, n: number): number {
  const sv = reactivity_m3s(T_keV, REACTIVITY_REACTIONS[0]);
  return (n * n / 4) * sv * E_ALPHA_J;
}

/** Bremsstrahlung power density [W/m³]: P = 5.34×10⁻³⁷ · n² · √T_keV */
function bremsstrahlung(T_keV: number, n: number): number {
  return 5.34e-37 * n * n * Math.sqrt(T_keV);
}

export default function Reactivity() {
  const canvasReact  = useRef<HTMLCanvasElement>(null);
  const canvasPower  = useRef<HTMLCanvasElement>(null);

  const [n_m3, setN]       = useState(1e20);   // m⁻³
  const [tauE_s, setTauE]  = useState(3.0);    // s
  const [T_keV, setT]      = useState(10);     // keV

  const nTau = n_m3 * tauE_s;
  const lawsonTarget = 1e20;  // approximate D-T ignition: n·τ_E ~ 10²⁰ m⁻³s

  // Draw reactivity curves
  useEffect(() => {
    const canvas = canvasReact.current;
    if (!canvas) return;
    const draw = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const ml = 62, mr = 18, mt = 20, mb = 44;
      const pw = W - ml - mr, ph = H - mt - mb;

      const SV_MIN = 1e-26, SV_MAX = 1e-21;
      const ex = (T: number) => ml + ((Math.log10(T) - Math.log10(T_MIN)) / (Math.log10(T_MAX) - Math.log10(T_MIN))) * pw;
      const ey = (sv: number) => mt + (1 - (Math.log10(Math.max(sv, SV_MIN)) - Math.log10(SV_MIN)) / (Math.log10(SV_MAX) - Math.log10(SV_MIN))) * ph;

      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      [1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100].forEach(T => {
        ctx.beginPath(); ctx.moveTo(ex(T), mt); ctx.lineTo(ex(T), mt+ph); ctx.stroke();
      });
      for (let e = -26; e <= -21; e++) {
        ctx.beginPath(); ctx.moveTo(ml, ey(Math.pow(10, e))); ctx.lineTo(ml+pw, ey(Math.pow(10, e))); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(180,200,230,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ml, mt); ctx.lineTo(ml, mt+ph);
      ctx.moveTo(ml, mt+ph); ctx.lineTo(ml+pw, mt+ph);
      ctx.stroke();

      // Axis ticks & labels
      ctx.fillStyle = 'rgba(160,185,220,0.8)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      [1,10,100].forEach(T => ctx.fillText(`${T}`, ex(T), mt+ph+14));
      ctx.fillText('T (keV)', ml+pw/2, mt+ph+32);
      ctx.textAlign = 'right';
      for (let e = -26; e <= -21; e++) {
        ctx.fillText(`10^${e}`, ml-4, ey(Math.pow(10,e))+4);
      }
      ctx.save();
      ctx.translate(13, mt+ph/2);
      ctx.rotate(-Math.PI/2);
      ctx.textAlign = 'center';
      ctx.fillText('⟨σv⟩ (m³/s)', 0, 0);
      ctx.restore();

      // D-T curve
      const dtColor = '#ff6b6b';
      ctx.strokeStyle = dtColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      T_GRID.forEach(T => {
        const sv = reactivity_m3s(T, REACTIVITY_REACTIONS[0]);
        const x = ex(T), y = ey(sv);
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // D-D total curve
      ctx.strokeStyle = '#74c0fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      first = true;
      T_GRID.forEach(T => {
        const sv = reactivityDD_m3s(T);
        const x = ex(T), y = ey(sv);
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Vertical T cursor
      ctx.strokeStyle = 'rgba(255,255,100,0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(ex(T_keV), mt); ctx.lineTo(ex(T_keV), mt+ph); ctx.stroke();
      ctx.setLineDash([]);

      // Legend
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      [[dtColor, 'D–T'], ['#74c0fc', 'D–D total']].forEach(([c, lbl], i) => {
        const ly = mt+14+i*20;
        ctx.strokeStyle = c as string;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ml+8, ly); ctx.lineTo(ml+30, ly); ctx.stroke();
        ctx.fillStyle = c as string;
        ctx.fillText(lbl as string, ml+34, ly+4);
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [T_keV]);

  // Draw power balance curves
  useEffect(() => {
    const canvas = canvasPower.current;
    if (!canvas) return;
    const draw = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const ml = 58, mr = 18, mt = 18, mb = 40;
      const pw = W - ml - mr, ph = H - mt - mb;

      const P_MIN = 1e2, P_MAX = 1e8;
      const ex = (T: number) => ml + ((Math.log10(T) - Math.log10(T_MIN)) / (Math.log10(T_MAX) - Math.log10(T_MIN))) * pw;
      const ey = (P: number) => mt + (1 - (Math.log10(Math.max(P, P_MIN)) - Math.log10(P_MIN)) / (Math.log10(P_MAX) - Math.log10(P_MIN))) * ph;

      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      [1,2,3,5,10,20,50,100].forEach(T => {
        ctx.beginPath(); ctx.moveTo(ex(T), mt); ctx.lineTo(ex(T), mt+ph); ctx.stroke();
      });
      for (let e = 2; e <= 8; e++) {
        ctx.beginPath(); ctx.moveTo(ml, ey(Math.pow(10,e))); ctx.lineTo(ml+pw, ey(Math.pow(10,e))); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(180,200,230,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ml, mt); ctx.lineTo(ml, mt+ph);
      ctx.moveTo(ml, mt+ph); ctx.lineTo(ml+pw, mt+ph);
      ctx.stroke();

      ctx.fillStyle = 'rgba(160,185,220,0.8)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      [1,10,100].forEach(T => ctx.fillText(`${T}`, ex(T), mt+ph+14));
      ctx.fillText('T (keV)', ml+pw/2, mt+ph+30);
      ctx.textAlign = 'right';
      for (let e = 2; e <= 8; e += 2) {
        ctx.fillText(`10^${e}`, ml-4, ey(Math.pow(10,e))+4);
      }
      ctx.save();
      ctx.translate(12, mt+ph/2);
      ctx.rotate(-Math.PI/2);
      ctx.textAlign = 'center';
      ctx.font = '10px monospace';
      ctx.fillText('P (W/m³)', 0, 0);
      ctx.restore();

      // Alpha heating
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      T_GRID.forEach(T => {
        const P = alphaHeating(T, n_m3);
        if (P < P_MIN) { first = true; return; }
        const x = ex(T), y = ey(P);
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Bremsstrahlung
      ctx.strokeStyle = '#ffd43b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      first = true;
      T_GRID.forEach(T => {
        const P = bremsstrahlung(T, n_m3);
        if (P < P_MIN) { first = true; return; }
        const x = ex(T), y = ey(P);
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Ignition crossover shading
      let ignT: number | null = null;
      for (let i = 1; i < T_GRID.length; i++) {
        const T = T_GRID[i];
        const pa = alphaHeating(T, n_m3);
        const pb = bremsstrahlung(T, n_m3);
        const pa_prev = alphaHeating(T_GRID[i-1], n_m3);
        const pb_prev = bremsstrahlung(T_GRID[i-1], n_m3);
        if ((pa_prev < pb_prev) && (pa >= pb)) { ignT = T; break; }
      }
      if (ignT) {
        ctx.fillStyle = 'rgba(105,219,124,0.12)';
        ctx.fillRect(ex(ignT), mt, ml+pw - ex(ignT), ph);
        ctx.strokeStyle = 'rgba(105,219,124,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(ex(ignT), mt); ctx.lineTo(ex(ignT), mt+ph); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(105,219,124,0.8)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Tign≈${ignT.toFixed(0)}keV`, ex(ignT)+3, mt+13);
      }

      // Cursor
      ctx.strokeStyle = 'rgba(255,255,100,0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(ex(T_keV), mt); ctx.lineTo(ex(T_keV), mt+ph); ctx.stroke();
      ctx.setLineDash([]);

      // Legend
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      [['#ff6b6b','P_α (alpha)'], ['#ffd43b','P_brem']].forEach(([c, lbl], i) => {
        const ly = mt+14+i*18;
        ctx.strokeStyle = c as string;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ml+8, ly); ctx.lineTo(ml+28, ly); ctx.stroke();
        ctx.fillStyle = c as string;
        ctx.fillText(lbl as string, ml+32, ly+4);
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [n_m3, T_keV]);

  const sv_dt = reactivity_m3s(T_keV, REACTIVITY_REACTIONS[0]);
  const sv_dd = reactivityDD_m3s(T_keV);
  const pa = alphaHeating(T_keV, n_m3);
  const pb = bremsstrahlung(T_keV, n_m3);

  return (
    <div className="lesson-layout lesson-layout--tall">
      <div className="canvas-area" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <canvas ref={canvasReact} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <canvas ref={canvasPower} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
      <div className="sidebar">
        <p className="section-heading">Parameters</p>
        <div className="control-group">
          <NumericControl
            label="Temperature T (keV)"
            value={T_keV} min={1} max={100} step={0.5}
            format={(v) => v.toFixed(1)}
            onChange={setT}
          />
          <NumericControl
            label="Density n (m⁻³)"
            value={n_m3} min={1e18} max={1e22} step={1e18}
            format={(v) => v.toExponential(1)}
            onChange={setN}
          />
          <NumericControl
            label="τ_E (s)"
            value={tauE_s} min={0.1} max={10} step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={setTauE}
          />
        </div>

        <p className="section-heading" style={{ marginTop: 14 }}>At T = {T_keV.toFixed(1)} keV</p>
        <div className="readout-grid">
          <span>⟨σv⟩ D-T</span><span>{sv_dt.toExponential(3)} m³/s</span>
          <span>⟨σv⟩ D-D</span><span>{sv_dd.toExponential(3)} m³/s</span>
          <span>P_α</span><span>{pa.toExponential(2)} W/m³</span>
          <span>P_brem</span><span>{pb.toExponential(2)} W/m³</span>
          <span>P_α / P_brem</span><span style={{ color: pa > pb ? '#69db7c' : '#ff6b6b' }}>
            {(pa/pb).toFixed(3)}
          </span>
        </div>

        <p className="section-heading" style={{ marginTop: 14 }}>Lawson criterion</p>
        <div className="readout-grid">
          <span>n·τ_E</span><span>{nTau.toExponential(2)} m⁻³s</span>
          <span>Target</span><span>~10²⁰ m⁻³s</span>
        </div>
        <div style={{ marginTop: 8, height: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (Math.log10(nTau) - 14) / (20 - 14) * 100)}%`,
            background: nTau >= lawsonTarget ? '#69db7c' : '#ff6b6b',
            transition: 'width 0.2s',
          }} />
        </div>
      </div>
    </div>
  );
}
