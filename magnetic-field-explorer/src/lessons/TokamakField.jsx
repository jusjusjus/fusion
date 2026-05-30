import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import Scene from '../viz/Scene.jsx';
import CoilMesh from '../viz/CoilMesh.jsx';
import CurrentArrows from '../viz/CurrentArrows.jsx';
import FieldLines from '../viz/FieldLines.jsx';
import InjectionMarker from '../viz/InjectionMarker.jsx';
import ParticleTraces from '../viz/ParticleTraces.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import InjectionPanel from '../components/InjectionPanel.jsx';
import useStore, { ITER_TOKAMAK } from '../store/useStore.js';
import { toroidalSet } from '../physics/coils.js';
import { fieldAtPoint } from '../physics/biotSavart.js';
import { traceFieldlines } from '../physics/fieldlines.js';
import { useParticleInjection } from '../hooks/useParticleInjection.js';
import { MU0_OVER_2PI } from '../physics/units.js';

/**
 * Poloidal field from a toroidal plasma current Icentral (thin-torus approximation).
 *
 * The plasma current flows toroidally (in the φ direction) around the torus.
 * By Ampère's law on a poloidal circle of minor radius r = √((ρ−R0)²+z²):
 // B_θ = (μ₀/2π)·Ip / r  (Ampère's law for toroidal plasma current).
 //
 // Direction θ̂ in Cartesian (poloidal unit vector around the minor cross-section):
 //   θ̂ = −(z/r)·ρ̂ + ((ρ−R0)/r)·ẑ
 */
function poloidalField(x, y, z, R0, a, Icentral) {
 const rho = Math.sqrt(x * x + y * y);
 if (rho < 1e-9) return [0, 0, 0];
 const dr = rho - R0;
 // Clamp minor radius to avoid 1/r² singularity near the torus magnetic axis
 const minR2 = (a * 0.05) ** 2;
 const r2 = Math.max(dr * dr + z * z, minR2);
 // B_pol = (μ₀/2π)·Icentral / r,  θ̂ = (−z·ρ̂ + dr·ẑ) / r
 const scale = MU0_OVER_2PI * Icentral / r2;
 return [
   scale * (-z * x / rho),
   scale * (-z * y / rho),
   scale * dr,
 ];
}

export default function TokamakField() {
  const { t } = useTranslation();
  const { params, setParam, setParams, resetParams } = useStore();
  const { N, R0, a, current, Icentral, n, numLines, traceLength } = params.tokamak;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState([]);
  const controlsRef = useRef();
  const cameraRef = useRef();

  const [showHaze, setShowHaze] = useState(true);

  const coils = useMemo(() => toroidalSet({ N, R0, a, n, current }), [N, R0, a, n, current]);

  const bFunc = useMemo(() => ([x, y, z]) => {
    const [bx, by, bz] = fieldAtPoint([x, y, z], coils.midpoints, coils.weightedDl);
    const [px, py, pz] = poloidalField(x, y, z, R0, a, Icentral);
    return [bx + px, by + py, bz + pz];
  }, [coils, R0, a, Icentral]);

  const injection = useParticleInjection(bFunc);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setComputing(true);
      const seeds = [];
      for (let i = 0; i < numLines; i++) {
        const r = R0 + (i / (numLines - 1 || 1) - 0.5) * a * 1.2;
        seeds.push(new Float32Array([r, 0, 0]));
      }
      const lines = traceFieldlines(seeds, bFunc, { length: traceLength, nsteps: 1200 });
      setFieldLines(lines);
      setComputing(false);
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [bFunc, numLines, traceLength, R0, a]);

  const colormap = (value) => new THREE.Color().setHSL(0.55 + value * 0.15, 0.9, 0.5);

  const controls = [
    { key: 'N',          label: t('controls.numCoils'),     step: 1,    value: N,          hint: '4 – 32' },
    { key: 'R0',         label: t('controls.radius'),       step: 0.1,  value: R0,         hint: 'm  (ITER: 6.2)' },
    { key: 'a',          label: t('controls.minorRadius'),  step: 0.05, value: a,          hint: 'm  (ITER: 2.0)' },
    { key: 'current',    label: t('controls.current'),      step: 1000, value: current,    hint: 'A  (ITER: ~9 MA)' },
    { key: 'Icentral',   label: t('controls.plasmaCurrent'),step: 50000,value: Icentral,   hint: 'A  plasma toroidal current (ITER: ~15 MA)' },
    { key: 'numLines',   label: t('controls.numFieldLines'),step: 1,    value: numLines,   hint: '0 – 10' },
    { key: 'traceLength',label: t('controls.traceLength'),  step: 1,    value: traceLength,hint: 'arc-length along field line; one toroidal wrap ≈ 2πR₀' },
  ];

  const coilMeshes = useMemo(() => {
    const mp = coils.midpoints;
    const perCoil = mp.length / 3 / N;
    return Array.from({ length: N }, (_, i) => mp.slice(i * perCoil * 3, (i + 1) * perCoil * 3));
  }, [coils, N]);

  const coilWeightedDls = useMemo(() => {
    const dl = coils.weightedDl;
    const perCoil = dl.length / 3 / N;
    return Array.from({ length: N }, (_, i) => dl.slice(i * perCoil * 3, (i + 1) * perCoil * 3));
  }, [coils, N]);

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene cameraPosition={[2.5, 1.5, 2.5]} controlsRef={controlsRef} cameraRef={cameraRef}
               injectionMode={injection.injectionMode}
               onInject={(cam) => injection.injectAt(cam)}>
          {coilMeshes.map((mp, i) => (
            <group key={i}>
              <CoilMesh midpoints={mp} color={`hsl(${200 + i * 15}, 80%, 60%)`} current={current} maxRadius={a * 0.05} />
              <CurrentArrows
                midpoints={mp} weightedDl={coilWeightedDls[i]}
                color={`hsl(${200 + i * 15}, 80%, 60%)`}
                nArrows={3} coneRadius={0.005} coneHeight={0.015}
              />
            </group>
          ))}
          <FieldLines lines={fieldLines} colormap={colormap} lineWidth={1.5} />
          {showHaze && Icentral > 0 && (
            <mesh>
              <torusGeometry args={[R0, a * 0.95, 16, 60]} />
              <meshStandardMaterial
                color="#ff6600"
                transparent
                opacity={Math.min(0.35, (Math.abs(Icentral) / Math.max(Math.abs(current), 1)) * 0.35)}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          <ParticleTraces particles={injection.particles} />
        </Scene>
        <InjectionMarker active={injection.injectionMode} />
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('tokamak', key, value)}
          onReset={() => resetParams('tokamak')}
          computing={computing}
          extraButtons={
            <button className="preset-btn" onClick={() => setParams('tokamak', ITER_TOKAMAK)}>
              ITER preset
            </button>
          }
        />
        <label className="toggle-row">
          <input type="checkbox" checked={showHaze} onChange={e => setShowHaze(e.target.checked)} />
          <span>Plasma haze</span>
        </label>
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <InjectionPanel
          active={injection.injectionMode}
          onToggle={injection.toggleInjectionMode}
          onInject={() => injection.injectAt(cameraRef.current)}
          onClear={injection.clearParticles}
          particleCount={injection.particles.length}
          speciesId={injection.speciesId} onSpeciesId={injection.setSpeciesId}
          energyEV={injection.energyEV}   onEnergyEV={injection.setEnergyEV}
        />
        <p className="description">{t('descriptions.tokamak')}</p>
      </div>
    </div>
  );
}
