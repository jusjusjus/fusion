import { create } from 'zustand';

const useStore = create((set) => ({
  activeLesson: 'singleLoop',
  setActiveLesson: (id) => set({ activeLesson: id }),

  tfBackend: 'initializing',
  setTfBackend: (b) => set({ tfBackend: b }),

  // Per-lesson parameters
  params: {
    singleLoop: { radius: 1, current: 1, n: 200 },
    helmholtz: { radius: 1, separation: 1, current: 1, n: 200 },
    toroidal: { N: 8, R0: 2, a: 0.6, current: 1, n: 200, numLines: 5, traceLength: 80 },
    gradient: { B0: 1, alpha: 0, beta: 0, numLines: 4, traceLength: 14 },
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
