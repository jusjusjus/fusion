# Copilot Instructions

This monorepo contains two sibling projects for magnetic-field simulation and visualization.

## Projects

- **`magnetic-field-explorer/`** — React 19 + Three.js interactive 3D web app (deployed to GitHub Pages)
- **`biot-savart-py/`** — Python package for Biot-Savart field computation, Poincaré sections, and plotting

---

## magnetic-field-explorer

### Commands

All commands run from `magnetic-field-explorer/`:

```bash
npm run dev      # start dev server (Vite HMR)
npm run build    # production build → dist/
npm run lint     # ESLint
npm run preview  # preview the production build locally
```

No test runner is configured.

### Architecture

```
src/
  physics/       # pure computation — no React, no side effects
    biotSavart.js   fieldAtPoint() (plain JS) and fieldAtGrid() (TF.js GPU batch)
    coils.js        coil geometry generators (circularLoop, toroidalSet, helicalCoil, …)
    fieldlines.js   RK4 field-line tracing (fixed arc-length step)
    particle.js     charged-particle trajectory integration
    toyField.js     analytic toy fields
  viz/           # Three.js / R3F scene components (Scene.jsx, FieldLines.jsx, …)
  components/    # UI widgets (ControlPanel.jsx, InjectionPanel.jsx, …)
  hooks/         # shared hooks (useParticleInjection.js)
  lessons/       # one file per physics scenario (SingleLoop, HelmholtzCoils, …)
  store/         # Zustand global store (useStore.js)
  i18n/          # en.json + de.json translations
```

**Data flow:** `physics/` → `lessons/` → `viz/` + `components/`

Each lesson file in `src/lessons/` is self-contained: it reads params from the Zustand store, builds coil geometry with `physics/coils.js`, computes field data, and renders `<Scene>` containing R3F viz components plus a sidebar with `<ControlPanel>` and charts.

### Key conventions

**Coil representation** — Every coil (or merged set of coils) is a plain object `{ midpoints: Float32Array(N*3), weightedDl: Float32Array(N*3) }` where `weightedDl = dl (m) × current (A)`. All physics functions accept this shape; `mergeCoils(array)` concatenates them.

**SI units** — All physics quantities are in strict SI: positions in metres, currents in amperes, B fields in Tesla. The Biot-Savart kernel includes the `μ₀/(4π) = 1×10⁻⁷` prefactor (defined in `physics/units.js`); `fieldAtPoint` and `fieldAtGrid` return Tesla when fed metres and amperes. The `poloidalField` helper in `TokamakField.jsx` uses `MU0_OVER_2PI = 2×10⁻⁷` for Ampère's law. Chart axes display Bz in μT (cosmetic ×10⁶ at render time only). Particle injection keeps normalized/pedagogical units (q=1, m=1) — see comment in `useParticleInjection.js`.

**Two-tier field computation:**
- `fieldAtPoint(x, midpoints, weightedDl)` — plain JS, called thousands of times per RK4 trace (no TF.js overhead)
- `fieldAtGrid(xs, midpoints, weightedDl)` — TF.js with GPU broadcasting, for computing fields at large grids of points in one shot; always wrap in `tf.tidy()`

**Zustand store** — `useStore` holds `activeLesson`, `tfBackend`, and per-lesson `params` objects. Update params via `setParam(lessonKey, paramKey, value)`. Lesson keys match the keys in the `LESSONS` map in `App.jsx`.

**Adding a new lesson:**
1. Create `src/lessons/MyLesson.jsx` following the existing lesson pattern
2. Add a coil generator to `src/physics/coils.js` if needed
3. Register default params in `src/store/useStore.js`
4. Add the lesson to the `LESSONS` map in `src/App.jsx`
5. Add translation keys to both `src/i18n/en.json` and `src/i18n/de.json`

**i18n** — UI strings use `react-i18next`. Every user-visible string must have entries in both `en.json` and `de.json`. Language is auto-detected from `navigator.language`.

**Scene component** — `viz/Scene.jsx` wraps the R3F `<Canvas>` with shared lighting, orbit/FPV controls, a gradient sky, and a camera-coordinates HUD. The `injectionMode` prop switches from orbit controls to WASD/arrow-key first-person navigation for particle injection.

**Deployment** — GitHub Actions deploys to GitHub Pages only on commits tagged `v*` (semver) or via manual `workflow_dispatch`. The Vite `base` is `/fusion/`.

---

## biot-savart-py

### Commands

All commands run from `biot-savart-py/`:

```bash
uv run main.py          # run the script
make run                # same via make
make watch              # auto-rerun on file changes (requires nodemon)
```

Dependencies are managed with `uv` (`pyproject.toml` + `uv.lock`). Uses Numba JIT (`numba`) for performance-critical field computations.

### Architecture

```
src/
  core/
    biot_savart.py   core Biot-Savart integrator (Numba-accelerated)
    fieldlines.py    field-line and Poincaré tracing
    coords.py        coordinate utilities
    poincare.py      Poincaré section analysis
    plotting.py      matplotlib helpers
  coils/             coil geometry modules (circle, torus, helical, …)
main.py              script entry point — uncomment/comment calls to run scenarios
```

Scenarios are activated by uncommenting function calls in `main.py`. The package is not installed as a library; `main.py` imports directly from `src/`.
