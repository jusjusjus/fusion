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
import { circularLoop, mergeCoils } from '../physics/coils';
import { fieldAtPoint } from '../physics/biotSavart';
import { traceFieldlines, type BFunc } from '../physics/fieldlines';
import { useParticleInjection } from '../hooks/useParticleInjection';

const COLOR_COIL1 = '#ffaa00';
const COLOR_COIL2_NORMAL = '#00ccff';
const COLOR_COIL2_FLIPPED = '#ff4466';

export default function HelmholtzCoils() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { radius, separation, current, n } = params.helmholtz;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState<Float32Array[]>([]);
  const [coil2Flipped, setCoil2Flipped] = useState(false);
  const controlsRef = useRef<{ reset?: () => void } | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  const current2 = coil2Flipped ? -current : current;
  const coil2Color = coil2Flipped ? COLOR_COIL2_FLIPPED : COLOR_COIL2_NORMAL;

  const { coil1, coil2 } = useMemo(
    () => ({
      coil1: circularLoop({ radius, z: separation / 2, n, current }),
      coil2: circularLoop({ radius, z: -separation / 2, n, current: current2 }),
    }),
    [radius, separation, current, current2, n],
  );

  const merged = useMemo(() => mergeCoils([coil1, coil2]), [coil1, coil2]);

  const bFunc = useMemo<BFunc>(
    () => (x) => fieldAtPoint(x, merged.midpoints, merged.weightedDl),
    [merged],
  );

  const injection = useParticleInjection(bFunc);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setComputing(true);

      const radii = [0.10, 0.25, 0.45, 0.68, 0.92, 1.20];
      const phis = [0, Math.PI / 2, Math.PI];
      const zPlanes = [separation / 2, -separation / 2];
      const seeds: Float32Array[] = [];
      for (const z of zPlanes) {
        for (const r of radii) {
          for (const phi of phis) {
            seeds.push(
              new Float32Array([
                radius * r * Math.cos(phi),
                radius * r * Math.sin(phi),
                z,
              ]),
            );
          }
        }
      }

      const lines = traceFieldlines(seeds, bFunc, { length: radius * 80, nsteps: 2000, bidirectional: true });
      setFieldLines(lines);
      setComputing(false);
    }, 10);

    return () => window.clearTimeout(timeoutId);
  }, [bFunc, radius, separation]);

  const colormap = (value: number): THREE.Color => new THREE.Color().setHSL(0.55 - value * 0.3, 1, 0.55);

  const controls = [
    { key: 'radius',     label: t('controls.radius'),     min: 0.05, max: 0.5,  step: 0.01, decimals: 2, value: radius },
    { key: 'separation', label: t('controls.separation'), min: 0.02, max: 0.5,  step: 0.01, decimals: 2, value: separation },
    { key: 'current',    label: t('controls.current'),    min: 0.1,  max: 10.0, step: 0.1,  decimals: 1, value: current },
  ];

  const configLabel = coil2Flipped
    ? t('helmholtz.configAnti')
    : t('helmholtz.configNormal');

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene
          cameraPosition={[0.5, 0.4, 0.5]}
          controlsRef={controlsRef}
          cameraRef={cameraRef}
          injectionMode={injection.injectionMode}
          onInject={(cam) => injection.injectAt(cam)}
        >
          <CoilMesh midpoints={coil1.midpoints} color={COLOR_COIL1} current={current} />
          <CurrentArrows midpoints={coil1.midpoints} weightedDl={coil1.weightedDl} color={COLOR_COIL1} />
          <CoilMesh midpoints={coil2.midpoints} color={coil2Color} current={current2} />
          <CurrentArrows midpoints={coil2.midpoints} weightedDl={coil2.weightedDl} color={coil2Color} />
          <FieldLines lines={fieldLines} colormap={colormap} />
          <ParticleTraces particles={injection.particles} />
        </Scene>
        <InjectionMarker active={injection.injectionMode} />
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('helmholtz', key, value)}
          computing={computing}
        />
        <div className="flip-row">
          <span className="config-label">{configLabel}</span>
          <button
            className={`flip-btn${coil2Flipped ? ' flipped' : ''}`}
            onClick={() => setCoil2Flipped((flipped) => !flipped)}
          >
            {coil2Flipped ? t('helmholtz.restoreCoil2') : t('helmholtz.flipCoil2')}
          </button>
        </div>
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
        <p className="description">
          {coil2Flipped ? t('descriptions.antiHelmholtz') : t('descriptions.helmholtz')}
        </p>
      </div>
    </div>
  );
}
