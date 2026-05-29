import { useTranslation } from 'react-i18next';
import { PARTICLES } from '../physics/particles.js';

/**
 * Sidebar panel for particle injection mode.
 *
 * Props:
 *   active              bool      - whether injection mode is on
 *   onToggle            fn        - toggle injection mode
 *   onInject            fn        - inject particle from camera viewpoint
 *   onClear             fn        - clear all traces
 *   particleCount       number    - how many traces exist
 *   speciesId/onSpeciesId  value+setter  - particle species key
 *   energyEV/onEnergyEV    value+setter  - kinetic energy in eV
 */
export default function InjectionPanel({
  active,
  onToggle,
  onInject,
  onClear,
  particleCount = 0,
  speciesId, onSpeciesId,
  energyEV,  onEnergyEV,
}) {
  const { t } = useTranslation();

  return (
    <div className="injection-panel">
      <div className="injection-header">
        <span className="injection-title">{t('injection.title')}</span>
        <button
          className={`inject-toggle-btn${active ? ' active' : ''}`}
          onClick={onToggle}
        >
          {active ? t('injection.modeOff') : t('injection.modeOn')}
        </button>
      </div>

      {active && (
        <>
          <p className="injection-hint">{t('injection.hint')}</p>

          <div className="injection-controls">
            {/* Species selector */}
            <div className="control-row">
              <label>{t('injection.species')}</label>
              <div className="species-buttons">
                {PARTICLES.map(p => (
                  <button
                    key={p.id}
                    className={`species-btn${speciesId === p.id ? ' active' : ''}`}
                    onClick={() => onSpeciesId(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy slider (log scale: 1 eV – 10 keV) */}
            <LogEnergySlider
              label={t('injection.energy')}
              value={energyEV}
              onChange={onEnergyEV}
            />
          </div>

          <div className="injection-actions">
            <button className="inject-btn" onClick={onInject}>
              {t('injection.inject')}
            </button>
            <button
              className="clear-btn"
              onClick={onClear}
              disabled={particleCount === 0}
            >
              {t('injection.clear')} {particleCount > 0 && `(${particleCount})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Logarithmic energy slider: slider range 0–40 maps to 1–10000 eV (10^0 – 10^4). */
function LogEnergySlider({ label, value, onChange }) {
  const logVal = Math.log10(Math.max(value, 1)) * 10;
  const display = value < 1000
    ? `${Math.round(value)} eV`
    : `${(value / 1000).toFixed(2)} keV`;

  return (
    <div className="control-row">
      <label>
        {label}
        <span className="control-value">{display}</span>
      </label>
      <input
        type="range"
        min={0} max={40} step={0.5}
        value={logVal}
        onChange={e => onChange(Math.pow(10, parseFloat(e.target.value) / 10))}
      />
    </div>
  );
}

