/**
 * Reusable control panel sidebar.
 * controls: array of { key, label, type, min, max, step, value }
 * onChange: (key, value) => void
 * onCompute: () => void
 * computing: bool
 */
export default function ControlPanel({ controls = [], onChange, onCompute, computing = false, children }) {
  return (
    <aside className="control-panel">
      {controls.map(({ key, label, type = 'range', min = 0, max = 10, step = 0.1, value }) => (
        <div key={key} className="control-row">
          <label>
            {label}
            <span className="control-value">{typeof value === 'number' ? value.toFixed(2) : value}</span>
          </label>
          {type === 'range' ? (
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(key, parseFloat(e.target.value))}
            />
          ) : (
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(key, parseFloat(e.target.value))}
              className="number-input"
            />
          )}
        </div>
      ))}

      {children}

      {onCompute && (
        <button
          className={`compute-btn ${computing ? 'busy' : ''}`}
          onClick={onCompute}
          disabled={computing}
        >
          {computing ? '⏳ …' : '▶ Compute'}
        </button>
      )}
    </aside>
  );
}
