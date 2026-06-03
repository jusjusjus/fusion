/**
 * Tritium Breeding lesson
 *
 * Interactive blanket model: TBR as function of Li-6 enrichment,
 * blanket thickness, and Be multiplier fraction.
 * Shows TBR bar + TBR vs enrichment curve.
 */
import { useEffect, useRef, useState } from 'react';
import {
  computeTBR,
  tbrVsEnrichment,
  startupInventory_g,
} from '../physics/tritiumBreeding';
import NumericControl from '../components/NumericControl';

export default function TritiumBreeding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [enrichment,   setEnrichment]   = useState(0.3);   // Li-6 fraction
  const [thickness_cm, setThickness]    = useState(60);    // cm
  const [f_Be,         setFBe]          = useState(0.05);  // Be fraction
  const [P_MW,         setPMW]          = useState(500);   // MW

  const result = computeTBR({ enrichment, thickness_cm, f_Be });
  const inv = startupInventory_g(P_MW, result.TBR, 30);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      const ml = 54, mr = 20, mt = 28, mb = 44;
      const pw = W - ml - mr, ph = H - mt - mb;

      const TBR_MAX = 1.6;

      const ex = (e: number) => ml + e * pw;
      const ey = (tbr: number) => mt + (1 - tbr / TBR_MAX) * ph;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      [0, 0.4, 0.8, 1.0, 1.2, 1.6].forEach(t => {
        ctx.beginPath(); ctx.moveTo(ml, ey(t)); ctx.lineTo(ml+pw, ey(t)); ctx.stroke();
      });
      [0, 0.25, 0.5, 0.75, 1.0].forEach(e => {
        ctx.beginPath(); ctx.moveTo(ex(e), mt); ctx.lineTo(ex(e), mt+ph); ctx.stroke();
      });

      // TBR = 1 critical line
      ctx.strokeStyle = 'rgba(255,150,50,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(ml, ey(1)); ctx.lineTo(ml+pw, ey(1)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,150,50,0.7)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('TBR = 1', ml+4, ey(1)-4);

      // Axes
      ctx.strokeStyle = 'rgba(180,200,230,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ml, mt); ctx.lineTo(ml, mt+ph);
      ctx.moveTo(ml, mt+ph); ctx.lineTo(ml+pw, mt+ph);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(160,185,220,0.8)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      [0, 0.25, 0.5, 0.75, 1.0].forEach(e => ctx.fillText(`${(e*100).toFixed(0)}%`, ex(e), mt+ph+14));
      ctx.fillText('Li-6 enrichment', ml+pw/2, mt+ph+32);
      ctx.textAlign = 'right';
      [0, 0.4, 0.8, 1.0, 1.2, 1.6].forEach(t => ctx.fillText(t.toFixed(1), ml-4, ey(t)+4));
      ctx.save();
      ctx.translate(14, mt+ph/2);
      ctx.rotate(-Math.PI/2);
      ctx.textAlign = 'center';
      ctx.fillText('TBR', 0, 0);
      ctx.restore();

      // TBR vs enrichment curve (current thickness + Be)
      const curve = tbrVsEnrichment({ thickness_cm, f_Be });
      ctx.strokeStyle = '#69db7c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      curve.forEach(({ e, TBR }, i) => {
        const x = ex(e), y = ey(Math.min(TBR, TBR_MAX * 1.05));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Cursor dot at current enrichment
      const cur = computeTBR({ enrichment, thickness_cm, f_Be });
      const xc = ex(enrichment);
      const yc = ey(Math.min(cur.TBR, TBR_MAX));
      const tbrColor = cur.TBR >= 1 ? '#69db7c' : '#ff6b6b';
      ctx.fillStyle = tbrColor;
      ctx.beginPath(); ctx.arc(xc, yc, 7, 0, Math.PI*2); ctx.fill();

      // Breakdown bar (stacked horizontal near top)
      const barY = mt - 20;
      const barTotal = pw * 0.6;
      const barX0 = ml + (pw - barTotal) / 2;
      const fracLi6 = cur.TBR > 0 ? cur.TBR_Li6 / cur.TBR : 0;
      const fracLi7 = cur.TBR > 0 ? cur.TBR_Li7 / cur.TBR : 0;
      const fracBe  = cur.TBR > 0 ? cur.TBR_Be  / cur.TBR : 0;

      [[fracLi6, '#4dabf7'], [fracLi7, '#74c0fc'], [fracBe, '#ffd43b']].reduce((x, [f, c]) => {
        const bw = (f as number) * barTotal;
        ctx.fillStyle = c as string;
        ctx.fillRect(x, barY, bw, 8);
        return x + bw;
      }, barX0);

      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4dabf7';
      ctx.fillText('⁶Li', barX0 + fracLi6*barTotal/2, barY-2);
      ctx.fillStyle = '#74c0fc';
      ctx.fillText('⁷Li', barX0 + fracLi6*barTotal + fracLi7*barTotal/2, barY-2);
      ctx.fillStyle = '#ffd43b';
      ctx.fillText('Be', barX0 + fracLi6*barTotal + fracLi7*barTotal + fracBe*barTotal/2, barY-2);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [enrichment, thickness_cm, f_Be]);

  return (
    <div className="lesson-layout">
      <div className="canvas-area">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="sidebar">
        <p className="section-heading">Blanket parameters</p>
        <div className="control-group">
          <NumericControl
            label="Li-6 enrichment (%)"
            value={enrichment * 100} min={7.5} max={90} step={0.5}
            format={(v) => v.toFixed(1)}
            onChange={(v) => setEnrichment(v / 100)}
          />
          <NumericControl
            label="Blanket thickness (cm)"
            value={thickness_cm} min={10} max={120} step={5}
            format={(v) => v.toFixed(0)}
            onChange={setThickness}
          />
          <NumericControl
            label="Be volume fraction (%)"
            value={f_Be * 100} min={0} max={40} step={1}
            format={(v) => v.toFixed(0)}
            onChange={(v) => setFBe(v / 100)}
          />
          <NumericControl
            label="Fusion power (MW)"
            value={P_MW} min={100} max={2000} step={100}
            format={(v) => v.toFixed(0)}
            onChange={setPMW}
          />
        </div>

        <p className="section-heading" style={{ marginTop: 14 }}>Results</p>
        <div className="readout-grid">
          <span>TBR</span>
          <span style={{
            color: result.TBR >= 1 ? '#69db7c' : '#ff6b6b',
            fontWeight: 'bold',
            fontSize: 15,
          }}>
            {result.TBR.toFixed(3)} {result.TBR >= 1 ? '✓' : '✗'}
          </span>
          <span>⁶Li contribution</span><span>{result.TBR_Li6.toFixed(3)}</span>
          <span>⁷Li contribution</span><span>{result.TBR_Li7.toFixed(3)}</span>
          <span>Be contribution</span><span>{result.TBR_Be.toFixed(3)}</span>
          <span>Startup T inventory</span>
          <span style={{ color: result.TBR >= 1 ? '#c8d8f0' : '#ff6b6b' }}>
            {result.TBR >= 1 ? `${inv.toFixed(0)} g` : '∞'}
          </span>
        </div>

        <div className="info-box" style={{ marginTop: 14 }}>
          <p className="info-title">TBR must exceed 1</p>
          <p className="info-text">
            Every fusion event consumes one T atom. TBR &gt; 1 means the
            blanket breeds more T than is consumed. Natural Li has only 7.5%
            ⁶Li — enrichment and Be neutron multiplication are essential for
            TBR ≥ 1.15 (accounting for losses and decay).
          </p>
        </div>
      </div>
    </div>
  );
}
