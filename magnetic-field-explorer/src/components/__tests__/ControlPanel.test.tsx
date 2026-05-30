import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlPanel from '../ControlPanel.jsx';

// ControlPanel has no i18n dependencies — it receives all strings as props.

const controls = [
  { key: 'radius',  label: 'Radius',  step: 0.01, value: 0.1,  decimals: 3 },
  { key: 'current', label: 'Current', step: 1,    value: 10,   hint: '1 – 100 A' },
  { key: 'n',       label: 'Segments', step: 10,  value: 200 },
];

describe('ControlPanel — rendering', () => {
  it('renders a label and input for each control', () => {
    render(<ControlPanel controls={controls} onChange={() => {}} />);
    expect(screen.getByText('Radius')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Segments')).toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
  });

  it('renders hint text when provided', () => {
    render(<ControlPanel controls={controls} onChange={() => {}} />);
    expect(screen.getByText('1 – 100 A')).toBeInTheDocument();
  });

  it('does not render hint when omitted', () => {
    const c = [{ key: 'x', label: 'X', step: 1, value: 5 }];
    render(<ControlPanel controls={c} onChange={() => {}} />);
    // No hint → no .control-hint element for this control
    expect(screen.queryByText(/hint/i)).not.toBeInTheDocument();
  });

  it('inputs are pre-filled with current values', () => {
    render(<ControlPanel controls={controls} onChange={() => {}} />);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(parseFloat(inputs[0].value)).toBeCloseTo(0.1, 5);
    expect(parseFloat(inputs[1].value)).toBeCloseTo(10, 5);
    expect(parseFloat(inputs[2].value)).toBeCloseTo(200, 5);
  });

  it('renders children inside the panel', () => {
    render(
      <ControlPanel controls={[]} onChange={() => {}}>
        <span data-testid="custom-child">hello</span>
      </ControlPanel>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });
});

describe('ControlPanel — interactions', () => {
  it('calls onChange with the correct key and parsed float value', () => {
    const onChange = vi.fn();
    render(<ControlPanel controls={controls} onChange={onChange} />);
    const [radiusInput] = screen.getAllByRole('spinbutton');
    fireEvent.change(radiusInput, { target: { value: '0.5' } });
    expect(onChange).toHaveBeenCalledWith('radius', 0.5);
  });

  it('does not call onChange for non-numeric input', () => {
    const onChange = vi.fn();
    render(<ControlPanel controls={controls} onChange={onChange} />);
    const [radiusInput] = screen.getAllByRole('spinbutton');
    fireEvent.change(radiusInput, { target: { value: 'abc' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders Reset button when onReset is provided', () => {
    render(<ControlPanel controls={controls} onChange={() => {}} onReset={() => {}} />);
    expect(screen.getByText('↺ Reset')).toBeInTheDocument();
  });

  it('does not render Reset button when onReset is absent', () => {
    render(<ControlPanel controls={controls} onChange={() => {}} />);
    expect(screen.queryByText('↺ Reset')).not.toBeInTheDocument();
  });

  it('calls onReset when Reset button is clicked', () => {
    const onReset = vi.fn();
    render(<ControlPanel controls={controls} onChange={() => {}} onReset={onReset} />);
    fireEvent.click(screen.getByText('↺ Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders Compute button when onCompute is provided', () => {
    render(<ControlPanel controls={[]} onChange={() => {}} onCompute={() => {}} />);
    expect(screen.getByText('▶ Compute')).toBeInTheDocument();
  });

  it('Compute button is disabled while computing', () => {
    render(<ControlPanel controls={[]} onChange={() => {}} onCompute={() => {}} computing={true} />);
    const btn = screen.getByRole('button', { name: /…/ });
    expect(btn).toBeDisabled();
  });

  it('renders extraButtons content', () => {
    render(
      <ControlPanel
        controls={[]}
        onChange={() => {}}
        extraButtons={<button>ITER Preset</button>}
      />
    );
    expect(screen.getByText('ITER Preset')).toBeInTheDocument();
  });
});
