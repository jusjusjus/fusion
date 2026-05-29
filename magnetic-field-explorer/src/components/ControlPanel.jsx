/**
 * Reusable control panel sidebar.
 * controls: array of { key, label, step, value, decimals, hint }
 *   hint: optional string shown below the input as a range guide, e.g. "0.1 – 10 MA"
 * onChange:  (key, value) => void
 * onReset:   () => void  — fires when the Reset button is clicked
 * onCompute: () => void  — if provided, shows a Compute button
 * computing: bool
 * extraButtons: optional JSX rendered inside the control-actions row (e.g. ITER preset)
 */
export default function ControlPanel({ controls = [], onChange, onReset, onCompute, computing = false, children, extraButtons }) {
  return (
    <aside className="control-panel">
      {controls.map(({ key, label, step = 1, value, decimals = 2, hint }) => (
        <div key={key} className="control-row">
          <label>
            {label}
          </label>
          <input
            type="number"
            step={step}
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(key, v);
            }}
            className="number-input"
          />
          {hint && <span className="control-hint">{hint}</span>}
        </div>
      ))}

      {children}

      <div className="control-actions">
        {onReset && (
          <button className="reset-btn" onClick={onReset}>↺ Reset</button>
        )}
        {extraButtons}
        {onCompute && (
          <button
            className={`compute-btn ${computing ? 'busy' : ''}`}
            onClick={onCompute}
            disabled={computing}
          >
            {computing ? '⏳ …' : '▶ Compute'}
          </button>
        )}
      </div>
    </aside>
  );
}
