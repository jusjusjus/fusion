/**
 * Cross-Sections lesson
 *
 * Log-log canvas plot of σ(E) for D-T, D-D (total), and D-³He.
 * An energy cursor (NumericControl slider) shows σ at a chosen energy.
 */
import { useEffect, useRef, useState } from 'react';
import {
  CROSS_SECTION_REACTIONS,
  crossSectionDT,
  crossSectionDDtotal,
  crossSectionDHe3,
} from '../physics/crossSections';
import NumericControl from '../components/NumericControl';

// Pre-compute log-spaced energy grid for the curves
const E_MIN = 0.5;
const E_MAX = 1000;
const N_PTS = 300;
const ENERGY_GRID = Array.from({ length: N_PTS }, (_, i) => {
  const t = i / (N_PTS - 1);
  return E_MIN * Math.pow(E_MAX / E_MIN, t);
});

type SigmaFn = (E: number) => number;

const SIGMA_FNS: SigmaFn[] = [crossSectionDT, crossSectionDDtotal, crossSectionDHe3];

function toLogCanvas(
  val: number,
  vMin: number,
  vMax: number,
  lo: number,
  hi: number,
): number {
  if (val <= 0) return hi;
  const t = (Math.log10(val) - Math.log10(vMin)) / (Math.log10(vMax) - Math.log10(vMin));
  return lo + (1 - t) * (hi - lo);
}

export default function CrossSections() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [E_cursor, setECursor] = useState(64);  // keV at cursor

  const reactions = CROSS_SECTION_REACTIONS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;

      // Plot margins
      const ml = 58, mr = 20, mt = 24, mb = 44;
      const pw = W - ml - mr;
      const ph = H - mt - mb;

      const EL = E_MIN, EH = E_MAX;
      const SL = 1e-4, SH = 1e4;   // mb range

      const ex = (E: number) => ml + ((Math.log10(E) - Math.log10(EL)) / (Math.log10(EH) - Math.log10(EL))) * pw;
      const ey = (s: number) => mt + (1 - (Math.log10(Math.max(s, SL)) - Math.log10(SL)) / (Math.log10(SH) - Math.log10(SL))) * ph;

      // Background
      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      const eDecades = [1, 10, 100, 1000];
      const eTicks = eDecades.flatMap(d => [1,2,3,4,5,6,7,8,9].map(m => m*d)).filter(e => e >= EL && e <= EH);
      eTicks.forEach(e => {
        ctx.beginPath(); ctx.moveTo(ex(e), mt); ctx.lineTo(ex(e), mt + ph); ctx.stroke();
      });
      const sDecades = [1e-4, 1e-3, 1e-2, 1e-1, 1, 10, 100, 1000, 1e4];
      sDecades.forEach(s => {
        ctx.beginPath(); ctx.moveTo(ml, ey(s)); ctx.lineTo(ml + pw, ey(s)); ctx.stroke();
      });

      // Axes
      ctx.strokeStyle = 'rgba(180,200,230,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ml, mt); ctx.lineTo(ml, mt + ph);
      ctx.moveTo(ml, mt + ph); ctx.lineTo(ml + pw, mt + ph);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(160,185,220,0.8)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      eDecades.forEach(e => {
        if (e >= EL && e <= EH) ctx.fillText(`${e}`, ex(e), mt + ph + 16);
      });
      ctx.fillText('E (keV)', ml + pw / 2, mt + ph + 34);

      ctx.textAlign = 'right';
      sDecades.forEach(s => {
        const label = s >= 1 ? `${s}` : `1e${Math.round(Math.log10(s))}`;
        ctx.fillText(label, ml - 5, ey(s) + 4);
      });

      // Y-axis label (rotated)
      ctx.save();
      ctx.translate(14, mt + ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('σ (mb)', 0, 0);
      ctx.restore();

      // Curves
      reactions.forEach((rxn, idx) => {
        const fn = SIGMA_FNS[idx];
        ctx.strokeStyle = rxn.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let first = true;
        ENERGY_GRID.forEach(E => {
          const s = fn(E);
          if (s < SL || s > SH * 10) { first = true; return; }
          const x = ex(E), y = ey(s);
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Legend
        const ly = mt + 14 + idx * 20;
        ctx.strokeStyle = rxn.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ml + 8, ly); ctx.lineTo(ml + 30, ly); ctx.stroke();
        ctx.fillStyle = rxn.color;
        ctx.textAlign = 'left';
        ctx.font = '12px monospace';
        ctx.fillText(rxn.label, ml + 34, ly + 4);
      });

      // Cursor line
      const xc = ex(E_cursor);
      ctx.strokeStyle = 'rgba(255,255,100,0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(xc, mt); ctx.lineTo(xc, mt + ph); ctx.stroke();
      ctx.setLineDash([]);

      // Cursor σ dots
      reactions.forEach((rxn, idx) => {
        const fn = SIGMA_FNS[idx];
        const s = fn(E_cursor);
        if (s < SL * 0.01) return;
        const yc = ey(s);
        ctx.fillStyle = rxn.color;
        ctx.beginPath(); ctx.arc(xc, yc, 5, 0, Math.PI * 2); ctx.fill();
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [E_cursor, reactions]);

  const sigmas = SIGMA_FNS.map((fn) => fn(E_cursor));

  return (
    <div className="lesson-layout">
      <div className="canvas-area">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="sidebar">
        <p className="section-heading">Energy cursor</p>
        <div className="control-group">
          <NumericControl
            label="E (keV)"
            value={E_cursor}
            min={0.5}
            max={1000}
            step={0.5}
            format={(v) => v.toFixed(1)}
            onChange={setECursor}
          />
        </div>

        <p className="section-heading" style={{ marginTop: 16 }}>σ at E = {E_cursor.toFixed(1)} keV</p>
        <div className="control-group">
          {CROSS_SECTION_REACTIONS.map((rxn, idx) => (
            <div key={rxn.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: rxn.color, fontFamily: 'monospace', fontSize: 13 }}>{rxn.label}</span>
              <span style={{ color: '#c8d8f0', fontFamily: 'monospace', fontSize: 13 }}>
                {sigmas[idx] >= 0.01 ? sigmas[idx].toFixed(2) : sigmas[idx].toExponential(2)} mb
              </span>
            </div>
          ))}
        </div>

        <div className="info-box" style={{ marginTop: 16 }}>
          <p className="info-title">Why D–T dominates</p>
          <p className="info-text">
            D–T reaches σ ≈ 5000 mb at ~65 keV — orders of magnitude above D–D
            and D–³He at the same energy. This is why ITER and DEMO burn D–T fuel.
          </p>
        </div>
      </div>
    </div>
  );
}
