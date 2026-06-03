/**
 * Two-Stream Instability lesson
 *
 * Two equal electron beams travel at ±v₀ through a uniform ion background.
 * A 1D PIC simulation shows:
 *   - Phase-space portrait (x, vx) — the evolving cat's-eye vortex
 *   - Electric-field energy over time (linear growth → saturation)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { initTwoStream, stepPIC, QM_ELECTRON } from '../physics/pic1d';
import type { PICState } from '../physics/pic1d';

const L  = 1.0;    // domain length (m) — normalised
const NG = 64;     // PIC grid cells
const N0 = 1e14;   // background ion density (m⁻³)
const STEPS_PER_FRAME = 5;
const MAX_ENERGY_POINTS = 400;

export default function TwoStream() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const stateRef     = useRef<PICState | null>(null);
  const energyLog    = useRef<number[]>([]);
  const rafRef       = useRef<number>(0);

  const [v0,  setV0]  = useState(2e6);    // m/s (beam velocity)
  const [vth, setVth] = useState(1e5);    // m/s (thermal spread)
  const [Np,  setNp]  = useState(300);    // macro-particles per beam
  const [dt,  setDt]  = useState(5e-10);  // s

  const restart = useCallback(() => {
    stateRef.current = initTwoStream({ N: Np, v0, vth, L, Ng: NG, n0: N0 });
    energyLog.current = [];
  }, [v0, vth, Np]);

  useEffect(() => { restart(); }, [restart]);

  // Resize canvas
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
        s = stepPIC(s, dt, QM_ELECTRON, N0);
      }
      stateRef.current = s;
      energyLog.current.push(s.fieldEnergy);
      if (energyLog.current.length > MAX_ENERGY_POINTS) energyLog.current.shift();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      // ── Phase-space portrait (upper 60%) ──────────────────────────
      const phaseH = H * 0.55;
      const phaseY = H * 0.04;
      const vMax = v0 * 2.2;

      // Border
      ctx.strokeStyle = 'rgba(77,171,247,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, phaseY, W, phaseH);

      // Axes
      const vZeroY = phaseY + phaseH * 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, vZeroY); ctx.lineTo(W, vZeroY); ctx.stroke();
      ctx.setLineDash([]);

      // Particles
      const { x, v: vArr } = s;
      const N2 = x.length;
      for (let i = 0; i < N2; i++) {
        const px = (x[i] / L) * W;
        const py = vZeroY - (vArr[i] / vMax) * phaseH * 0.45;
        const isBeam1 = i < N2 / 2;
        ctx.fillStyle = isBeam1 ? 'rgba(77,171,247,0.7)' : 'rgba(255,107,107,0.7)';
        ctx.fillRect(px - 0.8, py - 0.8, 1.6, 1.6);
      }

      // Phase-space label
      ctx.fillStyle = 'rgba(100,140,200,0.7)';
      ctx.font = '10px monospace';
      ctx.fillText('vx', 4, phaseY + 12);
      ctx.fillText('x →', W - 30, phaseY + phaseH - 4);
      ctx.fillText(`+v₀`, 4, vZeroY - phaseH * 0.43);
      ctx.fillText(`−v₀`, 4, vZeroY + phaseH * 0.43);

      // ── Energy chart (lower 35%) ──────────────────────────────────
      const chartY = H * 0.66;
      const chartH = H * 0.3;
      ctx.strokeStyle = 'rgba(77,171,247,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, chartY, W, chartH);

      const elog = energyLog.current;
      if (elog.length > 1) {
        const maxE = Math.max(...elog.filter(isFinite)) || 1e-20;
        const minE = Math.max(elog.filter(e => e > 0)[0] ?? maxE * 1e-6, maxE * 1e-8);

        ctx.strokeStyle = '#69db7c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < elog.length; i++) {
          const ex = (i / MAX_ENERGY_POINTS) * W;
          const logVal = Math.max(Math.log10(elog[i] || minE), Math.log10(minE));
          const logMax = Math.log10(maxE);
          const logMin = Math.log10(minE);
          const ey = chartY + chartH * (1 - (logVal - logMin) / (logMax - logMin + 0.01));
          if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
        }
        ctx.stroke();

        ctx.fillStyle = 'rgba(105,219,124,0.7)';
        ctx.font = '10px monospace';
        ctx.fillText(`E_field = ${elog[elog.length-1].toExponential(2)} J/m²`, 8, chartY + 13);
        ctx.fillText('log(E²)', 4, chartY + chartH - 4);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dt, v0]);

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
              Beam v₀ (m/s)
              <span className="control-value">{v0.toExponential(1)}</span>
            </label>
            <input type="range" min={5e5} max={1e7} step={1e5}
              value={v0} onChange={(e) => setV0(Number(e.target.value))} />
          </div>
          <div className="control-row">
            <label className="control-label">
              Thermal spread v_th (m/s)
              <span className="control-value">{vth.toExponential(1)}</span>
            </label>
            <input type="range" min={0} max={5e5} step={1e4}
              value={vth} onChange={(e) => setVth(Number(e.target.value))} />
          </div>
          <div className="control-row">
            <label className="control-label">
              Particles / beam
              <span className="control-value">{Np}</span>
            </label>
            <input type="range" min={100} max={800} step={50}
              value={Np} onChange={(e) => setNp(Number(e.target.value))} />
          </div>
          <div className="control-row">
            <label className="control-label">
              Time step (s)
              <span className="control-value">{dt.toExponential(1)}</span>
            </label>
            <input type="range" min={1e-10} max={2e-9} step={1e-10}
              value={dt} onChange={(e) => setDt(Number(e.target.value))} />
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn--primary" onClick={restart}>Restart</button>
        </div>

        <p className="description">
          Two electron beams (blue: +v₀, red: −v₀) share the same spatial domain.
          The Buneman / two-stream instability grows any small charge perturbation
          exponentially; the growth rate peaks near k·v₀ ≈ ωp.
          In phase space the free energy of the beams is transferred into growing
          electrostatic waves, eventually forming <em>cat's-eye vortices</em> as
          particles become trapped in the wave troughs.
          The lower panel shows E-field energy on a log scale — watch it grow
          exponentially then saturate.
          Reduce v_th toward zero to sharpen the instability.
        </p>
      </div>
    </div>
  );
}
