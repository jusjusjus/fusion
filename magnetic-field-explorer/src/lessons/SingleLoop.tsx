import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
import { circularLoop } from '../physics/coils';
import { fieldAtPoint } from '../physics/biotSavart';
import { traceFieldlines, type BFunc } from '../physics/fieldlines';
import { useParticleInjection } from '../hooks/useParticleInjection';

interface BzDatum {
  z: number;
  Bz: number;
}

export default function SingleLoop() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { radius, current, n } = params.singleLoop;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState<Float32Array[]>([]);
  const [bzData, setBzData] = useState<BzDatum[]>([]);
  const controlsRef = useRef<{ reset?: () => void } | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  const coil = useMemo(() => circularLoop({ radius, z: 0, n, current }), [radius, current, n]);

  const bFunc = useMemo<BFunc>(
    () => (x) => fieldAtPoint(x, coil.midpoints, coil.weightedDl),
    [coil],
  );

  const injection = useParticleInjection(bFunc);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setComputing(true);

      const seeds: Float32Array[] = [];
      const radii = [0.12, 0.28, 0.48, 0.70, 0.92, 1.25, 1.65];
      const phis = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      for (const r of radii) {
        for (const phi of phis) {
          seeds.push(
            new Float32Array([
              radius * r * Math.cos(phi),
              radius * r * Math.sin(phi),
              radius * 0.02,
            ]),
          );
        }
      }

      const lines = traceFieldlines(seeds, bFunc, { length: radius * 30, nsteps: 800, bidirectional: true });
      setFieldLines(lines);

      const data: BzDatum[] = [];
      for (let i = 0; i < 30; i += 1) {
        const z = -3 * radius + (6 * radius * i) / 29;
        const B = bFunc([0, 0, z]);
        data.push({ z: +(z / radius).toFixed(2), Bz: +(B[2] * 1e6).toFixed(4) });
      }
      setBzData(data);
      setComputing(false);
    }, 10);

    return () => window.clearTimeout(timeoutId);
  }, [bFunc, radius]);

  const colormap = (value: number): THREE.Color => new THREE.Color().setHSL(0.6 - value * 0.4, 1, 0.5);

  const controls = [
    { key: 'radius',  label: t('controls.radius'),  min: 0.02, max: 0.5,  step: 0.01, decimals: 2, value: radius },
    { key: 'current', label: t('controls.current'), min: 0.1,  max: 10.0, step: 0.1,  decimals: 1, value: current },
  ];

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
          <CoilMesh midpoints={coil.midpoints} color="#ffaa00" current={current} />
          <CurrentArrows midpoints={coil.midpoints} weightedDl={coil.weightedDl} color="#ffaa00" />
          <FieldLines lines={fieldLines} colormap={colormap} />
          <ParticleTraces particles={injection.particles} />
        </Scene>
        <InjectionMarker active={injection.injectionMode} />
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('singleLoop', key, value)}
          computing={computing}
        />
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <div className="chart-box">
          <p className="chart-title">{t('charts.bzOnAxis')}</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={bzData}>
              <XAxis
                dataKey="z"
                label={{ value: t('charts.axialPosition'), position: 'insideBottom', offset: -5 }}
              />
              <YAxis />
              <Tooltip formatter={(v) => (v == null ? '' : `${(+v).toFixed(3)} μT`)} />
              <Line type="monotone" dataKey="Bz" stroke="#44aaff" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
        <p className="description">{t('descriptions.singleLoop')}</p>
      </div>
    </div>
  );
}
