import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InjectionPanel from '../InjectionPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const baseProps = {
  active: false,
  onToggle: vi.fn(),
  onInject: vi.fn(),
  onClear: vi.fn(),
  particleCount: 0,
  speciesId: 'electron',
  onSpeciesId: vi.fn(),
  energyEV: 100,
  onEnergyEV: vi.fn(),
};

describe('InjectionPanel — inactive state', () => {
  it('renders the panel title', () => {
    render(<InjectionPanel {...baseProps} />);
    expect(screen.getByText('injection.title')).toBeInTheDocument();
  });

  it('shows "Enter" mode button when inactive', () => {
    render(<InjectionPanel {...baseProps} />);
    expect(screen.getByText('injection.modeOn')).toBeInTheDocument();
  });

  it('does not render species or energy controls when inactive', () => {
    render(<InjectionPanel {...baseProps} />);
    expect(screen.queryByText('injection.species')).not.toBeInTheDocument();
    expect(screen.queryByText('injection.energy')).not.toBeInTheDocument();
  });

  it('calls onToggle when the mode button is clicked', () => {
    const onToggle = vi.fn();
    render(<InjectionPanel {...baseProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('injection.modeOn'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('InjectionPanel — active state', () => {
  const activeProps = { ...baseProps, active: true };

  it('shows "Exit" mode button when active', () => {
    render(<InjectionPanel {...activeProps} />);
    expect(screen.getByText('injection.modeOff')).toBeInTheDocument();
  });

  it('renders species selector buttons for all particles', () => {
    render(<InjectionPanel {...activeProps} />);
    // PARTICLES list has 5 entries: e⁻, H⁺, D⁺, He⁺, He²⁺
    const speciesBtns = screen.getAllByRole('button', { name: /[eHDh]/i });
    expect(speciesBtns.length).toBeGreaterThanOrEqual(4);
  });

  it('calls onSpeciesId when a species button is clicked', () => {
    const onSpeciesId = vi.fn();
    render(<InjectionPanel {...activeProps} onSpeciesId={onSpeciesId} />);
    // Find the H⁺ (proton) button
    const protonBtn = screen.getByText('H⁺');
    fireEvent.click(protonBtn);
    expect(onSpeciesId).toHaveBeenCalledWith('proton');
  });

  it('renders an energy input with the current eV value', () => {
    render(<InjectionPanel {...activeProps} energyEV={250} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(parseFloat(input.value)).toBe(250);
  });

  it('calls onEnergyEV with a positive number when energy changes', () => {
    const onEnergyEV = vi.fn();
    render(<InjectionPanel {...activeProps} onEnergyEV={onEnergyEV} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '500' } });
    expect(onEnergyEV).toHaveBeenCalledWith(500);
  });

  it('does not call onEnergyEV for non-positive values', () => {
    const onEnergyEV = vi.fn();
    render(<InjectionPanel {...activeProps} onEnergyEV={onEnergyEV} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-10' } });
    expect(onEnergyEV).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '0' } });
    expect(onEnergyEV).not.toHaveBeenCalled();
  });

  it('renders Inject and Clear buttons', () => {
    render(<InjectionPanel {...activeProps} />);
    expect(screen.getByText('injection.inject')).toBeInTheDocument();
    expect(screen.getByText(/injection.clear/)).toBeInTheDocument();
  });

  it('calls onInject when the Inject button is clicked', () => {
    const onInject = vi.fn();
    render(<InjectionPanel {...activeProps} onInject={onInject} />);
    fireEvent.click(screen.getByText('injection.inject'));
    expect(onInject).toHaveBeenCalledTimes(1);
  });

  it('Clear button is disabled when particleCount is 0', () => {
    render(<InjectionPanel {...activeProps} particleCount={0} />);
    // Find the clear button by matching the translated key
    const clearBtn = screen.getByText(/injection.clear/).closest('button') as HTMLButtonElement;
    expect(clearBtn).toBeDisabled();
  });

  it('Clear button is enabled and shows count when traces exist', () => {
    render(<InjectionPanel {...activeProps} particleCount={3} />);
    const clearBtn = screen.getByText(/injection.clear/).closest('button') as HTMLButtonElement;
    expect(clearBtn).not.toBeDisabled();
    expect(clearBtn.textContent).toMatch('3');
  });

  it('calls onClear when Clear button is clicked with traces present', () => {
    const onClear = vi.fn();
    render(<InjectionPanel {...activeProps} onClear={onClear} particleCount={2} />);
    fireEvent.click(screen.getByText(/injection.clear/).closest('button')!);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
