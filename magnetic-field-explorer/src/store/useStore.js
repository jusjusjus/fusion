import { create } from 'zustand';

const useStore = create((set) => ({
  activeLesson: 'singleLoop',
  setActiveLesson: (id) => set({ activeLesson: id }),

  tfBackend: 'initializing',
  setTfBackend: (b) => set({ tfBackend: b }),

  // Per-lesson parameters (all in SI: metres, amperes, tesla)
  params: {
    singleLoop: { radius: 0.10, current: 1.0, n: 200 },
    helmholtz:  { radius: 0.10, separation: 0.10, current: 1.0, n: 200 },
    toroidal:   { N: 12, R0: 1.00, a: 0.30, current: 50,  n: 200, numLines: 5, traceLength: 8 },
    tokamak:    { N: 12, R0: 1.00, a: 0.30, current: 50,  Icentral: 200, n: 200, numLines: 5, traceLength: 12 },
    gradient:   { B0: 0.001, alpha: 0.05, beta: 0, numLines: 4, traceLength: 0.5 },
  },

  setParam: (lesson, key, value) =>
    set((state) => ({
      params: {
        ...state.params,
        [lesson]: { ...state.params[lesson], [key]: value },
      },
    })),
}));

export default useStore;
