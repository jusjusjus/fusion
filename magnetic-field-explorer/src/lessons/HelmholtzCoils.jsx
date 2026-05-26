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
import useStore from '../store/useStore.js';
import { circularLoop, mergeCoils } from '../physics/coils.js';
import { fieldAtPoint } from '../physics/biotSavart.js';
import { traceFieldlines } from '../physics/fieldlines.js';
import { useParticleInjection } from '../hooks/useParticleInjection.js';

const COLOR_COIL1 = '#ffaa00';
const COLOR_COIL2_NORMAL = '#00ccff';
const COLOR_COIL2_FLIPPED = '#ff4466';

export default function HelmholtzCoils() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { radius, separation, current, n } = params.helmholtz;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState([]);
  const [coil2Flipped, setCoil2Flipped] = useState(false);
  const controlsRef = useRef();

  const current2 = coil2Flipped ? -current : current;
  const coil2Color = coil2Flipped ? COLOR_COIL2_FLIPPED : COLOR_COIL2_NORMAL;

  const { coil1, coil2 } = useMemo(
    () => ({
      coil1: circularLoop({ radius, z: separation / 2, n, current }),
      coil2: circularLoop({ radius, z: -separation / 2, n, current: current2 }),
    }),
    [radius, separation, current, current2, n]
  );

  const merged = useMemo(() => mergeCoils([coil1, coil2]), [coil1, coil2]);

  const bFunc = useMemo(
    () => (x) => fieldAtPoint(x, merged.midpoints, merged.weightedDl),
    [merged]
  );

  const injection = useParticleInjection(bFunc);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setComputing(true);

      // Seeds in the planes of each coil (z = ±separation/2) at increasing radii.
      // Seeding from the coil plane (not the midplane) lets bidirectional tracing
      // reveal both the single-coil wrapping lines (one arc away from the coil) and
      // the cross-coil lines (the other arc threading through both coils).
      // Avoid r≈0 (on-axis lines run straight and never close).
      const radii = [0.10, 0.25, 0.45, 0.68, 0.92, 1.20];
      const phis = [0, Math.PI / 2, Math.PI];
      const zPlanes = [separation / 2, -separation / 2];
      const seeds = [];
      for (const z of zPlanes) {
        for (const r of radii) {
          for (const phi of phis) {
            seeds.push(
              new Float32Array([
                radius * r * Math.cos(phi),
                radius * r * Math.sin(phi),
                z,
              ])
            );
          }
        }
      }

      // Long enough for the outermost field lines to close.
      // Bidirectional: half-arc backward + half-arc forward, so each direction gets length/2.
      const lines = traceFieldlines(seeds, bFunc, { length: radius * 80, nsteps: 2000, bidirectional: true });
      setFieldLines(lines);
      setComputing(false);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [bFunc, radius]);

  const colormap = (value) => new THREE.Color().setHSL(0.55 - value * 0.3, 1, 0.55);

  const controls = [
    { key: 'radius', label: t('controls.radius'), min: 0.5, max: 3, step: 0.1, value: radius },
    {
      key: 'separation',
      label: t('controls.separation'),
      min: 0.2,
      max: 4,
      step: 0.1,
      value: separation,
    },
    { key: 'current', label: t('controls.current'), min: 0.1, max: 5, step: 0.1, value: current },
  ];

  const configLabel = coil2Flipped
    ? t('helmholtz.configAnti')
    : t('helmholtz.configNormal');

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene controlsRef={controlsRef}>
          <CoilMesh midpoints={coil1.midpoints} color={COLOR_COIL1} />
          <CurrentArrows midpoints={coil1.midpoints} weightedDl={coil1.weightedDl} color={COLOR_COIL1} />
          <CoilMesh midpoints={coil2.midpoints} color={coil2Color} />
          <CurrentArrows midpoints={coil2.midpoints} weightedDl={coil2.weightedDl} color={coil2Color} />
          <FieldLines lines={fieldLines} colormap={colormap} />
          <InjectionMarker active={injection.injectionMode} controlsRef={controlsRef} />
          <ParticleTraces particles={injection.particles} />
        </Scene>
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
            onClick={() => setCoil2Flipped((f) => !f)}
          >
            {coil2Flipped ? t('helmholtz.restoreCoil2') : t('helmholtz.flipCoil2')}
          </button>
        </div>
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <InjectionPanel
          active={injection.injectionMode}
          onToggle={injection.toggleInjectionMode}
          onInject={() => injection.injectAt(controlsRef.current?.target)}
          onClear={injection.clearParticles}
          particleCount={injection.particles.length}
          speed={injection.speed}   onSpeed={injection.setSpeed}
          theta={injection.theta}   onTheta={injection.setTheta}
          phi={injection.phi}       onPhi={injection.setPhi}
          charge={injection.charge} onCharge={injection.setCharge}
          mass={injection.mass}     onMass={injection.setMass}
        />
        <p className="description">
          {coil2Flipped ? t('descriptions.antiHelmholtz') : t('descriptions.helmholtz')}
        </p>
      </div>
    </div>
  );
}
