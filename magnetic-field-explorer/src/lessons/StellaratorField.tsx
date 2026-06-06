import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import Scene from '../viz/Scene';

import CoilMesh from '../viz/CoilMesh';
import CurrentArrows from '../viz/CurrentArrows';
import FieldLines from '../viz/FieldLines';
import InjectionMarker from '../viz/InjectionMarker';
import ParticleTraces from '../viz/ParticleTraces';
import ControlPanel from '../components/ControlPanel';
import InjectionPanel from '../components/InjectionPanel';
import useStore from '../store/useStore';
import { loadStellaratorCoils } from '../physics/stellaratorCoils';
import { fieldAtPoint } from '../physics/biotSavart';
import { traceFieldlines, type BFunc } from '../physics/fieldlines';
import { useParticleInjection } from '../hooks/useParticleInjection';

const SCALE = 0.1;
const R0 = 14 * SCALE;
const a = 4 * SCALE;

interface CoilData {
  merged: { midpoints: Float32Array; weightedDl: Float32Array };
  perCoilMidpoints: Float32Array[];
  perCoilWeightedDl: Float32Array[];
}

export default function StellaratorField() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { numLines, traceLength, current } = params.stellarator;
  const [coilData, setCoilData] = useState<CoilData | null>(null);
  const [fieldLines, setFieldLines] = useState<Float32Array[]>([]);
  const [computing, setComputing] = useState(false);
  const controlsRef = useRef<{ reset?: () => void } | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  useEffect(() => {
    loadStellaratorCoils(SCALE).then((data) => {
      const perCoilMidpoints: Float32Array[] = [];
      const perCoilWeightedDl: Float32Array[] = [];
      for (const coil of data.perCoil) {
        perCoilMidpoints.push(coil.midpoints);
        perCoilWeightedDl.push(coil.weightedDl);
      }
      setCoilData({ merged: data.merged, perCoilMidpoints, perCoilWeightedDl });
    });
  }, []);

  const bFunc = useMemo<BFunc | null>(() => {
    if (!coilData) return null;
    const { midpoints, weightedDl } = coilData.merged;
    return ([x, y, z]) => {
      const [bx, by, bz] = fieldAtPoint([x, y, z], midpoints, weightedDl);
      return [bx * current, by * current, bz * current];
    };
  }, [coilData, current]);

  const injection = useParticleInjection(bFunc ?? (() => [0, 0, 0]));

  useEffect(() => {
    if (!bFunc) return;
    const timeoutId = window.setTimeout(() => {
      setComputing(true);
      const seeds: Float32Array[] = [];
      for (let i = 0; i < numLines; i++) {
        const halfStep = numLines % 2 === 1 ? 0.5 / Math.max(numLines - 1, 1) : 0;
        const r = R0 + (i / (numLines - 1 || 1) - 0.5 + halfStep) * a * 1.2;
        seeds.push(new Float32Array([r, 0, 0]));
      }
      const lines = traceFieldlines(seeds, bFunc, { length: traceLength, nsteps: 2000 });
      setFieldLines(lines);
      setComputing(false);
    }, 10);
    return () => window.clearTimeout(timeoutId);
  }, [bFunc, numLines, traceLength]);

  const colormap = (value: number): THREE.Color => new THREE.Color().setHSL(0.55 + value * 0.15, 0.9, 0.5);

  const controls = [
    { key: 'numLines',    label: t('controls.numFieldLines'), step: 1,     value: numLines,    hint: '0 – 12' },
    { key: 'traceLength', label: t('controls.traceLength'),   step: 0.5,   value: traceLength, hint: 'm; torus circ ≈ 8.8 m' },
    { key: 'current',     label: t('controls.current'),       step: 1e5,   value: current,     hint: 'A  (model scaled ×0.1)' },
  ];

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene
          cameraPosition={[2.5, 1.5, 2.5]}
          controlsRef={controlsRef}
          cameraRef={cameraRef}
          injectionMode={injection.injectionMode}
          onInject={(cam) => injection.injectAt(cam)}
        >
          {coilData && coilData.perCoilMidpoints.map((mp, i) => (
            <group key={i}>
              <CoilMesh
                midpoints={mp}
                color="#ff8800"
                current={Math.abs(current)}
                maxRadius={a * 0.05}
              />
              <CurrentArrows
                midpoints={mp}
                weightedDl={coilData.perCoilWeightedDl[i]}
                color="#ff8800"
                nArrows={2}
                coneRadius={0.008}
                coneHeight={0.02}
              />
            </group>
          ))}
          <FieldLines lines={fieldLines} colormap={colormap} lineWidth={1.5} />
          <ParticleTraces particles={injection.particles} />
        </Scene>
        <InjectionMarker active={injection.injectionMode} />
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('stellarator', key, value)}
          computing={computing}
        />
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <InjectionPanel
          active={injection.injectionMode}
          onToggle={injection.toggleInjectionMode}
          onInject={() => injection.injectAt(cameraRef.current)}
          onClear={injection.clearParticles}
          particleCount={injection.particles.length}
          speciesId={injection.speciesId}
          onSpeciesId={injection.setSpeciesId}
          energyEV={injection.energyEV}
          onEnergyEV={injection.setEnergyEV}
        />
        <p className="description">{t('descriptions.stellarator')}</p>
      </div>
    </div>
  );
}
