/**
 * Alpha Ash lesson
 *
 * Animated time-series showing He²⁺ ash accumulation in a burning D-T plasma.
 * Solves the ODE for f_ash(t) using RK4, advancing one τ_E per frame.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { initAsh, stepAsh, ashEquilibrium } from '../physics/alphaAsh';
import type { AshState, AshParams } from '../physics/alphaAsh';
import NumericControl from '../components/NumericControl';

const DT_NORM = 0.05;       // normalised time step (units of τ_E)
const STEPS_PER_FRAME = 3;
const MAX_HISTORY = 300;

export default function AlphaAsh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<AshState>(initAsh());
  const histRef   = useRef<AshState[]>([initAsh()]);
  const rafRef    = useRef<number>(0);
  const runRef    = useRef(true);

  const [running, setRunning] = useState(true);
  const [T_keV,   setT]      = useState(10);    // keV
  const [n_m3,    setN]      = useState(1e20);  // m⁻³
  const [tauE,    setTauE]   = useState(3.0);   // s
  const [tauMult, setTauMult] = useState(5);    // τ_He / τ_E

  const paramsRef = useRef<AshParams>({ T_keV, n_m3, tau_E_s: tauE, tau_mult: tauMult });
  useEffect(() => {
    paramsRef.current = { T_keV, n_m3, tau_E_s: tauE, tau_mult: tauMult };
  }, [T_keV, n_m3, tauE, tauMult]);

  const restart = useCallback(() => {
    stateRef.current = initAsh();
    histRef.current  = [initAsh()];
  }, []);

  const toggleRunning = useCallback(() => {
    const next = !runRef.current;
    runRef.current = next;
    setRunning(next);
  }, []);

  useEffect(() => { restart(); }, [restart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      if (runRef.current) {
        for (let i = 0; i < STEPS_PER_FRAME; i++) {
          stateRef.current = stepAsh(stateRef.current, paramsRef.current, DT_NORM);
          histRef.current.push({ ...stateRef.current });
          if (histRef.current.length > MAX_HISTORY) histRef.current.shift();
        }
      }

      const W = canvas.width, H = canvas.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      const hist = histRef.current;
      if (hist.length < 2) { rafRef.current = requestAnimationFrame(draw); return; }

      const ml = 56, mr = 18, mt = 20, mb = 40;
      const pw = W - ml - mr, ph = H - mt - mb;

      // Time axis: show last MAX_HISTORY steps in τ_E units
      const tEnd   = hist[hist.length - 1].t;
      const tStart = hist[0].t;
      const tRange = Math.max(tEnd - tStart, 1);

      const ex = (t: number) => ml + ((t - tStart) / tRange) * pw;
      const ey_f = (f: number) => mt + (1 - f / 0.5) * ph;
      const ey_p = (p: number) => mt + (1 - p) * ph;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach(f => {
        ctx.beginPath(); ctx.moveTo(ml, ey_f(f)); ctx.lineTo(ml+pw, ey_f(f)); ctx.stroke();
      });

      // Axes
      ctx.strokeStyle = 'rgba(180,200,230,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ml, mt); ctx.lineTo(ml, mt+ph);
      ctx.moveTo(ml, mt+ph); ctx.lineTo(ml+pw, mt+ph);
      ctx.stroke();

      // Y labels
      ctx.fillStyle = 'rgba(160,185,220,0.8)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach(f => {
        ctx.fillText(`${(f*100).toFixed(0)}%`, ml-4, ey_f(f)+4);
      });
      ctx.textAlign = 'center';
      ctx.fillText('t (τ_E)', ml+pw/2, mt+ph+30);
      ctx.save();
      ctx.translate(14, mt+ph/2);
      ctx.rotate(-Math.PI/2);
      ctx.textAlign = 'center';
      ctx.fillText('ash fraction / rel. power', 0, 0);
      ctx.restore();

      // T axis labels
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(160,185,220,0.6)';
      ctx.font = '10px monospace';
      for (let i = 0; i <= 4; i++) {
        const t = tStart + (i / 4) * tRange;
        ctx.fillText(t.toFixed(1), ex(t), mt+ph+14);
      }

      // P_rel curve (yellow)
      ctx.strokeStyle = '#ffd43b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      hist.forEach((s, i) => {
        const x = ex(s.t), y = ey_p(s.P_rel);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // f_ash curve (red-orange)
      ctx.strokeStyle = '#ff8c42';
      ctx.lineWidth = 2;
      ctx.beginPath();
      hist.forEach((s, i) => {
        const x = ex(s.t), y = ey_f(s.f_ash);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Equilibrium dashed lines
      const f_eq = ashEquilibrium(paramsRef.current);
      const p_eq = Math.max(0, (1 - 2*f_eq)**2);
      ctx.setLineDash([5,4]);
      ctx.strokeStyle = 'rgba(255,140,66,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ml, ey_f(f_eq)); ctx.lineTo(ml+pw, ey_f(f_eq)); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,211,67,0.35)';
      ctx.beginPath(); ctx.moveTo(ml, ey_p(p_eq)); ctx.lineTo(ml+pw, ey_p(p_eq)); ctx.stroke();
      ctx.setLineDash([]);

      // Readout
      const cur = hist[hist.length-1];
      ctx.fillStyle = '#ff8c42';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`f_ash = ${(cur.f_ash*100).toFixed(1)}%  (eq: ${(f_eq*100).toFixed(1)}%)`, ml+4, mt+14);
      ctx.fillStyle = '#ffd43b';
      ctx.fillText(`P_fus/P₀ = ${(cur.P_rel*100).toFixed(1)}%`, ml+4, mt+28);

      // Legend
      [['#ff8c42','f_ash (He fraction)'], ['#ffd43b','P_fus / P₀']].forEach(([c, lbl], i) => {
        const ly = mt+ph - 18 - i*18;
        ctx.strokeStyle = c as string;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ml+8, ly); ctx.lineTo(ml+28, ly); ctx.stroke();
        ctx.fillStyle = c as string;
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(lbl as string, ml+32, ly+4);
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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

  return (
    <div className="lesson-layout">
      <div className="canvas-area">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="sidebar">
        <p className="section-heading">Parameters</p>
        <div className="control-group">
          <NumericControl
            label="Temperature T (keV)"
            value={T_keV} min={3} max={30} step={0.5}
            format={(v) => v.toFixed(1)}
            onChange={(v) => { setT(v); restart(); }}
          />
          <NumericControl
            label="Density n (m⁻³)"
            value={n_m3} min={1e19} max={1e21} step={1e19}
            format={(v) => v.toExponential(1)}
            onChange={(v) => { setN(v); restart(); }}
          />
          <NumericControl
            label="τ_E (s)"
            value={tauE} min={0.5} max={10} step={0.5}
            format={(v) => v.toFixed(1)}
            onChange={(v) => { setTauE(v); restart(); }}
          />
          <NumericControl
            label="τ_He / τ_E"
            value={tauMult} min={1} max={15} step={0.5}
            format={(v) => v.toFixed(1)}
            onChange={(v) => { setTauMult(v); restart(); }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={toggleRunning} style={{ flex: 1 }}>
            {running ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button className="btn" onClick={restart} style={{ flex: 1 }}>
            ↺ Reset
          </button>
        </div>

        <div className="info-box" style={{ marginTop: 14 }}>
          <p className="info-title">Ash dilution</p>
          <p className="info-text">
            Each He²⁺ ion displaces one D or T ion. When f_ash rises, D-T
            density falls as (1−2f), so power ∝ (1−2f)². The equilibrium
            is set by the pumping time τ_He = τ_mult · τ_E.
          </p>
        </div>
      </div>
    </div>
  );
}
