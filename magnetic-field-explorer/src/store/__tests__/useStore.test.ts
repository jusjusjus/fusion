import { describe, it, expect, beforeEach } from 'vitest';
import useStore, { DEFAULTS, ITER_TOROIDAL, ITER_TOKAMAK } from '../../store/useStore';

// Deep-clone the defaults before every test so mutations don't leak
beforeEach(() => {
  useStore.setState({ params: JSON.parse(JSON.stringify(DEFAULTS)) });
});

describe('DEFAULTS', () => {
  it('defines all expected lesson keys', () => {
    expect(DEFAULTS).toHaveProperty('gradient');
    expect(DEFAULTS).toHaveProperty('singleLoop');
    expect(DEFAULTS).toHaveProperty('helmholtz');
    expect(DEFAULTS).toHaveProperty('toroidal');
    expect(DEFAULTS).toHaveProperty('tokamak');
  });

  it('singleLoop has positive current and radius', () => {
    expect(DEFAULTS.singleLoop.current).toBeGreaterThan(0);
    expect(DEFAULTS.singleLoop.radius).toBeGreaterThan(0);
  });
});

describe('ITER presets', () => {
  it('ITER_TOROIDAL has R0 = 6.2 m and 18 coils', () => {
    expect(ITER_TOROIDAL.R0).toBe(6.2);
    expect(ITER_TOROIDAL.N).toBe(18);
    expect(ITER_TOROIDAL.a).toBe(2.0);
  });

  it('ITER_TOKAMAK extends ITER_TOROIDAL with a plasma current', () => {
    expect(ITER_TOKAMAK.R0).toBe(ITER_TOROIDAL.R0);
    expect(ITER_TOKAMAK.N).toBe(ITER_TOROIDAL.N);
    expect(ITER_TOKAMAK).toHaveProperty('Icentral');
    expect(ITER_TOKAMAK.Icentral).toBeGreaterThan(0);
  });
});

describe('setParam', () => {
  it('updates a single parameter without touching others', () => {
    const { setParam } = useStore.getState();
    setParam('singleLoop', 'radius', 0.5);
    const { params } = useStore.getState();
    expect(params.singleLoop.radius).toBe(0.5);
    expect(params.singleLoop.current).toBe(DEFAULTS.singleLoop.current);
    expect(params.singleLoop.n).toBe(DEFAULTS.singleLoop.n);
  });

  it('updating one lesson does not affect another', () => {
    const { setParam } = useStore.getState();
    setParam('toroidal', 'current', 99999);
    const { params } = useStore.getState();
    expect(params.tokamak.current).toBe(DEFAULTS.tokamak.current);
    expect(params.singleLoop.current).toBe(DEFAULTS.singleLoop.current);
  });

  it('stores numeric values exactly', () => {
    const { setParam } = useStore.getState();
    setParam('gradient', 'B0', 0.123456789);
    expect(useStore.getState().params.gradient.B0).toBe(0.123456789);
  });
});

describe('setParams', () => {
  it('applies a multi-field preset in one call', () => {
    const { setParams } = useStore.getState();
    setParams('toroidal', ITER_TOROIDAL);
    const { params } = useStore.getState();
    expect(params.toroidal.R0).toBe(ITER_TOROIDAL.R0);
    expect(params.toroidal.current).toBe(ITER_TOROIDAL.current);
    expect(params.toroidal.N).toBe(ITER_TOROIDAL.N);
  });

  it('merges: fields not in the preset retain their current values', () => {
    const { setParam, setParams } = useStore.getState();
    // Change numLines first, then apply a partial preset that does NOT include numLines
    setParam('toroidal', 'numLines', 99);
    setParams('toroidal', { R0: 3.0, current: 100 });
    const { params } = useStore.getState();
    expect(params.toroidal.R0).toBe(3.0);
    expect(params.toroidal.current).toBe(100);
    expect(params.toroidal.numLines).toBe(99);  // unchanged
  });
});

describe('resetParams', () => {
  it('restores a single lesson to DEFAULTS', () => {
    const { setParam, resetParams } = useStore.getState();
    setParam('singleLoop', 'radius', 9.9);
    resetParams('singleLoop');
    expect(useStore.getState().params.singleLoop.radius).toBe(DEFAULTS.singleLoop.radius);
  });

  it('does not affect other lessons', () => {
    const { setParam, resetParams } = useStore.getState();
    setParam('toroidal', 'current', 12345);
    resetParams('singleLoop');
    expect(useStore.getState().params.toroidal.current).toBe(12345);
  });

  it('reset after setParams restores original defaults', () => {
    const { setParams, resetParams } = useStore.getState();
    setParams('toroidal', ITER_TOROIDAL);
    resetParams('toroidal');
    const { params } = useStore.getState();
    expect(params.toroidal.R0).toBe(DEFAULTS.toroidal.R0);
    expect(params.toroidal.current).toBe(DEFAULTS.toroidal.current);
    expect(params.toroidal.N).toBe(DEFAULTS.toroidal.N);
  });
});

describe('setActiveLesson', () => {
  it('changes the active lesson', () => {
    useStore.getState().setActiveLesson('toroidal');
    expect(useStore.getState().activeLesson).toBe('toroidal');
  });

  it('each lesson switch is independent', () => {
    const { setActiveLesson } = useStore.getState();
    setActiveLesson('helmholtz');
    expect(useStore.getState().activeLesson).toBe('helmholtz');
    setActiveLesson('gradient');
    expect(useStore.getState().activeLesson).toBe('gradient');
  });
});
