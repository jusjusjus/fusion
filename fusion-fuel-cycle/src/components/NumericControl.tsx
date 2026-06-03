import { useEffect, useRef, useState } from 'react';

/** Default display format: exponential for very large/small, fixed otherwise. */
function defaultFormat(v: number): string {
  if (!Number.isFinite(v)) return String(v);
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e4 || abs < 1e-2) return v.toPrecision(4);
  return v % 1 === 0 ? String(v) : v.toPrecision(4);
}

interface NumericControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** How to display the value in the text input. Defaults to a smart scientific/fixed formatter. */
  format?: (v: number) => string;
  /** When true, snaps committed values to integers via Math.round. */
  integer?: boolean;
}

/**
 * A parameter control combining a labelled text input and a range slider.
 * - Slider drag: updates value immediately.
 * - Text input: commits on Enter or blur; invalid input reverts to current value.
 * - Text display stays in sync with the slider when not focused.
 */
export default function NumericControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = defaultFormat,
  integer = false,
}: NumericControlProps) {
  const [text, setText] = useState(() => format(value));
  const focused = useRef(false);

  // Sync text with external value changes (e.g. slider), but not while user is typing
  useEffect(() => {
    if (!focused.current) setText(format(value));
  }, [value, format]);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      setText(format(value)); // revert
      return;
    }
    let clamped = Math.max(min, Math.min(max, parsed));
    if (integer) clamped = Math.round(clamped);
    onChange(clamped);
  };

  return (
    <div className="num-control">
      <div className="num-control__header">
        <span className="num-control__label">{label}</span>
        <input
          className="num-control__text"
          type="text"
          value={text}
          onFocus={() => { focused.current = true; }}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => { focused.current = false; commit(e.target.value); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit(text);
              (e.target as HTMLInputElement).blur();
            } else if (e.key === 'Escape') {
              setText(format(value));
              focused.current = false;
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
