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

            {/* Energy input */}
            <div className="control-row">
              <label>{t('injection.energy')}</label>
              <input
                type="number"
                min={1e-6}
                step="any"
                value={energyEV}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) onEnergyEV(v);
                }}
                className="number-input"
              />
              <span className="control-hint">eV — thermal: 0.016 · keV–MeV for visible orbits</span>
            </div>
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


