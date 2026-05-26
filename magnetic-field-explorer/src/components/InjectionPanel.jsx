import { useTranslation } from 'react-i18next';

/**
 * Sidebar panel for particle injection mode.
 *
 * Props:
 *   active           bool      - whether injection mode is on
 *   onToggle         fn        - toggle injection mode
 *   onInject         fn        - inject particle at current orbit target
 *   onClear          fn        - clear all traces
 *   particleCount    number    - how many traces exist
 *   speed / onSpeed  value+setter
 *   theta / onTheta  value+setter
 *   phi   / onPhi    value+setter
 *   charge/onCharge  value+setter
 *   mass  / onMass   value+setter
 */
export default function InjectionPanel({
  active,
  onToggle,
  onInject,
  onClear,
  particleCount = 0,
  speed,  onSpeed,
  theta,  onTheta,
  phi,    onPhi,
  charge, onCharge,
  mass,   onMass,
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
            <SliderRow label={t('injection.speed')} value={speed} min={0.1} max={5} step={0.1} onChange={onSpeed} />
            <SliderRow label="θ" value={theta} min={0} max={Math.PI} step={0.05} onChange={onTheta} fmt={v => `${(v * 180 / Math.PI).toFixed(0)}°`} />
            <SliderRow label="φ" value={phi}   min={0} max={2 * Math.PI} step={0.05} onChange={onPhi} fmt={v => `${(v * 180 / Math.PI).toFixed(0)}°`} />
            <SliderRow label={t('injection.charge')} value={charge} min={0.1} max={5} step={0.1} onChange={onCharge} />
            <SliderRow label={t('injection.mass')}   value={mass}   min={0.1} max={5} step={0.1} onChange={onMass} />
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

function SliderRow({ label, value, min, max, step, onChange, fmt }) {
  const display = fmt ? fmt(value) : +value.toFixed(2);
  return (
    <div className="control-row">
      <label>
        {label}
        <span className="control-value">{display}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
