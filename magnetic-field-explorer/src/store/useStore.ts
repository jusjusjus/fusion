import { create } from 'zustand';

export interface GradientParams { B0: number; alpha: number; beta: number; numLines: number; traceLength: number; }
export interface SingleLoopParams { radius: number; current: number; n: number; }
export interface HelmholtzParams { radius: number; separation: number; current: number; n: number; }
export interface ToroidalParams { N: number; R0: number; a: number; current: number; n: number; numLines: number; traceLength: number; }
export interface TokamakParams { N: number; R0: number; a: number; current: number; Icentral: number; n: number; numLines: number; traceLength: number; }

export interface AllParams {
  gradient: GradientParams;
  singleLoop: SingleLoopParams;
  helmholtz: HelmholtzParams;
  toroidal: ToroidalParams;
  tokamak: TokamakParams;
  stellarator: GradientParams;
}
export type LessonKey = keyof AllParams;

interface StoreState {
  activeLesson: string;
  setActiveLesson: (id: string) => void;
  tfBackend: string;
  setTfBackend: (b: string) => void;
  params: AllParams;
  setParam: (lesson: LessonKey, key: string, value: number) => void;
  setParams: (lesson: LessonKey, values: Partial<AllParams[LessonKey]>) => void;
  resetParams: (lesson: LessonKey) => void;
}

export const DEFAULTS: AllParams = {
  gradient:   { B0: 0.001, alpha: 0.05, beta: 0, numLines: 4, traceLength: 0.5 },
  singleLoop: { radius: 0.10, current: 1.0, n: 200 },
  helmholtz:  { radius: 0.10, separation: 0.10, current: 1.0, n: 200 },
  toroidal:   { N: 12, R0: 1.00, a: 0.30, current: 50, n: 200, numLines: 5, traceLength: 8 },
  tokamak:    { N: 12, R0: 1.00, a: 0.30, current: 50, Icentral: 200, n: 200, numLines: 5, traceLength: 12 },
  stellarator:   { B0: 0.001, alpha: 0.05, beta: 0, numLines: 4, traceLength: 0.5 },
};
export const ITER_TOROIDAL: ToroidalParams = { N: 18, R0: 6.2, a: 2.0, current: 500000, n: 200, numLines: 5, traceLength: 10 };
export const ITER_TOKAMAK: TokamakParams = { ...ITER_TOROIDAL, Icentral: 2000000, traceLength: 12 };

const useStore = create<StoreState>()((set) => ({
  activeLesson: 'home',
  setActiveLesson: (id) => set({ activeLesson: id }),
  tfBackend: 'initializing',
  setTfBackend: (b) => set({ tfBackend: b }),
  params: { ...DEFAULTS },
  setParam: (lesson, key, value) => set((state) => ({
    params: {
      ...state.params,
      [lesson]: {
        ...state.params[lesson],
        [key]: value,
      } as AllParams[typeof lesson],
    },
  })),
  setParams: (lesson, values) => set((state) => ({
    params: {
      ...state.params,
      [lesson]: {
        ...state.params[lesson],
        ...values,
      } as AllParams[typeof lesson],
    },
  })),
  resetParams: (lesson) => set((state) => ({
    params: {
      ...state.params,
      [lesson]: { ...DEFAULTS[lesson] },
    },
  })),
}));

export default useStore;
