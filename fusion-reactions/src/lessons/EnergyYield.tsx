/**
 * Energy Yield lesson
 *
 * Shows:
 *   1. Canvas bar chart of binding energy per nucleon for key nuclides.
 *   2. Reaction selector with Q-value display and product energies.
 *   3. Energy comparison: reactions → MJ/kg → coal tonnes.
 */
import { useEffect, useRef, useState } from 'react';
import { NUCLIDES, DT, DD_branch1, DD_branch2, DHe3 } from '../physics/constants';
import type { Reaction } from '../physics/constants';

const REACTIONS: Reaction[] = [DT, DD_branch1, DD_branch2, DHe3];

// Tonnes of coal equivalent per MJ (coal: ~24 MJ/kg → 24,000 MJ/t → 1 MJ = 1/24000 t)
const MJ_PER_TONNE_COAL = 24000;

export default function EnergyYield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedRxn, setSelectedRxn] = useState(0);

  const rxn = REACTIONS[selectedRxn];

  // Binding energy chart
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

      const ml = 14, mr = 14, mt = 30, mb = 50;
      const pw = W - ml - mr;
      const ph = H - mt - mb;

      const n = NUCLIDES.length;
      const barW = pw / n * 0.7;
      const gap  = pw / n;

      const maxBE = 8;

      // Grid lines
      [0, 2, 4, 6, 8].forEach(be => {
        const y = mt + ph * (1 - be / maxBE);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(ml+pw, y); ctx.stroke();
        ctx.fillStyle = 'rgba(160,185,220,0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${be}`, ml-2, y+4);
      });

      // Axis label
      ctx.fillStyle = 'rgba(160,185,220,0.7)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Binding energy (MeV/nucleon)', ml, 16);

      // Bars
      NUCLIDES.forEach((nuc, i) => {
        const barH = (nuc.BE_per_A / maxBE) * ph;
        const x = ml + i * gap + (gap - barW) / 2;
        const y = mt + ph - barH;

        const grad = ctx.createLinearGradient(0, y, 0, y+barH);
        grad.addColorStop(0, nuc.color);
        grad.addColorStop(1, nuc.color + '44');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barW, barH);

        // Symbol label
        ctx.fillStyle = '#c8d8f0';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(nuc.symbol, x + barW/2, mt + ph + 14);

        // Value label on bar
        if (nuc.BE_per_A > 0.5) {
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.font = '10px monospace';
          ctx.fillText(nuc.BE_per_A.toFixed(2), x + barW/2, y - 4);
        }
      });

      // ⁴He highlight
      const i4He = NUCLIDES.findIndex(n => n.symbol === '⁴He');
      if (i4He >= 0) {
        const x = ml + i4He * gap + (gap - barW) / 2;
        const y = mt + ph - (NUCLIDES[i4He].BE_per_A / maxBE) * ph;
        ctx.strokeStyle = '#ffd43b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x-1, y-1, barW+2, (NUCLIDES[i4He].BE_per_A / maxBE) * ph + 2);
        ctx.fillStyle = '#ffd43b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('↑ product', x + barW/2, y - 14);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Coal comparison
  const reactionsPerKg = (1 / ((5.0064e-27) * 2)) * 1e0;  // rough: using D-T pair mass
  const energyMJpkg = rxn.Q_MeV * 1e6 * 1.602e-19 / (3.3559e-27) / 1e6;  // MJ/kg fuel pair
  const coalTonnes = energyMJpkg / MJ_PER_TONNE_COAL * 1000;  // per kg fuel

  return (
    <div className="lesson-layout">
      <div className="canvas-area">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="sidebar">
        <p className="section-heading">Select reaction</p>
        <div className="control-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {REACTIONS.map((r, i) => (
            <button
              key={r.label}
              className={`lesson-card ${selectedRxn === i ? 'lesson-card--active' : ''}`}
              style={{ padding: '8px 12px', textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => setSelectedRxn(i)}
            >
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#c8d8f0' }}>
                {r.equation}
              </span>
            </button>
          ))}
        </div>

        <p className="section-heading" style={{ marginTop: 14 }}>Q value</p>
        <div className="readout-grid">
          <span>Q</span>
          <span style={{ color: '#ffd43b', fontWeight: 'bold' }}>{rxn.Q_MeV.toFixed(2)} MeV</span>
          <span>{rxn.product1.name}</span>
          <span>{rxn.product1.E_MeV.toFixed(2)} MeV</span>
          <span>{rxn.product2.name}</span>
          <span>{rxn.product2.E_MeV.toFixed(2)} MeV</span>
        </div>

        <p className="section-heading" style={{ marginTop: 14 }}>Energy density</p>
        <div className="readout-grid">
          <span>Per kg fuel</span>
          <span>{energyMJpkg.toFixed(0)} MJ/kg</span>
          <span>vs coal</span>
          <span style={{ color: '#69db7c' }}>×{coalTonnes.toFixed(0)}</span>
          <span>Specific E</span>
          <span>{rxn.specificEnergy_GJperg.toFixed(2)} GJ/g</span>
        </div>

        <div className="info-box" style={{ marginTop: 14 }}>
          <p className="info-title">Why ⁴He?</p>
          <p className="info-text">
            Helium-4 has the highest binding energy per nucleon among light
            nuclei (7.07 MeV/A), so reactions producing ⁴He release the most
            energy. The jump in binding energy from D+T → ⁴He drives the
            enormous 17.6 MeV yield.
          </p>
        </div>
      </div>
    </div>
  );
}
