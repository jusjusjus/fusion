/**
 * Alfvén Wave lesson
 *
 * 1D ideal MHD: a transverse magnetic perturbation b_y and velocity v_y
 * propagate at the Alfvén speed vA = B₀/√(μ₀ρ).
 * The canvas shows b_y(x, t) as a live waveform.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { initAlfvenFull, stepAlfvenFull } from '../physics/alfven';
import type { AlfvenStateWithB0 } from '../physics/alfven';

const NG = 256;   // grid points
const L  = 1.0;   // domain length (m)
const STEPS_PER_FRAME = 20;

/** Format Alfvén speed nicely */
function fmtSpeed(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)} Mm/s`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)} km/s`;
  return `${v.toFixed(0)} m/s`;
}

export default function AlfvenWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<AlfvenStateWithB0 | null>(null);
  const rafRef    = useRef<number>(0);

  const [B0,       setB0]       = useState(0.1);    // T
  const [rho,      setRho]      = useState(1e-6);   // kg/m³
  const [amplitude, setAmplitude] = useState(0.005); // T
  const [width,    setWidth]    = useState(0.08);   // m

  const MU0 = 4 * Math.PI * 1e-7;
  const vA  = B0 / Math.sqrt(MU0 * rho);

  const restart = useCallback(() => {
    stateRef.current = initAlfvenFull({ B0, rho, Ng: NG, L, amplitude, width });
  }, [B0, rho, amplitude, width]);

  useEffect(() => { restart(); }, [restart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const state = stateRef.current;
      if (!state) { rafRef.current = requestAnimationFrame(draw); return; }

      let s = state;
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        s = stepAlfvenFull(s);
      }
      stateRef.current = s;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      const by   = s.by;
      const bMax = amplitude * 1.5 || 0.01;

      // ── b_y waveform ──────────────────────────────────────────────
      const plotTop  = H * 0.1;
      const plotH    = H * 0.35;
      const midY     = plotTop + plotH * 0.5;

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        const y = midY - (i / 2) * plotH * 0.48;
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      // Zero line
      ctx.strokeStyle = 'rgba(255,200,60,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(W, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waveform
      ctx.strokeStyle = '#4dabf7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let j = 0; j < NG; j++) {
        const px = (j / (NG - 1)) * W;
        const py = midY - (by[j] / bMax) * plotH * 0.48;
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // b_y label
      ctx.fillStyle = 'rgba(100,140,200,0.7)';
      ctx.font = '11px monospace';
      ctx.fillText('b_y (T)', 6, plotTop + 12);
      ctx.fillText(`+${bMax.toExponential(2)}`, 6, plotTop + 18);
      ctx.fillText('x →', W - 34, plotTop + plotH - 4);

      // ── v_y waveform ──────────────────────────────────────────────
      const vy   = s.vy;
      const vyMax = (amplitude / Math.sqrt(4 * Math.PI * 1e-7 * rho)) * 1.5 || 1;

      const plot2Top = H * 0.55;
      const mid2Y    = plot2Top + plotH * 0.5;

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        const y = mid2Y - (i / 2) * plotH * 0.48;
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,200,60,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, mid2Y); ctx.lineTo(W, mid2Y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let j = 0; j < NG; j++) {
        const px = (j / (NG - 1)) * W;
        const py = mid2Y - (vy[j] / vyMax) * plotH * 0.48;
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = 'rgba(200,120,120,0.7)';
      ctx.font = '11px monospace';
      ctx.fillText('v_y (m/s)', 6, plot2Top + 12);

      // ── vA readout ───────────────────────────────────────────────
      ctx.fillStyle = 'rgba(105,219,124,0.9)';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`vA = ${fmtSpeed(vA)}`, 12, H * 0.94);
      ctx.fillStyle = 'rgba(105,219,124,0.7)';
      ctx.font = '11px monospace';
      ctx.fillText(`t = ${(s.t * vA / L).toFixed(2)} L/vA`, W - 100, 16);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [vA, amplitude, rho]);

  return (
    <div className="lesson-layout">
      <div className="canvas-area">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="sidebar">
        <p className="section-heading">Parameters</p>
        <div className="control-group">
          <div className="control-row">
            <label className="control-label">
              B₀ (T)
              <span className="control-value">{B0.toFixed(3)}</span>
            </label>
            <input type="range" min={0.001} max={1.0} step={0.001}
              value={B0} onChange={(e) => setB0(Number(e.target.value))} />
          </div>
          <div className="control-row">
            <label className="control-label">
              Density ρ (kg/m³)
              <span className="control-value">{rho.toExponential(1)}</span>
            </label>
            <input type="range" min={1e-8} max={1e-4} step={1e-8}
              value={rho} onChange={(e) => setRho(Number(e.target.value))} />
          </div>
          <div className="control-row">
            <label className="control-label">
              Pulse amplitude (T)
              <span className="control-value">{amplitude.toExponential(2)}</span>
            </label>
            <input type="range" min={1e-4} max={0.05} step={1e-4}
              value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} />
          </div>
          <div className="control-row">
            <label className="control-label">
              Pulse width (m)
              <span className="control-value">{width.toFixed(3)}</span>
            </label>
            <input type="range" min={0.02} max={0.3} step={0.005}
              value={width} onChange={(e) => setWidth(Number(e.target.value))} />
          </div>
        </div>

        <div className="info-badge">
          vA = {fmtSpeed(vA)}
        </div>

        <div className="btn-row">
          <button className="btn btn--primary" onClick={restart}>Restart</button>
        </div>

        <p className="description">
          In a magnetised plasma a transverse perturbation of both the magnetic
          field (b_y, blue) and plasma velocity (v_y, red) propagates along
          B₀ at the <em>Alfvén speed</em>{' '}
          vA = B₀/√(μ₀ρ). The field acts like a taut string: magnetic tension
          (Lorentz force) provides the restoring force and mass density ρ provides
          the inertia.
          Increasing B₀ raises vA; increasing ρ lowers it.
          Watch the Gaussian pulse travel across the periodic domain at vA —
          the speed at which information propagates in an MHD plasma.
        </p>
      </div>
    </div>
  );
}
