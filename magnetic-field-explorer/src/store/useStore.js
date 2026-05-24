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
    helicalSheet: { R0: 2, a: 0.5, nfp: 3, nLines: 20, nTurns: 2, nsteps: 600 },
    particle: { charge: 1, mass: 1, speed: 1, theta: Math.PI / 4, phi: 0 },
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
