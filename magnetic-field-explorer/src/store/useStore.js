import { create } from 'zustand';

// ── Lesson defaults (used for reset) ────────────────────────────────────────
export const DEFAULTS = {
  gradient:   { B0: 0.001, alpha: 0.05, beta: 0, numLines: 4, traceLength: 0.5 },
  singleLoop: { radius: 0.10, current: 1.0, n: 200 },
  helmholtz:  { radius: 0.10, separation: 0.10, current: 1.0, n: 200 },
  toroidal:   { N: 12, R0: 1.00, a: 0.30, current: 50,  n: 200, numLines: 5, traceLength: 8 },
  tokamak:    { N: 12, R0: 1.00, a: 0.30, current: 50,  Icentral: 200, n: 200, numLines: 5, traceLength: 12 },
};

// ── ITER-scale presets ───────────────────────────────────────────────────────
// I = B_t * 2π * R0 / (μ₀ * N) — here we use 500 kA for B ≈ 500 mT at R0=6.2m
// giving keV-ion Larmor radii of ~0.1m — visually clear within the 2m minor radius.
export const ITER_TOROIDAL = { N: 18, R0: 6.2, a: 2.0, current: 500000, n: 200, numLines: 5, traceLength: 10 };
export const ITER_TOKAMAK  = { ...ITER_TOROIDAL, Icentral: 2000000, traceLength: 12 };

const useStore = create((set) => ({
  activeLesson: 'gradient',
  setActiveLesson: (id) => set({ activeLesson: id }),

  tfBackend: 'initializing',
  setTfBackend: (b) => set({ tfBackend: b }),

  // Per-lesson parameters (all in SI: metres, amperes, tesla)
  params: { ...DEFAULTS },

  setParam: (lesson, key, value) =>
    set((state) => ({
      params: {
        ...state.params,
        [lesson]: { ...state.params[lesson], [key]: value },
      },
    })),

  /** Set multiple params for a lesson at once (e.g. loading a preset). */
  setParams: (lesson, values) =>
    set((state) => ({
      params: {
        ...state.params,
        [lesson]: { ...state.params[lesson], ...values },
      },
    })),

  /** Reset a lesson's params to the original defaults. */
  resetParams: (lesson) =>
    set((state) => ({
      params: {
        ...state.params,
        [lesson]: { ...DEFAULTS[lesson] },
      },
    })),
}));

export default useStore;
