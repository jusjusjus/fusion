/**
 * Plasma Oscillations lesson
 *
 * 1D electron sheet model — displaced electrons oscillate at the plasma frequency.
 * The canvas shows:
 *   - Animated electron density profile (cyan histogram)
 *   - Equilibrium (ion) density reference line
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { initOscillation, stepOscillation, computeDensity } from '../physics/plasmaOscillations';
import type { OscState } from '../physics/plasmaOscillations';
import NumericControl from '../components/NumericControl';

const NG     = 64;   // grid cells for density display
const STEPS_PER_FRAME = 20;

/** Plasma frequency (rad/s) → Hz */
function wpToHz(wp: number) {
  return wp / (2 * Math.PI);
}

/** Format frequency in Hz / kHz / MHz / GHz */
function fmtFreq(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`;
  return `${hz.toFixed(1)} Hz`;
}

export default function PlasmaOscillations() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<OscState | null>(null);
  const rafRef    = useRef<number>(0);
  const runRef    = useRef(true);

  const [running,   setRunning]   = useState(true);
  const [n0,        setN0]        = useState(1e16);   // m⁻³
  const [amplitude, setAmplitude] = useState(0.3);    // fraction of spacing
  const [N,         setN]         = useState(200);    // sheets
  const [mode,      setMode]      = useState(1);      // spatial mode

  const L = 0.1; // domain length (m) — 10 cm

  // Derived display quantities
  const wp = stateRef.current?.wp ?? Math.sqrt(n0 * 1.602e-19 * 1.602e-19 / (8.854e-12 * 9.109e-31));
  const fp = wpToHz(wp);

  const restart = useCallback(() => {
    stateRef.current = initOscillation({ n0, amplitude, N, L, mode });
  }, [n0, amplitude, N, mode]);

  const toggleRunning = useCallback(() => {
    const next = !runRef.current;
    runRef.current = next;
    setRunning(next);
  }, []);

  // Re-initialise whenever parameters change
  useEffect(() => { restart(); }, [restart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const state = stateRef.current;
      if (!state) { rafRef.current = requestAnimationFrame(draw); return; }

      // Advance simulation only when running
      let s = state;
      if (runRef.current) {
        for (let i = 0; i < STEPS_PER_FRAME; i++) {
          s = stepOscillation(s);
        }
        stateRef.current = s;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      // Density profile
      const density = computeDensity(s.positions, L, NG);
      const maxDensity = Math.max(...Array.from(density), 1);
      const barW = W / NG;
      const plotH = H * 0.7;
      const plotY = H * 0.15;

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 0; j <= 4; j++) {
        const y = plotY + plotH * (1 - j / 4);
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      // Equilibrium reference
      const eqDensity = s.positions.length / NG;
      const eqY = plotY + plotH * (1 - eqDensity / (maxDensity * 1.1));
      ctx.strokeStyle = 'rgba(255,200,60,0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, eqY);
      ctx.lineTo(W, eqY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Density bars
      for (let j = 0; j < NG; j++) {
        const barH = (density[j] / (maxDensity * 1.1)) * plotH;
        const x = j * barW;
        const y = plotY + plotH - barH;

        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, 'rgba(77,171,247,0.9)');
        grad.addColorStop(1, 'rgba(30,90,160,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 0.5, y, barW - 1, barH);
      }

      // Labels
      ctx.fillStyle = 'rgba(100,140,200,0.8)';
      ctx.font = '11px monospace';
      ctx.fillText('n(x)', 8, plotY - 6);

      ctx.fillStyle = 'rgba(100,140,200,0.6)';
      ctx.font = '10px monospace';
      ctx.fillText('0', 4, plotY + plotH + 12);
      ctx.fillText('L', W - 12, plotY + plotH + 12);
      ctx.fillText('x →', W / 2 - 10, plotY + plotH + 14);

      // ωp readout
      ctx.fillStyle = 'rgba(105,219,124,0.9)';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`ωp = ${(s.wp / 1e9).toFixed(3)} × 10⁹ rad/s`, 12, H * 0.92);
      ctx.fillStyle = 'rgba(105,219,124,0.7)';
      ctx.font = '11px monospace';
      ctx.fillText(`fp = ${fmtFreq(wpToHz(s.wp))}`, 12, H * 0.97);

      // t readout
      ctx.fillStyle = 'rgba(150,180,220,0.6)';
      ctx.font = '10px monospace';
      const Tperiod = 2 * Math.PI / s.wp;
      ctx.fillText(`t = ${(s.t / Tperiod).toFixed(1)} Tp`, W - 80, 16);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Resize canvas to match container
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
            label="Density n₀ (m⁻³)"
            value={n0} min={1e14} max={1e18} step={1e14}
            format={(v) => v.toExponential(2)}
            onChange={setN0}
          />
          <NumericControl
            label="Amplitude"
            value={amplitude} min={0.01} max={0.8} step={0.01}
            format={(v) => v.toFixed(2)}
            onChange={setAmplitude}
          />
          <NumericControl
            label="Sheets N"
            value={N} min={50} max={500} step={10}
            format={String} integer
            onChange={setN}
          />
          <NumericControl
            label="Mode k"
            value={mode} min={1} max={8} step={1}
            format={String} integer
            onChange={setMode}
          />
        </div>

        <div className="info-badge">ωp = {(wp / 1e9).toFixed(3)} ×10⁹ rad/s</div>
        <div className="info-badge">fp = {fmtFreq(fp)}</div>

        <div className="btn-row">
          <button className="btn btn--primary" onClick={restart}>Restart</button>
          <button
            className={`btn ${running ? 'btn--danger' : 'btn--primary'}`}
            onClick={toggleRunning}
          >
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>

        <p className="description">
          In the cold-plasma model, displacing electrons from their equilibrium positions
          creates a restoring electric field E ∝ displacement. Every sheet oscillates at
          the <em>plasma frequency</em>{' '}
          ω<sub>p</sub> = √(n₀e²/ε₀mₑ) — independent of wave-number in the
          long-wavelength limit.
          {' '}Increasing n₀ raises ωp (denser plasma → stronger restoring force).
          The spatial mode sets the initial density pattern; all modes oscillate at the
          same ωp in the linear regime.
        </p>
      </div>
    </div>
  );
}
